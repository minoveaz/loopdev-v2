export type NavigationIconKey = "launchpad" | "crm" | "erp" | "settings";

export type SharedNavigationItem = {
  id: string;
  label: string;
  path: string;
};

export type SharedNavigationGroup = {
  id: string;
  label: string;
  iconKey: NavigationIconKey;
  items: SharedNavigationItem[];
};

export const loopdevNavigationContract: {
  launchpad: SharedNavigationItem;
  groups: SharedNavigationGroup[];
} = {
  launchpad: {
    id: "launchpad",
    label: "Launchpad",
    path: "/launchpad",
  },
  groups: [
    {
      id: "crm",
      label: "CRM",
      iconKey: "crm",
      items: [
        { id: "crm-overview", label: "Overview", path: "/app/sales-crm/overview" },
        { id: "crm-contacts", label: "Contacts", path: "/app/sales-crm/contacts" },
        { id: "crm-leads", label: "Leads", path: "/app/sales-crm/leads" },
        { id: "crm-pipeline", label: "Pipeline", path: "/app/sales-crm/pipeline" },
        { id: "crm-opportunities", label: "Opportunities", path: "/app/sales-crm/opportunities" },
        { id: "crm-tasks", label: "Tasks", path: "/app/sales-crm/tasks" },
        { id: "crm-communications", label: "Communications", path: "/app/sales-crm/communications" },
      ],
    },
    {
      id: "erp",
      label: "ERP",
      iconKey: "erp",
      items: [
        { id: "erp-overview", label: "Overview", path: "/app/erp/overview" },
        { id: "erp-product-catalog", label: "Product Catalog", path: "/app/erp/product-catalog" },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      iconKey: "settings",
      items: [
        { id: "settings-root", label: "Settings", path: "/app/settings" },
      ],
    },
  ],
};
