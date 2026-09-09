import { BookOpen, Code2, Database, Palette, ShieldCheck, Zap, type LucideIcon } from "lucide-react";

export type DocArticle = {
  slug: string;
  title: string;
  summary: string;
  readTime: string;
  body: DocBlock[];
};

export type DocBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; lang?: string; code: string }
  | { type: "callout"; tone: "info" | "warning" | "success"; title: string; text: string };

export type DocSection = {
  slug: string;
  icon: LucideIcon;
  title: string;
  description: string;
  articles: DocArticle[];
};

export const DOC_SECTIONS: DocSection[] = [
  {
    slug: "getting-started",
    icon: Zap,
    title: "Getting started",
    description: "Install, run, and explore the project layout.",
    articles: [
      {
        slug: "install-and-run",
        title: "Install & run",
        summary: "Bootstrap the project locally with Bun or npm.",
        readTime: "3 min",
        body: [
          { type: "p", text: "Rivera is a Vite + React + TypeScript application. You can run it with Bun, pnpm, or npm — Bun is recommended for the fastest install times." },
          { type: "h", text: "Prerequisites" },
          { type: "list", items: ["Node.js 20+ or Bun 1.1+", "Git for cloning the repository", "A modern browser for the dev preview"] },
          { type: "h", text: "Install dependencies" },
          { type: "code", lang: "bash", code: "bun install\n# or\nnpm install" },
          { type: "h", text: "Start the dev server" },
          { type: "code", lang: "bash", code: "bun run dev\n# preview on http://localhost:5173" },
          { type: "callout", tone: "info", title: "Hot reload", text: "Vite reloads modules on save. Tailwind classes regenerate automatically." },
        ],
      },
      {
        slug: "project-structure",
        title: "Project structure",
        summary: "How pages, routes, components, and features are organized.",
        readTime: "4 min",
        body: [
          { type: "p", text: "The codebase follows a feature-first layout under src/. Reusable building blocks live in components/, and per-domain logic lives under features/." },
          { type: "code", lang: "text", code: "src/\n  app/            # navigation graph\n  routes/         # route table & guards\n  pages/          # one file per route\n  components/\n    common/       # PageContainer, DataCard, DataTable…\n    layout/       # AppShell, Sidebar, Topbar\n    ui/           # shadcn primitives\n  features/       # domain modules (marketing, pos, …)\n  data/           # mock seeds & local stores\n  hooks/  lib/    # cross-cutting utilities" },
          { type: "callout", tone: "success", title: "Convention", text: "Every page wraps content in <PageContainer> and uses <PageHeader> for the title block." },
        ],
      },
      {
        slug: "first-page",
        title: "Your first page",
        summary: "Create a new page and add it to the navigation.",
        readTime: "5 min",
        body: [
          { type: "h", text: "1. Create the page file" },
          { type: "code", lang: "tsx", code: "// src/pages/demo/Hello.tsx\nimport { PageContainer, PageHeader, DataCard } from \"@/components/common\";\n\nexport default function HelloPage() {\n  return (\n    <PageContainer width=\"default\">\n      <PageHeader title=\"Hello\" description=\"My first page\" />\n      <DataCard title=\"Welcome\">It works.</DataCard>\n    </PageContainer>\n  );\n}" },
          { type: "h", text: "2. Register the route" },
          { type: "p", text: "Add a <Route /> entry to src/routes/AppRoutes.tsx and a sidebar item in src/app/navigation.ts." },
        ],
      },
      {
        slug: "routing-basics",
        title: "Routing basics",
        summary: "React Router v6 with nested layouts and breadcrumbs.",
        readTime: "4 min",
        body: [
          { type: "p", text: "Routes are declared in AppRoutes.tsx. The shell layout wraps every authenticated route and provides the sidebar, topbar, and breadcrumb context." },
          { type: "list", items: ["Use <Link to=\"/path\"> for in-app links", "useBreadcrumbs() returns the active trail", "ProtectedRoute gates routes by role"] },
        ],
      },
    ],
  },
  {
    slug: "theming",
    icon: Palette,
    title: "Theming",
    description: "Tokens, dark mode, and chart styles.",
    articles: [
      {
        slug: "design-tokens",
        title: "Design tokens",
        summary: "Semantic HSL tokens drive every color in the app.",
        readTime: "5 min",
        body: [
          { type: "p", text: "Colors are defined as HSL triplets in src/index.css and consumed via Tailwind utility classes like bg-primary or text-muted-foreground." },
          { type: "code", lang: "css", code: ":root {\n  --background: 0 0% 100%;\n  --foreground: 222 47% 11%;\n  --primary: 221 83% 53%;\n  --primary-foreground: 210 40% 98%;\n}" },
          { type: "callout", tone: "warning", title: "Avoid raw colors", text: "Never write text-white or bg-[#1a1a1a] in components. Use tokens so dark mode and theme presets keep working." },
        ],
      },
      {
        slug: "dark-mode",
        title: "Dark mode",
        summary: "Class-based dark mode with system preference fallback.",
        readTime: "3 min",
        body: [
          { type: "p", text: "The theme provider toggles a .dark class on <html>. All token overrides live under :root.dark in index.css." },
          { type: "list", items: ["useTheme() returns { theme, setTheme }", "Persisted to localStorage", "Cross-tab synced via the storage event"] },
        ],
      },
      {
        slug: "custom-themes",
        title: "Custom themes",
        summary: "Pick brand colors, radius, and font with the customizer.",
        readTime: "4 min",
        body: [
          { type: "p", text: "Open the theme customizer from the topbar to remix primary color, accent, radius, and density. Settings persist per device." },
        ],
      },
      {
        slug: "chart-styles",
        title: "Chart styles",
        summary: "Curve presets keep Recharts visuals on-brand.",
        readTime: "3 min",
        body: [
          { type: "p", text: "resolveChartStyle() maps the active theme into Recharts props (curve type, gradient, grid). Use it instead of hardcoding chart visuals." },
        ],
      },
    ],
  },
  {
    slug: "data-layer",
    icon: Database,
    title: "Data layer",
    description: "Local stores, seeds, and persistence.",
    articles: [
      {
        slug: "create-local-store",
        title: "createLocalStore",
        summary: "A typed, reactive in-memory store backed by localStorage.",
        readTime: "5 min",
        body: [
          { type: "p", text: "createLocalStore(key, seed) returns a store with get / set / update / remove / subscribe. Pair it with the useLocalStore() hook for live components." },
          { type: "code", lang: "ts", code: "export const campaignsStore = createLocalStore(\n  \"campaigns\",\n  () => seedCampaigns(),\n);\n\nfunction Campaigns() {\n  const items = useLocalStore(campaignsStore);\n  return <List items={items} />;\n}" },
        ],
      },
      {
        slug: "mock-seeds",
        title: "Mock seeds",
        summary: "Deterministic mock data under src/data/.",
        readTime: "3 min",
        body: [
          { type: "p", text: "Seed helpers generate realistic relational data with stable IDs so demos look the same on every load." },
        ],
      },
      {
        slug: "query-helpers",
        title: "Query helpers",
        summary: "Search, sort, paginate, and filter without a backend.",
        readTime: "4 min",
        body: [
          { type: "p", text: "lib/dataUtils provides composable helpers for client-side querying — perfect for DataTable toolbars." },
        ],
      },
      {
        slug: "persistence",
        title: "Persistence",
        summary: "How state survives reloads and syncs across tabs.",
        readTime: "3 min",
        body: [
          { type: "p", text: "Stores write to localStorage on every mutation and listen for the storage event so other tabs stay in sync automatically." },
        ],
      },
    ],
  },
  {
    slug: "components",
    icon: Code2,
    title: "Components",
    description: "Common building blocks for every page.",
    articles: [
      {
        slug: "page-header",
        title: "PageHeader",
        summary: "Standard title, eyebrow, breadcrumbs, and actions block.",
        readTime: "2 min",
        body: [
          { type: "code", lang: "tsx", code: "<PageHeader\n  eyebrow=\"Helpdesk\"\n  title=\"Documentation\"\n  description=\"Everything you need to build with Rivera.\"\n  breadcrumbs={trail}\n  actions={<Button>New</Button>}\n/>" },
        ],
      },
      {
        slug: "data-card",
        title: "DataCard",
        summary: "Card surface with optional title, description, and action.",
        readTime: "2 min",
        body: [
          { type: "p", text: "Use DataCard to wrap any content that needs the standard panel style. Pass flush to remove inner padding for tables." },
        ],
      },
      {
        slug: "data-table",
        title: "DataTable",
        summary: "Sortable, selectable, paginated table with row actions.",
        readTime: "5 min",
        body: [
          { type: "p", text: "DataTable<T> takes columns and data. It handles sorting, selection, bulk actions, row actions, and an optional toolbar." },
        ],
      },
      {
        slug: "empty-state",
        title: "EmptyState",
        summary: "Friendly placeholder with icon, title, and CTA.",
        readTime: "1 min",
        body: [
          { type: "p", text: "DataTable renders EmptyState automatically when there are no rows. You can also drop it into custom views." },
        ],
      },
    ],
  },
  {
    slug: "modules",
    icon: BookOpen,
    title: "Modules",
    description: "Pre-built domain modules you can adapt.",
    articles: [
      { slug: "ecommerce", title: "eCommerce", summary: "Catalog, orders, customers, and reports.", readTime: "4 min", body: [{ type: "p", text: "Catalog management, order pipeline, customer 360, and report layouts ready to wire to a real backend." }] },
      { slug: "real-estate", title: "Real estate", summary: "Listings, agents, deals, and analytics.", readTime: "4 min", body: [{ type: "p", text: "Listing inventory, agent profiles, deal pipeline, and market analytics." }] },
      { slug: "logistics", title: "Logistics", summary: "Fleet, shipments, and warehouses.", readTime: "4 min", body: [{ type: "p", text: "Fleet utilization, shipment tracking, and warehouse capacity dashboards." }] },
      { slug: "academy", title: "Academy", summary: "Courses, instructors, and learners.", readTime: "4 min", body: [{ type: "p", text: "Course catalog, learner progress, and instructor management." }] },
    ],
  },
  {
    slug: "security",
    icon: ShieldCheck,
    title: "Security",
    description: "Auth, roles, and data access patterns.",
    articles: [
      {
        slug: "mock-auth",
        title: "Mock auth",
        summary: "Demo authentication for the mock backend.",
        readTime: "3 min",
        body: [
          { type: "p", text: "use-auth provides a simple sign-in flow against the mock user store. Replace it with your real provider when you integrate a backend." },
        ],
      },
      {
        slug: "roles-and-permissions",
        title: "Roles & permissions",
        summary: "Permission matrix and role-based gating.",
        readTime: "4 min",
        body: [
          { type: "p", text: "Roles map to permission keys defined in features/roles/permissions.ts. ProtectedRoute checks the active user's role on every navigation." },
          { type: "callout", tone: "warning", title: "Production reminder", text: "When you connect a real database, store roles in a separate table and check them server-side — never trust the client." },
        ],
      },
      {
        slug: "rls-patterns",
        title: "RLS patterns",
        summary: "Row-Level Security recipes for Postgres.",
        readTime: "5 min",
        body: [
          { type: "p", text: "When you wire to Lovable Cloud, define a has_role() security definer function and use it in your RLS policies to avoid recursion." },
        ],
      },
    ],
  },
];

export function findArticle(sectionSlug: string, articleSlug: string) {
  const section = DOC_SECTIONS.find((s) => s.slug === sectionSlug);
  const article = section?.articles.find((a) => a.slug === articleSlug);
  if (!section || !article) return null;
  return { section, article };
}