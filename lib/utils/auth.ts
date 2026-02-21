import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User, { IUserDocument } from "@/lib/models/User";
import { errorResponse } from "@/lib/utils/api-response";

// ============================================================
// FleetFlow — Auth & RBAC Utilities (Clerk Organizations)
// ============================================================
//
// All role/permission checks use Clerk's `auth().has()` which
// reads directly from the org membership — no DB round-trip needed
// for access control decisions.
//
// Custom permissions created in Clerk Dashboard:
//   org:vehicle:manage   org:vehicle:view
//   org:driver:manage    org:driver:view
//   org:trip:manage      org:trip:view
//   org:maintenance:manage  org:maintenance:view
//   org:expense:manage   org:expense:view
//   org:analytics:view
// ============================================================

export type ClerkPermission =
  | "org:vehicle:manage"
  | "org:vehicle:view"
  | "org:driver:manage"
  | "org:driver:view"
  | "org:trip:manage"
  | "org:trip:view"
  | "org:maintenance:manage"
  | "org:maintenance:view"
  | "org:expense:manage"
  | "org:expense:view"
  | "org:analytics:view";

// ─── Internal helper ────────────────────────────────────────

/**
 * Resolves the authenticated Clerk user to a MongoDB User document.
 * Returns null if unauthenticated or user document not found.
 */
async function resolveUser(userId: string): Promise<IUserDocument | null> {
  await connectDB();
  return User.findOne({ clerkId: userId });
}

// ─── Public helpers ─────────────────────────────────────────

/**
 * Permission-based route guard (Clerk Organizations).
 *
 * Checks that the authenticated org member has the required permission
 * via Clerk's `has()` — no extra DB role lookup needed.
 *
 * Usage:
 *   return withPermission(req, "org:vehicle:manage", async (user) => { ... });
 */
export async function withPermission(
  _req: NextRequest,
  permission: ClerkPermission,
  handler: (user: IUserDocument) => Promise<Response>
): Promise<Response> {
  try {
    const session = await auth();
    const { userId, has } = session;

    if (!userId) {
      return errorResponse("Unauthorized — please sign in", 401);
    }

    // Clerk org permission check (no DB needed for this guard)
    if (!has({ permission })) {
      return errorResponse(`Forbidden — requires permission: ${permission}`, 403);
    }

    const user = await resolveUser(userId);
    if (!user) {
      return errorResponse("User not found — please complete onboarding", 404);
    }

    return handler(user);
  } catch (error) {
    console.error("[Auth Error]", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * Multi-permission route guard — passes if the user has ANY of the listed permissions.
 *
 * Usage:
 *   return withAnyPermission(req, ["org:trip:manage", "org:trip:view"], async (user) => { ... });
 */
export async function withAnyPermission(
  _req: NextRequest,
  permissions: ClerkPermission[],
  handler: (user: IUserDocument) => Promise<Response>
): Promise<Response> {
  try {
    const session = await auth();
    const { userId, has } = session;

    if (!userId) {
      return errorResponse("Unauthorized — please sign in", 401);
    }

    const allowed = permissions.some((p) => has({ permission: p }));
    if (!allowed) {
      return errorResponse(
        `Forbidden — requires one of: ${permissions.join(", ")}`,
        403
      );
    }

    const user = await resolveUser(userId);
    if (!user) {
      return errorResponse("User not found — please complete onboarding", 404);
    }

    return handler(user);
  } catch (error) {
    console.error("[Auth Error]", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * Lightweight auth check — just ensures the user is authenticated
 * and exists in our DB. No permission check.
 *
 * Use for endpoints accessible by ALL authenticated org members.
 */
export async function withUser(
  _req: NextRequest,
  handler: (user: IUserDocument) => Promise<Response>
): Promise<Response> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return errorResponse("Unauthorized — please sign in", 401);
    }

    const user = await resolveUser(userId);
    if (!user) {
      return errorResponse("User not found — please complete onboarding", 404);
    }

    return handler(user);
  } catch (error) {
    console.error("[Auth Error]", error);
    return errorResponse("Internal server error", 500);
  }
}

// ─── Legacy alias (kept for backward compat) ─────────────────
// The old withAuth checked roles from DB. Kept as a thin shim
// in case any routes still use it — it now calls withAnyPermission
// but you should migrate routes to withPermission / withAnyPermission.
/** @deprecated Use withPermission or withAnyPermission instead */
export const withAuth = withAnyPermission;
