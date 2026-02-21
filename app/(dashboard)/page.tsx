"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchDashboardKPIs } from "@/lib/api";
import type { DashboardKPIs } from "@/types";
import { Truck, Wrench, Activity, Package, Users, CheckCircle } from "lucide-react";

export default function CommandCenterPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardKPIs()
      .then((res) => setKpis(res.data ?? null))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Command Center</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Active Fleet",
      value: kpis?.activeFleet ?? 0,
      subtitle: `of ${kpis?.totalVehicles ?? 0} vehicles`,
      icon: Truck,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Maintenance Alerts",
      value: kpis?.maintenanceAlerts ?? 0,
      subtitle: "vehicles in shop",
      icon: Wrench,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Utilization Rate",
      value: `${(kpis?.utilizationRate ?? 0).toFixed(1)}%`,
      subtitle: "fleet assigned",
      icon: Activity,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Pending Cargo",
      value: kpis?.pendingCargo ?? 0,
      subtitle: "awaiting dispatch",
      icon: Package,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  const overviewCards = [
    { label: "Total Vehicles", value: kpis?.totalVehicles ?? 0, icon: Truck },
    { label: "Available Vehicles", value: kpis?.availableVehicles ?? 0, icon: CheckCircle },
    { label: "Total Drivers", value: kpis?.totalDrivers ?? 0, icon: Users },
    { label: "Available Drivers", value: kpis?.availableDrivers ?? 0, icon: CheckCircle },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Command Center</h1>
          <p className="text-muted-foreground text-sm mt-1">Fleet overview at a glance</p>
        </div>
        <Badge variant="outline" className="text-xs">Live</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{card.title}</span>
                  <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
