import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const categorySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    icon: { type: String, default: "circle" },
    color: { type: String, default: "#6366f1" },
    isDefault: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export type CategoryDoc = InferSchemaType<typeof categorySchema> & { _id: Types.ObjectId };

export const Category: Model<CategoryDoc> =
  models.Category || model<CategoryDoc>("Category", categorySchema);

export const DEFAULT_CATEGORIES: { name: string; icon: string; color: string }[] = [
  { name: "Food", icon: "utensils", color: "#f97316" },
  { name: "Travel", icon: "plane", color: "#0ea5e9" },
  { name: "Shopping", icon: "shopping-bag", color: "#ec4899" },
  { name: "Rent", icon: "home", color: "#8b5cf6" },
  { name: "Utilities", icon: "zap", color: "#eab308" },
  { name: "Entertainment", icon: "clapperboard", color: "#f43f5e" },
  { name: "Medical", icon: "heart-pulse", color: "#ef4444" },
  { name: "Education", icon: "graduation-cap", color: "#14b8a6" },
  { name: "Subscription", icon: "repeat", color: "#6366f1" },
  { name: "Investment", icon: "trending-up", color: "#22c55e" },
  { name: "Salary", icon: "banknote", color: "#10b981" },
  { name: "Other", icon: "circle-ellipsis", color: "#64748b" },
];
