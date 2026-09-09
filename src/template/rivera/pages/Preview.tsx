import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  Command,
  DollarSign,
  Github,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Moon,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Users,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { StatCard, StatusBadge } from "@/components/common";
import { useTheme } from "@/hooks/use-theme";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Static showcase data — drives the visual mock-ups on this landing  */
/* page. Kept inline because it's not used elsewhere.                 */
/* ------------------------------------------------------------------ */

const TECH_STACK = [
  { label: "React 19", tone: "primary" },
  { label: "Vite 8", tone: "accent" },
  { label: "Tailwind CSS 4", tone: "info" },
  { label: "shadcn/ui", tone: "gold" },
  { label: "TypeScript", tone: "success" },
  { label: "Recharts", tone: "neutral" },
] as const;

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "12+ dashboard layouts",
    description: "Analytics, CRM, Ecommerce — ready to drop into your product.",
  },
  {
    icon: Palette,
    title: "Polished design system",
    description: "Semantic tokens, six status tones, editorial typography out of the box.",
  },
  {
    icon: Moon,
    title: "Light & dark mode",
    description: "Every component, chart, and surface tuned for both themes.",
  },
  {
    icon: Command,
    title: "Global command menu",
    description: "Cmd+K search across pages, users, projects, orders, and more.",
  },
  {
    icon: ShieldCheck,
    title: "Mock auth & RBAC",
    description: "Login, register, password reset and role-based UI — frontend only.",
  },
  {
    icon: Bell,
    title: "Toasts & notifications",
    description: "Sonner toasts, mark-as-read inbox, microinteractions throughout.",
  },
  {
    icon: BarChart3,
    title: "Reports & charts",
    description: "Sales, traffic, and activity logs powered by Recharts.",
  },
  {
    icon: Sparkles,
    title: "Production-ready UI kit",
    description: "Buttons, forms, tables, modals, alerts — fully documented.",
  },
  {
    icon: Lock,
    title: "100% frontend",
    description: "No backend required. Mock data + localStorage persistence.",
  },
];

const ACTIVITY = [
  { user: "Amelia Hart", action: "approved invoice INV-2026-0041", at: "2m ago", tone: "success" as const },
  { user: "Marcus Bell", action: "shipped order RV-10247", at: "14m ago", tone: "info" as const },
  { user: "Sofia Lin", action: "uploaded 3 design files", at: "38m ago", tone: "neutral" as const },
  { user: "Priya Anand", action: "flagged anomaly in revenue", at: "1h ago", tone: "warning" as const },
];

const REVENUE_BARS = [42, 58, 49, 71, 64, 82, 76, 90, 84, 96, 88, 100];

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function Preview() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Decorative mesh background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh opacity-70" aria-hidden />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[420px] w-[760px] -translate-x-1/2 rounded-full bg-gradient-primary opacity-20 blur-3xl"
        aria-hidden
      />

      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <Logo variant="light" />
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-fast hover:text-foreground">Features</a>
            <a href="#showcase" className="transition-fast hover:text-foreground">Showcase</a>
            <a href="#stack" className="transition-fast hover:text-foreground">Stack</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="Toggle theme"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground/70 transition-fast hover:border-border-strong hover:text-foreground"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              to="/pages/login"
              className="hidden h-9 items-center rounded-lg px-3 text-sm font-medium text-foreground/80 transition-fast hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground shadow-elegant transition-smooth hover:opacity-95"
            >
              Enter dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-12 md:px-8 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Rivera v1.0.0 · frontend-only admin template
          </span>
          <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            A premium admin dashboard,
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">designed with conviction.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Rivera is a polished, production-ready React template — twelve dashboards, a full
            UI kit, and an editorial visual language. No backend required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-primary px-6 text-sm font-semibold text-primary-foreground shadow-elegant transition-smooth hover:translate-y-[-1px] hover:opacity-95"
            >
              Enter the dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#showcase"
              className="inline-flex h-11 items-center gap-2 surface-card-compact px-6 text-sm font-semibold text-foreground transition-fast hover:border-border-strong hover:bg-muted"
            >
              <Sparkles className="h-4 w-4 text-accent" />
              View showcase
            </a>
          </div>

          {/* Tech stack badges */}
          <div id="stack" className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {TECH_STACK.map((s) => (
              <StatusBadge key={s.label} tone={s.tone}>
                {s.label}
              </StatusBadge>
            ))}
          </div>
        </div>

        {/* Hero dashboard mockup */}
        <div className="relative mt-14">
          <div className="absolute inset-x-12 -bottom-6 h-12 rounded-full bg-primary/20 blur-3xl" aria-hidden />
          <DashboardMockup />
        </div>
      </section>

      {/* Feature grid */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Everything you need</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Built for shipping admin UIs
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every screen, component, and microinteraction is opinionated, consistent, and ready
            for your next product.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <FeatureTile key={f.title} icon={f.icon} title={f.title} description={f.description} />
          ))}
        </div>
      </section>

      {/* Showcase cards */}
      <section id="showcase" className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Component showcase</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Real components, real polish
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every card below is rendered with the same primitives shipped in the dashboard.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ShowcaseCard label="KPI card" className="lg:col-span-1">
            <StatCard
              label="Total Revenue"
              value={formatCurrency(78650)}
              delta={12.4}
              hint="vs. last month"
              icon={DollarSign}
              accent="primary"
            />
          </ShowcaseCard>

          <ShowcaseCard label="Activity feed" className="lg:col-span-2">
            <div className="space-y-3">
              {ACTIVITY.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 surface-card-compact p-3 transition-fast hover:border-border-strong"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{a.user}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.action}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge tone={a.tone}>{a.tone}</StatusBadge>
                    <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:inline">
                      {a.at}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ShowcaseCard>

          <ShowcaseCard label="Revenue chart" className="lg:col-span-2">
            <MiniRevenueChart />
          </ShowcaseCard>

          <ShowcaseCard label="Quick stats">
            <div className="grid grid-cols-2 gap-3">
              <MiniStat icon={Users} label="Users" value={formatNumber(3284)} tone="info" />
              <MiniStat icon={ShoppingBag} label="Orders" value={formatNumber(412)} tone="gold" />
              <MiniStat icon={MessageSquare} label="Messages" value="184" tone="primary" />
              <MiniStat icon={Calendar} label="Events" value="27" tone="accent" />
            </div>
          </ShowcaseCard>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
        <div className="relative overflow-hidden rounded-xl bg-gradient-editorial p-10 shadow-elegant md:p-16">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/30 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-primary-glow/20 blur-3xl" aria-hidden />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-sidebar-accent/60 px-3 py-1 text-xs font-medium text-sidebar-foreground/80">
              <Zap className="h-3 w-3 text-accent" />
              Ready to ship
            </span>
            <h2 className="mt-5 font-display text-3xl font-semibold tracking-tight text-sidebar-foreground md:text-4xl">
              Start exploring Rivera now
            </h2>
            <p className="mt-4 max-w-lg text-sidebar-foreground/70">
              Drop into the live dashboard, browse the UI kit, and try every flow. Everything is
              fully interactive — no setup required.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-accent-foreground shadow-glow transition-smooth hover:opacity-95"
              >
                Enter dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/ui-kit/buttons"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-6 text-sm font-semibold text-sidebar-foreground transition-fast hover:bg-sidebar-accent"
              >
                Browse UI kit
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground md:flex-row md:px-8">
          <div className="flex items-center gap-3">
            <Logo variant="light" />
          </div>
          <p className="text-xs">© {new Date().getFullYear()} Rivera Admin · Frontend-only template</p>
          <div className="flex items-center gap-4">
            <a className="inline-flex items-center gap-1.5 transition-fast hover:text-foreground" href="#">
              <Github className="h-4 w-4" /> Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FeatureTile({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Activity;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden surface-card-interactive p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition-smooth group-hover:bg-gradient-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function ShowcaseCard({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden surface-card-muted-interactive p-5 shadow-soft",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          Live preview
        </span>
      </div>
      <div className="rounded-xl bg-background p-4">{children}</div>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  tone: "primary" | "accent" | "gold" | "info";
}) {
  const toneMap: Record<string, string> = {
    primary: "bg-primary-soft text-primary",
    accent: "bg-accent-soft text-accent",
    gold: "bg-gold-soft text-gold",
    info: "bg-info-soft text-info",
  };
  return (
    <div className="surface-card-compact p-3">
      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", toneMap[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

/** Tiny CSS-only bar chart — avoids pulling Recharts into the landing route. */
function MiniRevenueChart() {
  const max = Math.max(...REVENUE_BARS);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Revenue · YTD</p>
          <p className="font-display text-2xl font-semibold tabular-nums text-foreground">
            {formatCurrency(942380)}
          </p>
        </div>
        <StatusBadge tone="success">+18.2%</StatusBadge>
      </div>
      <div className="mt-5 flex h-32 items-end gap-2">
        {REVENUE_BARS.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-md bg-gradient-to-t from-primary to-primary-glow opacity-80 transition-fast hover:opacity-100"
            style={{ height: `${(v / max) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>Jan</span>
        <span>Apr</span>
        <span>Jul</span>
        <span>Oct</span>
        <span>Dec</span>
      </div>
    </div>
  );
}

/** Hero: simulated dashboard frame using actual project tokens. */
function DashboardMockup() {
  return (
    <div className="relative mx-auto max-w-6xl overflow-hidden surface-card-raised">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-card-muted px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
        <span className="ml-3 truncate font-mono text-[11px] text-muted-foreground">
          rivera.app/dashboard
        </span>
      </div>

      <div className="grid grid-cols-12">
        {/* Sidebar */}
        <aside className="col-span-12 hidden bg-sidebar p-4 text-sidebar-foreground sm:block sm:col-span-3 lg:col-span-2">
          <Logo variant="dark" />
          <ul className="mt-6 space-y-1 text-sm">
            {[
              { label: "Dashboard", icon: LayoutDashboard, active: true },
              { label: "Users", icon: Users },
              { label: "Orders", icon: ShoppingBag },
              { label: "Reports", icon: BarChart3 },
              { label: "Calendar", icon: Calendar },
            ].map((it) => (
              <li
                key={it.label}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-fast",
                  it.active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50",
                )}
              >
                <it.icon className="h-4 w-4" />
                <span>{it.label}</span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main */}
        <main className="col-span-12 p-5 sm:col-span-9 lg:col-span-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Overview
              </p>
              <h3 className="font-display text-xl font-semibold text-foreground">
                Welcome back, Amelia
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge tone="success">Live</StatusBadge>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Updated just now
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              compact
              label="Revenue"
              value={formatCurrency(78650)}
              delta={12.4}
              icon={DollarSign}
              accent="primary"
            />
            <StatCard
              compact
              label="Users"
              value={formatNumber(3284)}
              delta={4.7}
              icon={Users}
              accent="info"
            />
            <StatCard
              compact
              label="Orders"
              value={formatNumber(412)}
              delta={-2.1}
              icon={ShoppingBag}
              accent="gold"
            />
            <StatCard
              compact
              label="Conversion"
              value="3.84%"
              delta={0.6}
              icon={Activity}
              accent="success"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="surface-card-compact p-4 lg:col-span-2">
              <MiniRevenueChart />
            </div>
            <div className="surface-card-compact p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Recent activity
              </p>
              <ul className="mt-3 space-y-2.5">
                {ACTIVITY.slice(0, 3).map((a, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-foreground">{a.user}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{a.action}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}