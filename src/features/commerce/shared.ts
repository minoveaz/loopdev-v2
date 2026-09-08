import type { StatusTone } from "@/components/common";
import type { InvoiceStatus, OrderStatus, ProductStatus } from "@/types";

export const orderStatusTone: Record<OrderStatus, StatusTone> = {
  paid: "success",
  pending: "warning",
  refunded: "info",
  failed: "destructive",
  shipped: "primary",
  cancelled: "neutral",
};

export const productStatusTone: Record<ProductStatus, StatusTone> = {
  active: "success",
  draft: "neutral",
  archived: "neutral",
  out_of_stock: "destructive",
};

export const invoiceStatusTone: Record<InvoiceStatus, StatusTone> = {
  draft: "neutral",
  sent: "info",
  paid: "success",
  overdue: "destructive",
  void: "neutral",
};

/** Fulfillment derived from order status (for the Orders table). */
export type Fulfillment = "unfulfilled" | "processing" | "shipped" | "delivered" | "cancelled";

export function fulfillmentFor(status: OrderStatus): Fulfillment {
  switch (status) {
    case "shipped": return "shipped";
    case "paid": return "processing";
    case "pending": return "unfulfilled";
    case "refunded": return "delivered";
    case "failed":
    case "cancelled": return "cancelled";
  }
}

export const fulfillmentTone: Record<Fulfillment, StatusTone> = {
  unfulfilled: "neutral",
  processing: "info",
  shipped: "primary",
  delivered: "success",
  cancelled: "destructive",
};

/** Generates a deterministic emoji-style placeholder per category. */
export function categoryEmoji(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("subscription")) return "✦";
  if (c.includes("template")) return "◳";
  if (c.includes("add")) return "✚";
  if (c.includes("merch")) return "◉";
  if (c.includes("resource")) return "❖";
  return "■";
}