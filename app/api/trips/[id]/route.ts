import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Trip from "@/lib/models/Trip";
import Vehicle from "@/lib/models/Vehicle";
import Driver from "@/lib/models/Driver";
import { withPermission } from "@/lib/utils/auth";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { updateTripSchema } from "@/lib/validators/trip";

// ============================================================
// GET /api/trips/[id] — Get trip details
// Permission: org:trip:view  (fleet_manager, dispatcher, safety_officer, finance_analyst)
// ============================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(req, "org:trip:view", async () => {
    const { id } = await params;
    await connectDB();

    const trip = await Trip.findById(id)
      .populate("vehicle", "name licensePlate type maxCapacity currentOdometer")
      .populate("driver", "name licenseNumber email safetyScore")
      .lean();

    if (!trip) {
      return errorResponse("Trip not found", 404);
    }

    return successResponse(trip);
  });
}

// ============================================================
// PUT /api/trips/[id] — Update trip (status transitions)
// Permission: org:trip:manage  (fleet_manager, dispatcher)
// ============================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(req, "org:trip:manage", async () => {
    const { id } = await params;
    const body = await req.json();

    const parsed = updateTripSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return errorResponse("Validation failed", 400, fieldErrors as Record<string, string[]>);
    }

    await connectDB();

    const trip = await Trip.findById(id);
    if (!trip) {
      return errorResponse("Trip not found", 404);
    }

    const newStatus = parsed.data.status;

    if (newStatus === "completed") {
      if (!parsed.data.endOdometer && !trip.endOdometer) {
        return errorResponse("End odometer reading is required to complete a trip", 400);
      }

      const endOdometer = parsed.data.endOdometer ?? trip.endOdometer!;

      if (trip.startOdometer) {
        trip.distanceCovered = endOdometer - trip.startOdometer;
      }

      trip.endOdometer = endOdometer;
      trip.completedDate = parsed.data.completedDate
        ? new Date(parsed.data.completedDate)
        : new Date();
      trip.status = "completed";

      await Vehicle.findByIdAndUpdate(trip.vehicle, {
        status: "available",
        currentOdometer: endOdometer,
      });

      await Driver.findByIdAndUpdate(trip.driver, {
        status: "available",
        $inc: { totalTripsCompleted: 1 },
      });
    } else if (newStatus === "cancelled") {
      if (trip.status === "completed") {
        return errorResponse("Cannot cancel a completed trip", 400);
      }

      const previousStatus = trip.status; // capture before mutation
      trip.status = "cancelled";

      // Revert vehicle and driver if they were actively assigned
      if (previousStatus === "dispatched" || previousStatus === "in_transit") {
        await Promise.all([
          Vehicle.findByIdAndUpdate(trip.vehicle, { status: "available" }),
          Driver.findByIdAndUpdate(trip.driver, { status: "available" }),
        ]);
      }
    } else if (newStatus === "in_transit") {
      if (trip.status !== "dispatched") {
        return errorResponse("Can only move to in_transit from dispatched status", 400);
      }
      trip.status = "in_transit";
    } else {
      if (parsed.data.notes !== undefined) trip.notes = parsed.data.notes;
      if (parsed.data.endOdometer !== undefined) trip.endOdometer = parsed.data.endOdometer;
    }

    await trip.save();

    const populated = await Trip.findById(trip._id)
      .populate("vehicle", "name licensePlate type maxCapacity")
      .populate("driver", "name licenseNumber")
      .lean();

    return successResponse(populated, `Trip ${newStatus || "updated"} successfully`);
  });
}
