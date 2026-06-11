import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const groupMemberSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    invitedEmail: { type: String, default: null },
    role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
    status: { type: String, enum: ["active", "invited"], default: "active" },
    joinedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

groupMemberSchema.index({ groupId: 1, userId: 1 });
groupMemberSchema.index({ groupId: 1, invitedEmail: 1 });
groupMemberSchema.index({ userId: 1, status: 1 });

export type GroupMemberDoc = InferSchemaType<typeof groupMemberSchema> & { _id: Types.ObjectId };

export const GroupMember: Model<GroupMemberDoc> =
  models.GroupMember || model<GroupMemberDoc>("GroupMember", groupMemberSchema);
