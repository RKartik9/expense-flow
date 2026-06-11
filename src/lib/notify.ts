import { Notification, type NOTIFICATION_TYPES } from "@/lib/models/notification";
import { ActivityLog } from "@/lib/models/activity-log";

export async function createNotification(input: {
  userId: string;
  type: (typeof NOTIFICATION_TYPES)[number];
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    await Notification.create(input);
  } catch (err) {
    console.error("Failed to create notification", err);
  }
}

export async function logActivity(input: {
  userId: string;
  groupId?: string | null;
  action: string;
  details?: string;
  entityType?: string;
  entityId?: string;
}) {
  try {
    await ActivityLog.create(input);
  } catch (err) {
    console.error("Failed to log activity", err);
  }
}
