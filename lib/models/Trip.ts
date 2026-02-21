import mongoose, { Schema, Document, Model } from "mongoose";
import type { TripStatus } from "@/types/trip";

// ============================================================
// Trip Model — Dispatch & cargo movement lifecycle
// ============================================================

export interface ITripDocument extends Document {
  tripNumber: string;
  vehicle: mongoose.Types.ObjectId;
  driver: mongoose.Types.ObjectId;
  origin: string;
  destination: string;
  cargoDescription?: string;
  cargoWeight: number;
  status: TripStatus;
  startOdometer?: number;
  endOdometer?: number;
  distanceCovered?: number;
  scheduledDate?: Date;
  completedDate?: Date;
  notes?: string;
  createdBy?: string; // Clerk user ID
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITripDocument>(
  {
    tripNumber: {
      type: String,
      unique: true,
    },
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle is required"],
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: [true, "Driver is required"],
    },
    origin: {
      type: String,
      required: [true, "Origin is required"],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
    },
    cargoDescription: { type: String, trim: true },
    cargoWeight: {
      type: Number,
      required: [true, "Cargo weight is required"],
      min: [0, "Cargo weight cannot be negative"],
    },
    status: {
      type: String,
      enum: ["draft", "dispatched", "in_transit", "completed", "cancelled"],
      default: "draft",
    },
    startOdometer: { type: Number, min: 0 },
    endOdometer: { type: Number, min: 0 },
    distanceCovered: { type: Number, min: 0 },
    scheduledDate: Date,
    completedDate: Date,
    notes: { type: String, trim: true },
    createdBy: { type: String }, // Clerk user ID
  },
  { timestamps: true }
);

// Auto-generate trip number before saving
TripSchema.pre("save", async function () {
  if (this.isNew && !this.tripNumber) {
    const count = await mongoose.models.Trip.countDocuments();
    this.tripNumber = `TRP-${String(count + 1).padStart(5, "0")}`;
  }

  // Auto-compute distance if both odometer readings are present
  if (this.endOdometer && this.startOdometer) {
    this.distanceCovered = this.endOdometer - this.startOdometer;
  }
});

// Indexes
TripSchema.index({ status: 1 });
TripSchema.index({ vehicle: 1 });
TripSchema.index({ driver: 1 });
TripSchema.index({ scheduledDate: -1 });

const Trip: Model<ITripDocument> =
  mongoose.models.Trip || mongoose.model<ITripDocument>("Trip", TripSchema);

export default Trip;
