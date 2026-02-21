// ============================================================
// FleetFlow — Expense Types
// ============================================================

export type ExpenseType = "fuel" | "toll" | "parking" | "fine" | "other";

export interface IExpense {
  _id: string;
  vehicle: string; // Vehicle ObjectId (or populated)
  trip?: string; // optional Trip ObjectId
  type: ExpenseType;
  amount: number;
  fuelLiters?: number; // only for fuel type
  fuelPricePerLiter?: number;
  date: string;
  description?: string;
  receiptUrl?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IExpensePopulated extends Omit<IExpense, "vehicle" | "trip"> {
  vehicle: {
    _id: string;
    name: string;
    licensePlate: string;
  };
  trip?: {
    _id: string;
    tripNumber: string;
  };
}

export interface CreateExpensePayload {
  vehicle: string;
  trip?: string;
  type: ExpenseType;
  amount: number;
  fuelLiters?: number;
  fuelPricePerLiter?: number;
  date: string;
  description?: string;
  receiptUrl?: string;
}

export interface UpdateExpensePayload extends Partial<CreateExpensePayload> {}

export interface ExpenseFilters {
  vehicle?: string;
  trip?: string;
  type?: ExpenseType;
  dateFrom?: string;
  dateTo?: string;
}
