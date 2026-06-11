"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { SubscriptionTracker, BILLING_CYCLES } from "@/lib/models/subscription-tracker";
import { serialize } from "@/lib/serialize";
import { type ActionResult, actionError } from "./types";

export interface SubscriptionItem {
  _id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: (typeof BILLING_CYCLES)[number];
  nextRenewalAt: string;
  reminderDaysBefore: number;
  active: boolean;
}

export async function getSubscriptions(): Promise<SubscriptionItem[]> {
  const user = await requireUser();
  const subs = await SubscriptionTracker.find({ userId: user._id, deletedAt: null })
    .sort({ nextRenewalAt: 1 })
    .lean();
  return serialize<SubscriptionItem[]>(subs);
}

const subscriptionSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  billingCycle: z.enum(BILLING_CYCLES),
  nextRenewalAt: z.string(),
  reminderDaysBefore: z.number().min(0).max(30).default(3),
});

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;

export async function createSubscription(input: SubscriptionInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = subscriptionSchema.parse(input);
    await SubscriptionTracker.create({
      ...data,
      nextRenewalAt: new Date(data.nextRenewalAt),
      userId: user._id,
    });
    revalidatePath("/subscriptions");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function updateSubscription(id: string, input: SubscriptionInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = subscriptionSchema.parse(input);
    const result = await SubscriptionTracker.updateOne(
      { _id: id, userId: user._id, deletedAt: null },
      { $set: { ...data, nextRenewalAt: new Date(data.nextRenewalAt) } }
    );
    if (result.matchedCount === 0) return { success: false, error: "Subscription not found" };
    revalidatePath("/subscriptions");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function toggleSubscription(id: string, active: boolean): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await SubscriptionTracker.updateOne(
      { _id: id, userId: user._id, deletedAt: null },
      { $set: { active } }
    );
    revalidatePath("/subscriptions");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function deleteSubscription(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await SubscriptionTracker.updateOne(
      { _id: id, userId: user._id },
      { $set: { deletedAt: new Date() } }
    );
    revalidatePath("/subscriptions");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}
