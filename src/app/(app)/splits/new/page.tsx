import type { Metadata } from "next";
import type { Types } from "mongoose";
import { requireUser } from "@/lib/auth";
import { getFriendsData } from "@/lib/actions/friends";
import { GroupMember } from "@/lib/models/group-member";
import { Group } from "@/lib/models/group";
import { serialize } from "@/lib/serialize";
import { PageHeader } from "@/components/page-header";
import { SplitForm, type GroupOption, type PersonOption } from "@/components/splits/split-form";

export const metadata: Metadata = { title: "New Split" };

async function getGroupOptions(userId: Types.ObjectId): Promise<GroupOption[]> {
  const memberships = await GroupMember.find({
    userId,
    status: "active",
    deletedAt: null,
  }).lean();
  const groupIds = memberships.map((m) => m.groupId);
  const [groups, allMembers] = await Promise.all([
    Group.find({ _id: { $in: groupIds }, deletedAt: null }).lean(),
    GroupMember.find({ groupId: { $in: groupIds }, status: "active", deletedAt: null })
      .populate("userId", "name email")
      .lean(),
  ]);

  return serialize<GroupOption[]>(
    groups.map((g) => ({
      _id: g._id,
      name: g.name,
      members: allMembers
        .filter((m) => String(m.groupId) === String(g._id) && m.userId)
        .map((m) => {
          const u = m.userId as { name?: string; email?: string };
          return { email: u.email ?? "", name: u.name ?? "" };
        })
        .filter((m) => m.email),
    }))
  );
}

export default async function NewSplitPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const [{ group }, user] = await Promise.all([searchParams, requireUser()]);
  const [friendsData, groups] = await Promise.all([getFriendsData(), getGroupOptions(user._id)]);

  const friends: PersonOption[] = friendsData.friends.map((f) => ({
    email: f.email,
    name: f.name,
  }));

  return (
    <>
      <PageHeader title="New split" description="Split a bill equally, by percentage, or with exact amounts." />
      <SplitForm
        myEmail={user.email}
        myName={user.name}
        defaultCurrency={user.currency}
        friends={friends}
        groups={groups}
        initialGroupId={group}
      />
    </>
  );
}
