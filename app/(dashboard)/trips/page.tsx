"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { fetchTrips, createTrip, updateTrip, fetchVehicles, fetchDrivers } from "@/lib/api";
import type { ITripPopulated, TripStatus, CreateTripPayload, IVehicle, IDriver } from "@/types";
import { Plus, Search, MoreHorizontal, Play, CheckCircle, XCircle, MapPin } from "lucide-react";

const statusConfig: Record<TripStatus, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  draft: { label: "Draft", variant: "secondary" },
  dispatched: { label: "Dispatched", variant: "default" },
  in_transit: { label: "In Transit", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export default function TripsPage() {
  const [trips, setTrips] = useState<ITripPopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completingTrip, setCompletingTrip] = useState<ITripPopulated | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // For create form
  const [availableVehicles, setAvailableVehicles] = useState<IVehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<IDriver[]>([]);

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number | undefined> = { page, limit: 20 };
      if (search) params.search = search;
      if (filterStatus !== "all") params.status = filterStatus;
      const res = await fetchTrips(params);
      setTrips(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus]);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  const openCreate = async () => {
    setError(null); setFieldErrors({}); setDialogOpen(true);
    try {
      const [vRes, dRes] = await Promise.all([
        fetchVehicles({ status: "available", limit: 100 }),
        fetchDrivers({ status: "available", limit: 100 }),
      ]);
      setAvailableVehicles(vRes.data);
      setAvailableDrivers(dRes.data);
    } catch { /* ignore */ }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setError(null); setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const data: CreateTripPayload = {
      vehicle: fd.get("vehicle") as string,
      driver: fd.get("driver") as string,
      origin: fd.get("origin") as string,
      destination: fd.get("destination") as string,
      cargoDescription: fd.get("cargoDescription") as string || undefined,
      cargoWeight: Number(fd.get("cargoWeight")),
      scheduledDate: fd.get("scheduledDate") as string || undefined,
      notes: fd.get("notes") as string || undefined,
    };
    try {
      await createTrip(data);
      setDialogOpen(false);
      loadTrips();
    } catch (err: unknown) {
      const apiErr = err as { error?: string; details?: Record<string, string[]> };
      setError(apiErr?.error || "Something went wrong");
      if (apiErr?.details) setFieldErrors(apiErr.details);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (tripId: string, status: TripStatus, endOdometer?: number) => {
    try {
      await updateTrip(tripId, { status, endOdometer });
      loadTrips();
      setCompleteDialogOpen(false);
    } catch (err: unknown) {
      const apiErr = err as { error?: string };
      alert(apiErr?.error || "Failed to update status");
    }
  };

  const openComplete = (trip: ITripPopulated) => {
    setCompletingTrip(trip);
    setCompleteDialogOpen(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Trip Dispatcher</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} trips total</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Create Trip</Button>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search trip number, origin, destination..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trip #</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Distance</TableHead>
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
            ) : trips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No trips found
                </TableCell>
              </TableRow>
            ) : (
              trips.map((t) => {
                const sc = statusConfig[t.status];
                return (
                  <TableRow key={t._id}>
                    <TableCell className="font-mono text-xs font-medium">{t.tripNumber}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{t.origin}</p>
                        <p className="text-muted-foreground text-xs">→ {t.destination}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{t.vehicle?.name || "—"}</p>
                        <p className="text-muted-foreground text-xs font-mono">{t.vehicle?.licensePlate || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>{t.driver?.name || "—"}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{t.cargoWeight?.toLocaleString()} kg</p>
                        {t.cargoDescription && <p className="text-xs text-muted-foreground">{t.cargoDescription}</p>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                    <TableCell>{t.distanceCovered ? `${t.distanceCovered.toLocaleString()} km` : "—"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {t.status === "dispatched" && (
                            <DropdownMenuItem onClick={() => handleStatusUpdate(t._id, "in_transit")}>
                              <Play className="w-3.5 h-3.5 mr-2" /> Start Transit
                            </DropdownMenuItem>
                          )}
                          {t.status === "in_transit" && (
                            <DropdownMenuItem onClick={() => openComplete(t)}>
                              <CheckCircle className="w-3.5 h-3.5 mr-2" /> Complete Trip
                            </DropdownMenuItem>
                          )}
                          {(t.status === "dispatched" || t.status === "in_transit") && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStatusUpdate(t._id, "cancelled")} className="text-destructive focus:text-destructive">
                                <XCircle className="w-3.5 h-3.5 mr-2" /> Cancel
                              </DropdownMenuItem>
                            </>
                          )}
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

      {/* Create Trip Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Trip</DialogTitle>
            <DialogDescription>Assign a vehicle and driver for dispatch</DialogDescription>
          </DialogHeader>
          {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="vehicle">Vehicle *</Label>
                <select id="vehicle" name="vehicle" required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="">Select vehicle...</option>
                  {availableVehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.name} ({v.licensePlate}) — {v.maxCapacity}kg</option>
                  ))}
                </select>
                {fieldErrors.vehicle && <p className="text-xs text-destructive">{fieldErrors.vehicle[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="driver">Driver *</Label>
                <select id="driver" name="driver" required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option value="">Select driver...</option>
                  {availableDrivers.map(d => (
                    <option key={d._id} value={d._id}>{d.name} ({d.licenseCategory.join(", ")})</option>
                  ))}
                </select>
                {fieldErrors.driver && <p className="text-xs text-destructive">{fieldErrors.driver[0]}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="origin">Origin *</Label>
                <Input id="origin" name="origin" required />
                {fieldErrors.origin && <p className="text-xs text-destructive">{fieldErrors.origin[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="destination">Destination *</Label>
                <Input id="destination" name="destination" required />
                {fieldErrors.destination && <p className="text-xs text-destructive">{fieldErrors.destination[0]}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cargoWeight">Cargo Weight (kg) *</Label>
                <Input id="cargoWeight" name="cargoWeight" type="number" required />
                {fieldErrors.cargoWeight && <p className="text-xs text-destructive">{fieldErrors.cargoWeight[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input id="scheduledDate" name="scheduledDate" type="datetime-local" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cargoDescription">Cargo Description</Label>
              <Input id="cargoDescription" name="cargoDescription" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Dispatching..." : "Dispatch Trip"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Trip Dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Complete Trip</DialogTitle>
            <DialogDescription>Enter the final odometer reading to complete trip {completingTrip?.tripNumber}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const endOdometer = Number(fd.get("endOdometer"));
            if (completingTrip) handleStatusUpdate(completingTrip._id, "completed", endOdometer);
          }} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="endOdometer">End Odometer (km) *</Label>
              <Input id="endOdometer" name="endOdometer" type="number" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCompleteDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Complete</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
