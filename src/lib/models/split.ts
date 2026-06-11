import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const SPLIT_TYPES = ["equal", "percentage", "exact"] as const;

const splitSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    splitType: { type: String, enum: SPLIT_TYPES, required: true },
    createdById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    payerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", default: null },
    date: { type: Date, default: Date.now },
    receiptUrl: { type: String },
    status: { type: String, enum: ["open", "settled"], default: "open" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

splitSchema.index({ createdById: 1, createdAt: -1 });
splitSchema.index({ groupId: 1, status: 1 });
splitSchema.index({ title: "text", description: "text" });

export type SplitDoc = InferSchemaType<typeof splitSchema> & { _id: Types.ObjectId };

export const Split: Model<SplitDoc> = models.Split || model<SplitDoc>("Split", splitSchema);
