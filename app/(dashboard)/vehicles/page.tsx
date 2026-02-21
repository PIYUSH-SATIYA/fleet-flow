"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { fetchVehicles, createVehicle, updateVehicle, deleteVehicle } from "@/lib/api";
import type { IVehicle, VehicleStatus, VehicleType, CreateVehiclePayload } from "@/types";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Truck } from "lucide-react";

const statusConfig: Record<VehicleStatus, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  available: { label: "Available", variant: "success" },
  on_trip: { label: "On Trip", variant: "default" },
  in_shop: { label: "In Shop", variant: "warning" },
  retired: { label: "Retired", variant: "secondary" },
};

const vehicleTypes: VehicleType[] = ["truck", "van", "bike"];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<IVehicle | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number | undefined> = { page, limit: 20 };
      if (search) params.search = search;
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterType !== "all") params.type = filterType;
      const res = await fetchVehicles(params);
      setVehicles(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterType]);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  const openCreate = () => { setEditingVehicle(null); setError(null); setFieldErrors({}); setDialogOpen(true); };
  const openEdit = (v: IVehicle) => { setEditingVehicle(v); setError(null); setFieldErrors({}); setDialogOpen(true); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const data: CreateVehiclePayload = {
      name: fd.get("name") as string,
      model: fd.get("model") as string,
      licensePlate: fd.get("licensePlate") as string,
      type: fd.get("type") as VehicleType,
      maxCapacity: Number(fd.get("maxCapacity")),
      currentOdometer: Number(fd.get("currentOdometer") || 0),
      region: fd.get("region") as string || undefined,
      acquisitionCost: Number(fd.get("acquisitionCost") || 0),
      acquisitionDate: fd.get("acquisitionDate") as string || undefined,
    };
    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle._id, data);
      } else {
        await createVehicle(data);
      }
      setDialogOpen(false);
      loadVehicles();
    } catch (err: unknown) {
      const apiErr = err as { error?: string; details?: Record<string, string[]> };
      setError(apiErr?.error || "Something went wrong");
      if (apiErr?.details) setFieldErrors(apiErr.details);
    } finally {
      setSaving(false);
    }
  };

  const handleRetire = async (id: string) => {
    try {
      await deleteVehicle(id);
      loadVehicles();
    } catch (err: unknown) {
      const apiErr = err as { error?: string };
      alert(apiErr?.error || "Failed to retire");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Registry</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} vehicles total</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1" /> Add Vehicle
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, model, plate..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="on_trip">On Trip</SelectItem>
                <SelectItem value="in_shop">In Shop</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="truck">Truck</SelectItem>
                <SelectItem value="van">Van</SelectItem>
                <SelectItem value="bike">Bike</SelectItem>
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
              <TableHead>Vehicle</TableHead>
              <TableHead>Plate</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Odometer</TableHead>
              <TableHead>Region</TableHead>
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
            ) : vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  <Truck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No vehicles found
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((v) => {
                const sc = statusConfig[v.status];
                return (
                  <TableRow key={v._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.model}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{v.licensePlate}</TableCell>
                    <TableCell className="capitalize">{v.type}</TableCell>
                    <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                    <TableCell>{v.maxCapacity.toLocaleString()} kg</TableCell>
                    <TableCell>{v.currentOdometer.toLocaleString()} km</TableCell>
                    <TableCell>{v.region || "—"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(v)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleRetire(v._id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Retire
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVehicle ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
            <DialogDescription>{editingVehicle ? "Update vehicle details" : "Add a new vehicle to your fleet"}</DialogDescription>
          </DialogHeader>
          {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" defaultValue={editingVehicle?.name} required />
                {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model">Model *</Label>
                <Input id="model" name="model" defaultValue={editingVehicle?.model} required />
                {fieldErrors.model && <p className="text-xs text-destructive">{fieldErrors.model[0]}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="licensePlate">License Plate *</Label>
                <Input id="licensePlate" name="licensePlate" defaultValue={editingVehicle?.licensePlate} required />
                {fieldErrors.licensePlate && <p className="text-xs text-destructive">{fieldErrors.licensePlate[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type">Type *</Label>
                <select id="type" name="type" defaultValue={editingVehicle?.type || "truck"} required
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  {vehicleTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
                {fieldErrors.type && <p className="text-xs text-destructive">{fieldErrors.type[0]}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="maxCapacity">Max Capacity (kg) *</Label>
                <Input id="maxCapacity" name="maxCapacity" type="number" defaultValue={editingVehicle?.maxCapacity} required />
                {fieldErrors.maxCapacity && <p className="text-xs text-destructive">{fieldErrors.maxCapacity[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currentOdometer">Odometer (km)</Label>
                <Input id="currentOdometer" name="currentOdometer" type="number" defaultValue={editingVehicle?.currentOdometer || 0} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="region">Region</Label>
                <Input id="region" name="region" defaultValue={editingVehicle?.region} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="acquisitionCost">Acquisition Cost</Label>
                <Input id="acquisitionCost" name="acquisitionCost" type="number" defaultValue={editingVehicle?.acquisitionCost} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acquisitionDate">Acquisition Date</Label>
              <Input id="acquisitionDate" name="acquisitionDate" type="date" defaultValue={editingVehicle?.acquisitionDate?.split("T")[0]} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingVehicle ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
