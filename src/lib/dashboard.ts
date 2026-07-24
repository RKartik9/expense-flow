import "server-only";
import { Types } from "mongoose";
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  format,
  eachDayOfInterval,
  startOfDay,
  addDays,
} from "date-fns";
import { Expense } from "@/lib/models/expense";
import { Split } from "@/lib/models/split";
import { SplitParticipant } from "@/lib/models/split-participant";
import { RecurringExpense } from "@/lib/models/recurring-expense";
import { SubscriptionTracker } from "@/lib/models/subscription-tracker";

export interface OverviewStats {
  totalExpenses: number;
  totalIncome: number;
  monthlySpending: number;
  monthlySavings: number;
  prevMonthSpending: number;
  prevMonthSavings: number;
  pendingSplitsOwedToMe: number;
  pendingSplitsIOwe: number;
  upcomingPaymentsCount: number;
  upcomingPaymentsAmount: number;
  spark: number[];
}

async function sumExpenses(userId: Types.ObjectId, type: "expense" | "income", from?: Date, to?: Date) {
  const match: Record<string, unknown> = { userId, type, deletedAt: null };
  if (from || to) {
    match.date = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
  }
  const result = await Expense.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  return result[0]?.total ?? 0;
}

export async function getOverviewStats(userId: Types.ObjectId): Promise<OverviewStats> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonth = subMonths(now, 1);
  const prevMonthStart = startOfMonth(prevMonth);
  const prevMonthEnd = endOfMonth(prevMonth);
  const weekAhead = addDays(now, 7);

  const [
    totalExpenses,
    totalIncome,
    monthlySpending,
    monthlyIncome,
    prevMonthSpending,
    prevMonthIncome,
    spark,
  ] = await Promise.all([
    sumExpenses(userId, "expense"),
    sumExpenses(userId, "income"),
    sumExpenses(userId, "expense", monthStart, monthEnd),
    sumExpenses(userId, "income", monthStart, monthEnd),
    sumExpenses(userId, "expense", prevMonthStart, prevMonthEnd),
    sumExpenses(userId, "income", prevMonthStart, prevMonthEnd),
    getDailySpendSeries(userId, 14),
  ]);

  // Splits where I'm the payer: outstanding amounts others owe me
  const mySplits = await Split.find({ payerId: userId, status: "open", deletedAt: null })
    .select("_id")
    .lean();
  const owedToMeAgg = await SplitParticipant.aggregate([
    {
      $match: {
        splitId: { $in: mySplits.map((s) => s._id) },
        isPayer: false,
        status: { $ne: "paid" },
        deletedAt: null,
      },
    },
    { $group: { _id: null, total: { $sum: { $subtract: ["$shareAmount", "$paidAmount"] } } } },
  ]);

  // Splits where I owe someone
  const iOweAgg = await SplitParticipant.aggregate([
    { $match: { userId, isPayer: false, status: { $ne: "paid" }, deletedAt: null } },
    { $group: { _id: null, total: { $sum: { $subtract: ["$shareAmount", "$paidAmount"] } } } },
  ]);

  const [recurring, subscriptions] = await Promise.all([
    RecurringExpense.find({
      userId,
      active: true,
      deletedAt: null,
      nextRunAt: { $lte: weekAhead },
    }).lean(),
    SubscriptionTracker.find({
      userId,
      active: true,
      deletedAt: null,
      nextRenewalAt: { $lte: weekAhead },
    }).lean(),
  ]);

  return {
    totalExpenses,
    totalIncome,
    monthlySpending,
    monthlySavings: monthlyIncome - monthlySpending,
    prevMonthSpending,
    prevMonthSavings: prevMonthIncome - prevMonthSpending,
    pendingSplitsOwedToMe: owedToMeAgg[0]?.total ?? 0,
    pendingSplitsIOwe: iOweAgg[0]?.total ?? 0,
    upcomingPaymentsCount: recurring.length + subscriptions.length,
    upcomingPaymentsAmount:
      recurring.reduce((s, r) => s + r.amount, 0) + subscriptions.reduce((s, x) => s + x.amount, 0),
    spark,
  };
}

async function getDailySpendSeries(userId: Types.ObjectId, days: number): Promise<number[]> {
  const from = startOfDay(subDays(new Date(), days - 1));
  const rows = await Expense.aggregate([
    { $match: { userId, type: "expense", deletedAt: null, date: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        amount: { $sum: "$amount" },
      },
    },
  ]);
  const byDay = new Map(rows.map((r) => [r._id, r.amount]));
  return eachDayOfInterval({ start: from, end: new Date() }).map(
    (d) => byDay.get(format(d, "yyyy-MM-dd")) ?? 0
  );
}

export interface TrendPoint {
  date: string;
  label: string;
  amount: number;
}

export async function getTrendData(userId: Types.ObjectId): Promise<TrendPoint[]> {
  const from = startOfDay(subDays(new Date(), 29));
  const rows = await Expense.aggregate([
    { $match: { userId, type: "expense", deletedAt: null, date: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        amount: { $sum: "$amount" },
      },
    },
  ]);
  const byDay = new Map(rows.map((r) => [r._id, r.amount]));
  return eachDayOfInterval({ start: from, end: new Date() }).map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return { date: key, label: format(d, "dd MMM"), amount: byDay.get(key) ?? 0 };
  });
}

export interface MonthlyComparisonPoint {
  month: string;
  expenses: number;
  income: number;
}

export async function getMonthlyComparison(userId: Types.ObjectId): Promise<MonthlyComparisonPoint[]> {
  const from = startOfMonth(subMonths(new Date(), 5));
  const rows = await Expense.aggregate([
    { $match: { userId, deletedAt: null, date: { $gte: from } } },
    {
      $group: {
        _id: { month: { $dateToString: { format: "%Y-%m", date: "$date" } }, type: "$type" },
        amount: { $sum: "$amount" },
      },
    },
  ]);
  const points: MonthlyComparisonPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    const key = format(d, "yyyy-MM");
    points.push({
      month: format(d, "MMM"),
      expenses: rows.find((r) => r._id.month === key && r._id.type === "expense")?.amount ?? 0,
      income: rows.find((r) => r._id.month === key && r._id.type === "income")?.amount ?? 0,
    });
  }
  return points;
}

export interface CategorySlice {
  name: string;
  color: string;
  value: number;
}

export async function getCategoryDistribution(userId: Types.ObjectId): Promise<CategorySlice[]> {
  const monthStart = startOfMonth(new Date());
  const rows = await Expense.aggregate([
    { $match: { userId, type: "expense", deletedAt: null, date: { $gte: monthStart } } },
    { $group: { _id: "$categoryId", value: { $sum: "$amount" } } },
    {
      $lookup: {
        from: "categories",
        localField: "_id",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    { $sort: { value: -1 } },
  ]);
  return rows.map((r) => ({
    name: r.category?.name ?? "Other",
    color: r.category?.color ?? "#64748b",
    value: r.value,
  }));
}

export interface HeatmapDay {
  date: string;
  amount: number;
}

export async function getHeatmapData(userId: Types.ObjectId): Promise<HeatmapDay[]> {
  const from = startOfDay(subDays(new Date(), 7 * 16 - 1));
  const rows = await Expense.aggregate([
    { $match: { userId, type: "expense", deletedAt: null, date: { $gte: from } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        amount: { $sum: "$amount" },
      },
    },
  ]);
  const byDay = new Map(rows.map((r) => [r._id, r.amount]));
  return eachDayOfInterval({ start: from, end: new Date() }).map((d) => {
    const key = format(d, "yyyy-MM-dd");
    return { date: key, amount: byDay.get(key) ?? 0 };
  });
}
