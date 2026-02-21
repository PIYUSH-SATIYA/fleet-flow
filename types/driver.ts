// ============================================================
// FleetFlow — Driver Types
// ============================================================

import type { VehicleType } from "./vehicle";

export type DriverStatus = "available" | "on_trip" | "off_duty" | "suspended";

export interface IDriver {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  licenseNumber: string;
  licenseCategory: VehicleType[]; // can drive which vehicle types
  licenseExpiry: string; // ISO date
  status: DriverStatus;
  safetyScore: number; // 0–100
  totalTripsCompleted: number;
  avatarUrl?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDriverPayload {
  name: string;
  email: string;
  phone?: string;
  licenseNumber: string;
  licenseCategory: VehicleType[];
  licenseExpiry: string;
  status?: DriverStatus;
  safetyScore?: number;
  avatarUrl?: string;
}

export interface UpdateDriverPayload extends Partial<CreateDriverPayload> {
  status?: DriverStatus;
  safetyScore?: number;
}

export interface DriverFilters {
  status?: DriverStatus;
  licenseCategory?: VehicleType;
  search?: string; // search by name, email, licenseNumber
}
