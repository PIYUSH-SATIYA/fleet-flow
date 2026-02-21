// ============================================================
// FleetFlow — Trip Types
// ============================================================

export type TripStatus = "draft" | "dispatched" | "in_transit" | "completed" | "cancelled";

export interface ITrip {
  _id: string;
  tripNumber: string; // e.g. "TRP-00001"
  vehicle: string; // Vehicle ObjectId (or populated IVehicle)
  driver: string; // Driver ObjectId (or populated IDriver)
  origin: string;
  destination: string;
  cargoDescription?: string;
  cargoWeight: number; // in kg
  status: TripStatus;
  startOdometer?: number;
  endOdometer?: number;
  distanceCovered?: number; // computed: endOdometer - startOdometer
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Populated version with vehicle & driver objects
export interface ITripPopulated extends Omit<ITrip, "vehicle" | "driver"> {
  vehicle: {
    _id: string;
    name: string;
    licensePlate: string;
    type: string;
    maxCapacity: number;
  };
  driver: {
    _id: string;
    name: string;
    licenseNumber: string;
  };
}

export interface CreateTripPayload {
  vehicle: string; // Vehicle ObjectId
  driver: string; // Driver ObjectId
  origin: string;
  destination: string;
  cargoDescription?: string;
  cargoWeight: number;
  startOdometer?: number;
  scheduledDate?: string;
  notes?: string;
}

export interface UpdateTripPayload {
  status?: TripStatus;
  endOdometer?: number;
  completedDate?: string;
  notes?: string;
}

export interface TripFilters {
  status?: TripStatus;
  vehicle?: string;
  driver?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
