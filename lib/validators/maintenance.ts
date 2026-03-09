import { z } from "zod";

// ============================================================
// Maintenance Validators
// ============================================================

export const createMaintenanceSchema = z.object({
  vehicle: z.string().min(1, "Vehicle ID is required"),
  serviceType: z.enum(
    ["oil_change", "tire_replacement", "brake_service", "engine_repair", "inspection", "other"],
    { message: "Invalid service type" }
  ),
  description: z.string().trim().optional(),
  cost: z.number().min(0, "Cost cannot be negative"),
  odometerAtService: z.number().min(0).optional(),
  serviceDate: z.coerce.date({ message: "Service date is required" }),
  vendor: z.string().trim().optional(),
});

export const updateMaintenanceSchema = z.object({
  description: z.string().trim().optional(),
  cost: z.number().min(0).optional(),
  status: z.enum(["scheduled", "in_progress", "completed"]).optional(),
  completedDate: z.coerce.date().optional(),
  vendor: z.string().trim().optional(),
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceSchema>;
