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
import { fetchDrivers, createDriver, updateDriver, deleteDriver } from "@/lib/api";
import type { IDriver, DriverStatus, CreateDriverPayload } from "@/types";
import type { VehicleType } from "@/types";
import { Plus, Search, MoreHorizontal, Pencil, UserX, Users, AlertTriangle } from "lucide-react";

const statusConfig: Record<DriverStatus, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  available: { label: "Available", variant: "success" },
  on_trip: { label: "On Trip", variant: "default" },
  off_duty: { label: "Off Duty", variant: "secondary" },
  suspended: { label: "Suspended", variant: "destructive" },
};

const vehicleTypes: VehicleType[] = ["truck", "van", "bike"];

function isLicenseExpired(expiry: string): boolean {
  return new Date(expiry) < new Date();
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<IDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<IDriver | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<VehicleType[]>([]);

  const loadDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number | undefined> = { page, limit: 20 };
      if (search) params.search = search;
      if (filterStatus !== "all") params.status = filterStatus;
      const res = await fetchDrivers(params);
      setDrivers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus]);

  useEffect(() => { loadDrivers(); }, [loadDrivers]);

  const openCreate = () => {
    setEditingDriver(null); setError(null); setFieldErrors({});
    setSelectedCategories([]); setDialogOpen(true);
  };
  const openEdit = (d: IDriver) => {
    setEditingDriver(d); setError(null); setFieldErrors({});
    setSelectedCategories(d.licenseCategory); setDialogOpen(true);
  };

  const toggleCategory = (cat: VehicleType) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true); setError(null); setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const data: CreateDriverPayload = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      phone: fd.get("phone") as string || undefined,
      licenseNumber: fd.get("licenseNumber") as string,
      licenseCategory: selectedCategories,
      licenseExpiry: fd.get("licenseExpiry") as string,
      safetyScore: Number(fd.get("safetyScore") || 50),
    };
    try {
      if (editingDriver) {
        await updateDriver(editingDriver._id, data);
      } else {
        await createDriver(data);
      }
      setDialogOpen(false);
      loadDrivers();
    } catch (err: unknown) {
      const apiErr = err as { error?: string; details?: Record<string, string[]> };
      setError(apiErr?.error || "Something went wrong");
      if (apiErr?.details) setFieldErrors(apiErr.details);
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async (id: string) => {
    try {
      await deleteDriver(id);
      loadDrivers();
    } catch (err: unknown) {
      const apiErr = err as { error?: string };
      alert(apiErr?.error || "Failed to suspend");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Driver Profiles & Safety</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} drivers registered</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-1" /> Add Driver</Button>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search by name, email, license..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
            </div>
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="on_trip">On Trip</SelectItem>
                <SelectItem value="off_duty">Off Duty</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
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
              <TableHead>Driver</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Safety Score</TableHead>
              <TableHead>Trips</TableHead>
              <TableHead>License Expiry</TableHead>
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
            ) : drivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No drivers found
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((d) => {
                const sc = statusConfig[d.status];
                const expired = isLicenseExpired(d.licenseExpiry);
                return (
                  <TableRow key={d._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{d.name}</p>
                        <p className="text-xs text-muted-foreground">{d.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{d.licenseNumber}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {d.licenseCategory.map(c => (
                          <Badge key={c} variant="secondary" className="text-[10px] capitalize">{c}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={sc.variant}>{sc.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${d.safetyScore}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{d.safetyScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>{d.totalTripsCompleted}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {expired && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
                        <span className={expired ? "text-destructive text-xs" : "text-xs"}>
                          {new Date(d.licenseExpiry).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(d)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleSuspend(d._id)} className="text-destructive focus:text-destructive">
                            <UserX className="w-3.5 h-3.5 mr-2" /> Suspend
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
            <DialogTitle>{editingDriver ? "Edit Driver" : "Add Driver"}</DialogTitle>
            <DialogDescription>{editingDriver ? "Update driver details" : "Register a new driver"}</DialogDescription>
          </DialogHeader>
          {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" defaultValue={editingDriver?.name} required />
                {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" defaultValue={editingDriver?.email} required />
                {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={editingDriver?.phone} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="licenseNumber">License Number *</Label>
                <Input id="licenseNumber" name="licenseNumber" defaultValue={editingDriver?.licenseNumber} required />
                {fieldErrors.licenseNumber && <p className="text-xs text-destructive">{fieldErrors.licenseNumber[0]}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>License Categories *</Label>
              <div className="flex gap-2">
                {vehicleTypes.map(t => (
                  <button key={t} type="button" onClick={() => toggleCategory(t)}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors cursor-pointer ${selectedCategories.includes(t)
                        ? "bg-primary/15 border-primary text-primary"
                        : "border-input text-muted-foreground hover:border-foreground"
                      }`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              {fieldErrors.licenseCategory && <p className="text-xs text-destructive">{fieldErrors.licenseCategory[0]}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="licenseExpiry">License Expiry *</Label>
                <Input id="licenseExpiry" name="licenseExpiry" type="date" defaultValue={editingDriver?.licenseExpiry?.split("T")[0]} required />
                {fieldErrors.licenseExpiry && <p className="text-xs text-destructive">{fieldErrors.licenseExpiry[0]}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="safetyScore">Safety Score (0-100)</Label>
                <Input id="safetyScore" name="safetyScore" type="number" min={0} max={100} defaultValue={editingDriver?.safetyScore ?? 50} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingDriver ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
