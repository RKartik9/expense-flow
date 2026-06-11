"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { User } from "@/lib/models/user";
import { CURRENCIES, TIMEZONES } from "@/lib/format";
import { type ActionResult, actionError } from "./types";

const profileSchema = z.object({
  name: z.string().min(1).max(100),
  currency: z.enum(CURRENCIES),
  timezone: z.enum(TIMEZONES),
  notificationPrefs: z.object({
    emailReminders: z.boolean(),
    weeklySummary: z.boolean(),
    monthlyReport: z.boolean(),
    splitNotifications: z.boolean(),
  }),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const data = profileSchema.parse(input);
    await User.updateOne({ _id: user._id }, { $set: data });
    revalidatePath("/settings");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}
