import { z } from "zod";

// ============================================================
// Vehicle Validators
// ============================================================

export const createVehicleSchema = z.object({
  name: z.string().min(1, "Vehicle name is required").trim(),
  model: z.string().min(1, "Vehicle model is required").trim(),
  licensePlate: z.string().min(1, "License plate is required").trim().toUpperCase(),
  type: z.enum(["truck", "van", "bike"], {
    message: "Type must be truck, van, or bike",
  }),
  maxCapacity: z.number().positive("Max capacity must be positive"),
  currentOdometer: z.number().min(0).optional(),
  region: z.string().trim().optional(),
  acquisitionCost: z.number().min(0).optional(),
  acquisitionDate: z.coerce.date().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z.enum(["available", "on_trip", "in_shop", "retired"]).optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
