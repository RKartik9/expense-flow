"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { startOfMonth, endOfMonth } from "date-fns";
import { requireUser } from "@/lib/auth";
import { Budget } from "@/lib/models/budget";
import { Expense } from "@/lib/models/expense";
import { serialize } from "@/lib/serialize";
import { type ActionResult, actionError } from "./types";

export interface BudgetItem {
  _id: string;
  categoryId: { _id: string; name: string; color: string } | null;
  amount: number;
  month: number;
  year: number;
  spent: number;
}

export async function getBudgets(month: number, year: number): Promise<BudgetItem[]> {
  const user = await requireUser();
  const budgets = await Budget.find({ userId: user._id, month, year, deletedAt: null })
    .populate("categoryId", "name color")
    .lean();

  const ref = new Date(year, month - 1, 15);
  const spentRows = await Expense.aggregate([
    {
      $match: {
        userId: user._id,
        type: "expense",
        deletedAt: null,
        date: { $gte: startOfMonth(ref), $lte: endOfMonth(ref) },
      },
    },
    { $group: { _id: "$categoryId", spent: { $sum: "$amount" } } },
  ]);
  const spentByCategory = new Map(spentRows.map((r) => [String(r._id), r.spent]));

  return serialize<BudgetItem[]>(
    budgets.map((b) => ({
      ...b,
      spent:
        spentByCategory.get(
          String((b.categoryId as { _id?: unknown } | null)?._id ?? b.categoryId)
        ) ?? 0,
    }))
  );
}

const budgetSchema = z.object({
  categoryId: z.string().refine(Types.ObjectId.isValid),
  amount: z.number().positive(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
});

export async function upsertBudget(input: z.infer<typeof budgetSchema>): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = budgetSchema.parse(input);
    await Budget.updateOne(
      { userId: user._id, categoryId: data.categoryId, month: data.month, year: data.year },
      { $set: { amount: data.amount, deletedAt: null } },
      { upsert: true }
    );
    revalidatePath("/budgets");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await Budget.updateOne({ _id: id, userId: user._id }, { $set: { deletedAt: new Date() } });
    revalidatePath("/budgets");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}
