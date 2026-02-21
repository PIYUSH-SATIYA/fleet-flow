// ============================================================
// FleetFlow — User Types
// ============================================================

export type UserRole = "fleet_manager" | "dispatcher" | "safety_officer" | "finance_analyst";

export interface IUser {
  _id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}
