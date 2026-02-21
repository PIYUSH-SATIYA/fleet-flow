import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Maintenance from "@/lib/models/Maintenance";
import Vehicle from "@/lib/models/Vehicle";
import { withPermission } from "@/lib/utils/auth";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { updateMaintenanceSchema } from "@/lib/validators/maintenance";

// ============================================================
// GET /api/maintenance/[id] — Get service detail
// Permission: org:maintenance:view  (fleet_manager, dispatcher, safety_officer)
// ============================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(req, "org:maintenance:view", async () => {
    const { id } = await params;
    await connectDB();

    const maintenance = await Maintenance.findById(id)
      .populate("vehicle", "name licensePlate type currentOdometer")
      .lean();

    if (!maintenance) {
      return errorResponse("Maintenance log not found", 404);
    }

    return successResponse(maintenance);
  });
}

// ============================================================
// PUT /api/maintenance/[id] — Update / complete service
// Permission: org:maintenance:manage  (fleet_manager, safety_officer)
// ============================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(req, "org:maintenance:manage", async () => {
    const { id } = await params;
    const body = await req.json();

    const parsed = updateMaintenanceSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return errorResponse("Validation failed", 400, fieldErrors as Record<string, string[]>);
    }

    await connectDB();

    const maintenance = await Maintenance.findById(id);
    if (!maintenance) {
      return errorResponse("Maintenance log not found", 404);
    }

    // If completing the service, update vehicle status back to available
    if (parsed.data.status === "completed" && maintenance.status !== "completed") {
      maintenance.completedDate = parsed.data.completedDate
        ? new Date(parsed.data.completedDate)
        : new Date();

      await Vehicle.findByIdAndUpdate(maintenance.vehicle, {
        status: "available",
      });
    }

    if (parsed.data.description !== undefined) maintenance.description = parsed.data.description;
    if (parsed.data.cost !== undefined) maintenance.cost = parsed.data.cost;
    if (parsed.data.status) maintenance.status = parsed.data.status;
    if (parsed.data.vendor !== undefined) maintenance.vendor = parsed.data.vendor;

    await maintenance.save();

    const populated = await Maintenance.findById(maintenance._id)
      .populate("vehicle", "name licensePlate")
      .lean();

    return successResponse(
      populated,
      parsed.data.status === "completed"
        ? "Service completed — vehicle is now available"
        : "Maintenance log updated"
    );
  });
}
