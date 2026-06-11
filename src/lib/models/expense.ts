import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const PAYMENT_METHODS = ["cash", "upi", "bank_transfer", "credit_card", "debit_card", "other"] as const;

const expenseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    type: { type: String, enum: ["expense", "income"], default: "expense" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    description: { type: String },
    date: { type: Date, required: true, default: Date.now },
    receiptUrl: { type: String },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: "cash" },
    tags: { type: [String], default: [] },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", default: null },
    splitId: { type: Schema.Types.ObjectId, ref: "Split", default: null },
    recurringExpenseId: { type: Schema.Types.ObjectId, ref: "RecurringExpense", default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, categoryId: 1 });
expenseSchema.index({ userId: 1, type: 1, date: -1 });
expenseSchema.index({ title: "text", description: "text", tags: "text" });

export type ExpenseDoc = InferSchemaType<typeof expenseSchema> & { _id: Types.ObjectId };

export const Expense: Model<ExpenseDoc> =
  models.Expense || model<ExpenseDoc>("Expense", expenseSchema);
