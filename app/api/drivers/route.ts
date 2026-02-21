import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Driver from "@/lib/models/Driver";
import { withPermission } from "@/lib/utils/auth";
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  parsePagination,
} from "@/lib/utils/api-response";
import { createDriverSchema } from "@/lib/validators/driver";

// ============================================================
// GET /api/drivers — List drivers
// Permission: org:driver:view  (fleet_manager, dispatcher, safety_officer)
// ============================================================
export async function GET(req: NextRequest) {
  return withPermission(req, "org:driver:view", async () => {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(searchParams);

    const filter: Record<string, unknown> = {};
    const status = searchParams.get("status");
    const licenseCategory = searchParams.get("licenseCategory");
    const search = searchParams.get("search");

    if (status) filter.status = status;
    if (licenseCategory) filter.licenseCategory = licenseCategory;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { licenseNumber: { $regex: search, $options: "i" } },
      ];
    }

    const [drivers, total] = await Promise.all([
      Driver.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Driver.countDocuments(filter),
    ]);

    return paginatedResponse(drivers, total, page, limit);
  });
}

// ============================================================
// POST /api/drivers — Create driver profile
// Permission: org:driver:manage  (fleet_manager, dispatcher)
// ============================================================
export async function POST(req: NextRequest) {
  return withPermission(req, "org:driver:manage", async (user) => {
    const body = await req.json();

    const parsed = createDriverSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return errorResponse("Validation failed", 400, fieldErrors as Record<string, string[]>);
    }

    await connectDB();

    const existing = await Driver.findOne({
      $or: [
        { email: parsed.data.email },
        { licenseNumber: parsed.data.licenseNumber },
      ],
    });
    if (existing) {
      return errorResponse("A driver with this email or license number already exists", 409);
    }

    const driver = await Driver.create({
      ...parsed.data,
      createdBy: user._id,
    });

    return successResponse(driver, "Driver created successfully", 201);
  });
}
