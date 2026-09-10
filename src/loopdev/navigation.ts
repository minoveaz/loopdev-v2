import { LayoutDashboard, Users } from "lucide-react";
import type { NavSection } from "@/app/nav-types";

export const loopdevNavigation: NavSection[] = [
  {
    label: "Launchpad",
    items: [
      {
        label: "Launchpad",
        to: "/launchpad",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Suites",
    items: [
      {
        label: "CRM",
        icon: Users,
        children: [
          { label: "Overview", to: "/app/sales-crm/overview" },
          { label: "Contacts", to: "/app/sales-crm/contacts" },
          { label: "Leads", to: "/app/sales-crm/leads" },
          { label: "Pipeline", to: "/app/sales-crm/pipeline" },
          { label: "Opportunities", to: "/app/sales-crm/opportunities" },
          { label: "Operations", to: "/app/sales-crm/operations" },
          { label: "Automations", to: "/app/sales-crm/automations" },
          { label: "Tasks", to: "/app/sales-crm/tasks" },
          { label: "Communications", to: "/app/sales-crm/communications" },
        ],
      },
    ],
  },
];
