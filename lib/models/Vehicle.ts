import mongoose, { Schema, Document, Model } from "mongoose";
import type { VehicleType, VehicleStatus } from "@/types/vehicle";

// ============================================================
// Vehicle Model — Physical asset registry
// ============================================================

export interface IVehicleDocument {
  name: string;
  model: string;
  licensePlate: string;
  type: VehicleType;
  maxCapacity: number;
  currentOdometer: number;
  status: VehicleStatus;
  region?: string;
  acquisitionCost: number;
  acquisitionDate?: Date;
  imageUrl?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicleDocument>(
  {
    name: {
      type: String,
      required: [true, "Vehicle name is required"],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Vehicle model is required"],
      trim: true,
    },
    licensePlate: {
      type: String,
      required: [true, "License plate is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["truck", "van", "bike"],
      required: [true, "Vehicle type is required"],
    },
    maxCapacity: {
      type: Number,
      required: [true, "Max capacity is required"],
      min: [0, "Max capacity cannot be negative"],
    },
    currentOdometer: {
      type: Number,
      default: 0,
      min: [0, "Odometer cannot be negative"],
    },
    status: {
      type: String,
      enum: ["available", "on_trip", "in_shop", "retired"],
      default: "available",
    },
    region: { type: String, trim: true },
    acquisitionCost: {
      type: Number,
      default: 0,
      min: [0, "Acquisition cost cannot be negative"],
    },
    acquisitionDate: Date,
    imageUrl: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Indexes for common queries
VehicleSchema.index({ status: 1 });
VehicleSchema.index({ type: 1 });
VehicleSchema.index({ region: 1 });

const Vehicle: Model<IVehicleDocument> =
  mongoose.models.Vehicle ||
  mongoose.model<IVehicleDocument>("Vehicle", VehicleSchema);

export default Vehicle;
