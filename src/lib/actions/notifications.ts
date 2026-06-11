"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { Notification } from "@/lib/models/notification";
import { serialize } from "@/lib/serialize";
import { type ActionResult, actionError } from "./types";

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const user = await requireUser();
    return await Notification.countDocuments({ userId: user._id, read: false, deletedAt: null });
  } catch {
    return 0;
  }
}

export async function getNotifications(limit = 50): Promise<NotificationItem[]> {
  const user = await requireUser();
  const items = await Notification.find({ userId: user._id, deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  return serialize<NotificationItem[]>(items);
}

export async function markNotificationRead(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await Notification.updateOne({ _id: id, userId: user._id }, { $set: { read: true } });
    revalidatePath("/notifications");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await Notification.updateMany({ userId: user._id, read: false }, { $set: { read: true } });
    revalidatePath("/notifications");
    return { success: true };
  } catch (err) {
    return actionError(err);
  }
}
