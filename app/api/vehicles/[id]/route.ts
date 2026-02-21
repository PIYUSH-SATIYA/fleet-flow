import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Vehicle from "@/lib/models/Vehicle";
import { withPermission } from "@/lib/utils/auth";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { updateVehicleSchema } from "@/lib/validators/vehicle";

// ============================================================
// GET /api/vehicles/[id] — Get single vehicle
// Permission: org:vehicle:view  (fleet_manager, dispatcher, safety_officer)
// ============================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(req, "org:vehicle:view", async () => {
    const { id } = await params;
    await connectDB();

    const vehicle = await Vehicle.findById(id).lean();
    if (!vehicle) {
      return errorResponse("Vehicle not found", 404);
    }

    return successResponse(vehicle);
  });
}

// ============================================================
// PUT /api/vehicles/[id] — Update vehicle
// Permission: org:vehicle:manage  (fleet_manager only)
// ============================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(req, "org:vehicle:manage", async () => {
    const { id } = await params;
    const body = await req.json();

    const parsed = updateVehicleSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return errorResponse("Validation failed", 400, fieldErrors as Record<string, string[]>);
    }

    await connectDB();

    if (parsed.data.licensePlate) {
      const existing = await Vehicle.findOne({
        licensePlate: parsed.data.licensePlate,
        _id: { $ne: id },
      });
      if (existing) {
        return errorResponse("A vehicle with this license plate already exists", 409);
      }
    }

    const vehicle = await Vehicle.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!vehicle) {
      return errorResponse("Vehicle not found", 404);
    }

    return successResponse(vehicle, "Vehicle updated successfully");
  });
}

// ============================================================
// DELETE /api/vehicles/[id] — Retire vehicle (soft delete)
// Permission: org:vehicle:manage  (fleet_manager only)
// ============================================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(req, "org:vehicle:manage", async () => {
    const { id } = await params;
    await connectDB();

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return errorResponse("Vehicle not found", 404);
    }

    if (vehicle.status === "on_trip") {
      return errorResponse("Cannot retire a vehicle that is currently on a trip", 400);
    }

    vehicle.status = "retired";
    await vehicle.save();

    return successResponse(vehicle, "Vehicle retired successfully");
  });
}
