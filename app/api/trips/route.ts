import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Trip from "@/lib/models/Trip";
import Vehicle from "@/lib/models/Vehicle";
import Driver from "@/lib/models/Driver";
import { withPermission } from "@/lib/utils/auth";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
} from "@/lib/utils/api-response";
import { createTripSchema } from "@/lib/validators/trip";

// ============================================================
// GET /api/trips — List trips
// Permission: org:trip:view  (fleet_manager, dispatcher, safety_officer, finance_analyst)
// ============================================================
export async function GET(req: NextRequest) {
  return withPermission(req, "org:trip:view", async () => {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(searchParams);

    const filter: Record<string, unknown> = {};
    const status = searchParams.get("status");
    const vehicleId = searchParams.get("vehicle");
    const driverId = searchParams.get("driver");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");

    if (status) filter.status = status;
    if (vehicleId) filter.vehicle = vehicleId;
    if (driverId) filter.driver = driverId;
    if (dateFrom || dateTo) {
      filter.scheduledDate = {};
      if (dateFrom) (filter.scheduledDate as Record<string, unknown>).$gte = new Date(dateFrom);
      if (dateTo) (filter.scheduledDate as Record<string, unknown>).$lte = new Date(dateTo);
    }
    if (search) {
      filter.$or = [
        { tripNumber: { $regex: search, $options: "i" } },
        { origin: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
      ];
    }

    const [trips, total] = await Promise.all([
      Trip.find(filter)
        .populate("vehicle", "name licensePlate type maxCapacity")
        .populate("driver", "name licenseNumber")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Trip.countDocuments(filter),
    ]);

    return paginatedResponse(trips, total, page, limit);
  });
}

// ============================================================
// POST /api/trips — Create trip with full business validation
// Permission: org:trip:manage  (fleet_manager, dispatcher)
// ============================================================
export async function POST(req: NextRequest) {
  return withPermission(req, "org:trip:manage", async (user) => {
    const body = await req.json();

    const parsed = createTripSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return errorResponse("Validation failed", 400, fieldErrors as Record<string, string[]>);
    }

    await connectDB();

    // 1. Fetch vehicle and driver
    const [vehicle, driver] = await Promise.all([
      Vehicle.findById(parsed.data.vehicle),
      Driver.findById(parsed.data.driver),
    ]);

    if (!vehicle) return errorResponse("Vehicle not found", 404);
    if (!driver) return errorResponse("Driver not found", 404);

    // 2. Check vehicle availability
    if (vehicle.status !== "available") {
      return errorResponse(
        `Vehicle "${vehicle.name}" is not available (current status: ${vehicle.status})`,
        400
      );
    }

    // 3. Check driver availability
    if (driver.status !== "available") {
      return errorResponse(
        `Driver "${driver.name}" is not available (current status: ${driver.status})`,
        400
      );
    }

    // 4. Check driver license expiry
    if (new Date(driver.licenseExpiry) < new Date()) {
      return errorResponse(
        `Driver "${driver.name}"'s license has expired (${driver.licenseExpiry.toISOString().split("T")[0]})`,
        400
      );
    }

    // 5. Check driver license category matches vehicle type
    if (!driver.licenseCategory.includes(vehicle.type)) {
      return errorResponse(
        `Driver "${driver.name}" is not licensed to drive a ${vehicle.type} (licensed for: ${driver.licenseCategory.join(", ")})`,
        400
      );
    }

    // 6. Check cargo weight vs vehicle capacity
    if (parsed.data.cargoWeight > vehicle.maxCapacity) {
      return errorResponse(
        `Cargo weight (${parsed.data.cargoWeight}kg) exceeds vehicle max capacity (${vehicle.maxCapacity}kg)`,
        400
      );
    }

    // All checks passed — create trip and update statuses
    const trip = await Trip.create({
      ...parsed.data,
      status: "dispatched",
      startOdometer: parsed.data.startOdometer ?? vehicle.currentOdometer,
      createdBy: user._id,
    });

    await Promise.all([
      Vehicle.findByIdAndUpdate(vehicle._id, { status: "on_trip" }),
      Driver.findByIdAndUpdate(driver._id, { status: "on_trip" }),
    ]);

    const populated = await Trip.findById(trip._id)
      .populate("vehicle", "name licensePlate type maxCapacity")
      .populate("driver", "name licenseNumber")
      .lean();

    return successResponse(populated, "Trip created and dispatched successfully", 201);
  });
}
