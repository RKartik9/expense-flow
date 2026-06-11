"use server";

import { requireUser } from "@/lib/auth";
import { Expense } from "@/lib/models/expense";
import { Group } from "@/lib/models/group";
import { GroupMember } from "@/lib/models/group-member";
import { Split } from "@/lib/models/split";
import { SplitParticipant } from "@/lib/models/split-participant";
import { Category } from "@/lib/models/category";
import { User } from "@/lib/models/user";

export interface SearchResult {
  type: "expense" | "group" | "split" | "category" | "user";
  id: string;
  title: string;
  subtitle?: string;
  link: string;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const user = await requireUser();
  const q = query.trim();
  if (q.length < 2) return [];
  const rx = new RegExp(escapeRegex(q), "i");

  const [expenses, groups, memberGroups, splits, participantSplits, categories, users] =
    await Promise.all([
      Expense.find({ userId: user._id, deletedAt: null, $or: [{ title: rx }, { description: rx }, { tags: rx }] })
        .sort({ date: -1 })
        .limit(5)
        .lean(),
      Group.find({ ownerId: user._id, deletedAt: null, name: rx }).limit(5).lean(),
      GroupMember.find({ userId: user._id, status: "active", deletedAt: null })
        .select("groupId")
        .lean(),
      Split.find({ createdById: user._id, deletedAt: null, title: rx }).limit(5).lean(),
      SplitParticipant.find({ userId: user._id, deletedAt: null }).select("splitId").lean(),
      Category.find({ userId: user._id, deletedAt: null, name: rx }).limit(5).lean(),
      User.find({ deletedAt: null, $or: [{ name: rx }, { email: rx }], _id: { $ne: user._id } })
        .select("name email imageUrl")
        .limit(5)
        .lean(),
    ]);

  const memberGroupIds = memberGroups.map((m) => m.groupId);
  const moreGroups = await Group.find({
    _id: { $in: memberGroupIds },
    ownerId: { $ne: user._id },
    deletedAt: null,
    name: rx,
  })
    .limit(5)
    .lean();

  const participantSplitIds = participantSplits.map((p) => p.splitId);
  const moreSplits = await Split.find({
    _id: { $in: participantSplitIds },
    createdById: { $ne: user._id },
    deletedAt: null,
    title: rx,
  })
    .limit(5)
    .lean();

  const results: SearchResult[] = [
    ...expenses.map((e) => ({
      type: "expense" as const,
      id: String(e._id),
      title: e.title,
      subtitle: `${e.currency} ${e.amount}`,
      link: `/expenses?q=${encodeURIComponent(e.title)}`,
    })),
    ...[...groups, ...moreGroups].map((g) => ({
      type: "group" as const,
      id: String(g._id),
      title: g.name,
      subtitle: g.description ?? undefined,
      link: `/groups/${g._id}`,
    })),
    ...[...splits, ...moreSplits].map((s) => ({
      type: "split" as const,
      id: String(s._id),
      title: s.title,
      subtitle: `${s.currency} ${s.totalAmount}`,
      link: `/splits/${s._id}`,
    })),
    ...categories.map((c) => ({
      type: "category" as const,
      id: String(c._id),
      title: c.name,
      subtitle: "Category",
      link: `/expenses?category=${c._id}`,
    })),
    ...users.map((u) => ({
      type: "user" as const,
      id: String(u._id),
      title: u.name,
      subtitle: u.email,
      link: `/friends?q=${encodeURIComponent(u.email)}`,
    })),
  ];

  return JSON.parse(JSON.stringify(results));
}
