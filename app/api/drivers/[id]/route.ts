import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Driver from "@/lib/models/Driver";
import { withPermission } from "@/lib/utils/auth";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { updateDriverSchema } from "@/lib/validators/driver";

// ============================================================
// GET /api/drivers/[id] — Get driver profile + stats
// Permission: org:driver:view  (fleet_manager, dispatcher, safety_officer)
// ============================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(req, "org:driver:view", async () => {
    const { id } = await params;
    await connectDB();

    const driver = await Driver.findById(id).lean();
    if (!driver) {
      return errorResponse("Driver not found", 404);
    }

    return successResponse(driver);
  });
}

// ============================================================
// PUT /api/drivers/[id] — Update driver profile / toggle status
// Permission: org:driver:manage  (fleet_manager, dispatcher)
// ============================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(req, "org:driver:manage", async () => {
    const { id } = await params;
    const body = await req.json();

    const parsed = updateDriverSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return errorResponse("Validation failed", 400, fieldErrors as Record<string, string[]>);
    }

    await connectDB();

    if (parsed.data.email || parsed.data.licenseNumber) {
      const orConditions = [];
      if (parsed.data.email) orConditions.push({ email: parsed.data.email });
      if (parsed.data.licenseNumber)
        orConditions.push({ licenseNumber: parsed.data.licenseNumber });

      const existing = await Driver.findOne({
        $or: orConditions,
        _id: { $ne: id },
      });
      if (existing) {
        return errorResponse(
          "A driver with this email or license number already exists",
          409
        );
      }
    }

    const driver = await Driver.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean();

    if (!driver) {
      return errorResponse("Driver not found", 404);
    }

    return successResponse(driver, "Driver updated successfully");
  });
}

// ============================================================
// DELETE /api/drivers/[id] — Suspend driver
// Permission: org:driver:manage  (fleet_manager, dispatcher)
// ============================================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(req, "org:driver:manage", async () => {
    const { id } = await params;
    await connectDB();

    const driver = await Driver.findById(id);
    if (!driver) {
      return errorResponse("Driver not found", 404);
    }

    if (driver.status === "on_trip") {
      return errorResponse("Cannot suspend a driver who is currently on a trip", 400);
    }

    driver.status = "suspended";
    await driver.save();

    return successResponse(driver, "Driver suspended successfully");
  });
}
