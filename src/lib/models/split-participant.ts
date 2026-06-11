import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const splitParticipantSchema = new Schema(
  {
    splitId: { type: Schema.Types.ObjectId, ref: "Split", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    email: { type: String, required: true },
    name: { type: String },
    shareAmount: { type: Number, required: true, min: 0 },
    percentage: { type: Number, default: null },
    paidAmount: { type: Number, default: 0 },
    isPayer: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "partial", "paid"], default: "pending" },
    lastRemindedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

splitParticipantSchema.index({ splitId: 1 });
splitParticipantSchema.index({ userId: 1, status: 1 });
splitParticipantSchema.index({ email: 1 });

export type SplitParticipantDoc = InferSchemaType<typeof splitParticipantSchema> & { _id: Types.ObjectId };

export const SplitParticipant: Model<SplitParticipantDoc> =
  models.SplitParticipant || model<SplitParticipantDoc>("SplitParticipant", splitParticipantSchema);
