export type NavigationIconKey =
  | "account"
  | "conversations"
  | "copilot"
  | "crm"
  | "erp"
  | "launchpad"
  | "more"
  | "settings"
  | "suites";

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

export type BottomNavigationContext = "launchpad" | "crm" | "erp";

export type SharedBottomNavigationItem = SharedNavigationItem & {
  iconKey: NavigationIconKey;
  slot: "copilot" | "conversations" | "launchpad" | "more";
};

const bottomNavigationItems = {
  launchpad: {
    id: "bottom-launchpad",
    label: "Launchpad",
    path: "/launchpad",
    iconKey: "launchpad",
    slot: "launchpad",
  },
  conversations: {
    id: "bottom-conversations",
    label: "Conversations",
    path: "/app/conversations",
    iconKey: "conversations",
    slot: "conversations",
  },
  more: {
    id: "bottom-more",
    label: "More",
    path: "/app/more",
    iconKey: "more",
    slot: "more",
  },
} satisfies Record<"conversations" | "launchpad" | "more", SharedBottomNavigationItem>;

const copilotBottomNavigationItem = {
  id: "bottom-copilot",
  label: "Copilot",
  path: "/app/copilot",
  iconKey: "copilot",
  slot: "copilot",
} satisfies SharedBottomNavigationItem;

export function getBottomNavigationItems(): SharedBottomNavigationItem[] {
  return [
    bottomNavigationItems.launchpad,
    bottomNavigationItems.conversations,
    copilotBottomNavigationItem,
    bottomNavigationItems.more,
  ];
}

export type ContextualActionContext = BottomNavigationContext | "conversations";

export type ContextualActionIconKey =
  | "contact"
  | "conversation"
  | "crm"
  | "erp"
  | "lead"
  | "opportunity"
  | "order"
  | "product";

export type SharedContextualAction = {
  id: string;
  label: string;
  description: string;
  path: string;
  iconKey: ContextualActionIconKey;
};

const contextualActions: Record<ContextualActionContext, SharedContextualAction[]> = {
  launchpad: [
    { id: "open-crm", label: "Open CRM", description: "Continue work with customers and pipeline.", path: "/app/sales-crm/overview", iconKey: "crm" },
    { id: "open-erp", label: "Open ERP", description: "Continue work with products and operations.", path: "/app/erp/overview", iconKey: "erp" },
  ],
  crm: [
    { id: "new-contact", label: "New contact", description: "Create a person or company in CRM.", path: "/app/sales-crm/contacts/new", iconKey: "contact" },
    { id: "new-lead", label: "New lead", description: "Add a lead to the qualification flow.", path: "/app/sales-crm/leads/new", iconKey: "lead" },
    { id: "new-opportunity", label: "New opportunity", description: "Start tracking a revenue opportunity.", path: "/app/sales-crm/opportunities/new", iconKey: "opportunity" },
  ],
  erp: [
    { id: "new-product", label: "New product", description: "Add an item to the product catalog.", path: "/app/erp/product-catalog/new", iconKey: "product" },
    { id: "new-order", label: "New order", description: "Start a new operational order.", path: "/app/erp/orders/new", iconKey: "order" },
  ],
  conversations: [
    { id: "new-conversation", label: "New conversation", description: "Start a conversation with a teammate or contact.", path: "/app/conversations/new", iconKey: "conversation" },
  ],
};

export function getContextualActions(
  context: ContextualActionContext,
): SharedContextualAction[] {
  return contextualActions[context];
}
