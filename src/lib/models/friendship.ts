import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const friendshipSchema = new Schema(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

friendshipSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });
friendshipSchema.index({ recipientId: 1, status: 1 });

export type FriendshipDoc = InferSchemaType<typeof friendshipSchema> & { _id: Types.ObjectId };

export const Friendship: Model<FriendshipDoc> =
  models.Friendship || model<FriendshipDoc>("Friendship", friendshipSchema);
