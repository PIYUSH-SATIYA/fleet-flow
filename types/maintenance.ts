// ============================================================
// FleetFlow — Maintenance Types
// ============================================================

export type ServiceType =
  | "oil_change"
  | "tire_replacement"
  | "brake_service"
  | "engine_repair"
  | "inspection"
  | "other";

export type MaintenanceStatus = "scheduled" | "in_progress" | "completed";

export interface IMaintenance {
  _id: string;
  vehicle: string; // Vehicle ObjectId (or populated)
  serviceType: ServiceType;
  description?: string;
  cost: number;
  odometerAtService?: number;
  serviceDate: string;
  completedDate?: string;
  status: MaintenanceStatus;
  vendor?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMaintenancePopulated extends Omit<IMaintenance, "vehicle"> {
  vehicle: {
    _id: string;
    name: string;
    licensePlate: string;
  };
}

export interface CreateMaintenancePayload {
  vehicle: string;
  serviceType: ServiceType;
  description?: string;
  cost: number;
  odometerAtService?: number;
  serviceDate: string;
  vendor?: string;
}

export interface UpdateMaintenancePayload {
  description?: string;
  cost?: number;
  status?: MaintenanceStatus;
  completedDate?: string;
  vendor?: string;
}

export interface MaintenanceFilters {
  vehicle?: string;
  serviceType?: ServiceType;
  status?: MaintenanceStatus;
  dateFrom?: string;
  dateTo?: string;
}
