import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Expense from "@/lib/models/Expense";
import { withPermission } from "@/lib/utils/auth";
import { successResponse, errorResponse } from "@/lib/utils/api-response";
import { updateExpenseSchema } from "@/lib/validators/expense";

// ============================================================
// GET /api/expenses/[id] — Get expense detail
// Permission: org:expense:view  (fleet_manager, dispatcher, safety_officer, finance_analyst)
// ============================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(req, "org:expense:view", async () => {
    const { id } = await params;
    await connectDB();

    const expense = await Expense.findById(id)
      .populate("vehicle", "name licensePlate")
      .populate("trip", "tripNumber origin destination")
      .lean();

    if (!expense) {
      return errorResponse("Expense not found", 404);
    }

    return successResponse(expense);
  });
}

// ============================================================
// PUT /api/expenses/[id] — Update expense
// Permission: org:expense:manage  (fleet_manager, finance_analyst)
// ============================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(req, "org:expense:manage", async () => {
    const { id } = await params;
    const body = await req.json();

    const parsed = updateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return errorResponse("Validation failed", 400, fieldErrors as Record<string, string[]>);
    }

    await connectDB();

    const expense = await Expense.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    })
      .populate("vehicle", "name licensePlate")
      .populate("trip", "tripNumber")
      .lean();

    if (!expense) {
      return errorResponse("Expense not found", 404);
    }

    return successResponse(expense, "Expense updated successfully");
  });
}

// ============================================================
// DELETE /api/expenses/[id] — Delete expense
// Permission: org:expense:manage  (fleet_manager, finance_analyst)
// ============================================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermission(req, "org:expense:manage", async () => {
    const { id } = await params;
    await connectDB();

    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      return errorResponse("Expense not found", 404);
    }

    return successResponse(null, "Expense deleted successfully");
  });
}
