import type { Shipment, Vehicle, Warehouse } from "@/types";
import { ago, inDays } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

const ROUTES: Array<[string, string]> = [
  ["NYC, USA", "Chicago, USA"],
  ["London, UK", "Paris, FR"],
  ["Berlin, DE", "Madrid, ES"],
  ["Tokyo, JP", "Osaka, JP"],
  ["Mumbai, IN", "Delhi, IN"],
  ["São Paulo, BR", "Rio, BR"],
  ["Toronto, CA", "Vancouver, CA"],
  ["Sydney, AU", "Melbourne, AU"],
];
const CARRIERS = ["Rivera Express", "BlueArrow", "Helix Freight", "NorthLine"];
const STATUSES: Shipment["status"][] = ["pending", "in_transit", "in_transit", "delivered", "delayed", "cancelled"];

export const mockShipments: Shipment[] = Array.from({ length: 22 }).map((_, i) => {
  const [origin, destination] = ROUTES[i % ROUTES.length];
  return {
    id: `ship_${i + 1}`,
    trackingNumber: `RX-${(890000 + i * 13).toString()}`,
    origin,
    destination,
    carrier: CARRIERS[i % CARRIERS.length],
    weightKg: 2 + ((i * 7) % 240),
    status: STATUSES[i % STATUSES.length],
    etaDate: inDays(2 + (i % 8)),
    customer: `Customer #${(i + 1).toString().padStart(3, "0")}`,
    vehicleId: `veh_${(i % 6) + 1}`,
    createdAt: ago(15 - (i % 12)),
    updatedAt: ago(i % 6),
  };
});

export const shipmentsStore = createLocalStore<Shipment>({
  key: "data:shipments",
  seed: mockShipments,
  idPrefix: "ship",
});

const VEHICLE_TYPES: Vehicle["type"][] = ["van", "truck", "bike", "car"];
const VEHICLE_STATUS: Vehicle["status"][] = ["active", "active", "maintenance", "idle", "retired"];

export const mockVehicles: Vehicle[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `veh_${i + 1}`,
  plate: `RV-${(1000 + i * 7).toString()}`,
  model: ["Sprinter 350", "Volvo FH16", "Honda Cargo", "Tesla Semi", "Iveco Daily"][i % 5],
  type: VEHICLE_TYPES[i % VEHICLE_TYPES.length],
  driver: ["A. Walker", "B. Singh", "C. Romero", "D. Park", "E. Müller", "F. Costa"][i % 6],
  capacityKg: 200 + (i % 5) * 800,
  status: VEHICLE_STATUS[i % VEHICLE_STATUS.length],
  mileageKm: 12_000 + i * 4_700,
  lastServiceAt: ago(20 + (i % 60)),
  createdAt: ago(400 - i * 10),
  updatedAt: ago(i),
}));

export const vehiclesStore = createLocalStore<Vehicle>({
  key: "data:vehicles",
  seed: mockVehicles,
  idPrefix: "veh",
});

export const mockWarehouses: Warehouse[] = [
  { name: "Brooklyn Hub", code: "BK-01", city: "Brooklyn", country: "USA" },
  { name: "Wembley Depot", code: "WE-02", city: "London", country: "UK" },
  { name: "Tempelhof Center", code: "BE-03", city: "Berlin", country: "DE" },
  { name: "Shibaura Yard", code: "TY-04", city: "Tokyo", country: "JP" },
  { name: "Vila Leopoldina", code: "SP-05", city: "São Paulo", country: "BR" },
  { name: "Pune North", code: "PN-06", city: "Pune", country: "IN" },
].map((w, i) => ({
  id: `wh_${i + 1}`,
  ...w,
  capacity: 5_000 + i * 1_500,
  occupancy: 35 + ((i * 17) % 60),
  manager: ["L. Adler", "M. Patel", "N. Rossi", "O. Tanaka", "P. Souza", "Q. Mehta"][i],
  isActive: i !== 5,
  createdAt: ago(700 - i * 30),
  updatedAt: ago(i),
}));

export const warehousesStore = createLocalStore<Warehouse>({
  key: "data:warehouses",
  seed: mockWarehouses,
  idPrefix: "wh",
});