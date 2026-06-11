"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { requireUser } from "@/lib/auth";
import { RecurringExpense, FREQUENCIES } from "@/lib/models/recurring-expense";
import { PAYMENT_METHODS } from "@/lib/models/expense";
import { serialize } from "@/lib/serialize";
import { type ActionResult, actionError } from "./types";

export interface RecurringItem {
  _id: string;
  title: string;
  amount: number;
  currency: string;
  categoryId: { _id: string; name: string; color: string } | null;
  paymentMethod: string;
  frequency: (typeof FREQUENCIES)[number];
  nextRunAt: string;
  lastRunAt: string | null;
  active: boolean;
}

export async function getRecurringExpenses(): Promise<RecurringItem[]> {
  const user = await requireUser();
  const items = await RecurringExpense.find({ userId: user._id, deletedAt: null })
    .populate("categoryId", "name color")
    .sort({ nextRunAt: 1 })
    .lean();
  return serialize<RecurringItem[]>(items);
}

const recurringSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  categoryId: z.string().refine(Types.ObjectId.isValid),
  paymentMethod: z.enum(PAYMENT_METHODS),
  frequency: z.enum(FREQUENCIES),
  nextRunAt: z.string(),
});

export type RecurringInput = z.infer<typeof recurringSchema>;

export async function createRecurringExpense(input: RecurringInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = recurringSchema.parse(input);
    await RecurringExpense.create({
      ...data,
      nextRunAt: new Date(data.nextRunAt),
      userId: user._id,
    });
    revalidatePath("/recurring");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function toggleRecurringExpense(id: string, active: boolean): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await RecurringExpense.updateOne(
      { _id: id, userId: user._id, deletedAt: null },
      { $set: { active } }
    );
    revalidatePath("/recurring");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteRecurringExpense(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await RecurringExpense.updateOne(
      { _id: id, userId: user._id },
      { $set: { deletedAt: new Date() } }
    );
    revalidatePath("/recurring");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}
