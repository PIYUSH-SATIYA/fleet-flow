"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { fetchExpenses, createExpense, deleteExpense, fetchVehicles, fetchTrips } from "@/lib/api";
import type { IExpensePopulated, ExpenseType, CreateExpensePayload, IVehicle, ITripPopulated } from "@/types";
import { Plus, Search, MoreHorizontal, Trash2, Receipt } from "lucide-react";

const typeConfig: Record<ExpenseType, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  fuel: { label: "Fuel", variant: "warning" },
  toll: { label: "Toll", variant: "default" },
  parking: { label: "Parking", variant: "secondary" },
  fine: { label: "Fine", variant: "destructive" },
  other: { label: "Other", variant: "secondary" },
};

const expenseTypes: ExpenseType[] = ["fuel", "toll", "parking", "fine", "other"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<IExpensePopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [trips, setTrips] = useState<ITripPopulated[]>([]);
  const [selectedType, setSelectedType] = useState<ExpenseType>("fuel");

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number | undefined> = { page, limit: 20 };
      if (filterType !== "all") params.type = filterType;
      const res = await fetchExpenses(params);
      setExpenses(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterType]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const openCreate = async () => {
    setError(null); setFieldErrors({}); setSelectedType("fuel"); setDialogOpen(true);
    try {
      const [vRes, tRes] = await Promise.all([
        fetchVehicles({ limit: 100 }),
        fetchTrips({ limit: 100 }),
      ]);
      setVehicles(vRes.data);
      setTrips(tRes.data);
    } catch { /* ignore */ }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setError(null); setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const data: CreateExpensePayload = {
      vehicle: fd.get("vehicle") as string,
      trip: fd.get("trip") as string || undefined,
      type: selectedType,
      amount: Number(fd.get("amount")),
      date: fd.get("date") as string,
      description: fd.get("description") as string || undefined,
    };
    if (selectedType === "fuel") {
      data.fuelLiters = Number(fd.get("fuelLiters") || 0) || undefined;
      data.fuelPricePerLiter = Number(fd.get("fuelPricePerLiter") || 0) || undefined;
    }
    try {
      await createExpense(data);
      setDialogOpen(false);
      loadExpenses();
    } catch (err: unknown) {
      const apiErr = err as { error?: string; details?: Record<string, string[]> };
      setError(apiErr?.error || "Something went wrong");
      if (apiErr?.details) setFieldErrors(apiErr.details);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await deleteExpense(id);
      loadExpenses();
    } catch (err: unknown) {
      const apiErr = err as { error?: string };
      alert(apiErr?.error || "Failed to delete");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Expenses & Fuel Logging</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} expense records</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Log Expense</Button>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {expenseTypes.map(t => (
                  <SelectItem key={t} value={t}>{typeConfig[t].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Trip</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Fuel Details</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(8)].map((_, j) => (
                    <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse w-20" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No expenses found
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((ex) => {
                const tc = typeConfig[ex.type];
                return (
                  <TableRow key={ex._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{ex.vehicle?.name || "—"}</p>
                        <p className="text-xs text-muted-foreground font-mono">{ex.vehicle?.licensePlate || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{ex.trip?.tripNumber || "—"}</TableCell>
                    <TableCell><Badge variant={tc.variant}>{tc.label}</Badge></TableCell>
                    <TableCell className="font-medium">₹{ex.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      {ex.type === "fuel" && ex.fuelLiters ? (
                        <div className="text-xs text-muted-foreground">
                          <p>{ex.fuelLiters}L @ ₹{ex.fuelPricePerLiter}/L</p>
                        </div>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{new Date(ex.date).toLocaleDateString()}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-muted-foreground text-sm">{ex.description || "—"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDelete(ex._id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Log Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Expense</DialogTitle>
            <DialogDescription>Record a new expense entry</DialogDescription>
          </DialogHeader>
          {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="vehicle">Vehicle *</Label>
                <select id="vehicle" name="vehicle" required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="">Select vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>
                  ))}
                </select>
                {fieldErrors.vehicle && <p className="text-xs text-destructive">{fieldErrors.vehicle[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trip">Trip (Optional)</Label>
                <select id="trip" name="trip"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="">No trip linked</option>
                  {trips.map(t => (
                    <option key={t._id} value={t._id}>{t.tripNumber} — {t.origin} → {t.destination}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Expense Type *</Label>
              <div className="flex gap-2 flex-wrap">
                {expenseTypes.map(t => (
                  <button key={t} type="button" onClick={() => setSelectedType(t)}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors cursor-pointer ${selectedType === t
                        ? "bg-primary/15 border-primary text-primary"
                        : "border-input text-muted-foreground hover:border-foreground"
                      }`}>
                    {typeConfig[t].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input id="amount" name="amount" type="number" required />
                {fieldErrors.amount && <p className="text-xs text-destructive">{fieldErrors.amount[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" name="date" type="date" required />
                {fieldErrors.date && <p className="text-xs text-destructive">{fieldErrors.date[0]}</p>}
              </div>
            </div>
            {selectedType === "fuel" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fuelLiters">Fuel (Liters)</Label>
                  <Input id="fuelLiters" name="fuelLiters" type="number" step="0.1" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fuelPricePerLiter">Price per Liter (₹)</Label>
                  <Input id="fuelPricePerLiter" name="fuelPricePerLiter" type="number" step="0.01" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Log Expense"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
