import mongoose, { Schema, Document, Model } from "mongoose";
import type { UserRole } from "@/types/user";

// ============================================================
// User Model — Synced from Clerk via webhook
// ============================================================

export interface IUserDocument extends Document {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    clerkId: {
      type: String,
      required: [true, "Clerk ID is required"],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    role: {
      type: String,
      enum: ["fleet_manager", "dispatcher", "safety_officer", "finance_analyst"],
      default: "dispatcher",
    },
    avatarUrl: String,
  },
  { timestamps: true }
);

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;
