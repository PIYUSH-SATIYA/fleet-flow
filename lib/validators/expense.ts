import { z } from "zod";

// ============================================================
// Expense Validators
// ============================================================

export const createExpenseSchema = z.object({
  vehicle: z.string().min(1, "Vehicle ID is required"),
  trip: z.string().optional(),
  type: z.enum(["fuel", "toll", "parking", "fine", "other"], {
    message: "Invalid expense type",
  }),
  amount: z.number().positive("Amount must be positive"),
  fuelLiters: z.number().positive().optional(),
  fuelPricePerLiter: z.number().positive().optional(),
  date: z.coerce.date({ message: "Date is required" }),
  description: z.string().trim().optional(),
  receiptUrl: z.string().url().optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
