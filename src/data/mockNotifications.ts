import type { Notification } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

export const mockNotifications: Notification[] = [
  { id: "n_01", title: "New order",          message: "Harbor Logistics placed a $5,400 order.",        type: "info",    read: false, link: "/management/orders?focus=o_01",     createdAt: ago(0, 1),  updatedAt: ago(0, 1)  },
  { id: "n_02", title: "Project milestone",  message: "Atlas Rebrand reached 78% completion.",          type: "success", read: false, link: "/management/projects?focus=p_01",   createdAt: ago(0, 16), updatedAt: ago(0, 16) },
  { id: "n_03", title: "Payment failed",     message: "Driftwood Studio invoice failed to charge.",      type: "error",   read: true,  link: "/management/invoices?focus=in_01",  createdAt: ago(5),     updatedAt: ago(5)     },
  { id: "n_04", title: "Team invite pending",message: "Henrik Voss has not accepted yet.",              type: "warning", read: false, link: "/management/users?focus=u_01",      createdAt: ago(6),     updatedAt: ago(6)     },
  { id: "n_05", title: "Backup completed",   message: "Daily workspace backup finished successfully.",  type: "success", read: true,                                createdAt: ago(1, 2),  updatedAt: ago(1, 2)  },
  { id: "n_06", title: "Storage at 82%",     message: "Approaching plan storage limit.",                type: "warning", read: false, link: "/account/settings",    createdAt: ago(2),     updatedAt: ago(2)     },
];

export const notificationsStore = createLocalStore<Notification>({
  key: "data:notifications",
  seed: mockNotifications,
  idPrefix: "n",
});
