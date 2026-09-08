import {
  LayoutDashboard,
  BarChart3,
  Palette,
  UserCircle,
  FileCode,
  Sparkles,
  ShoppingBag,
  FolderKanban,
  ScanBarcode,
  Image as ImageIcon,
  Truck,
  Building2,
  Megaphone,
  GraduationCap,
  PenSquare,
  CreditCard,
  Users,
  LifeBuoy,
  TableProperties,
  PieChart,
  FormInput,
  FileEdit,
  CalendarRange,
  Map as MapIcon,
  Layers,
  Boxes,
  Shield,
  Mail,
  Lock,
  AlertTriangle,
  ListTree,
  ClipboardList,
  FileBarChart,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** Node in the navigation tree — supports arbitrary nesting. */
export interface NavNode {
  label: string;
  to?: string;
  icon?: LucideIcon;
  badge?: string;
  description?: string;
  children?: NavNode[];
}

/** Backwards-compatible aliases. */
export type NavItem = NavNode;
export type NavChild = NavNode;

export interface NavSection {
  label: string;
  items: NavNode[];
}

export const navigation: NavSection[] = [
  {
    label: "Dashboards",
    items: [
      {
        label: "Dashboards",
        icon: LayoutDashboard,
        children: [
          { label: "eCommerce", to: "/dashboards/ecommerce" },
          { label: "Analytics", to: "/dashboards/analytics" },
          { label: "CRM", to: "/dashboard/crm" },
          { label: "Projects", to: "/dashboards/projects" },
          { label: "POS System", to: "/dashboards/pos" },
          { label: "NFT Market", to: "/dashboards/nft" },
          { label: "Restaurant", to: "/dashboards/restaurant" },
          { label: "Logistics", to: "/dashboards/logistics" },
          { label: "Academy", to: "/dashboards/academy" },
          { label: "Real Estate", to: "/dashboards/real-estate" },
          { label: "Marketing", to: "/dashboards/marketing" },
        ],
      },
    ],
  },
  {
    label: "WebApps",
    items: [
      {
        label: "Applications",
        icon: Sparkles,
        children: [
          { label: "Chat", to: "/apps/chat", badge: "12" },
          { label: "Email", to: "/apps/email" },
          { label: "Contact", to: "/apps/contact" },
          { label: "Invoice", to: "/apps/invoice" },
          { label: "Tasks", to: "/apps/tasks" },
          { label: "Kanban", to: "/apps/kanban" },
          { label: "Calendar", to: "/apps/calendar" },
          { label: "Meeting", to: "/apps/meeting" },
          { label: "AI Chatbot", to: "/apps/ai-chatbot" },
          { label: "File Manager", to: "/apps/files" },
        ],
      },
      {
        label: "eCommerce",
        icon: ShoppingBag,
        children: [
          { label: "Dashboard", to: "/ecommerce/dashboard" },
          {
            label: "Catalog",
            children: [
              { label: "Products List", to: "/ecommerce/catalog/products" },
              { label: "Product Add", to: "/ecommerce/catalog/products/add" },
              { label: "Product Edit", to: "/ecommerce/catalog/products/edit" },
              { label: "Categories", to: "/ecommerce/catalog/categories" },
              { label: "Category Add", to: "/ecommerce/catalog/categories/add" },
              { label: "Category Edit", to: "/ecommerce/catalog/categories/edit" },
            ],
          },
          {
            label: "Customers",
            children: [
              { label: "Customer Listing", to: "/ecommerce/customers" },
              { label: "Customer Details", to: "/ecommerce/customers/details" },
            ],
          },
          {
            label: "Sales",
            children: [
              { label: "Orders Listing", to: "/ecommerce/sales/orders" },
              { label: "Order Details", to: "/ecommerce/sales/orders/details" },
              { label: "Order Add", to: "/ecommerce/sales/orders/add" },
              { label: "Order Edit", to: "/ecommerce/sales/orders/edit" },
            ],
          },
          {
            label: "Reports",
            children: [
              { label: "Product Viewed", to: "/ecommerce/reports/product-viewed" },
              { label: "Product Orders", to: "/ecommerce/reports/product-orders" },
              { label: "Product Sales", to: "/ecommerce/reports/product-sales" },
              { label: "Product Shipping", to: "/ecommerce/reports/product-shipping" },
              { label: "Product Returns", to: "/ecommerce/reports/product-returns" },
            ],
          },
          { label: "Invoice", to: "/ecommerce/invoice" },
          { label: "Settings", to: "/ecommerce/settings" },
        ],
      },
      {
        label: "Projects",
        icon: FolderKanban,
        children: [
          { label: "Dashboard", to: "/projects/dashboard" },
          {
            label: "Projects",
            children: [
              { label: "Overview", to: "/projects/overview" },
              { label: "Workspace", to: "/projects/workspace" },
            ],
          },
          {
            label: "Operations",
            children: [
              { label: "Targets & KPIs", to: "/projects/operations/targets" },
              { label: "Budgets", to: "/projects/operations/budgets" },
              { label: "Tasks", to: "/projects/operations/tasks" },
              { label: "Workload", to: "/projects/operations/workload" },
              { label: "Time Tracking", to: "/projects/operations/time-tracking" },
            ],
          },
          { label: "Team", to: "/projects/team" },
          { label: "Activity", to: "/projects/activity" },
          { label: "Settings", to: "/projects/settings" },
        ],
      },
      {
        label: "POS System",
        icon: ScanBarcode,
        children: [
          { label: "Dashboard", to: "/pos/dashboard" },
          { label: "Checkout", to: "/pos/checkout" },
          { label: "Inventory", to: "/pos/inventory" },
          {
            label: "Orders",
            children: [
              { label: "Transactions", to: "/pos/orders/transactions" },
              { label: "Order Receipt", to: "/pos/orders/receipt" },
            ],
          },
          {
            label: "Customers",
            children: [
              { label: "Customers", to: "/pos/customers" },
              { label: "Customer Profile", to: "/pos/customers/profile" },
            ],
          },
          { label: "Settings", to: "/pos/settings" },
        ],
      },
      {
        label: "NFT Market",
        icon: ImageIcon,
        children: [
          { label: "Dashboard", to: "/nft/dashboard" },
          {
            label: "Marketplace",
            children: [
              { label: "Overview", to: "/nft/marketplace/overview" },
              { label: "Bids", to: "/nft/marketplace/bids" },
            ],
          },
          {
            label: "Assets",
            children: [
              { label: "Assets", to: "/nft/assets" },
              { label: "Manage", to: "/nft/assets/manage" },
            ],
          },
          {
            label: "Creators",
            children: [
              { label: "Creators", to: "/nft/creators" },
              { label: "Manage", to: "/nft/creators/manage" },
            ],
          },
          { label: "Collections", to: "/nft/collections" },
          { label: "Settings", to: "/nft/settings" },
        ],
      },
      {
        label: "Logistics",
        icon: Truck,
        children: [
          { label: "Dashboard", to: "/logistics/dashboard" },
          {
            label: "Shipments",
            children: [
              { label: "Shipments", to: "/logistics/shipments" },
              { label: "Manage", to: "/logistics/shipments/manage" },
            ],
          },
          {
            label: "Fleet",
            children: [
              { label: "Fleet", to: "/logistics/fleet" },
              { label: "Manage", to: "/logistics/fleet/manage" },
            ],
          },
          {
            label: "Warehouses",
            children: [
              { label: "Warehouses", to: "/logistics/warehouses" },
              { label: "Manage", to: "/logistics/warehouses/manage" },
            ],
          },
          { label: "Analytics", to: "/logistics/analytics" },
          { label: "Settings", to: "/logistics/settings" },
        ],
      },
      {
        label: "Real Estate",
        icon: Building2,
        children: [
          { label: "Dashboard", to: "/real-estate/dashboard" },
          {
            label: "Listings",
            children: [
              { label: "Listings", to: "/real-estate/listings" },
              { label: "Manage", to: "/real-estate/listings/manage" },
            ],
          },
          {
            label: "Deals",
            children: [
              { label: "Deals", to: "/real-estate/deals" },
              { label: "Manage", to: "/real-estate/deals/manage" },
            ],
          },
          {
            label: "Agents",
            children: [
              { label: "Agents", to: "/real-estate/agents" },
              { label: "Manage", to: "/real-estate/agents/manage" },
            ],
          },
          { label: "Analytics", to: "/real-estate/analytics" },
          { label: "Settings", to: "/real-estate/settings" },
        ],
      },
      {
        label: "Marketing",
        icon: Megaphone,
        children: [
          { label: "Dashboard", to: "/marketing/dashboard" },
          {
            label: "Campaigns",
            children: [
              { label: "Campaigns", to: "/marketing/campaigns" },
              { label: "Manage", to: "/marketing/campaigns/manage" },
            ],
          },
          { label: "Automation", to: "/marketing/automation" },
          { label: "Audience", to: "/marketing/audience" },
          { label: "Analytics", to: "/marketing/analytics" },
          { label: "Settings", to: "/marketing/settings" },
        ],
      },
      {
        label: "Academy",
        icon: GraduationCap,
        children: [
          { label: "Dashboard", to: "/academy/dashboard" },
          {
            label: "Courses",
            children: [
              { label: "Courses", to: "/academy/courses" },
              { label: "Manage", to: "/academy/courses/manage" },
            ],
          },
          {
            label: "Instructors",
            children: [
              { label: "Instructors", to: "/academy/instructors" },
              { label: "Manage", to: "/academy/instructors/manage" },
            ],
          },
          {
            label: "Learners",
            children: [
              { label: "Learners", to: "/academy/learners" },
              { label: "Manage", to: "/academy/learners/manage" },
            ],
          },
          { label: "Analytics", to: "/academy/analytics" },
          { label: "Settings", to: "/academy/settings" },
        ],
      },
      {
        label: "Blogs",
        icon: PenSquare,
        children: [
          { label: "Home", to: "/blogs" },
          { label: "Manager", to: "/blogs/manager" },
          { label: "Calendar", to: "/blogs/calendar" },
          { label: "Analytics", to: "/blogs/analytics" },
          { label: "Settings", to: "/blogs/settings" },
        ],
      },
      {
        label: "Subscription",
        icon: CreditCard,
        children: [
          { label: "Plans", to: "/subscription/plans" },
          { label: "Lifecycle", to: "/subscription/lifecycle" },
          { label: "Settings", to: "/subscription/settings" },
        ],
      },
      {
        label: "User Management",
        icon: Users,
        children: [
          {
            label: "Users",
            children: [
              { label: "Users List", to: "/user-management/users" },
              { label: "View User", to: "/user-management/users/view" },
              { label: "Add User", to: "/user-management/users/add" },
            ],
          },
          {
            label: "Roles",
            children: [
              { label: "Roles List", to: "/user-management/roles" },
              { label: "View Role", to: "/user-management/roles/view" },
            ],
          },
          { label: "User Permissions", to: "/user-management/permissions" },
        ],
      },
      {
        label: "Helpdesk",
        icon: LifeBuoy,
        children: [
          { label: "Tickets", to: "/helpdesk/tickets" },
          { label: "Ticket Details", to: "/helpdesk/tickets/details" },
          { label: "Create Ticket", to: "/helpdesk/tickets/create" },
        ],
      },
      {
        label: "Management",
        icon: ClipboardList,
        children: [
          { label: "Users", to: "/management/users" },
          { label: "Roles", to: "/management/roles" },
          { label: "Projects", to: "/management/projects" },
          { label: "Products", to: "/management/products" },
          { label: "Orders", to: "/management/orders" },
          { label: "Invoices", to: "/management/invoices" },
        ],
      },
      {
        label: "Reports",
        icon: FileBarChart,
        children: [
          { label: "Sales Report", to: "/reports/sales" },
          { label: "Traffic Report", to: "/reports/traffic" },
          { label: "Activity Logs", to: "/reports/activity" },
        ],
      },
    ],
  },
  {
    label: "UI Pages",
    items: [
      {
        label: "User Profile",
        icon: UserCircle,
        children: [
          { label: "Overview", to: "/user-profile/overview" },
          { label: "Activity", to: "/user-profile/activity" },
          { label: "Followers", to: "/user-profile/followers" },
          { label: "Contacts", to: "/user-profile/contacts" },
          { label: "Projects", to: "/user-profile/projects" },
          { label: "Gallery", to: "/user-profile/gallery" },
        ],
      },
      {
        label: "Account Settings",
        icon: Shield,
        children: [
          { label: "Account", to: "/account/profile" },
          { label: "Settings", to: "/account/settings" },
          { label: "Security", to: "/account/security" },
          { label: "Appearance", to: "/account-settings/appearance" },
          { label: "Notifications", to: "/account/notifications" },
          { label: "Plan & Billing", to: "/account/billing" },
          { label: "Integrations", to: "/account/integrations" },
        ],
      },
      {
        label: "Other Pages",
        icon: FileCode,
        children: [
          { label: "Starter", to: "/pages/starter" },
          { label: "FAQs", to: "/pages/faqs" },
          { label: "Pricing", to: "/pages/pricing" },
          { label: "About Us", to: "/pages/about" },
          { label: "Contact Us", to: "/pages/contact" },
          { label: "Privacy & Policy", to: "/pages/privacy" },
          { label: "Terms of Services", to: "/pages/terms" },
        ],
      },
      {
        label: "Authentication",
        icon: Lock,
        children: [
          { label: "Login", to: "/pages/login" },
          { label: "Register", to: "/pages/register" },
          { label: "Register Success", to: "/pages/register-success" },
          { label: "Reset Password", to: "/pages/reset-password" },
          { label: "Forgot Password", to: "/pages/forgot-password" },
          { label: "Two-factor OTP", to: "/pages/two-factor" },
          { label: "Lock Screen", to: "/pages/lock" },
        ],
      },
      {
        label: "Error Pages",
        icon: AlertTriangle,
        children: [
          { label: "404 Not Found", to: "/pages/404" },
          { label: "401 Not Authorized", to: "/pages/401" },
          { label: "500 Server Error", to: "/pages/500" },
          { label: "Coming Soon", to: "/pages/coming-soon" },
          { label: "Under Maintenance", to: "/pages/maintenance" },
        ],
      },
      {
        label: "Email Templates",
        icon: Mail,
        children: [
          { label: "Welcome Message", to: "/email-templates/welcome" },
          { label: "Confirm Account", to: "/email-templates/confirm" },
          { label: "Reset Password", to: "/email-templates/reset" },
          { label: "Expired Card", to: "/email-templates/expired-card" },
          { label: "Coupon Sale", to: "/email-templates/coupon" },
          { label: "Latest Update", to: "/email-templates/update" },
        ],
      },
    ],
  },
  {
    label: "Components",
    items: [
      {
        label: "Base UI",
        icon: Palette,
        children: [
          { label: "Accordions", to: "/components/base/accordions" },
          { label: "Avatars", to: "/components/base/avatars" },
          { label: "Buttons", to: "/ui-kit/buttons" },
          { label: "Cards", to: "/ui-kit/cards" },
          { label: "Carousel", to: "/components/base/carousel" },
          { label: "Dropdowns", to: "/components/base/dropdowns" },
          { label: "Modals", to: "/ui-kit/modals" },
          { label: "NavTabs", to: "/components/base/navtabs" },
          { label: "Toasts", to: "/components/base/toasts" },
          { label: "Typography", to: "/ui-kit/typography" },
          { label: "Mono in Context", to: "/ui-kit/mono-examples" },
          { label: "Miscellaneous", to: "/components/base/misc" },
        ],
      },
      {
        label: "Icons",
        icon: Sparkles,
        children: [{ label: "Lucide Icons", to: "/components/icons/lucide" }],
      },
      {
        label: "Tables",
        icon: TableProperties,
        children: [
          { label: "Basic Table", to: "/components/tables/basic" },
          { label: "Data Table", to: "/ui-kit/tables" },
        ],
      },
      {
        label: "Charts",
        icon: PieChart,
        children: [
          { label: "Recharts", to: "/components/charts/recharts" },
          { label: "Progress Charts", to: "/components/charts/progress" },
        ],
      },
      {
        label: "Forms",
        icon: FormInput,
        children: [
          { label: "Radios", to: "/components/forms/radios" },
          { label: "Checkboxes", to: "/components/forms/checkboxes" },
          { label: "Switches", to: "/components/forms/switches" },
          { label: "Elements", to: "/ui-kit/forms" },
          { label: "Validation", to: "/components/forms/validation" },
          { label: "Input Mask", to: "/components/forms/input-mask" },
          { label: "Sliders", to: "/components/forms/sliders" },
        ],
      },
      {
        label: "Editors",
        icon: FileEdit,
        children: [{ label: "Rich Text Editor", to: "/components/editors/rich-text" }],
      },
      {
        label: "Pickers",
        icon: CalendarRange,
        children: [
          { label: "Date Picker", to: "/components/pickers/date" },
          { label: "Date Range Picker", to: "/components/pickers/date-range" },
        ],
      },
      {
        label: "Maps",
        icon: MapIcon,
        children: [{ label: "Vector Map Placeholder", to: "/components/maps/vector" }],
      },
      {
        label: "Extended",
        icon: Layers,
        children: [
          { label: "Select", to: "/ui-kit/forms" },
          { label: "Alerts", to: "/ui-kit/alerts" },
          { label: "Slider", to: "/components/extended/slider" },
          { label: "Dropzone Mock", to: "/components/extended/dropzone" },
          { label: "Toast Examples", to: "/components/extended/toasts" },
        ],
      },
      {
        label: "Multi Level",
        icon: ListTree,
        children: [
          { label: "Level 1", to: "/components/multi-level/one" },
          {
            label: "Level 1",
            children: [
              { label: "Level 2", to: "/components/multi-level/two-a" },
              {
                label: "Level 2",
                children: [
                  { label: "Level 3", to: "/components/multi-level/three-a" },
                  { label: "Level 3", to: "/components/multi-level/three-b" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    label: "Helpdesk",
    items: [
      { label: "Support", to: "/helpdesk/support", icon: LifeBuoy },
      { label: "Changelog", to: "/helpdesk/changelog", icon: Boxes },
      { label: "Documentation", to: "/helpdesk/documentation", icon: FileCode },
      {
        label: "Developer",
        icon: Wrench,
        children: [
          { label: "Data Console", to: "/dev/data-console" },
          { label: "Card Variants", to: "/dev/card-variants" },
        ],
      },
    ],
  },
];

export const launchpadNavigation: NavSection[] = [
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
];

/** Flattened map of all routes with their breadcrumb trail and icon. */
export interface RouteMeta {
  path: string;
  label: string;
  section: string;
  /** Trail of ancestor labels from the section's top-level item down to (but excluding) this leaf. */
  trail: string[];
  /** Icon of the top-level group this route belongs to. */
  parentIcon?: LucideIcon;
  /** Immediate parent label, if any. */
  parent?: string;
}

export const routeMeta: Record<string, RouteMeta> = (() => {
  const map: Record<string, RouteMeta> = {};
  const visit = (
    node: NavNode,
    section: string,
    trail: string[],
    rootIcon?: LucideIcon,
  ) => {
    const icon = rootIcon ?? node.icon;
    if (node.to && !map[node.to]) {
      map[node.to] = {
        path: node.to,
        label: node.label,
        section,
        trail,
        parent: trail[trail.length - 1],
        parentIcon: icon,
      };
    }
    if (node.children) {
      const nextTrail = [...trail, node.label];
      for (const child of node.children) visit(child, section, nextTrail, icon);
    }
  };
  for (const section of navigation) {
    for (const item of section.items) visit(item, section.label, [], item.icon);
  }
  return map;
})();

/** Collect every leaf path in the navigation tree. */
export function collectNavRoutes(): string[] {
  return Object.keys(routeMeta);
}