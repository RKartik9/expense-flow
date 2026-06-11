import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const groupSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    coverImageUrl: { type: String },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    currency: { type: String, default: "INR" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

groupSchema.index({ ownerId: 1 });
groupSchema.index({ name: "text", description: "text" });

export type GroupDoc = InferSchemaType<typeof groupSchema> & { _id: Types.ObjectId };

export const Group: Model<GroupDoc> = models.Group || model<GroupDoc>("Group", groupSchema);
