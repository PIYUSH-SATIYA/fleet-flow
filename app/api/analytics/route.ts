import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Vehicle from "@/lib/models/Vehicle";
import Driver from "@/lib/models/Driver";
import Trip from "@/lib/models/Trip";
import Expense from "@/lib/models/Expense";
import Maintenance from "@/lib/models/Maintenance";
import { withPermission } from "@/lib/utils/auth";
import { successResponse, errorResponse } from "@/lib/utils/api-response";

// ============================================================
// GET /api/analytics/route.ts — Dashboard KPIs & analytics
// ============================================================

export async function GET(req: NextRequest) {
  // Permission: org:analytics:view (fleet_manager, dispatcher, safety_officer, finance_analyst)
  return withPermission(req, "org:analytics:view", async () => {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const report = searchParams.get("report") || "dashboard";

    switch (report) {
      case "dashboard":
        return getDashboardKPIs();
      case "fleet-summary":
        return getFleetSummary();
      case "vehicle":
        const vehicleId = searchParams.get("vehicleId");
        if (!vehicleId) return errorResponse("vehicleId is required", 400);
        return getVehicleAnalytics(vehicleId);
      default:
        return errorResponse("Invalid report type", 400);
    }
  });
}

// ---- Dashboard KPIs ----
async function getDashboardKPIs() {
  const [
    totalVehicles,
    activeFleet,
    maintenanceAlerts,
    availableVehicles,
    totalDrivers,
    availableDrivers,
    pendingCargo,
  ] = await Promise.all([
    Vehicle.countDocuments({ status: { $ne: "retired" } }),
    Vehicle.countDocuments({ status: "on_trip" }),
    Vehicle.countDocuments({ status: "in_shop" }),
    Vehicle.countDocuments({ status: "available" }),
    Driver.countDocuments({ status: { $ne: "suspended" } }),
    Driver.countDocuments({ status: "available" }),
    Trip.countDocuments({ status: { $in: ["draft", "dispatched"] } }),
  ]);

  const utilizationRate =
    totalVehicles > 0
      ? Math.round((activeFleet / totalVehicles) * 100)
      : 0;

  return successResponse({
    activeFleet,
    maintenanceAlerts,
    utilizationRate,
    pendingCargo,
    totalVehicles,
    totalDrivers,
    availableVehicles,
    availableDrivers,
  });
}

// ---- Fleet Summary (aggregated) ----
async function getFleetSummary() {
  const [
    totalFuelCost,
    totalMaintenanceCost,
    totalExpensesAll,
    tripsByStatus,
    vehiclesByStatus,
    driversByStatus,
    monthlyExpenses,
  ] = await Promise.all([
    // Total fuel cost
    Expense.aggregate([
      { $match: { type: "fuel" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    // Total maintenance cost
    Maintenance.aggregate([
      { $group: { _id: null, total: { $sum: "$cost" } } },
    ]),
    // Total all expenses
    Expense.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    // Trips grouped by status
    Trip.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    // Vehicles grouped by status
    Vehicle.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    // Drivers grouped by status
    Driver.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    // Monthly expenses (last 12 months)
    Expense.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)),
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  // Transform aggregation results
  const toMap = (arr: { _id: string; count: number }[]) =>
    Object.fromEntries(arr.map((item) => [item._id, item.count]));

  return successResponse({
    totalFuelCost: totalFuelCost[0]?.total || 0,
    totalMaintenanceCost: totalMaintenanceCost[0]?.total || 0,
    totalOperationalCost:
      (totalExpensesAll[0]?.total || 0) + (totalMaintenanceCost[0]?.total || 0),
    tripsByStatus: toMap(tripsByStatus),
    vehiclesByStatus: toMap(vehiclesByStatus),
    driversByStatus: toMap(driversByStatus),
    monthlyExpenses: monthlyExpenses.map((m) => ({
      month: `${m._id.year}-${String(m._id.month).padStart(2, "0")}`,
      amount: m.amount,
    })),
  });
}

// ---- Per-Vehicle Analytics ----
async function getVehicleAnalytics(vehicleId: string) {
  const vehicle = await Vehicle.findById(vehicleId).lean();
  if (!vehicle) return errorResponse("Vehicle not found", 404);

  const [trips, fuelExpenses, maintenanceCosts, allExpenses] = await Promise.all([
    Trip.find({ vehicle: vehicleId, status: "completed" }).lean(),
    Expense.aggregate([
      { $match: { vehicle: vehicle._id, type: "fuel" } },
      {
        $group: {
          _id: null,
          totalCost: { $sum: "$amount" },
          totalLiters: { $sum: "$fuelLiters" },
        },
      },
    ]),
    Maintenance.aggregate([
      { $match: { vehicle: vehicle._id } },
      { $group: { _id: null, total: { $sum: "$cost" } } },
    ]),
    Expense.aggregate([
      { $match: { vehicle: vehicle._id } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ]);

  const totalDistanceKm = trips.reduce((sum, t) => sum + (t.distanceCovered || 0), 0);
  const totalFuelLiters = fuelExpenses[0]?.totalLiters || 0;
  const totalFuelCost = fuelExpenses[0]?.totalCost || 0;
  const totalMaintCost = maintenanceCosts[0]?.total || 0;
  const totalExp = allExpenses[0]?.total || 0;

  return successResponse({
    vehicleId: vehicle._id,
    vehicleName: vehicle.name,
    licensePlate: vehicle.licensePlate,
    totalTrips: trips.length,
    totalDistanceKm,
    totalFuelLiters,
    totalFuelCost,
    totalMaintenanceCost: totalMaintCost,
    totalExpenses: totalExp,
    fuelEfficiency: totalFuelLiters > 0 ? +(totalDistanceKm / totalFuelLiters).toFixed(2) : 0,
    costPerKm: totalDistanceKm > 0 ? +((totalExp + totalMaintCost) / totalDistanceKm).toFixed(2) : 0,
    roi:
      vehicle.acquisitionCost > 0
        ? +(((0 - (totalMaintCost + totalFuelCost)) / vehicle.acquisitionCost) * 100).toFixed(2)
        : 0,
  });
}
