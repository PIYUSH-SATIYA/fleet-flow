import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Vehicle from "@/lib/models/Vehicle";
import { withPermission } from "@/lib/utils/auth";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
} from "@/lib/utils/api-response";
import { createVehicleSchema } from "@/lib/validators/vehicle";

// ============================================================
// GET /api/vehicles — List all vehicles
// Permission: org:vehicle:view  (fleet_manager, dispatcher, safety_officer)
// ============================================================
export async function GET(req: NextRequest) {
  return withPermission(req, "org:vehicle:view", async () => {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(searchParams);

    const filter: Record<string, unknown> = {};
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const region = searchParams.get("region");
    const search = searchParams.get("search");

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (region) filter.region = { $regex: region, $options: "i" };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
        { licensePlate: { $regex: search, $options: "i" } },
      ];
    }

    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vehicle.countDocuments(filter),
    ]);

    return paginatedResponse(vehicles, total, page, limit);
  });
}

// ============================================================
// POST /api/vehicles — Create a vehicle
// Permission: org:vehicle:manage  (fleet_manager only)
// ============================================================
export async function POST(req: NextRequest) {
  return withPermission(req, "org:vehicle:manage", async (user) => {
    const body = await req.json();

    const parsed = createVehicleSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return errorResponse("Validation failed", 400, fieldErrors as Record<string, string[]>);
    }

    await connectDB();

    const existing = await Vehicle.findOne({ licensePlate: parsed.data.licensePlate });
    if (existing) {
      return errorResponse("A vehicle with this license plate already exists", 409);
    }

    const vehicle = await Vehicle.create({
      ...parsed.data,
      createdBy: user.userId,
    });

    return successResponse(vehicle, "Vehicle created successfully", 201);
  });
}
