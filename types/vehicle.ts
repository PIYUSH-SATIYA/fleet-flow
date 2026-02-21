// ============================================================
// FleetFlow — Vehicle Types
// ============================================================

export type VehicleType = "truck" | "van" | "bike";
export type VehicleStatus = "available" | "on_trip" | "in_shop" | "retired";

export interface IVehicle {
  _id: string;
  name: string;
  model: string;
  licensePlate: string;
  type: VehicleType;
  maxCapacity: number; // in kg
  currentOdometer: number; // in km
  status: VehicleStatus;
  region?: string;
  acquisitionCost: number;
  acquisitionDate?: string;
  imageUrl?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehiclePayload {
  name: string;
  model: string;
  licensePlate: string;
  type: VehicleType;
  maxCapacity: number;
  currentOdometer?: number;
  region?: string;
  acquisitionCost?: number;
  acquisitionDate?: string;
}

export interface UpdateVehiclePayload extends Partial<CreateVehiclePayload> {
  status?: VehicleStatus;
}

export interface VehicleFilters {
  status?: VehicleStatus;
  type?: VehicleType;
  region?: string;
  search?: string; // search by name, model, or licensePlate
}
