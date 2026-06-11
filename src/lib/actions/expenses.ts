"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Types, type QueryFilter } from "mongoose";
import { requireUser } from "@/lib/auth";
import { Expense, PAYMENT_METHODS, type ExpenseDoc } from "@/lib/models/expense";
import { Category } from "@/lib/models/category";
import { rateLimit } from "@/lib/rate-limit";
import { checkBudgetAlert } from "@/lib/budget-check";
import { serialize } from "@/lib/serialize";
import { type ActionResult, actionError } from "./types";

export interface ExpenseItem {
  _id: string;
  title: string;
  amount: number;
  currency: string;
  type: "expense" | "income";
  categoryId: { _id: string; name: string; color: string; icon: string } | null;
  description?: string;
  date: string;
  receiptUrl?: string;
  paymentMethod: string;
  tags: string[];
}

export interface ExpenseFilters {
  q?: string;
  categoryId?: string;
  type?: "expense" | "income";
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface ExpensePage {
  items: ExpenseItem[];
  nextCursor: string | null;
}

const PAGE_SIZE = 20;

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFilter(userId: Types.ObjectId, filters: ExpenseFilters): QueryFilter<ExpenseDoc> {
  const filter: QueryFilter<ExpenseDoc> = { userId, deletedAt: null };
  if (filters.q) {
    const rx = new RegExp(escapeRegex(filters.q), "i");
    filter.$or = [{ title: rx }, { description: rx }, { tags: rx }];
  }
  if (filters.categoryId && Types.ObjectId.isValid(filters.categoryId)) {
    filter.categoryId = new Types.ObjectId(filters.categoryId);
  }
  if (filters.type) filter.type = filters.type;
  if (filters.dateFrom || filters.dateTo) {
    filter.date = {};
    if (filters.dateFrom) filter.date.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      filter.date.$lte = to;
    }
  }
  if (filters.minAmount != null || filters.maxAmount != null) {
    filter.amount = {};
    if (filters.minAmount != null) filter.amount.$gte = filters.minAmount;
    if (filters.maxAmount != null) filter.amount.$lte = filters.maxAmount;
  }
  return filter;
}

export async function getExpensesPage(
  filters: ExpenseFilters,
  cursor?: string | null
): Promise<ExpensePage> {
  const user = await requireUser();
  const filter = buildFilter(user._id, filters);

  if (cursor) {
    const [dateStr, id] = cursor.split("__");
    const cursorDate = new Date(dateStr);
    filter.$and = [
      ...(filter.$and ?? []),
      {
        $or: [
          { date: { $lt: cursorDate } },
          { date: cursorDate, _id: { $lt: new Types.ObjectId(id) } },
        ],
      },
    ];
  }

  const docs = await Expense.find(filter)
    .sort({ date: -1, _id: -1 })
    .limit(PAGE_SIZE + 1)
    .populate("categoryId", "name color icon")
    .lean();

  const hasMore = docs.length > PAGE_SIZE;
  const items = docs.slice(0, PAGE_SIZE);
  const last = items[items.length - 1];
  return {
    items: serialize<ExpenseItem[]>(items),
    nextCursor: hasMore && last ? `${new Date(last.date).toISOString()}__${last._id}` : null,
  };
}

const expenseSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  type: z.enum(["expense", "income"]).default("expense"),
  categoryId: z.string().refine(Types.ObjectId.isValid, "Invalid category"),
  description: z.string().max(2000).optional(),
  date: z.string().or(z.date()),
  receiptUrl: z.string().url().optional().or(z.literal("")),
  paymentMethod: z.enum(PAYMENT_METHODS).default("cash"),
  tags: z.array(z.string().min(1).max(30)).max(10).default([]),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

async function assertCategoryOwned(userId: Types.ObjectId, categoryId: string) {
  const category = await Category.findOne({ _id: categoryId, userId, deletedAt: null });
  if (!category) throw new Error("Category not found");
}

export async function createExpense(input: ExpenseInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    rateLimit(`expense:${user._id}`, 30);
    const data = expenseSchema.parse(input);
    await assertCategoryOwned(user._id, data.categoryId);
    await Expense.create({
      ...data,
      receiptUrl: data.receiptUrl || undefined,
      date: new Date(data.date),
      userId: user._id,
    });
    if (data.type === "expense") {
      await checkBudgetAlert(user._id, data.categoryId, new Date(data.date));
    }
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = expenseSchema.parse(input);
    await assertCategoryOwned(user._id, data.categoryId);
    const result = await Expense.updateOne(
      { _id: id, userId: user._id, deletedAt: null },
      {
        $set: {
          ...data,
          receiptUrl: data.receiptUrl || undefined,
          date: new Date(data.date),
        },
      }
    );
    if (result.matchedCount === 0) return { success: false, error: "Expense not found" };
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const result = await Expense.updateOne(
      { _id: id, userId: user._id, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    );
    if (result.matchedCount === 0) return { success: false, error: "Expense not found" };
    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}
