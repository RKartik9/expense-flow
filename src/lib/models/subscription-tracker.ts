import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const BILLING_CYCLES = ["weekly", "monthly", "quarterly", "yearly"] as const;

const subscriptionTrackerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    billingCycle: { type: String, enum: BILLING_CYCLES, default: "monthly" },
    nextRenewalAt: { type: Date, required: true },
    reminderDaysBefore: { type: Number, default: 3 },
    lastReminderSentAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

subscriptionTrackerSchema.index({ userId: 1, active: 1 });
subscriptionTrackerSchema.index({ active: 1, nextRenewalAt: 1 });

export type SubscriptionTrackerDoc = InferSchemaType<typeof subscriptionTrackerSchema> & {
  _id: Types.ObjectId;
};

export const SubscriptionTracker: Model<SubscriptionTrackerDoc> =
  models.SubscriptionTracker ||
  model<SubscriptionTrackerDoc>("SubscriptionTracker", subscriptionTrackerSchema);
