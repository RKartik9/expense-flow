import { Schema, model, models, type InferSchemaType, type Model, type Types } from "mongoose";

const activityLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    groupId: { type: Schema.Types.ObjectId, ref: "Group", default: null },
    action: { type: String, required: true },
    details: { type: String },
    entityType: { type: String },
    entityId: { type: String },
  },
  { timestamps: true }
);

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ groupId: 1, createdAt: -1 });

export type ActivityLogDoc = InferSchemaType<typeof activityLogSchema> & { _id: Types.ObjectId };

export const ActivityLog: Model<ActivityLogDoc> =
  models.ActivityLog || model<ActivityLogDoc>("ActivityLog", activityLogSchema);
