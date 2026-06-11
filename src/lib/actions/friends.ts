"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { requireUser } from "@/lib/auth";
import { Friendship } from "@/lib/models/friendship";
import { User } from "@/lib/models/user";
import { createNotification } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";
import { serialize } from "@/lib/serialize";
import { type ActionResult, actionError } from "./types";

export interface FriendUser {
  _id: string;
  name: string;
  email: string;
  imageUrl?: string;
}

export interface FriendRequestItem {
  _id: string;
  requester: FriendUser;
  createdAt: string;
}

export interface FriendsData {
  friends: FriendUser[];
  incoming: FriendRequestItem[];
  outgoing: { _id: string; recipient: FriendUser; createdAt: string }[];
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getFriendsData(): Promise<FriendsData> {
  const user = await requireUser();

  const [accepted, incoming, outgoing] = await Promise.all([
    Friendship.find({
      status: "accepted",
      deletedAt: null,
      $or: [{ requesterId: user._id }, { recipientId: user._id }],
    })
      .populate("requesterId", "name email imageUrl")
      .populate("recipientId", "name email imageUrl")
      .lean(),
    Friendship.find({ recipientId: user._id, status: "pending", deletedAt: null })
      .populate("requesterId", "name email imageUrl")
      .sort({ createdAt: -1 })
      .lean(),
    Friendship.find({ requesterId: user._id, status: "pending", deletedAt: null })
      .populate("recipientId", "name email imageUrl")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const friends = accepted.map((f) => {
    const requester = f.requesterId as unknown as { _id: Types.ObjectId };
    const other = String(requester._id) === String(user._id) ? f.recipientId : f.requesterId;
    return other;
  });

  return serialize<FriendsData>({
    friends,
    incoming: incoming.map((f) => ({ _id: f._id, requester: f.requesterId, createdAt: f.createdAt })),
    outgoing: outgoing.map((f) => ({ _id: f._id, recipient: f.recipientId, createdAt: f.createdAt })),
  });
}

export async function searchUsers(query: string): Promise<FriendUser[]> {
  const user = await requireUser();
  const q = query.trim();
  if (q.length < 2) return [];
  const rx = new RegExp(escapeRegex(q), "i");
  const users = await User.find({
    _id: { $ne: user._id },
    deletedAt: null,
    $or: [{ name: rx }, { email: rx }],
  })
    .select("name email imageUrl")
    .limit(10)
    .lean();
  return serialize<FriendUser[]>(users);
}

export async function sendFriendRequest(recipientId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    rateLimit(`friend-req:${user._id}`, 20);
    if (!Types.ObjectId.isValid(recipientId)) return { success: false, error: "Invalid user" };
    if (recipientId === String(user._id)) {
      return { success: false, error: "You cannot add yourself" };
    }
    const recipient = await User.findOne({ _id: recipientId, deletedAt: null });
    if (!recipient) return { success: false, error: "User not found" };

    const existing = await Friendship.findOne({
      deletedAt: null,
      $or: [
        { requesterId: user._id, recipientId },
        { requesterId: recipientId, recipientId: user._id },
      ],
    });
    if (existing) {
      if (existing.status === "accepted") return { success: false, error: "Already friends" };
      if (existing.status === "pending") return { success: false, error: "Request already pending" };
      // Re-send after rejection
      existing.status = "pending";
      existing.requesterId = user._id;
      existing.recipientId = recipient._id;
      await existing.save();
    } else {
      await Friendship.create({ requesterId: user._id, recipientId, status: "pending" });
    }

    await createNotification({
      userId: recipientId,
      type: "friend_request",
      title: `${user.name} sent you a friend request`,
      link: "/friends",
    });
    revalidatePath("/friends");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function respondToFriendRequest(
  friendshipId: string,
  accept: boolean
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const friendship = await Friendship.findOne({
      _id: friendshipId,
      recipientId: user._id,
      status: "pending",
      deletedAt: null,
    });
    if (!friendship) return { success: false, error: "Request not found" };

    friendship.status = accept ? "accepted" : "rejected";
    await friendship.save();

    if (accept) {
      await createNotification({
        userId: String(friendship.requesterId),
        type: "friend_accepted",
        title: `${user.name} accepted your friend request`,
        link: "/friends",
      });
    }
    revalidatePath("/friends");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function removeFriend(friendUserId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await Friendship.updateMany(
      {
        status: "accepted",
        deletedAt: null,
        $or: [
          { requesterId: user._id, recipientId: friendUserId },
          { requesterId: friendUserId, recipientId: user._id },
        ],
      },
      { $set: { deletedAt: new Date() } }
    );
    revalidatePath("/friends");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}
