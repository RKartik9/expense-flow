import "server-only";
import { subDays, subMonths, startOfMonth, format } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { User } from "@/lib/models/user";
import { Expense } from "@/lib/models/expense";
import { Group } from "@/lib/models/group";
import { Split } from "@/lib/models/split";
import { EmailLog } from "@/lib/models/email-log";
import { serialize } from "@/lib/serialize";

export interface AdminStats {
  totalUsers: number;
  activeUsers30d: number;
  newUsers30d: number;
  totalGroups: number;
  totalSplits: number;
  totalExpenses: number;
  totalExpenseVolume: number;
  emailsSent: number;
  emailsFailed: number;
  signupsByMonth: { month: string; count: number }[];
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();
  const thirtyDaysAgo = subDays(new Date(), 30);
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

  const [
    totalUsers,
    activeUsers30d,
    newUsers30d,
    totalGroups,
    totalSplits,
    totalExpenses,
    volumeAgg,
    emailsSent,
    emailsFailed,
    signupRows,
  ] = await Promise.all([
    User.countDocuments({ deletedAt: null }),
    User.countDocuments({ deletedAt: null, lastActiveAt: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ deletedAt: null, createdAt: { $gte: thirtyDaysAgo } }),
    Group.countDocuments({ deletedAt: null }),
    Split.countDocuments({ deletedAt: null }),
    Expense.countDocuments({ deletedAt: null }),
    Expense.aggregate([
      { $match: { deletedAt: null, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    EmailLog.countDocuments({ status: "sent" }),
    EmailLog.countDocuments({ status: "failed" }),
    User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const signupsByMonth: AdminStats["signupsByMonth"] = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    const key = format(d, "yyyy-MM");
    signupsByMonth.push({
      month: format(d, "MMM"),
      count: signupRows.find((r) => r._id === key)?.count ?? 0,
    });
  }

  return {
    totalUsers,
    activeUsers30d,
    newUsers30d,
    totalGroups,
    totalSplits,
    totalExpenses,
    totalExpenseVolume: volumeAgg[0]?.total ?? 0,
    emailsSent,
    emailsFailed,
    signupsByMonth,
  };
}

const PAGE_SIZE = 25;

export interface AdminPage<T> {
  items: T[];
  total: number;
  page: number;
  pageCount: number;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listAdminUsers(page = 1, q = ""): Promise<AdminPage<{
  _id: string;
  name: string;
  email: string;
  role: string;
  currency: string;
  createdAt: string;
  lastActiveAt: string | null;
}>> {
  await requireAdmin();
  const filter: Record<string, unknown> = { deletedAt: null };
  if (q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const total = await User.countDocuments(filter);
  const items = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .select("name email role currency createdAt lastActiveAt")
    .lean();
  return { items: serialize(items), total, page, pageCount: Math.ceil(total / PAGE_SIZE) };
}

export async function listAdminGroups(page = 1): Promise<AdminPage<{
  _id: string;
  name: string;
  ownerName: string;
  createdAt: string;
}>> {
  await requireAdmin();
  const total = await Group.countDocuments({ deletedAt: null });
  const groups = await Group.find({ deletedAt: null })
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate("ownerId", "name")
    .lean();
  return {
    items: serialize(
      groups.map((g) => ({
        _id: g._id,
        name: g.name,
        ownerName: (g.ownerId as { name?: string } | null)?.name ?? "Unknown",
        createdAt: g.createdAt,
      }))
    ),
    total,
    page,
    pageCount: Math.ceil(total / PAGE_SIZE),
  };
}

export async function listAdminExpenses(page = 1): Promise<AdminPage<{
  _id: string;
  title: string;
  amount: number;
  currency: string;
  type: string;
  userName: string;
  date: string;
}>> {
  await requireAdmin();
  const total = await Expense.countDocuments({ deletedAt: null });
  const expenses = await Expense.find({ deletedAt: null })
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .populate("userId", "name")
    .lean();
  return {
    items: serialize(
      expenses.map((e) => ({
        _id: e._id,
        title: e.title,
        amount: e.amount,
        currency: e.currency,
        type: e.type,
        userName: (e.userId as { name?: string } | null)?.name ?? "Unknown",
        date: e.date,
      }))
    ),
    total,
    page,
    pageCount: Math.ceil(total / PAGE_SIZE),
  };
}

export async function listAdminEmailLogs(page = 1): Promise<AdminPage<{
  _id: string;
  toEmail: string;
  type: string;
  subject: string;
  status: string;
  error?: string;
  createdAt: string;
}>> {
  await requireAdmin();
  const total = await EmailLog.countDocuments({});
  const logs = await EmailLog.find({})
    .sort({ createdAt: -1 })
    .skip((page - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .lean();
  return { items: serialize(logs), total, page, pageCount: Math.ceil(total / PAGE_SIZE) };
}
