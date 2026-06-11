import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const EMAIL_TYPES = [
  "group_invitation",
  "split_created",
  "payment_reminder",
  "settlement_reminder",
  "settlement_completed",
  "weekly_summary",
  "monthly_report",
  "subscription_reminder",
  "budget_alert",
] as const;

const emailLogSchema = new Schema(
  {
    toEmail: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    type: { type: String, enum: EMAIL_TYPES, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ["sent", "failed"], required: true },
    providerId: { type: String },
    error: { type: String },
  },
  { timestamps: true }
);

emailLogSchema.index({ toEmail: 1, createdAt: -1 });
emailLogSchema.index({ type: 1, createdAt: -1 });

export type EmailLogDoc = InferSchemaType<typeof emailLogSchema> & { _id: Types.ObjectId };

export const EmailLog: Model<EmailLogDoc> =
  models.EmailLog || model<EmailLogDoc>("EmailLog", emailLogSchema);
