import { z } from "zod";

// ============================================================
// Driver Validators
// ============================================================

export const createDriverSchema = z.object({
  name: z.string().min(1, "Driver name is required").trim(),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  phone: z.string().trim().optional(),
  licenseNumber: z.string().min(1, "License number is required").trim().toUpperCase(),
  licenseCategory: z
    .array(z.enum(["truck", "van", "bike"]))
    .min(1, "At least one license category is required"),
  licenseExpiry: z.string().min(1, "License expiry is required"),
  status: z.enum(["available", "on_trip", "off_duty", "suspended"]).optional(),
  safetyScore: z.number().min(0).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

export const updateDriverSchema = createDriverSchema.partial();

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
