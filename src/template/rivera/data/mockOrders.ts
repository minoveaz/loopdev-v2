import type { Order } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

export const mockOrders: Order[] = [
  { id: "o_01", reference: "RV-10241", customer: "Atlas Coffee Co.",   customerEmail: "ops@atlascoffee.co",  amount: 1280, currency: "USD", status: "paid",     items: 4, paymentMethod: "card",   createdAt: ago(1),  updatedAt: ago(1)  },
  { id: "o_02", reference: "RV-10242", customer: "Harbor Logistics",   customerEmail: "ap@harborlogi.com",   amount: 5400, currency: "USD", status: "pending",  items: 2, paymentMethod: "wire",   createdAt: ago(1),  updatedAt: ago(1)  },
  { id: "o_03", reference: "RV-10243", customer: "Coral Boutique",     customerEmail: "buy@coral.shop",      amount:  320, currency: "EUR", status: "paid",     items: 1, paymentMethod: "card",   createdAt: ago(2),  updatedAt: ago(2)  },
  { id: "o_04", reference: "RV-10244", customer: "Northwind Supply",   customerEmail: "billing@northwind.io",amount: 8900, currency: "USD", status: "refunded", items: 6, paymentMethod: "wire",   createdAt: ago(3),  updatedAt: ago(2)  },
  { id: "o_05", reference: "RV-10245", customer: "Sage Magazine",      customerEmail: "ops@sagemag.uk",      amount: 1500, currency: "GBP", status: "paid",     items: 3, paymentMethod: "card",   createdAt: ago(4),  updatedAt: ago(4)  },
  { id: "o_06", reference: "RV-10246", customer: "Driftwood Studio",   customerEmail: "hi@driftwood.studio", amount:  420, currency: "USD", status: "failed",   items: 1, paymentMethod: "card",   createdAt: ago(5),  updatedAt: ago(5)  },
  { id: "o_07", reference: "RV-10247", customer: "Atlas Coffee Co.",   customerEmail: "ops@atlascoffee.co",  amount:  840, currency: "USD", status: "shipped",  items: 2, paymentMethod: "card",   createdAt: ago(6),  updatedAt: ago(5)  },
  { id: "o_08", reference: "RV-10248", customer: "Harbor Logistics",   customerEmail: "ap@harborlogi.com",   amount: 3200, currency: "USD", status: "paid",     items: 5, paymentMethod: "wire",   createdAt: ago(7),  updatedAt: ago(7)  },
  { id: "o_09", reference: "RV-10249", customer: "Sage Magazine",      customerEmail: "ops@sagemag.uk",      amount:  680, currency: "GBP", status: "pending",  items: 2, paymentMethod: "card",   createdAt: ago(8),  updatedAt: ago(8)  },
  { id: "o_10", reference: "RV-10250", customer: "Northwind Supply",   customerEmail: "billing@northwind.io",amount: 11200, currency: "USD",status: "paid",     items: 9, paymentMethod: "wire",   createdAt: ago(9),  updatedAt: ago(9)  },
  { id: "o_11", reference: "RV-10251", customer: "Driftwood Studio",   customerEmail: "hi@driftwood.studio", amount:  780, currency: "USD", status: "cancelled",items: 2, paymentMethod: "paypal", createdAt: ago(10), updatedAt: ago(10) },
  { id: "o_12", reference: "RV-10252", customer: "Coral Boutique",     customerEmail: "buy@coral.shop",      amount:  990, currency: "EUR", status: "paid",     items: 3, paymentMethod: "card",   createdAt: ago(11), updatedAt: ago(11) },
];

export const ordersStore = createLocalStore<Order>({
  key: "data:orders",
  seed: mockOrders,
  idPrefix: "o",
});
