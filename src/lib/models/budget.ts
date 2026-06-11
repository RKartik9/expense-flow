import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const budgetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    amount: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    alertSentAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, categoryId: 1, month: 1, year: 1 }, { unique: true });

export type BudgetDoc = InferSchemaType<typeof budgetSchema> & { _id: Types.ObjectId };

export const Budget: Model<BudgetDoc> = models.Budget || model<BudgetDoc>("Budget", budgetSchema);
