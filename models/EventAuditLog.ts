import mongoose, { Schema, Document } from "mongoose";

export interface IEventAuditLog extends Document {
    eventId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userName: string;
    userEmail: string;
    action: "create" | "update" | "publish" | "cancel" | "delete" | "toggle_registrations";
    summary: string;
    createdAt: Date;
}

const EventAuditLogSchema = new Schema(
    {
        eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        userName: { type: String, required: true },
        userEmail: { type: String, required: true },
        action: { type: String, required: true },
        summary: { type: String, default: "" },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

export default (mongoose.models.EventAuditLog as mongoose.Model<IEventAuditLog>) ||
    mongoose.model<IEventAuditLog>("EventAuditLog", EventAuditLogSchema);
