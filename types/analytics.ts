// ============================================================
// FleetFlow — Analytics Types
// ============================================================

export interface DashboardKPIs {
  activeFleet: number; // vehicles currently "on_trip"
  maintenanceAlerts: number; // vehicles "in_shop"
  utilizationRate: number; // % of fleet assigned vs total
  pendingCargo: number; // trips in "draft" or "dispatched" status
  totalVehicles: number;
  totalDrivers: number;
  availableVehicles: number;
  availableDrivers: number;
}

export interface VehicleAnalytics {
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  totalTrips: number;
  totalDistanceKm: number;
  totalFuelLiters: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalExpenses: number;
  fuelEfficiency: number; // km per liter
  costPerKm: number;
  roi: number; // (revenue - costs) / acquisitionCost
}

export interface FleetSummary {
  totalOperationalCost: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  avgFuelEfficiency: number;
  avgCostPerKm: number;
  tripsByStatus: Record<string, number>;
  vehiclesByStatus: Record<string, number>;
  driversByStatus: Record<string, number>;
  monthlyExpenses: { month: string; amount: number }[];
}

export interface ExportParams {
  type: "csv" | "pdf";
  report: "fleet_summary" | "vehicle_detail" | "expense_report" | "driver_report";
  dateFrom?: string;
  dateTo?: string;
  vehicleId?: string;
}
