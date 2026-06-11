import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const NOTIFICATION_TYPES = [
  "new_split",
  "payment_received",
  "payment_reminder",
  "friend_request",
  "friend_accepted",
  "group_invitation",
  "budget_alert",
  "settlement_completed",
] as const;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    body: { type: String },
    link: { type: String },
    read: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export type NotificationDoc = InferSchemaType<typeof notificationSchema> & { _id: Types.ObjectId };

export const Notification: Model<NotificationDoc> =
  models.Notification || model<NotificationDoc>("Notification", notificationSchema);
