import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { errorResponse } from "@/lib/utils/api-response";

// ============================================================
// FleetFlow — Auth & RBAC Utilities (Clerk Organizations)
// ============================================================
//
// All role/permission checks use Clerk's `auth().has()` which
// reads directly from the org membership — no DB round-trip needed.
//
// We are SOLELY relying on Clerk for identity and access control.
// No MongoDB User lookup is performed here.
//
// Custom permissions configured in Clerk Dashboard:
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

/**
 * Lightweight Clerk user identity — passed to route handlers.
 * Solely derived from Clerk session; no DB lookup required.
 */
export interface ClerkUser {
  /** Clerk's user ID (e.g. "user_2abc...") */
  userId: string;
  /** Active org ID from Clerk session, if any */
  orgId: string | null;
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
  handler: (user: ClerkUser) => Promise<Response>
): Promise<Response> {
  try {
    const session = await auth();
    const { userId, orgId, has } = session;

    if (!userId) {
      return errorResponse("Unauthorized — please sign in", 401);
    }

    // Clerk org permission check (reads from session JWT — no DB needed)
    if (!has({ permission })) {
      return errorResponse(`Forbidden — requires permission: ${permission}`, 403);
    }

    return handler({ userId, orgId: orgId ?? null });
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
  handler: (user: ClerkUser) => Promise<Response>
): Promise<Response> {
  try {
    const session = await auth();
    const { userId, orgId, has } = session;

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

    return handler({ userId, orgId: orgId ?? null });
  } catch (error) {
    console.error("[Auth Error]", error);
    return errorResponse("Internal server error", 500);
  }
}

/**
 * Lightweight auth check — just ensures the user is authenticated.
 * No permission check. Use for endpoints accessible by ALL authenticated org members.
 */
export async function withUser(
  _req: NextRequest,
  handler: (user: ClerkUser) => Promise<Response>
): Promise<Response> {
  try {
    const session = await auth();
    const { userId, orgId } = session;

    if (!userId) {
      return errorResponse("Unauthorized — please sign in", 401);
    }

    return handler({ userId, orgId: orgId ?? null });
  } catch (error) {
    console.error("[Auth Error]", error);
    return errorResponse("Internal server error", 500);
  }
}

// ─── Legacy alias (kept for backward compat) ─────────────────
/** @deprecated Use withPermission or withAnyPermission instead */
export const withAuth = withAnyPermission;
