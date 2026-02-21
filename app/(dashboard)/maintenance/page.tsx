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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { fetchMaintenance, createMaintenance, updateMaintenance, fetchVehicles } from "@/lib/api";
import type { IMaintenancePopulated, MaintenanceStatus, ServiceType, CreateMaintenancePayload, IVehicle } from "@/types";
import { Plus, Search, MoreHorizontal, CheckCircle, Wrench } from "lucide-react";

const statusConfig: Record<MaintenanceStatus, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  scheduled: { label: "Scheduled", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
};

const serviceTypeLabels: Record<ServiceType, string> = {
  oil_change: "Oil Change",
  tire_replacement: "Tire Replacement",
  brake_service: "Brake Service",
  engine_repair: "Engine Repair",
  inspection: "Inspection",
  other: "Other",
};

const serviceTypes: ServiceType[] = ["oil_change", "tire_replacement", "brake_service", "engine_repair", "inspection", "other"];

export default function MaintenancePage() {
  const [records, setRecords] = useState<IMaintenancePopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number | undefined> = { page, limit: 20 };
      if (filterStatus !== "all") params.status = filterStatus;
      const res = await fetchMaintenance(params);
      setRecords(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const openCreate = async () => {
    setError(null); setFieldErrors({}); setDialogOpen(true);
    try {
      const res = await fetchVehicles({ limit: 100 });
      setVehicles(res.data.filter(v => v.status !== "on_trip" && v.status !== "retired"));
    } catch { /* ignore */ }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setError(null); setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const data: CreateMaintenancePayload = {
      vehicle: fd.get("vehicle") as string,
      serviceType: fd.get("serviceType") as ServiceType,
      description: fd.get("description") as string || undefined,
      cost: Number(fd.get("cost")),
      odometerAtService: Number(fd.get("odometerAtService") || 0) || undefined,
      serviceDate: fd.get("serviceDate") as string,
      vendor: fd.get("vendor") as string || undefined,
    };
    try {
      await createMaintenance(data);
      setDialogOpen(false);
      loadRecords();
    } catch (err: unknown) {
      const apiErr = err as { error?: string; details?: Record<string, string[]> };
      setError(apiErr?.error || "Something went wrong");
      if (apiErr?.details) setFieldErrors(apiErr.details);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await updateMaintenance(id, { status: "completed", completedDate: new Date().toISOString() });
      loadRecords();
    } catch (err: unknown) {
      const apiErr = err as { error?: string };
      alert(apiErr?.error || "Failed to complete service");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Maintenance & Service Logs</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} service records</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Log Service</Button>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
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
              <TableHead>Service Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
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
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  <Wrench className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No service records found
                </TableCell>
              </TableRow>
            ) : (
              records.map((r) => {
                const sc = statusConfig[r.status];
                return (
                  <TableRow key={r._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{r.vehicle?.name || "—"}</p>
                        <p className="text-xs text-muted-foreground font-mono">{r.vehicle?.licensePlate || ""}</p>
                      </div>
                    </TableCell>
                    <TableCell>{serviceTypeLabels[r.serviceType]}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">{r.description || "—"}</TableCell>
                    <TableCell>₹{r.cost.toLocaleString()}</TableCell>
                    <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                    <TableCell className="text-sm">{new Date(r.serviceDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">{r.vendor || "—"}</TableCell>
                    <TableCell>
                      {r.status !== "completed" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleComplete(r._id)}>
                              <CheckCircle className="w-3.5 h-3.5 mr-2" /> Complete Service
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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

      {/* Log Service Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Service</DialogTitle>
            <DialogDescription>Create a new maintenance service record</DialogDescription>
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
                <Label htmlFor="serviceType">Service Type *</Label>
                <select id="serviceType" name="serviceType" required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {serviceTypes.map(t => (
                    <option key={t} value={t}>{serviceTypeLabels[t]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cost">Cost (₹) *</Label>
                <Input id="cost" name="cost" type="number" required />
                {fieldErrors.cost && <p className="text-xs text-destructive">{fieldErrors.cost[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="odometerAtService">Odometer at Service</Label>
                <Input id="odometerAtService" name="odometerAtService" type="number" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="serviceDate">Service Date *</Label>
                <Input id="serviceDate" name="serviceDate" type="date" required />
                {fieldErrors.serviceDate && <p className="text-xs text-destructive">{fieldErrors.serviceDate[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor">Vendor</Label>
                <Input id="vendor" name="vendor" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Log Service"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
