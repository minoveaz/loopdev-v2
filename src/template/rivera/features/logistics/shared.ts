import type { Shipment, Vehicle, Warehouse } from "@/types";
import type { StatusTone } from "@/components/common";

export const shipmentStatusTone: Record<Shipment["status"], StatusTone> = {
  pending: "warning",
  in_transit: "info",
  delivered: "success",
  delayed: "destructive",
  cancelled: "neutral",
};

export const vehicleStatusTone: Record<Vehicle["status"], StatusTone> = {
  active: "success",
  maintenance: "warning",
  idle: "info",
  retired: "neutral",
};

export const shipmentStatusLabel: Record<Shipment["status"], string> = {
  pending: "Pending",
  in_transit: "In transit",
  delivered: "Delivered",
  delayed: "Delayed",
  cancelled: "Cancelled",
};

export function buildDeliverySeries() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((d, i) => ({
    day: d,
    onTime: 60 + ((i * 11) % 25),
    delayed: 4 + ((i * 5) % 10),
    pending: 8 + ((i * 7) % 12),
  }));
}

export function buildVolumeSeries() {
  return Array.from({ length: 12 }).map((_, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    shipments: 320 + ((i * 47) % 220),
    revenue: 18 + ((i * 3) % 14),
  }));
}

export function buildTimeline(s: Shipment) {
  const baseDate = new Date(s.createdAt);
  const eta = new Date(s.etaDate);
  const steps = [
    { label: "Order received", at: baseDate.toISOString(), done: true },
    { label: "Picked up at origin", at: new Date(baseDate.getTime() + 86400000).toISOString(), done: s.status !== "pending" },
    { label: `Departed ${s.origin}`, at: new Date(baseDate.getTime() + 86400000 * 2).toISOString(), done: ["in_transit", "delivered", "delayed"].includes(s.status) },
    { label: `Hub transit · ${s.carrier}`, at: new Date(baseDate.getTime() + 86400000 * 3).toISOString(), done: ["in_transit", "delivered"].includes(s.status) },
    { label: `Out for delivery · ${s.destination}`, at: new Date(eta.getTime() - 86400000).toISOString(), done: s.status === "delivered" },
    { label: "Delivered", at: eta.toISOString(), done: s.status === "delivered" },
  ];
  return steps;
}

export function warehouseTone(occupancy: number): StatusTone {
  if (occupancy >= 90) return "destructive";
  if (occupancy >= 75) return "warning";
  return "success";
}

export function summarizeShipments(items: readonly Shipment[]) {
  const by = (s: Shipment["status"]) => items.filter((i) => i.status === s).length;
  return {
    total: items.length,
    pending: by("pending"),
    inTransit: by("in_transit"),
    delivered: by("delivered"),
    delayed: by("delayed"),
    cancelled: by("cancelled"),
  };
}

export function summarizeFleet(items: readonly Vehicle[]) {
  return {
    total: items.length,
    active: items.filter((v) => v.status === "active").length,
    maintenance: items.filter((v) => v.status === "maintenance").length,
    idle: items.filter((v) => v.status === "idle").length,
    retired: items.filter((v) => v.status === "retired").length,
  };
}

export function summarizeWarehouses(items: readonly Warehouse[]) {
  const totalCap = items.reduce((s, w) => s + w.capacity, 0);
  const used = items.reduce((s, w) => s + (w.capacity * w.occupancy) / 100, 0);
  return {
    total: items.length,
    active: items.filter((w) => w.isActive).length,
    capacity: totalCap,
    used: Math.round(used),
    avgOccupancy: items.length ? Math.round(items.reduce((s, w) => s + w.occupancy, 0) / items.length) : 0,
  };
}

export const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
  padding: "8px 12px",
  boxShadow: "0 12px 32px -12px hsl(var(--foreground) / 0.18)",
} as const;