import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Expense from "@/lib/models/Expense";
import Vehicle from "@/lib/models/Vehicle";
import { withPermission } from "@/lib/utils/auth";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
} from "@/lib/utils/api-response";
import { createExpenseSchema } from "@/lib/validators/expense";

// ============================================================
// GET /api/expenses — List expenses
// Permission: org:expense:view  (fleet_manager, dispatcher, safety_officer, finance_analyst)
// ============================================================
export async function GET(req: NextRequest) {
  return withPermission(req, "org:expense:view", async () => {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(searchParams);

    const filter: Record<string, unknown> = {};
    const vehicleId = searchParams.get("vehicle");
    const tripId = searchParams.get("trip");
    const type = searchParams.get("type");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (vehicleId) filter.vehicle = vehicleId;
    if (tripId) filter.trip = tripId;
    if (type) filter.type = type;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) (filter.date as Record<string, unknown>).$gte = new Date(dateFrom);
      if (dateTo) (filter.date as Record<string, unknown>).$lte = new Date(dateTo);
    }

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .populate("vehicle", "name licensePlate")
        .populate("trip", "tripNumber")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Expense.countDocuments(filter),
    ]);

    return paginatedResponse(expenses, total, page, limit);
  });
}

// ============================================================
// POST /api/expenses — Log expense
// Permission: org:expense:manage  (fleet_manager, finance_analyst)
// ============================================================
export async function POST(req: NextRequest) {
  return withPermission(req, "org:expense:manage", async (user) => {
    const body = await req.json();

    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return errorResponse("Validation failed", 400, fieldErrors as Record<string, string[]>);
    }

    await connectDB();

    const vehicle = await Vehicle.findById(parsed.data.vehicle);
    if (!vehicle) {
      return errorResponse("Vehicle not found", 404);
    }

    const expense = await Expense.create({
      ...parsed.data,
      createdBy: user._id,
    });

    const populated = await Expense.findById(expense._id)
      .populate("vehicle", "name licensePlate")
      .populate("trip", "tripNumber")
      .lean();

    return successResponse(populated, "Expense logged successfully", 201);
  });
}
