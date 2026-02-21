import { NextResponse } from "next/server";

// ============================================================
// Standardized API Response Helper
// ============================================================

export function successResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

export function errorResponse(error: string, status = 400, details?: Record<string, string[]>) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status }
  );
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return NextResponse.json({
    success: true,
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

/**
 * Parse pagination params from URL search params.
 * Defaults: page=1, limit=20, sortBy=createdAt, sortOrder=desc
 */
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder: "asc" | "desc" = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

  return { page, limit, skip: (page - 1) * limit, sortBy, sortOrder };
}
