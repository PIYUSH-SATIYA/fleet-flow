import mongoose, { Schema, Document, Model } from "mongoose";
import type { ExpenseType } from "@/types/expense";

// ============================================================
// Expense Model — Financial tracking per asset
// ============================================================

export interface IExpenseDocument extends Document {
  vehicle: mongoose.Types.ObjectId;
  trip?: mongoose.Types.ObjectId;
  type: ExpenseType;
  amount: number;
  fuelLiters?: number;
  fuelPricePerLiter?: number;
  date: Date;
  description?: string;
  receiptUrl?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle is required"],
    },
    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
    },
    type: {
      type: String,
      enum: ["fuel", "toll", "parking", "fine", "other"],
      required: [true, "Expense type is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    fuelLiters: {
      type: Number,
      min: [0, "Fuel liters cannot be negative"],
    },
    fuelPricePerLiter: {
      type: Number,
      min: [0, "Fuel price cannot be negative"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    description: { type: String, trim: true },
    receiptUrl: String,
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Indexes
ExpenseSchema.index({ vehicle: 1 });
ExpenseSchema.index({ trip: 1 });
ExpenseSchema.index({ type: 1 });
ExpenseSchema.index({ date: -1 });

const Expense: Model<IExpenseDocument> =
  mongoose.models.Expense ||
  mongoose.model<IExpenseDocument>("Expense", ExpenseSchema);

export default Expense;
