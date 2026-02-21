import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Maintenance from "@/lib/models/Maintenance";
import Vehicle from "@/lib/models/Vehicle";
import { withPermission } from "@/lib/utils/auth";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
} from "@/lib/utils/api-response";
import { createMaintenanceSchema } from "@/lib/validators/maintenance";

// ============================================================
// GET /api/maintenance — List service logs
// Permission: org:maintenance:view  (fleet_manager, dispatcher, safety_officer)
// ============================================================
export async function GET(req: NextRequest) {
  return withPermission(req, "org:maintenance:view", async () => {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(searchParams);

    const filter: Record<string, unknown> = {};
    const vehicleId = searchParams.get("vehicle");
    const serviceType = searchParams.get("serviceType");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (vehicleId) filter.vehicle = vehicleId;
    if (serviceType) filter.serviceType = serviceType;
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.serviceDate = {};
      if (dateFrom) (filter.serviceDate as Record<string, unknown>).$gte = new Date(dateFrom);
      if (dateTo) (filter.serviceDate as Record<string, unknown>).$lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
      Maintenance.find(filter)
        .populate("vehicle", "name licensePlate")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Maintenance.countDocuments(filter),
    ]);

    return paginatedResponse(logs, total, page, limit);
  });
}

// ============================================================
// POST /api/maintenance — Log new service (auto: vehicle → in_shop)
// Permission: org:maintenance:manage  (fleet_manager, safety_officer)
// ============================================================
export async function POST(req: NextRequest) {
  return withPermission(req, "org:maintenance:manage", async (user) => {
    const body = await req.json();

    const parsed = createMaintenanceSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return errorResponse("Validation failed", 400, fieldErrors as Record<string, string[]>);
    }

    await connectDB();

    const vehicle = await Vehicle.findById(parsed.data.vehicle);
    if (!vehicle) {
      return errorResponse("Vehicle not found", 404);
    }

    if (vehicle.status === "on_trip") {
      return errorResponse(
        "Cannot create a service log for a vehicle that is currently on a trip",
        400
      );
    }

    const maintenance = await Maintenance.create({
      ...parsed.data,
      status: "in_progress",
      createdBy: user.userId,
    });

    vehicle.status = "in_shop";
    await vehicle.save();

    const populated = await Maintenance.findById(maintenance._id)
      .populate("vehicle", "name licensePlate")
      .lean();

    return successResponse(populated, "Service log created — vehicle moved to In Shop", 201);
  });
}
