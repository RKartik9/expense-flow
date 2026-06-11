import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";
import { PAYMENT_METHODS } from "./expense";

export const FREQUENCIES = ["daily", "weekly", "monthly", "quarterly", "yearly"] as const;

const recurringExpenseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: "upi" },
    frequency: { type: String, enum: FREQUENCIES, required: true },
    nextRunAt: { type: Date, required: true },
    lastRunAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

recurringExpenseSchema.index({ userId: 1, active: 1 });
recurringExpenseSchema.index({ active: 1, nextRunAt: 1 });

export type RecurringExpenseDoc = InferSchemaType<typeof recurringExpenseSchema> & { _id: Types.ObjectId };

export const RecurringExpense: Model<RecurringExpenseDoc> =
  models.RecurringExpense || model<RecurringExpenseDoc>("RecurringExpense", recurringExpenseSchema);
