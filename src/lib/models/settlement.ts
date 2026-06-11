import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

export const SETTLEMENT_METHODS = ["cash", "upi", "bank_transfer", "credit_card"] as const;

const settlementSchema = new Schema(
  {
    splitId: { type: Schema.Types.ObjectId, ref: "Split", default: null },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", default: null },
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    method: { type: String, enum: SETTLEMENT_METHODS, default: "upi" },
    status: { type: String, enum: ["pending", "partial", "paid"], default: "pending" },
    proofUrl: { type: String },
    note: { type: String },
    settledAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

settlementSchema.index({ fromUserId: 1, status: 1 });
settlementSchema.index({ toUserId: 1, status: 1 });
settlementSchema.index({ splitId: 1 });
settlementSchema.index({ groupId: 1 });

export type SettlementDoc = InferSchemaType<typeof settlementSchema> & { _id: Types.ObjectId };

export const Settlement: Model<SettlementDoc> =
  models.Settlement || model<SettlementDoc>("Settlement", settlementSchema);
