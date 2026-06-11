import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const notificationPrefsSchema = new Schema(
  {
    emailReminders: { type: Boolean, default: true },
    weeklySummary: { type: Boolean, default: true },
    monthlyReport: { type: Boolean, default: true },
    splitNotifications: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    imageUrl: { type: String },
    currency: { type: String, default: "INR" },
    timezone: { type: String, default: "Asia/Kolkata" },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    notificationPrefs: { type: notificationPrefsSchema, default: () => ({}) },
    lastActiveAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

export const User: Model<UserDoc> = models.User || model<UserDoc>("User", userSchema);
