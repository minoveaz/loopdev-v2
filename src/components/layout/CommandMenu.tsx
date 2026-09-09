import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Sparkles,
  BarChart3,
  Palette,
  UserCircle,
  FileCode,
  Users,
  FolderKanban,
  ShoppingCart,
  Package,
  Receipt,
  Settings,
  ArrowRight,
  LifeBuoy,
  FileText,
  Layers,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { navigation } from "@/app/navigation";
import {
  mockUsers,
  mockProjects,
  mockOrders,
  mockProducts,
  mockInvoices,
  mockTickets,
} from "@/template/rivera/data";
import type { NavNode } from "@/app/nav-types";

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type RouteGroup =
  | "Dashboards"
  | "Applications"
  | "Management"
  | "Reports"
  | "Settings"
  | "Pages";

const GROUP_ORDER: RouteGroup[] = [
  "Dashboards",
  "Applications",
  "Management",
  "Reports",
  "Settings",
  "Pages",
];

const GROUP_ICON: Record<RouteGroup, typeof LayoutDashboard> = {
  Dashboards: LayoutDashboard,
  Applications: Sparkles,
  Management: Briefcase,
  Reports: BarChart3,
  Settings: Settings,
  Pages: FileCode,
};

/** Classify a route path into one of the global command-menu groups. */
function classifyRoute(to: string): RouteGroup {
  if (to.includes("/dashboard") || to.startsWith("/dashboards")) return "Dashboards";
  if (to.includes("/settings")) return "Settings";
  if (to.includes("/reports") || to.startsWith("/reports")) return "Reports";
  if (
    to.startsWith("/apps") ||
    to.startsWith("/ui-kit") ||
    to.startsWith("/components") ||
    to.startsWith("/email-templates") ||
    to.startsWith("/pos/checkout")
  )
    return "Applications";
  if (
    to.startsWith("/ecommerce") ||
    to.startsWith("/management") ||
    to.startsWith("/user-management") ||
    to.startsWith("/helpdesk") ||
    to.startsWith("/projects") ||
    to.startsWith("/marketing") ||
    to.startsWith("/academy") ||
    to.startsWith("/blogs") ||
    to.startsWith("/subscription") ||
    to.startsWith("/logistics") ||
    to.startsWith("/real-estate") ||
    to.startsWith("/nft") ||
    to.startsWith("/pos")
  )
    return "Management";
  return "Pages";
}

interface FlatRoute {
  label: string;
  to: string;
  breadcrumb: string;
  group: RouteGroup;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (to: string) => {
    onOpenChange(false);
    navigate(to);
  };

  /** Flatten the entire navigation tree into routable leaves with breadcrumb context. */
  const allRoutes = useMemo<FlatRoute[]>(() => {
    const out: FlatRoute[] = [];
    const walk = (nodes: NavNode[], trail: string[]) => {
      for (const n of nodes) {
        const nextTrail = [...trail, n.label];
        if (n.to) {
          out.push({
            label: n.label,
            to: n.to,
            breadcrumb: trail.join(" › "),
            group: classifyRoute(n.to),
          });
        }
        if (n.children?.length) walk(n.children, nextTrail);
      }
    };
    for (const section of navigation) walk(section.items, [section.label]);
    return out;
  }, []);

  const q = query.trim().toLowerCase();
  const hasQuery = q.length > 0;
  /** Cap visible results per group: more when actively searching, fewer when idle. */
  const sliceLimit = hasQuery ? 8 : 5;

  const groupedRoutes = useMemo(() => {
    const filtered = hasQuery
      ? allRoutes.filter(
          (r) =>
            r.label.toLowerCase().includes(q) ||
            r.to.toLowerCase().includes(q) ||
            r.breadcrumb.toLowerCase().includes(q),
        )
      : allRoutes;
    const map = new Map<RouteGroup, FlatRoute[]>();
    for (const g of GROUP_ORDER) map.set(g, []);
    for (const r of filtered) map.get(r.group)!.push(r);
    return GROUP_ORDER.map((g) => ({ group: g, items: map.get(g)!.slice(0, sliceLimit) }));
  }, [allRoutes, q, hasQuery, sliceLimit]);

  const matchedUsers = useMemo(
    () =>
      (hasQuery
        ? mockUsers.filter(
            (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
          )
        : mockUsers
      ).slice(0, sliceLimit),
    [q, hasQuery, sliceLimit],
  );

  const matchedProjects = useMemo(
    () =>
      (hasQuery
        ? mockProjects.filter(
            (p) => p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q),
          )
        : mockProjects
      ).slice(0, sliceLimit),
    [q, hasQuery, sliceLimit],
  );

  const matchedOrders = useMemo(
    () =>
      (hasQuery
        ? mockOrders.filter(
            (o) =>
              o.reference.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q),
          )
        : mockOrders
      ).slice(0, sliceLimit),
    [q, hasQuery, sliceLimit],
  );

  const matchedProducts = useMemo(
    () =>
      (hasQuery
        ? mockProducts.filter(
            (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
          )
        : mockProducts
      ).slice(0, sliceLimit),
    [q, hasQuery, sliceLimit],
  );

  const matchedInvoices = useMemo(
    () =>
      (hasQuery
        ? mockInvoices.filter(
            (i) =>
              i.number.toLowerCase().includes(q) ||
              i.customer.toLowerCase().includes(q),
          )
        : mockInvoices
      ).slice(0, sliceLimit),
    [q, hasQuery, sliceLimit],
  );

  const matchedTickets = useMemo(
    () =>
      (hasQuery
        ? mockTickets.filter(
            (t) =>
              t.reference.toLowerCase().includes(q) ||
              t.subject.toLowerCase().includes(q) ||
              t.requester.toLowerCase().includes(q),
          )
        : mockTickets
      ).slice(0, sliceLimit),
    [q, hasQuery, sliceLimit],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search pages, users, projects, orders, products, tickets…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted ring-1 ring-inset ring-border">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium text-foreground">No results found</p>
            <p className="text-xs text-muted-foreground">Try a different search term</p>
          </div>
        </CommandEmpty>

        {groupedRoutes.map(({ group, items }) =>
          items.length === 0 ? null : (
            <CommandGroup key={group} heading={group}>
              {items.map((item) => {
                const Icon = GROUP_ICON[group] ?? ArrowRight;
                return (
                  <CommandItem
                    key={item.to}
                    value={`${group} ${item.breadcrumb} ${item.label} ${item.to}`}
                    onSelect={() => go(item.to)}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/70 text-muted-foreground ring-1 ring-inset ring-border/60">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-[13.5px] font-medium text-foreground">{item.label}</span>
                      {item.breadcrumb && (
                        <span className="truncate text-[11px] text-muted-foreground">
                          {item.breadcrumb}
                        </span>
                      )}
                    </span>
                    <ArrowRight className="ms-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ),
        )}

        <CommandSeparator />

        {matchedUsers.length > 0 && (
          <CommandGroup heading="Users">
            {matchedUsers.map((u) => (
              <CommandItem
                key={u.id}
                value={`user ${u.name} ${u.email}`}
                onSelect={() => go("/management/users")}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/70 text-muted-foreground ring-1 ring-inset ring-border/60">
                  <Users className="h-3.5 w-3.5" />
                </span>
                <span className="truncate text-[13.5px] font-medium text-foreground">{u.name}</span>
                <span className="ms-auto truncate text-xs text-muted-foreground">{u.email}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {matchedProjects.length > 0 && (
          <CommandGroup heading="Projects">
            {matchedProjects.map((p) => (
              <CommandItem
                key={p.id}
                value={`project ${p.name} ${p.client}`}
                onSelect={() => go("/management/projects")}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/70 text-muted-foreground ring-1 ring-inset ring-border/60">
                  <FolderKanban className="h-3.5 w-3.5" />
                </span>
                <span className="truncate text-[13.5px] font-medium text-foreground">{p.name}</span>
                <span className="ms-auto truncate text-xs text-muted-foreground">{p.client}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {matchedOrders.length > 0 && (
          <CommandGroup heading="Orders">
            {matchedOrders.map((o) => (
              <CommandItem
                key={o.id}
                value={`order ${o.reference} ${o.customer}`}
                onSelect={() => go("/management/orders")}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/70 text-muted-foreground ring-1 ring-inset ring-border/60">
                  <ShoppingCart className="h-3.5 w-3.5" />
                </span>
                <span className="truncate font-mono text-[13px] font-medium text-foreground">{o.reference}</span>
                <span className="ms-auto truncate text-xs text-muted-foreground">{o.customer}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {matchedProducts.length > 0 && (
          <CommandGroup heading="Products">
            {matchedProducts.map((p) => (
              <CommandItem
                key={p.id}
                value={`product ${p.name} ${p.sku}`}
                onSelect={() => go("/management/products")}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/70 text-muted-foreground ring-1 ring-inset ring-border/60">
                  <Package className="h-3.5 w-3.5" />
                </span>
                <span className="truncate text-[13.5px] font-medium text-foreground">{p.name}</span>
                <span className="ms-auto truncate font-mono text-xs text-muted-foreground">{p.sku}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {matchedInvoices.length > 0 && (
          <CommandGroup heading="Invoices">
            {matchedInvoices.map((i) => (
              <CommandItem
                key={i.id}
                value={`invoice ${i.number} ${i.customer}`}
                onSelect={() => go("/management/invoices")}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/70 text-muted-foreground ring-1 ring-inset ring-border/60">
                  <Receipt className="h-3.5 w-3.5" />
                </span>
                <span className="truncate font-mono text-[13px] font-medium text-foreground">{i.number}</span>
                <span className="ms-auto truncate text-xs text-muted-foreground">{i.customer}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {matchedTickets.length > 0 && (
          <CommandGroup heading="Tickets">
            {matchedTickets.map((t) => (
              <CommandItem
                key={t.id}
                value={`ticket ${t.reference} ${t.subject} ${t.requester}`}
                onSelect={() => go("/helpdesk/tickets")}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/70 text-muted-foreground ring-1 ring-inset ring-border/60">
                  <LifeBuoy className="h-3.5 w-3.5" />
                </span>
                <span className="truncate font-mono text-[13px] font-medium text-foreground">{t.reference}</span>
                <span className="ms-auto truncate text-xs text-muted-foreground">{t.subject}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Quick actions">
          {[
            { v: "settings general", to: "/account/settings", icon: Settings, label: "Open settings" },
            { v: "profile account", to: "/account/profile", icon: UserCircle, label: "View profile" },
            { v: "reports activity", to: "/reports/activity", icon: BarChart3, label: "Activity logs" },
            { v: "pages 404 errors", to: "/pages/404", icon: FileCode, label: "Sample pages" },
            { v: "ui kit components", to: "/ui-kit/buttons", icon: Sparkles, label: "Browse UI kit" },
          ].map(({ v, to, icon: Icon, label }) => (
            <CommandItem key={v} value={v} onSelect={() => go(to)}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary ring-1 ring-inset ring-primary/20">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="text-[13.5px] font-medium text-foreground">{label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border/70 bg-card px-1 font-mono text-[10px] font-medium">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border/70 bg-card px-1 font-mono text-[10px] font-medium">↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border/70 bg-card px-1 font-mono text-[10px] font-medium">Esc</kbd>
            Close
          </span>
        </div>
        <span className="hidden items-center gap-1 sm:flex">
          <span>Open with</span>
          <kbd className="inline-flex h-5 items-center gap-0.5 rounded border border-border/70 bg-card px-1 font-mono text-[10px] font-medium">⌘K</kbd>
        </span>
      </div>
    </CommandDialog>
  );
}