// ============================================================
// FleetFlow — Centralized API Fetch Helpers
// All fetch calls go through here for consistent error handling
// ============================================================

import type {
    IVehicle, CreateVehiclePayload, UpdateVehiclePayload,
    IDriver, CreateDriverPayload, UpdateDriverPayload,
    ITripPopulated, CreateTripPayload, UpdateTripPayload,
    IMaintenancePopulated, CreateMaintenancePayload, UpdateMaintenancePayload,
    IExpensePopulated, CreateExpensePayload, UpdateExpensePayload,
    DashboardKPIs, FleetSummary, VehicleAnalytics,
    ApiResponse, PaginatedResponse,
} from "@/types";

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        headers: { "Content-Type": "application/json", ...options?.headers },
        ...options,
    });
    const json = await res.json();
    if (!res.ok) throw json;
    return json;
}

function qs(params: Record<string, string | number | undefined>): string {
    const s = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") s.append(k, String(v));
    });
    const str = s.toString();
    return str ? `?${str}` : "";
}

// ── Vehicles ────────────────────────────────────────────────
export const fetchVehicles = (params: Record<string, string | number | undefined> = {}) =>
    request<PaginatedResponse<IVehicle>>(`${BASE}/vehicles${qs(params)}`);

export const fetchVehicle = (id: string) =>
    request<ApiResponse<IVehicle>>(`${BASE}/vehicles/${id}`);

export const createVehicle = (data: CreateVehiclePayload) =>
    request<ApiResponse<IVehicle>>(`${BASE}/vehicles`, { method: "POST", body: JSON.stringify(data) });

export const updateVehicle = (id: string, data: UpdateVehiclePayload) =>
    request<ApiResponse<IVehicle>>(`${BASE}/vehicles/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteVehicle = (id: string) =>
    request<ApiResponse<IVehicle>>(`${BASE}/vehicles/${id}`, { method: "DELETE" });

// ── Drivers ─────────────────────────────────────────────────
export const fetchDrivers = (params: Record<string, string | number | undefined> = {}) =>
    request<PaginatedResponse<IDriver>>(`${BASE}/drivers${qs(params)}`);

export const fetchDriver = (id: string) =>
    request<ApiResponse<IDriver>>(`${BASE}/drivers/${id}`);

export const createDriver = (data: CreateDriverPayload) =>
    request<ApiResponse<IDriver>>(`${BASE}/drivers`, { method: "POST", body: JSON.stringify(data) });

export const updateDriver = (id: string, data: UpdateDriverPayload) =>
    request<ApiResponse<IDriver>>(`${BASE}/drivers/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteDriver = (id: string) =>
    request<ApiResponse<IDriver>>(`${BASE}/drivers/${id}`, { method: "DELETE" });

// ── Trips ───────────────────────────────────────────────────
export const fetchTrips = (params: Record<string, string | number | undefined> = {}) =>
    request<PaginatedResponse<ITripPopulated>>(`${BASE}/trips${qs(params)}`);

export const fetchTrip = (id: string) =>
    request<ApiResponse<ITripPopulated>>(`${BASE}/trips/${id}`);

export const createTrip = (data: CreateTripPayload) =>
    request<ApiResponse<ITripPopulated>>(`${BASE}/trips`, { method: "POST", body: JSON.stringify(data) });

export const updateTrip = (id: string, data: UpdateTripPayload) =>
    request<ApiResponse<ITripPopulated>>(`${BASE}/trips/${id}`, { method: "PUT", body: JSON.stringify(data) });

// ── Maintenance ─────────────────────────────────────────────
export const fetchMaintenance = (params: Record<string, string | number | undefined> = {}) =>
    request<PaginatedResponse<IMaintenancePopulated>>(`${BASE}/maintenance${qs(params)}`);

export const fetchMaintenanceById = (id: string) =>
    request<ApiResponse<IMaintenancePopulated>>(`${BASE}/maintenance/${id}`);

export const createMaintenance = (data: CreateMaintenancePayload) =>
    request<ApiResponse<IMaintenancePopulated>>(`${BASE}/maintenance`, { method: "POST", body: JSON.stringify(data) });

export const updateMaintenance = (id: string, data: UpdateMaintenancePayload) =>
    request<ApiResponse<IMaintenancePopulated>>(`${BASE}/maintenance/${id}`, { method: "PUT", body: JSON.stringify(data) });

// ── Expenses ────────────────────────────────────────────────
export const fetchExpenses = (params: Record<string, string | number | undefined> = {}) =>
    request<PaginatedResponse<IExpensePopulated>>(`${BASE}/expenses${qs(params)}`);

export const fetchExpense = (id: string) =>
    request<ApiResponse<IExpensePopulated>>(`${BASE}/expenses/${id}`);

export const createExpense = (data: CreateExpensePayload) =>
    request<ApiResponse<IExpensePopulated>>(`${BASE}/expenses`, { method: "POST", body: JSON.stringify(data) });

export const updateExpense = (id: string, data: UpdateExpensePayload) =>
    request<ApiResponse<IExpensePopulated>>(`${BASE}/expenses/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const deleteExpense = (id: string) =>
    request<ApiResponse<IExpensePopulated>>(`${BASE}/expenses/${id}`, { method: "DELETE" });

// ── Analytics ───────────────────────────────────────────────
export const fetchDashboardKPIs = () =>
    request<ApiResponse<DashboardKPIs>>(`${BASE}/analytics?report=dashboard`);

export const fetchFleetSummary = () =>
    request<ApiResponse<FleetSummary>>(`${BASE}/analytics?report=fleet-summary`);

export const fetchVehicleAnalytics = (vehicleId: string) =>
    request<ApiResponse<VehicleAnalytics>>(`${BASE}/analytics?report=vehicle&vehicleId=${vehicleId}`);
