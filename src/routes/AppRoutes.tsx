import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "./ProtectedRoute";
import { RouteLoader } from "@/components/common/RouteLoader";
import { collectNavRoutes } from "@/app/navigation";
import { loopdevRouteElements } from "./LoopdevRoutes";

// All page components are lazy-loaded so each route ships as its own chunk
// and the initial bundle stays small. React.lazy + <Suspense> handles the
// async boundary; RouteFallback renders a professional spinner while the
// chunk is in-flight.
const Dashboard = lazy(() => import("@/template/rivera/pages/Dashboard"));
const Placeholder = lazy(() => import("@/template/rivera/pages/Placeholder"));
const NotFound = lazy(() => import("@/template/rivera/pages/NotFound"));
const AnalyticsDashboard = lazy(() => import("@/template/rivera/pages/dashboards/Analytics"));
const CRMDashboard = lazy(() => import("@/template/rivera/pages/dashboards/CRM"));
const EcommerceDashboard = lazy(() => import("@/template/rivera/pages/dashboards/Ecommerce"));
const UsersPage = lazy(() => import("@/template/rivera/pages/management/Users"));
const RolesPage = lazy(() => import("@/template/rivera/pages/management/Roles"));
const ProjectsPage = lazy(() => import("@/template/rivera/pages/management/Projects"));
const ProductsPage = lazy(() => import("@/template/rivera/pages/management/Products"));
const OrdersPage = lazy(() => import("@/template/rivera/pages/management/Orders"));
const InvoicesPage = lazy(() => import("@/template/rivera/pages/management/Invoices"));
const TasksPage = lazy(() => import("@/template/rivera/pages/apps/Tasks"));
const KanbanPage = lazy(() => import("@/template/rivera/pages/apps/Kanban"));
const CalendarPage = lazy(() => import("@/template/rivera/pages/apps/Calendar"));
const ChatPage = lazy(() => import("@/template/rivera/pages/apps/Chat"));
const FilesPage = lazy(() => import("@/template/rivera/pages/apps/Files"));
const EmailPage = lazy(() => import("@/template/rivera/pages/apps/Email"));
const ContactPage = lazy(() => import("@/template/rivera/pages/apps/Contact"));
const InvoicePage = lazy(() => import("@/template/rivera/pages/apps/Invoice"));
const MeetingPage = lazy(() => import("@/template/rivera/pages/apps/Meeting"));
const AiChatbotPage = lazy(() => import("@/template/rivera/pages/apps/AiChatbot"));
const SalesReport = lazy(() => import("@/template/rivera/pages/reports/SalesReport"));
const TrafficReport = lazy(() => import("@/template/rivera/pages/reports/TrafficReport"));
const ActivityLogs = lazy(() => import("@/template/rivera/pages/reports/ActivityLogs"));
const ButtonsKit = lazy(() => import("@/template/rivera/pages/ui-kit/Buttons"));
const CardsKit = lazy(() => import("@/template/rivera/pages/ui-kit/Cards"));
const FormsKit = lazy(() => import("@/template/rivera/pages/ui-kit/Forms"));
const TablesKit = lazy(() => import("@/template/rivera/pages/ui-kit/Tables"));
const ModalsKit = lazy(() => import("@/template/rivera/pages/ui-kit/Modals"));
const AlertsKit = lazy(() => import("@/template/rivera/pages/ui-kit/Alerts"));
const TypographyKit = lazy(() => import("@/template/rivera/pages/ui-kit/Typography"));
const MonoExamplesKit = lazy(() => import("@/template/rivera/pages/ui-kit/MonoExamples"));
const ProfilePage = lazy(() => import("@/template/rivera/pages/account/Profile"));
const SettingsPage = lazy(() => import("@/template/rivera/pages/account/Settings"));
const SecurityPage = lazy(() => import("@/template/rivera/pages/account/Security"));
const BillingPage = lazy(() => import("@/template/rivera/pages/account/Billing"));
const AppearancePage = lazy(() => import("@/template/rivera/pages/account-settings/AppearancePage"));
const Login = lazy(() => import("@/template/rivera/pages/auth/Login"));
const Register = lazy(() => import("@/template/rivera/pages/auth/Register"));
const ForgotPassword = lazy(() => import("@/template/rivera/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/template/rivera/pages/auth/ResetPassword"));
const Error500 = lazy(() => import("@/template/rivera/pages/errors/Error500"));
const Preview = lazy(() => import("@/template/rivera/pages/Preview"));
const DataConsole = lazy(() => import("@/template/rivera/pages/dev/DataConsole"));
const CardVariants = lazy(() => import("@/template/rivera/pages/dev/CardVariants"));
const ProjectsDashboard = lazy(() => import("@/template/rivera/pages/projects/Dashboard"));
const ProjectsOverview = lazy(() => import("@/template/rivera/pages/projects/Overview"));
const ProjectsWorkspace = lazy(() => import("@/template/rivera/pages/projects/Workspace"));
const ProjectsTargets = lazy(() => import("@/template/rivera/pages/projects/Targets"));
const ProjectsBudgets = lazy(() => import("@/template/rivera/pages/projects/Budgets"));
const ProjectOpsTasks = lazy(() => import("@/template/rivera/pages/projects/Tasks"));
const ProjectsWorkload = lazy(() => import("@/template/rivera/pages/projects/Workload"));
const ProjectsTimeTracking = lazy(() => import("@/template/rivera/pages/projects/TimeTracking"));
const ProjectsTeam = lazy(() => import("@/template/rivera/pages/projects/Team"));
const ProjectsActivity = lazy(() => import("@/template/rivera/pages/projects/Activity"));
const ProjectsSettings = lazy(() => import("@/template/rivera/pages/projects/Settings"));
const EcomDashboard = lazy(() => import("@/template/rivera/pages/ecommerce/Dashboard"));
const EcomProducts = lazy(() => import("@/template/rivera/pages/ecommerce/catalog/Products"));
const EcomProductAdd = lazy(() => import("@/template/rivera/pages/ecommerce/catalog/ProductAdd"));
const EcomProductEdit = lazy(() => import("@/template/rivera/pages/ecommerce/catalog/ProductEdit"));
const EcomCategories = lazy(() => import("@/template/rivera/pages/ecommerce/catalog/Categories"));
const EcomCategoryAdd = lazy(() => import("@/template/rivera/pages/ecommerce/catalog/CategoryAdd"));
const EcomCategoryEdit = lazy(() => import("@/template/rivera/pages/ecommerce/catalog/CategoryEdit"));
const EcomCustomersList = lazy(() => import("@/template/rivera/pages/ecommerce/customers/Listing"));
const EcomCustomerDetails = lazy(() => import("@/template/rivera/pages/ecommerce/customers/Details"));
const EcomOrders = lazy(() => import("@/template/rivera/pages/ecommerce/sales/Orders"));
const EcomOrderDetails = lazy(() => import("@/template/rivera/pages/ecommerce/sales/OrderDetails"));
const EcomOrderAdd = lazy(() => import("@/template/rivera/pages/ecommerce/sales/OrderAdd"));
const EcomOrderEdit = lazy(() => import("@/template/rivera/pages/ecommerce/sales/OrderEdit"));
const EcomReportViewed = lazy(() => import("@/template/rivera/pages/ecommerce/reports/ProductViewed"));
const EcomReportOrders = lazy(() => import("@/template/rivera/pages/ecommerce/reports/ProductOrders"));
const EcomReportSales = lazy(() => import("@/template/rivera/pages/ecommerce/reports/ProductSales"));
const EcomReportShipping = lazy(() => import("@/template/rivera/pages/ecommerce/reports/ProductShipping"));
const EcomReportReturns = lazy(() => import("@/template/rivera/pages/ecommerce/reports/ProductReturns"));
const EcomInvoice = lazy(() => import("@/template/rivera/pages/ecommerce/Invoice"));
const EcomSettings = lazy(() => import("@/template/rivera/pages/ecommerce/Settings"));
const PosDashboard = lazy(() => import("@/template/rivera/pages/pos/Dashboard"));
const PosCheckout = lazy(() => import("@/template/rivera/pages/pos/Checkout"));
const PosInventory = lazy(() => import("@/template/rivera/pages/pos/Inventory"));
const PosTransactions = lazy(() => import("@/template/rivera/pages/pos/Transactions"));
const PosReceipt = lazy(() => import("@/template/rivera/pages/pos/Receipt"));
const PosCustomers = lazy(() => import("@/template/rivera/pages/pos/Customers"));
const PosCustomerProfile = lazy(() => import("@/template/rivera/pages/pos/CustomerProfile"));
const PosSettingsPage = lazy(() => import("@/template/rivera/pages/pos/Settings"));
const NftDashboard = lazy(() => import("@/template/rivera/pages/nft/Dashboard"));
const NftOverview = lazy(() => import("@/template/rivera/pages/nft/Overview"));
const NftBids = lazy(() => import("@/template/rivera/pages/nft/Bids"));
const NftAssets = lazy(() => import("@/template/rivera/pages/nft/Assets"));
const NftManageAssets = lazy(() => import("@/template/rivera/pages/nft/ManageAssets"));
const NftCreators = lazy(() => import("@/template/rivera/pages/nft/Creators"));
const NftManageCreators = lazy(() => import("@/template/rivera/pages/nft/ManageCreators"));
const NftCollections = lazy(() => import("@/template/rivera/pages/nft/Collections"));
const NftSettingsPage = lazy(() => import("@/template/rivera/pages/nft/Settings"));
const LogisticsDashboard = lazy(() => import("@/template/rivera/pages/logistics/Dashboard"));
const LogisticsShipments = lazy(() => import("@/template/rivera/pages/logistics/Shipments"));
const LogisticsManageShipments = lazy(() => import("@/template/rivera/pages/logistics/ManageShipments"));
const LogisticsFleet = lazy(() => import("@/template/rivera/pages/logistics/Fleet"));
const LogisticsManageFleet = lazy(() => import("@/template/rivera/pages/logistics/ManageFleet"));
const LogisticsWarehouses = lazy(() => import("@/template/rivera/pages/logistics/Warehouses"));
const LogisticsManageWarehouses = lazy(() => import("@/template/rivera/pages/logistics/ManageWarehouses"));
const LogisticsAnalytics = lazy(() => import("@/template/rivera/pages/logistics/Analytics"));
const LogisticsSettings = lazy(() => import("@/template/rivera/pages/logistics/Settings"));
const RealEstateDashboard = lazy(() => import("@/template/rivera/pages/realestate/Dashboard"));
const RealEstateListings = lazy(() => import("@/template/rivera/pages/realestate/Listings"));
const RealEstateManageListings = lazy(() => import("@/template/rivera/pages/realestate/ManageListings"));
const RealEstateDeals = lazy(() => import("@/template/rivera/pages/realestate/Deals"));
const RealEstateManageDeals = lazy(() => import("@/template/rivera/pages/realestate/ManageDeals"));
const RealEstateAgents = lazy(() => import("@/template/rivera/pages/realestate/Agents"));
const RealEstateManageAgents = lazy(() => import("@/template/rivera/pages/realestate/ManageAgents"));
const RealEstateAnalytics = lazy(() => import("@/template/rivera/pages/realestate/Analytics"));
const RealEstateSettings = lazy(() => import("@/template/rivera/pages/realestate/Settings"));
const MarketingDashboard = lazy(() => import("@/template/rivera/pages/marketing/Dashboard"));
const MarketingCampaigns = lazy(() => import("@/template/rivera/pages/marketing/Campaigns"));
const MarketingManageCampaigns = lazy(() => import("@/template/rivera/pages/marketing/ManageCampaigns"));
const MarketingAutomation = lazy(() => import("@/template/rivera/pages/marketing/Automation"));
const MarketingAudience = lazy(() => import("@/template/rivera/pages/marketing/Audience"));
const MarketingAnalytics = lazy(() => import("@/template/rivera/pages/marketing/Analytics"));
const MarketingSettings = lazy(() => import("@/template/rivera/pages/marketing/Settings"));
const AcademyDashboard = lazy(() => import("@/template/rivera/pages/academy/Dashboard"));
const AcademyCourses = lazy(() => import("@/template/rivera/pages/academy/Courses"));
const AcademyManageCourses = lazy(() => import("@/template/rivera/pages/academy/ManageCourses"));
const AcademyInstructors = lazy(() => import("@/template/rivera/pages/academy/Instructors"));
const AcademyManageInstructors = lazy(() => import("@/template/rivera/pages/academy/ManageInstructors"));
const AcademyLearners = lazy(() => import("@/template/rivera/pages/academy/Learners"));
const AcademyManageLearners = lazy(() => import("@/template/rivera/pages/academy/ManageLearners"));
const AcademyAnalytics = lazy(() => import("@/template/rivera/pages/academy/Analytics"));
const AcademySettings = lazy(() => import("@/template/rivera/pages/academy/Settings"));
const BlogHome = lazy(() => import("@/template/rivera/pages/blogs/Home"));
const BlogManager = lazy(() => import("@/template/rivera/pages/blogs/Manager"));
const BlogCalendar = lazy(() => import("@/template/rivera/pages/blogs/Calendar"));
const BlogAnalytics = lazy(() => import("@/template/rivera/pages/blogs/Analytics"));
const BlogSettings = lazy(() => import("@/template/rivera/pages/blogs/Settings"));
const SubscriptionPlans = lazy(() => import("@/template/rivera/pages/subscription/Plans"));
const SubscriptionLifecycle = lazy(() => import("@/template/rivera/pages/subscription/Lifecycle"));
const SubscriptionSettings = lazy(() => import("@/template/rivera/pages/subscription/Settings"));
const UMUsersList = lazy(() => import("@/template/rivera/pages/user-management/UsersList"));
const UMViewUser = lazy(() => import("@/template/rivera/pages/user-management/ViewUser"));
const UMAddUser = lazy(() => import("@/template/rivera/pages/user-management/AddUser"));
const UMRolesList = lazy(() => import("@/template/rivera/pages/user-management/RolesList"));
const UMViewRole = lazy(() => import("@/template/rivera/pages/user-management/ViewRole"));
const UMPermissions = lazy(() => import("@/template/rivera/pages/user-management/Permissions"));
const EmailWelcome = lazy(() => import("@/template/rivera/pages/email-templates/Welcome"));
const EmailConfirm = lazy(() => import("@/template/rivera/pages/email-templates/Confirm"));
const EmailReset = lazy(() => import("@/template/rivera/pages/email-templates/Reset"));
const EmailExpiredCard = lazy(() => import("@/template/rivera/pages/email-templates/ExpiredCard"));
const EmailCoupon = lazy(() => import("@/template/rivera/pages/email-templates/Coupon"));
const EmailUpdate = lazy(() => import("@/template/rivera/pages/email-templates/Update"));
const CompAccordions = lazy(() => import("@/template/rivera/pages/components/base/Accordions"));
const CompAvatars = lazy(() => import("@/template/rivera/pages/components/base/Avatars"));
const CompCarousel = lazy(() => import("@/template/rivera/pages/components/base/Carousel"));
const CompDropdowns = lazy(() => import("@/template/rivera/pages/components/base/Dropdowns"));
const CompNavTabs = lazy(() => import("@/template/rivera/pages/components/base/NavTabs"));
const CompToasts = lazy(() => import("@/template/rivera/pages/components/base/Toasts"));
const CompMisc = lazy(() => import("@/template/rivera/pages/components/base/Misc"));
const CompLucide = lazy(() => import("@/template/rivera/pages/components/icons/LucideIcons"));
const CompBasicTable = lazy(() => import("@/template/rivera/pages/components/tables/BasicTable"));
const CompRecharts = lazy(() => import("@/template/rivera/pages/components/charts/Recharts"));
const CompProgress = lazy(() => import("@/template/rivera/pages/components/charts/Progress"));
const CompRadios = lazy(() => import("@/template/rivera/pages/components/forms/Radios"));
const CompCheckboxes = lazy(() => import("@/template/rivera/pages/components/forms/Checkboxes"));
const CompSwitches = lazy(() => import("@/template/rivera/pages/components/forms/Switches"));
const CompValidation = lazy(() => import("@/template/rivera/pages/components/forms/Validation"));
const CompInputMask = lazy(() => import("@/template/rivera/pages/components/forms/InputMask"));
const CompSliders = lazy(() => import("@/template/rivera/pages/components/forms/Sliders"));
const CompRichText = lazy(() => import("@/template/rivera/pages/components/editors/RichText"));
const CompDatePicker = lazy(() => import("@/template/rivera/pages/components/pickers/DatePicker"));
const CompDateRange = lazy(() => import("@/template/rivera/pages/components/pickers/DateRangePicker"));
const CompVectorMap = lazy(() => import("@/template/rivera/pages/components/maps/VectorMap"));
const CompSliderExt = lazy(() => import("@/template/rivera/pages/components/extended/SliderExt"));
const CompDropzone = lazy(() => import("@/template/rivera/pages/components/extended/Dropzone"));
const CompToastsExt = lazy(() => import("@/template/rivera/pages/components/extended/ToastsExt"));
const HelpdeskTickets = lazy(() => import("@/template/rivera/pages/helpdesk/Tickets"));
const HelpdeskTicketDetails = lazy(() => import("@/template/rivera/pages/helpdesk/TicketDetails"));
const HelpdeskTicketCreate = lazy(() => import("@/template/rivera/pages/helpdesk/TicketCreate"));
const HelpdeskTicketEdit = lazy(() => import("@/template/rivera/pages/helpdesk/TicketEdit"));
const HelpdeskSupport = lazy(() => import("@/template/rivera/pages/helpdesk/Support"));
const HelpdeskChangelog = lazy(() => import("@/template/rivera/pages/helpdesk/Changelog"));
const HelpdeskDocumentation = lazy(() => import("@/template/rivera/pages/helpdesk/Documentation"));
const HelpdeskDocumentationArticle = lazy(() => import("@/template/rivera/pages/helpdesk/DocumentationArticle"));
const UserProfileOverview = lazy(() => import("@/template/rivera/pages/user-profile/Overview"));
const UserProfileActivity = lazy(() => import("@/template/rivera/pages/user-profile/Activity"));
const UserProfileFollowers = lazy(() => import("@/template/rivera/pages/user-profile/Followers"));
const UserProfileContacts = lazy(() => import("@/template/rivera/pages/user-profile/Contacts"));
const UserProfileProjects = lazy(() => import("@/template/rivera/pages/user-profile/Projects"));
const UserProfileGallery = lazy(() => import("@/template/rivera/pages/user-profile/Gallery"));
const AccountNotificationsPage = lazy(() => import("@/template/rivera/pages/account/Notifications"));
const AccountIntegrationsPage = lazy(() => import("@/template/rivera/pages/account/Integrations"));
const RestaurantDashboard = lazy(() => import("@/template/rivera/pages/dashboards/Restaurant"));
const StarterPage = lazy(() => import("@/template/rivera/pages/info/Starter"));
const FAQsPage = lazy(() => import("@/template/rivera/pages/info/FAQs"));
const PricingPage = lazy(() => import("@/template/rivera/pages/info/Pricing"));
const AboutPage = lazy(() => import("@/template/rivera/pages/info/About"));
const ContactPageInfo = lazy(() => import("@/template/rivera/pages/info/Contact"));
const PrivacyPage = lazy(() => import("@/template/rivera/pages/info/Privacy"));
const TermsPage = lazy(() => import("@/template/rivera/pages/info/Terms"));
const RegisterSuccessPage = lazy(() => import("@/template/rivera/pages/info/RegisterSuccess"));
const TwoFactorPage = lazy(() => import("@/template/rivera/pages/info/TwoFactor"));
const LockScreenPage = lazy(() => import("@/template/rivera/pages/info/Lock"));
const UnauthorizedPage = lazy(() => import("@/template/rivera/pages/info/Unauthorized"));
const ComingSoonPage = lazy(() => import("@/template/rivera/pages/info/ComingSoon"));
const MaintenancePage = lazy(() => import("@/template/rivera/pages/info/Maintenance"));
const MultiLevelOne = lazy(() =>
  import("@/template/rivera/pages/components/multi-level/MultiLevel").then((m) => ({ default: m.MultiLevelOne })),
);
const MultiLevelTwoA = lazy(() =>
  import("@/template/rivera/pages/components/multi-level/MultiLevel").then((m) => ({ default: m.MultiLevelTwoA })),
);
const MultiLevelThreeA = lazy(() =>
  import("@/template/rivera/pages/components/multi-level/MultiLevel").then((m) => ({ default: m.MultiLevelThreeA })),
);
const MultiLevelThreeB = lazy(() =>
  import("@/template/rivera/pages/components/multi-level/MultiLevel").then((m) => ({ default: m.MultiLevelThreeB })),
);

const PUBLIC_PATHS = new Set([
  "/preview",
  "/pages/login",
  "/pages/register",
  "/pages/forgot-password",
  "/pages/reset-password",
  "/pages/404",
  "/pages/500",
]);

export function AppRoutes() {
  const allPaths = collectNavRoutes();
  const shellPaths = allPaths.filter((p) => !PUBLIC_PATHS.has(p));
  const builtPaths = new Set([
    "/",
    "/template",
    "/dashboard/analytics",
    "/dashboards/analytics",
    "/dashboard/crm",
    "/app/sales-crm",
    "/app/sales-crm/overview",
    "/app/sales-crm/contacts",
    "/app/sales-crm/pipeline",
    "/app/sales-crm/leads",
    "/app/sales-crm/opportunities",
    "/app/sales-crm/communications",
    "/app/sales-crm/tasks",
    "/dashboard/ecommerce",
    "/dashboards/ecommerce",
    "/management/users",
    "/management/roles",
    "/management/projects",
    "/management/products",
    "/management/orders",
    "/management/invoices",
    "/apps/tasks",
    "/apps/kanban",
    "/apps/calendar",
    "/apps/chat",
    "/apps/files",
    "/apps/email",
    "/apps/contact",
    "/apps/invoice",
    "/apps/meeting",
    "/apps/ai-chatbot",
    "/reports/sales",
    "/reports/traffic",
    "/reports/activity",
    "/ui-kit/buttons",
    "/ui-kit/cards",
    "/ui-kit/forms",
    "/ui-kit/tables",
    "/ui-kit/modals",
    "/ui-kit/alerts",
    "/ui-kit/typography",
    "/ui-kit/mono-examples",
    "/account/profile",
    "/account/settings",
    "/account/security",
    "/account/billing",
    "/account-settings/appearance",
    "/dev/data-console",
    "/dev/card-variants",
    "/dashboards/projects",
    "/projects/dashboard",
    "/projects/overview",
    "/projects/workspace",
    "/projects/operations/targets",
    "/projects/operations/budgets",
    "/projects/operations/tasks",
    "/projects/operations/workload",
    "/projects/operations/time-tracking",
    "/projects/team",
    "/projects/activity",
    "/projects/settings",
    "/ecommerce/dashboard",
    "/ecommerce/catalog/products",
    "/ecommerce/catalog/products/add",
    "/ecommerce/catalog/products/edit",
    "/ecommerce/catalog/categories",
    "/ecommerce/catalog/categories/add",
    "/ecommerce/catalog/categories/edit",
    "/ecommerce/customers",
    "/ecommerce/customers/details",
    "/ecommerce/sales/orders",
    "/ecommerce/sales/orders/details",
    "/ecommerce/sales/orders/add",
    "/ecommerce/sales/orders/edit",
    "/ecommerce/reports/product-viewed",
    "/ecommerce/reports/product-orders",
    "/ecommerce/reports/product-sales",
    "/ecommerce/reports/product-shipping",
    "/ecommerce/reports/product-returns",
    "/ecommerce/invoice",
    "/ecommerce/settings",
    "/pos/dashboard",
    "/dashboards/pos",
    "/pos/checkout",
    "/pos/inventory",
    "/pos/orders/transactions",
    "/pos/orders/receipt",
    "/pos/customers",
    "/pos/customers/profile",
    "/pos/settings",
    "/dashboards/nft",
    "/nft/dashboard",
    "/nft/marketplace/overview",
    "/nft/marketplace/bids",
    "/nft/assets",
    "/nft/assets/manage",
    "/nft/creators",
    "/nft/creators/manage",
    "/nft/collections",
    "/nft/settings",
    "/dashboards/logistics",
    "/logistics/dashboard",
    "/logistics/shipments",
    "/logistics/shipments/manage",
    "/logistics/fleet",
    "/logistics/fleet/manage",
    "/logistics/warehouses",
    "/logistics/warehouses/manage",
    "/logistics/analytics",
    "/logistics/settings",
    "/dashboards/real-estate",
    "/real-estate/dashboard",
    "/real-estate/listings",
    "/real-estate/listings/manage",
    "/real-estate/deals",
    "/real-estate/deals/manage",
    "/real-estate/agents",
    "/real-estate/agents/manage",
    "/real-estate/analytics",
    "/real-estate/settings",
    "/dashboards/marketing",
    "/marketing/dashboard",
    "/marketing/campaigns",
    "/marketing/campaigns/manage",
    "/marketing/automation",
    "/marketing/audience",
    "/marketing/analytics",
    "/marketing/settings",
    "/dashboards/academy",
    "/academy/dashboard",
    "/academy/courses",
    "/academy/courses/manage",
    "/academy/instructors",
    "/academy/instructors/manage",
    "/academy/learners",
    "/academy/learners/manage",
    "/academy/analytics",
    "/academy/settings",
    "/blogs",
    "/blogs/manager",
    "/blogs/calendar",
    "/blogs/analytics",
    "/blogs/settings",
    "/subscription/plans",
    "/subscription/lifecycle",
    "/subscription/settings",
    "/user-management/users",
    "/user-management/users/view",
    "/user-management/users/add",
    "/user-management/roles",
    "/user-management/roles/view",
    "/user-management/permissions",
    "/email-templates/welcome",
    "/email-templates/confirm",
    "/email-templates/reset",
    "/email-templates/expired-card",
    "/email-templates/coupon",
    "/email-templates/update",
    "/components/base/accordions",
    "/components/base/avatars",
    "/components/base/carousel",
    "/components/base/dropdowns",
    "/components/base/navtabs",
    "/components/base/toasts",
    "/components/base/misc",
    "/components/icons/lucide",
    "/components/tables/basic",
    "/components/charts/recharts",
    "/components/charts/progress",
    "/components/forms/radios",
    "/components/forms/checkboxes",
    "/components/forms/switches",
    "/components/forms/validation",
    "/components/forms/input-mask",
    "/components/forms/sliders",
    "/components/editors/rich-text",
    "/components/pickers/date",
    "/components/pickers/date-range",
    "/components/maps/vector",
    "/components/extended/slider",
    "/components/extended/dropzone",
    "/components/extended/toasts",
    "/dashboards/restaurant",
    "/helpdesk/tickets",
    "/helpdesk/tickets/details",
    "/helpdesk/tickets/create",
    "/helpdesk/support",
    "/helpdesk/changelog",
    "/helpdesk/documentation",
    "/user-profile/overview",
    "/user-profile/activity",
    "/user-profile/followers",
    "/user-profile/contacts",
    "/user-profile/projects",
    "/user-profile/gallery",
    "/account/notifications",
    "/account/integrations",
    "/pages/starter",
    "/pages/faqs",
    "/pages/pricing",
    "/pages/about",
    "/pages/contact",
    "/pages/privacy",
    "/pages/terms",
    "/pages/register-success",
    "/pages/two-factor",
    "/pages/lock",
    "/pages/401",
    "/pages/coming-soon",
    "/pages/maintenance",
    "/components/multi-level/one",
    "/components/multi-level/two-a",
    "/components/multi-level/three-a",
    "/components/multi-level/three-b",
  ]);

  return (
    <Suspense fallback={<RouteLoader />}>
    <Routes>
      {/* Public auth + sample pages */}
      <Route path="/preview" element={<Preview />} />
      <Route path="/pages/login" element={<Login />} />
      <Route path="/pages/register" element={<Register />} />
      <Route path="/pages/forgot-password" element={<ForgotPassword />} />
      <Route path="/pages/reset-password" element={<ResetPassword />} />
      <Route path="/pages/404" element={<NotFound />} />
      <Route path="/pages/500" element={<Error500 />} />

      {/* Legacy alias */}
      <Route path="/sign-in" element={<Navigate to="/pages/login" replace />} />

      {/* Authenticated app shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/template" replace />} />
        <Route path="/template" element={<Dashboard />} />
        {loopdevRouteElements}
        <Route path="/dashboard/analytics" element={<AnalyticsDashboard />} />
        <Route path="/dashboards/analytics" element={<AnalyticsDashboard />} />
        <Route path="/dashboard/crm" element={<CRMDashboard />} />
        <Route path="/dashboard/ecommerce" element={<EcommerceDashboard />} />
        <Route path="/dashboards/ecommerce" element={<EcommerceDashboard />} />
        <Route path="/management/users" element={<UsersPage />} />
        <Route path="/management/roles" element={<RolesPage />} />
        <Route path="/management/projects" element={<ProjectsPage />} />
        <Route path="/management/products" element={<ProductsPage />} />
        <Route path="/management/orders" element={<OrdersPage />} />
        <Route path="/management/invoices" element={<InvoicesPage />} />
        <Route path="/apps/tasks" element={<TasksPage />} />
        <Route path="/apps/kanban" element={<KanbanPage />} />
        <Route path="/apps/calendar" element={<CalendarPage />} />
        <Route path="/apps/chat" element={<ChatPage />} />
        <Route path="/apps/files" element={<FilesPage />} />
        <Route path="/apps/email" element={<EmailPage />} />
        <Route path="/apps/contact" element={<ContactPage />} />
        <Route path="/apps/invoice" element={<InvoicePage />} />
        <Route path="/apps/meeting" element={<MeetingPage />} />
        <Route path="/apps/ai-chatbot" element={<AiChatbotPage />} />
        <Route path="/reports/sales" element={<SalesReport />} />
        <Route path="/reports/traffic" element={<TrafficReport />} />
        <Route path="/reports/activity" element={<ActivityLogs />} />
        <Route path="/ui-kit/buttons" element={<ButtonsKit />} />
        <Route path="/ui-kit/cards" element={<CardsKit />} />
        <Route path="/ui-kit/forms" element={<FormsKit />} />
        <Route path="/ui-kit/tables" element={<TablesKit />} />
        <Route path="/ui-kit/modals" element={<ModalsKit />} />
        <Route path="/ui-kit/alerts" element={<AlertsKit />} />
        <Route path="/ui-kit/typography" element={<TypographyKit />} />
        <Route path="/ui-kit/mono-examples" element={<MonoExamplesKit />} />
        <Route path="/account/profile" element={<ProfilePage />} />
        <Route path="/account/settings" element={<SettingsPage />} />
        <Route path="/account/security" element={<SecurityPage />} />
        <Route path="/account/billing" element={<BillingPage />} />
        <Route path="/account-settings/appearance" element={<AppearancePage />} />
        <Route path="/dev/data-console" element={<DataConsole />} />
        <Route path="/dev/card-variants" element={<CardVariants />} />
        <Route path="/dashboards/projects" element={<ProjectsDashboard />} />
        <Route path="/projects/dashboard" element={<ProjectsDashboard />} />
        <Route path="/projects/overview" element={<ProjectsOverview />} />
        <Route path="/projects/workspace" element={<ProjectsWorkspace />} />
        <Route path="/projects/operations/targets" element={<ProjectsTargets />} />
        <Route path="/projects/operations/budgets" element={<ProjectsBudgets />} />
        <Route path="/projects/operations/tasks" element={<ProjectOpsTasks />} />
        <Route path="/projects/operations/workload" element={<ProjectsWorkload />} />
        <Route path="/projects/operations/time-tracking" element={<ProjectsTimeTracking />} />
        <Route path="/projects/team" element={<ProjectsTeam />} />
        <Route path="/projects/activity" element={<ProjectsActivity />} />
        <Route path="/projects/settings" element={<ProjectsSettings />} />
        <Route path="/ecommerce/dashboard" element={<EcomDashboard />} />
        <Route path="/ecommerce/catalog/products" element={<EcomProducts />} />
        <Route path="/ecommerce/catalog/products/add" element={<EcomProductAdd />} />
        <Route path="/ecommerce/catalog/products/edit" element={<EcomProductEdit />} />
        <Route path="/ecommerce/catalog/categories" element={<EcomCategories />} />
        <Route path="/ecommerce/catalog/categories/add" element={<EcomCategoryAdd />} />
        <Route path="/ecommerce/catalog/categories/edit" element={<EcomCategoryEdit />} />
        <Route path="/ecommerce/customers" element={<EcomCustomersList />} />
        <Route path="/ecommerce/customers/details" element={<EcomCustomerDetails />} />
        <Route path="/ecommerce/sales/orders" element={<EcomOrders />} />
        <Route path="/ecommerce/sales/orders/details" element={<EcomOrderDetails />} />
        <Route path="/ecommerce/sales/orders/add" element={<EcomOrderAdd />} />
        <Route path="/ecommerce/sales/orders/edit" element={<EcomOrderEdit />} />
        <Route path="/ecommerce/reports/product-viewed" element={<EcomReportViewed />} />
        <Route path="/ecommerce/reports/product-orders" element={<EcomReportOrders />} />
        <Route path="/ecommerce/reports/product-sales" element={<EcomReportSales />} />
        <Route path="/ecommerce/reports/product-shipping" element={<EcomReportShipping />} />
        <Route path="/ecommerce/reports/product-returns" element={<EcomReportReturns />} />
        <Route path="/ecommerce/invoice" element={<EcomInvoice />} />
        <Route path="/ecommerce/settings" element={<EcomSettings />} />
        <Route path="/pos/dashboard" element={<PosDashboard />} />
        <Route path="/dashboards/pos" element={<PosDashboard />} />
        <Route path="/pos/checkout" element={<PosCheckout />} />
        <Route path="/pos/inventory" element={<PosInventory />} />
        <Route path="/pos/orders/transactions" element={<PosTransactions />} />
        <Route path="/pos/orders/receipt" element={<PosReceipt />} />
        <Route path="/pos/customers" element={<PosCustomers />} />
        <Route path="/pos/customers/profile" element={<PosCustomerProfile />} />
        <Route path="/pos/settings" element={<PosSettingsPage />} />
        <Route path="/dashboards/nft" element={<NftDashboard />} />
        <Route path="/nft/dashboard" element={<NftDashboard />} />
        <Route path="/nft/marketplace/overview" element={<NftOverview />} />
        <Route path="/nft/marketplace/bids" element={<NftBids />} />
        <Route path="/nft/assets" element={<NftAssets />} />
        <Route path="/nft/assets/manage" element={<NftManageAssets />} />
        <Route path="/nft/creators" element={<NftCreators />} />
        <Route path="/nft/creators/manage" element={<NftManageCreators />} />
        <Route path="/nft/collections" element={<NftCollections />} />
        <Route path="/nft/settings" element={<NftSettingsPage />} />
        <Route path="/dashboards/logistics" element={<LogisticsDashboard />} />
        <Route path="/logistics/dashboard" element={<LogisticsDashboard />} />
        <Route path="/logistics/shipments" element={<LogisticsShipments />} />
        <Route path="/logistics/shipments/manage" element={<LogisticsManageShipments />} />
        <Route path="/logistics/fleet" element={<LogisticsFleet />} />
        <Route path="/logistics/fleet/manage" element={<LogisticsManageFleet />} />
        <Route path="/logistics/warehouses" element={<LogisticsWarehouses />} />
        <Route path="/logistics/warehouses/manage" element={<LogisticsManageWarehouses />} />
        <Route path="/logistics/analytics" element={<LogisticsAnalytics />} />
        <Route path="/logistics/settings" element={<LogisticsSettings />} />
        <Route path="/dashboards/real-estate" element={<RealEstateDashboard />} />
        <Route path="/real-estate/dashboard" element={<RealEstateDashboard />} />
        <Route path="/real-estate/listings" element={<RealEstateListings />} />
        <Route path="/real-estate/listings/manage" element={<RealEstateManageListings />} />
        <Route path="/real-estate/deals" element={<RealEstateDeals />} />
        <Route path="/real-estate/deals/manage" element={<RealEstateManageDeals />} />
        <Route path="/real-estate/agents" element={<RealEstateAgents />} />
        <Route path="/real-estate/agents/manage" element={<RealEstateManageAgents />} />
        <Route path="/real-estate/analytics" element={<RealEstateAnalytics />} />
        <Route path="/real-estate/settings" element={<RealEstateSettings />} />
        <Route path="/dashboards/marketing" element={<MarketingDashboard />} />
        <Route path="/marketing/dashboard" element={<MarketingDashboard />} />
        <Route path="/marketing/campaigns" element={<MarketingCampaigns />} />
        <Route path="/marketing/campaigns/manage" element={<MarketingManageCampaigns />} />
        <Route path="/marketing/automation" element={<MarketingAutomation />} />
        <Route path="/marketing/audience" element={<MarketingAudience />} />
        <Route path="/marketing/analytics" element={<MarketingAnalytics />} />
        <Route path="/marketing/settings" element={<MarketingSettings />} />
        <Route path="/dashboards/academy" element={<AcademyDashboard />} />
        <Route path="/academy/dashboard" element={<AcademyDashboard />} />
        <Route path="/academy/courses" element={<AcademyCourses />} />
        <Route path="/academy/courses/manage" element={<AcademyManageCourses />} />
        <Route path="/academy/instructors" element={<AcademyInstructors />} />
        <Route path="/academy/instructors/manage" element={<AcademyManageInstructors />} />
        <Route path="/academy/learners" element={<AcademyLearners />} />
        <Route path="/academy/learners/manage" element={<AcademyManageLearners />} />
        <Route path="/academy/analytics" element={<AcademyAnalytics />} />
        <Route path="/academy/settings" element={<AcademySettings />} />
        <Route path="/blogs" element={<BlogHome />} />
        <Route path="/blogs/manager" element={<BlogManager />} />
        <Route path="/blogs/calendar" element={<BlogCalendar />} />
        <Route path="/blogs/analytics" element={<BlogAnalytics />} />
        <Route path="/blogs/settings" element={<BlogSettings />} />
        <Route path="/subscription/plans" element={<SubscriptionPlans />} />
        <Route path="/subscription/lifecycle" element={<SubscriptionLifecycle />} />
        <Route path="/subscription/settings" element={<SubscriptionSettings />} />
        <Route path="/user-management/users" element={<UMUsersList />} />
        <Route path="/user-management/users/view" element={<UMViewUser />} />
        <Route path="/user-management/users/add" element={<UMAddUser />} />
        <Route path="/user-management/roles" element={<UMRolesList />} />
        <Route path="/user-management/roles/view" element={<UMViewRole />} />
        <Route path="/user-management/permissions" element={<UMPermissions />} />
        <Route path="/email-templates/welcome" element={<EmailWelcome />} />
        <Route path="/email-templates/confirm" element={<EmailConfirm />} />
        <Route path="/email-templates/reset" element={<EmailReset />} />
        <Route path="/email-templates/expired-card" element={<EmailExpiredCard />} />
        <Route path="/email-templates/coupon" element={<EmailCoupon />} />
        <Route path="/email-templates/update" element={<EmailUpdate />} />
        <Route path="/components/base/accordions" element={<CompAccordions />} />
        <Route path="/components/base/avatars" element={<CompAvatars />} />
        <Route path="/components/base/carousel" element={<CompCarousel />} />
        <Route path="/components/base/dropdowns" element={<CompDropdowns />} />
        <Route path="/components/base/navtabs" element={<CompNavTabs />} />
        <Route path="/components/base/toasts" element={<CompToasts />} />
        <Route path="/components/base/misc" element={<CompMisc />} />
        <Route path="/components/icons/lucide" element={<CompLucide />} />
        <Route path="/components/tables/basic" element={<CompBasicTable />} />
        <Route path="/components/charts/recharts" element={<CompRecharts />} />
        <Route path="/components/charts/progress" element={<CompProgress />} />
        <Route path="/components/forms/radios" element={<CompRadios />} />
        <Route path="/components/forms/checkboxes" element={<CompCheckboxes />} />
        <Route path="/components/forms/switches" element={<CompSwitches />} />
        <Route path="/components/forms/validation" element={<CompValidation />} />
        <Route path="/components/forms/input-mask" element={<CompInputMask />} />
        <Route path="/components/forms/sliders" element={<CompSliders />} />
        <Route path="/components/editors/rich-text" element={<CompRichText />} />
        <Route path="/components/pickers/date" element={<CompDatePicker />} />
        <Route path="/components/pickers/date-range" element={<CompDateRange />} />
        <Route path="/components/maps/vector" element={<CompVectorMap />} />
        <Route path="/components/extended/slider" element={<CompSliderExt />} />
        <Route path="/components/extended/dropzone" element={<CompDropzone />} />
        <Route path="/components/extended/toasts" element={<CompToastsExt />} />
        <Route path="/dashboards/restaurant" element={<RestaurantDashboard />} />
        <Route path="/helpdesk/tickets" element={<HelpdeskTickets />} />
        <Route path="/helpdesk/tickets/details" element={<HelpdeskTicketDetails />} />
        <Route path="/helpdesk/tickets/details/:id" element={<HelpdeskTicketDetails />} />
        <Route path="/helpdesk/tickets/create" element={<HelpdeskTicketCreate />} />
        <Route path="/helpdesk/tickets/edit/:id" element={<HelpdeskTicketEdit />} />
        <Route path="/helpdesk/support" element={<HelpdeskSupport />} />
        <Route path="/helpdesk/changelog" element={<HelpdeskChangelog />} />
        <Route path="/helpdesk/documentation" element={<HelpdeskDocumentation />} />
        <Route path="/helpdesk/documentation/:section/:article" element={<HelpdeskDocumentationArticle />} />
        <Route path="/user-profile/overview" element={<UserProfileOverview />} />
        <Route path="/user-profile/activity" element={<UserProfileActivity />} />
        <Route path="/user-profile/followers" element={<UserProfileFollowers />} />
        <Route path="/user-profile/contacts" element={<UserProfileContacts />} />
        <Route path="/user-profile/projects" element={<UserProfileProjects />} />
        <Route path="/user-profile/gallery" element={<UserProfileGallery />} />
        <Route path="/account/notifications" element={<AccountNotificationsPage />} />
        <Route path="/account/integrations" element={<AccountIntegrationsPage />} />
        <Route path="/pages/starter" element={<StarterPage />} />
        <Route path="/pages/faqs" element={<FAQsPage />} />
        <Route path="/pages/pricing" element={<PricingPage />} />
        <Route path="/pages/about" element={<AboutPage />} />
        <Route path="/pages/contact" element={<ContactPageInfo />} />
        <Route path="/pages/privacy" element={<PrivacyPage />} />
        <Route path="/pages/terms" element={<TermsPage />} />
        <Route path="/pages/register-success" element={<RegisterSuccessPage />} />
        <Route path="/pages/two-factor" element={<TwoFactorPage />} />
        <Route path="/pages/lock" element={<LockScreenPage />} />
        <Route path="/pages/401" element={<UnauthorizedPage />} />
        <Route path="/pages/coming-soon" element={<ComingSoonPage />} />
        <Route path="/pages/maintenance" element={<MaintenancePage />} />
        <Route path="/components/multi-level/one" element={<MultiLevelOne />} />
        <Route path="/components/multi-level/two-a" element={<MultiLevelTwoA />} />
        <Route path="/components/multi-level/three-a" element={<MultiLevelThreeA />} />
        <Route path="/components/multi-level/three-b" element={<MultiLevelThreeB />} />
        {shellPaths
          .filter((p) => !builtPaths.has(p))
          .map((path) => (
            <Route key={path} path={path} element={<Placeholder />} />
          ))}
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}
