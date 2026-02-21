"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { fetchDashboardKPIs, fetchFleetSummary, fetchVehicleAnalytics, fetchVehicles } from "@/lib/api";
import type { DashboardKPIs, FleetSummary, VehicleAnalytics, IVehicle } from "@/types";
import { BarChart3, Truck, Fuel, Wrench, TrendingUp, DollarSign, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [summary, setSummary] = useState<FleetSummary | null>(null);
  const [vehicleAnalytics, setVehicleAnalytics] = useState<VehicleAnalytics | null>(null);
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [vehicleLoading, setVehicleLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchDashboardKPIs().then(res => setKpis(res.data ?? null)).catch(() => { }),
      fetchFleetSummary().then(res => setSummary(res.data ?? null)).catch(() => { }),
      fetchVehicles({ limit: 100 }).then(res => setVehicles(res.data)).catch(() => { }),
    ]).finally(() => setLoading(false));
  }, []);

  const loadVehicleAnalytics = async (id: string) => {
    if (!id) { setVehicleAnalytics(null); return; }
    setVehicleLoading(true);
    try {
      const res = await fetchVehicleAnalytics(id);
      setVehicleAnalytics(res.data ?? null);
    } catch {
      setVehicleAnalytics(null);
    } finally {
      setVehicleLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Analytics & Reports</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-5"><div className="h-20 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const financialCards = [
    { title: "Total Fuel Cost", value: `₹${(summary?.totalFuelCost ?? 0).toLocaleString()}`, icon: Fuel, color: "text-warning" },
    { title: "Total Maintenance", value: `₹${(summary?.totalMaintenanceCost ?? 0).toLocaleString()}`, icon: Wrench, color: "text-primary" },
    { title: "Total Operational", value: `₹${(summary?.totalOperationalCost ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-success" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Financial and operational insights</p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {financialCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{card.title}</span>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold">{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Trips by Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Trips by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary?.tripsByStatus && Object.entries(summary.tripsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize text-muted-foreground">{status.replace("_", " ")}</span>
                <Badge variant="secondary">{count as number}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Vehicles by Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Vehicles by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary?.vehiclesByStatus && Object.entries(summary.vehiclesByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize text-muted-foreground">{status.replace("_", " ")}</span>
                <Badge variant="secondary">{count as number}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Drivers by Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Drivers by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary?.driversByStatus && Object.entries(summary.driversByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize text-muted-foreground">{status.replace("_", " ")}</span>
                <Badge variant="secondary">{count as number}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Expenses Chart */}
      {summary?.monthlyExpenses && summary.monthlyExpenses.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <CardDescription>Operational spend over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthlyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111113", border: "1px solid #27272a", borderRadius: "8px", fontSize: "12px" }}
                    labelStyle={{ color: "#fafafa" }}
                    formatter={(value: number | undefined) => [`₹${(value ?? 0).toLocaleString()}`, "Amount"]}
                  />
                  <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-Vehicle Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Vehicle Analytics</CardTitle>
          <CardDescription>Lookup per-vehicle performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <select
              value={selectedVehicleId}
              onChange={(e) => { setSelectedVehicleId(e.target.value); loadVehicleAnalytics(e.target.value); }}
              className="flex h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select a vehicle...</option>
              {vehicles.map(v => (
                <option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>
              ))}
            </select>
          </div>

          {vehicleLoading && <div className="text-sm text-muted-foreground">Loading...</div>}

          {vehicleAnalytics && !vehicleLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Total Trips</p>
                <p className="text-lg font-bold">{vehicleAnalytics.totalTrips}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Total Distance</p>
                <p className="text-lg font-bold">{vehicleAnalytics.totalDistanceKm.toLocaleString()} km</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Fuel Efficiency</p>
                <p className="text-lg font-bold">{vehicleAnalytics.fuelEfficiency.toFixed(1)} km/L</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Cost per km</p>
                <p className="text-lg font-bold">₹{vehicleAnalytics.costPerKm.toFixed(1)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Total Fuel Cost</p>
                <p className="text-lg font-bold">₹{vehicleAnalytics.totalFuelCost.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Maintenance Cost</p>
                <p className="text-lg font-bold">₹{vehicleAnalytics.totalMaintenanceCost.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Total Expenses</p>
                <p className="text-lg font-bold">₹{vehicleAnalytics.totalExpenses.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">ROI</p>
                <p className={`text-lg font-bold ${vehicleAnalytics.roi >= 0 ? "text-success" : "text-destructive"}`}>
                  {vehicleAnalytics.roi.toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          {!vehicleAnalytics && !vehicleLoading && selectedVehicleId && (
            <p className="text-sm text-muted-foreground">No analytics data available for this vehicle.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
