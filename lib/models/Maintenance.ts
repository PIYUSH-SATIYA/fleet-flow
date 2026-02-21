import mongoose, { Schema, Document, Model } from "mongoose";
import type { ServiceType, MaintenanceStatus } from "@/types/maintenance";

// ============================================================
// Maintenance Model — Preventive & reactive service tracking
// ============================================================

export interface IMaintenanceDocument extends Document {
  vehicle: mongoose.Types.ObjectId;
  serviceType: ServiceType;
  description?: string;
  cost: number;
  odometerAtService?: number;
  serviceDate: Date;
  completedDate?: Date;
  status: MaintenanceStatus;
  vendor?: string;
  createdBy?: string; // Clerk user ID
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceSchema = new Schema<IMaintenanceDocument>(
  {
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle is required"],
    },
    serviceType: {
      type: String,
      enum: [
        "oil_change",
        "tire_replacement",
        "brake_service",
        "engine_repair",
        "inspection",
        "other",
      ],
      required: [true, "Service type is required"],
    },
    description: { type: String, trim: true },
    cost: {
      type: Number,
      required: [true, "Cost is required"],
      min: [0, "Cost cannot be negative"],
    },
    odometerAtService: { type: Number, min: 0 },
    serviceDate: {
      type: Date,
      required: [true, "Service date is required"],
    },
    completedDate: Date,
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed"],
      default: "in_progress",
    },
    vendor: { type: String, trim: true },
    createdBy: { type: String }, // Clerk user ID
  },
  { timestamps: true }
);

// Indexes
MaintenanceSchema.index({ vehicle: 1 });
MaintenanceSchema.index({ status: 1 });
MaintenanceSchema.index({ serviceDate: -1 });

const Maintenance: Model<IMaintenanceDocument> =
  mongoose.models.Maintenance ||
  mongoose.model<IMaintenanceDocument>("Maintenance", MaintenanceSchema);

export default Maintenance;
