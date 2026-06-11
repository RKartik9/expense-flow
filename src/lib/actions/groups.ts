"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { requireUser } from "@/lib/auth";
import { Group } from "@/lib/models/group";
import { GroupMember } from "@/lib/models/group-member";
import { Split } from "@/lib/models/split";
import { SplitParticipant } from "@/lib/models/split-participant";
import { User, type UserDoc } from "@/lib/models/user";
import { ActivityLog } from "@/lib/models/activity-log";
import { createNotification, logActivity } from "@/lib/notify";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail, APP_URL } from "@/lib/email";
import { GroupInvitationEmail } from "@/emails/group-invitation";
import { computeNetBalances, simplifyDebts } from "@/lib/settlement/simplify";
import { serialize } from "@/lib/serialize";
import { type ActionResult, actionError } from "./types";

export interface GroupListItem {
  _id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  currency: string;
  role: string;
  memberCount: number;
  totalExpenses: number;
}

export interface GroupMemberItem {
  _id: string;
  userId: string | null;
  name: string;
  email: string;
  imageUrl?: string;
  role: "owner" | "admin" | "member";
  status: "active" | "invited";
}

export interface GroupBalanceLine {
  fromName: string;
  toName: string;
  fromId: string;
  toId: string;
  amount: number;
}

export interface GroupDetail {
  _id: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  currency: string;
  myRole: "owner" | "admin" | "member";
  members: GroupMemberItem[];
  totalExpenses: number;
  pendingAmount: number;
  whoOwesWhom: GroupBalanceLine[];
  recentActivity: { _id: string; action: string; details?: string; userName: string; createdAt: string }[];
  splits: {
    _id: string;
    title: string;
    totalAmount: number;
    currency: string;
    status: string;
    date: string;
    payerName: string;
  }[];
}

async function getMembership(groupId: string, userId: Types.ObjectId) {
  return GroupMember.findOne({
    groupId,
    userId,
    status: "active",
    deletedAt: null,
  });
}

async function requireGroupRole(
  groupId: string,
  user: UserDoc,
  roles: ("owner" | "admin" | "member")[]
) {
  const membership = await getMembership(groupId, user._id);
  if (!membership || !roles.includes(membership.role as "owner" | "admin" | "member")) {
    throw new Error("You don't have permission to do this");
  }
  return membership;
}

export async function getGroups(): Promise<GroupListItem[]> {
  const user = await requireUser();
  const memberships = await GroupMember.find({
    userId: user._id,
    status: "active",
    deletedAt: null,
  }).lean();
  const groupIds = memberships.map((m) => m.groupId);
  const groups = await Group.find({ _id: { $in: groupIds }, deletedAt: null }).lean();

  const [memberCounts, totals] = await Promise.all([
    GroupMember.aggregate([
      { $match: { groupId: { $in: groupIds }, status: "active", deletedAt: null } },
      { $group: { _id: "$groupId", count: { $sum: 1 } } },
    ]),
    Split.aggregate([
      { $match: { groupId: { $in: groupIds }, deletedAt: null } },
      { $group: { _id: "$groupId", total: { $sum: "$totalAmount" } } },
    ]),
  ]);

  return serialize<GroupListItem[]>(
    groups.map((g) => ({
      _id: g._id,
      name: g.name,
      description: g.description,
      coverImageUrl: g.coverImageUrl,
      currency: g.currency,
      role: memberships.find((m) => String(m.groupId) === String(g._id))?.role ?? "member",
      memberCount: memberCounts.find((c) => String(c._id) === String(g._id))?.count ?? 0,
      totalExpenses: totals.find((t) => String(t._id) === String(g._id))?.total ?? 0,
    }))
  );
}

const groupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
});

export type GroupInput = z.infer<typeof groupSchema>;

export async function createGroup(input: GroupInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    rateLimit(`group:${user._id}`, 10);
    const data = groupSchema.parse(input);
    const group = await Group.create({
      ...data,
      coverImageUrl: data.coverImageUrl || undefined,
      ownerId: user._id,
      currency: user.currency,
    });
    await GroupMember.create({
      groupId: group._id,
      userId: user._id,
      role: "owner",
      status: "active",
      joinedAt: new Date(),
    });
    await logActivity({
      userId: String(user._id),
      groupId: String(group._id),
      action: "group_created",
      details: `created the group "${group.name}"`,
    });
    revalidatePath("/groups");
    return { success: true, data: { id: String(group._id) } };
  } catch (err) {
    return actionError(err);
  }
}

export async function updateGroup(groupId: string, input: GroupInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await requireGroupRole(groupId, user, ["owner", "admin"]);
    const data = groupSchema.parse(input);
    await Group.updateOne(
      { _id: groupId, deletedAt: null },
      { $set: { ...data, coverImageUrl: data.coverImageUrl || undefined } }
    );
    revalidatePath(`/groups/${groupId}`);
    revalidatePath("/groups");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteGroup(groupId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await requireGroupRole(groupId, user, ["owner"]);
    await Group.updateOne({ _id: groupId }, { $set: { deletedAt: new Date() } });
    await GroupMember.updateMany({ groupId }, { $set: { deletedAt: new Date() } });
    revalidatePath("/groups");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function inviteMember(groupId: string, email: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    rateLimit(`invite:${user._id}`, 15);
    await requireGroupRole(groupId, user, ["owner", "admin"]);
    const group = await Group.findOne({ _id: groupId, deletedAt: null });
    if (!group) return { success: false, error: "Group not found" };

    const normalizedEmail = z.string().email().parse(email.trim().toLowerCase());
    const existingUser = await User.findOne({ email: normalizedEmail, deletedAt: null });

    const existingMember = await GroupMember.findOne({
      groupId,
      deletedAt: null,
      $or: [
        ...(existingUser ? [{ userId: existingUser._id }] : []),
        { invitedEmail: normalizedEmail },
      ],
    });
    if (existingMember) return { success: false, error: "Already a member or invited" };

    await GroupMember.create({
      groupId,
      userId: existingUser?._id ?? null,
      invitedEmail: normalizedEmail,
      role: "member",
      status: existingUser ? "active" : "invited",
      joinedAt: existingUser ? new Date() : null,
    });

    if (existingUser) {
      await createNotification({
        userId: String(existingUser._id),
        type: "group_invitation",
        title: `${user.name} added you to "${group.name}"`,
        link: `/groups/${groupId}`,
      });
    }

    await sendEmail({
      to: normalizedEmail,
      subject: `${user.name} invited you to "${group.name}" on ExpenseFlow`,
      type: "group_invitation",
      userId: existingUser ? String(existingUser._id) : null,
      react: GroupInvitationEmail({
        inviterName: user.name,
        groupName: group.name,
        appUrl: APP_URL,
      }),
    });

    await logActivity({
      userId: String(user._id),
      groupId,
      action: "member_invited",
      details: `invited ${normalizedEmail}`,
    });
    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function removeMember(groupId: string, memberId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await requireGroupRole(groupId, user, ["owner", "admin"]);
    const member = await GroupMember.findOne({ _id: memberId, groupId, deletedAt: null });
    if (!member) return { success: false, error: "Member not found" };
    if (member.role === "owner") return { success: false, error: "The owner cannot be removed" };
    await GroupMember.updateOne({ _id: memberId }, { $set: { deletedAt: new Date() } });
    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function changeMemberRole(
  groupId: string,
  memberId: string,
  role: "admin" | "member"
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await requireGroupRole(groupId, user, ["owner"]);
    const member = await GroupMember.findOne({ _id: memberId, groupId, deletedAt: null });
    if (!member) return { success: false, error: "Member not found" };
    if (member.role === "owner") return { success: false, error: "Cannot change the owner's role" };
    await GroupMember.updateOne({ _id: memberId }, { $set: { role } });
    revalidatePath(`/groups/${groupId}`);
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function getGroupDetail(groupId: string): Promise<GroupDetail | null> {
  const user = await requireUser();
  if (!Types.ObjectId.isValid(groupId)) return null;

  const membership = await getMembership(groupId, user._id);
  if (!membership) return null;

  const group = await Group.findOne({ _id: groupId, deletedAt: null }).lean();
  if (!group) return null;

  const [members, splits, activity] = await Promise.all([
    GroupMember.find({ groupId, deletedAt: null })
      .populate("userId", "name email imageUrl")
      .lean(),
    Split.find({ groupId, deletedAt: null })
      .populate("payerId", "name")
      .sort({ date: -1 })
      .limit(50)
      .lean(),
    ActivityLog.find({ groupId }).populate("userId", "name").sort({ createdAt: -1 }).limit(15).lean(),
  ]);

  const openSplits = splits.filter((s) => s.status === "open");
  const participants = await SplitParticipant.find({
    splitId: { $in: openSplits.map((s) => s._id) },
    deletedAt: null,
  }).lean();

  const balanceInput = openSplits.map((s) => ({
    payerId: String(s.payerId && typeof s.payerId === "object" && "_id" in s.payerId ? s.payerId._id : s.payerId),
    participants: participants
      .filter((p) => String(p.splitId) === String(s._id))
      .map((p) => ({
        userId: p.userId ? String(p.userId) : null,
        shareAmount: p.shareAmount,
        paidAmount: p.paidAmount,
        isPayer: p.isPayer,
      })),
  }));

  const netBalances = computeNetBalances(balanceInput);
  const transactions = simplifyDebts(netBalances);

  const nameOf = (id: string) => {
    const m = members.find((mem) => mem.userId && String((mem.userId as { _id?: unknown })._id ?? mem.userId) === id);
    const populated = m?.userId as { name?: string } | null;
    return populated?.name ?? "Unknown";
  };

  const pendingAmount = participants.reduce(
    (sum, p) => (p.isPayer || p.status === "paid" ? sum : sum + (p.shareAmount - p.paidAmount)),
    0
  );

  return serialize<GroupDetail>({
    _id: group._id,
    name: group.name,
    description: group.description,
    coverImageUrl: group.coverImageUrl,
    currency: group.currency,
    myRole: membership.role,
    members: members.map((m) => {
      const u = m.userId as { _id?: unknown; name?: string; email?: string; imageUrl?: string } | null;
      return {
        _id: m._id,
        userId: u?._id ?? null,
        name: u?.name ?? m.invitedEmail ?? "Invited",
        email: u?.email ?? m.invitedEmail ?? "",
        imageUrl: u?.imageUrl,
        role: m.role,
        status: m.status,
      };
    }),
    totalExpenses: splits.reduce((s, x) => s + x.totalAmount, 0),
    pendingAmount,
    whoOwesWhom: transactions.map((t) => ({
      fromId: t.from,
      toId: t.to,
      fromName: nameOf(t.from),
      toName: nameOf(t.to),
      amount: t.amount,
    })),
    recentActivity: activity.map((a) => ({
      _id: a._id,
      action: a.action,
      details: a.details,
      userName: (a.userId as { name?: string } | null)?.name ?? "Someone",
      createdAt: a.createdAt,
    })),
    splits: splits.map((s) => ({
      _id: s._id,
      title: s.title,
      totalAmount: s.totalAmount,
      currency: s.currency,
      status: s.status,
      date: s.date,
      payerName: (s.payerId as { name?: string } | null)?.name ?? "Unknown",
    })),
  });
}
