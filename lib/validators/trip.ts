import { z } from "zod";

// ============================================================
// Trip Validators
// ============================================================

export const createTripSchema = z.object({
  vehicle: z.string().min(1, "Vehicle ID is required"),
  driver: z.string().min(1, "Driver ID is required"),
  origin: z.string().min(1, "Origin is required").trim(),
  destination: z.string().min(1, "Destination is required").trim(),
  cargoDescription: z.string().trim().optional(),
  cargoWeight: z.number().positive("Cargo weight must be positive"),
  startOdometer: z.number().min(0).optional(),
  scheduledDate: z.string().optional(),
  notes: z.string().trim().optional(),
});

export const updateTripSchema = z.object({
  status: z
    .enum(["draft", "dispatched", "in_transit", "completed", "cancelled"])
    .optional(),
  endOdometer: z.number().min(0).optional(),
  completedDate: z.string().optional(),
  notes: z.string().trim().optional(),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
