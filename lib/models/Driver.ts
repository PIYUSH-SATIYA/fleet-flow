import mongoose, { Schema, Document, Model } from "mongoose";
import type { DriverStatus } from "@/types/driver";
import type { VehicleType } from "@/types/vehicle";

// ============================================================
// Driver Model — Human resource & compliance management
// ============================================================

export interface IDriverDocument extends Document {
  name: string;
  email: string;
  phone?: string;
  licenseNumber: string;
  licenseCategory: VehicleType[];
  licenseExpiry: Date;
  status: DriverStatus;
  safetyScore: number;
  totalTripsCompleted: number;
  avatarUrl?: string;
  createdBy?: string; // Clerk user ID
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriverDocument>(
  {
    name: {
      type: String,
      required: [true, "Driver name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    licenseCategory: {
      type: [String],
      enum: ["truck", "van", "bike"],
      required: [true, "At least one license category is required"],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "At least one license category is required",
      },
    },
    licenseExpiry: {
      type: Date,
      required: [true, "License expiry date is required"],
    },
    status: {
      type: String,
      enum: ["available", "on_trip", "off_duty", "suspended"],
      default: "available",
    },
    safetyScore: {
      type: Number,
      default: 100,
      min: [0, "Safety score cannot be below 0"],
      max: [100, "Safety score cannot exceed 100"],
    },
    totalTripsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    avatarUrl: String,
    createdBy: { type: String }, // Clerk user ID
  },
  { timestamps: true }
);

// Indexes
DriverSchema.index({ status: 1 });
DriverSchema.index({ licenseExpiry: 1 });

const Driver: Model<IDriverDocument> =
  mongoose.models.Driver ||
  mongoose.model<IDriverDocument>("Driver", DriverSchema);

export default Driver;
