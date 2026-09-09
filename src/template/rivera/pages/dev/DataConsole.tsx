import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  PageHeader,
  PageContainer,
  DataCard,
  StatusBadge,
  EmptyState,
  TablePagination,
  SearchInput,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  usersStore,
  rolesStore,
  projectsStore,
  tasksStore,
  ordersStore,
  productsStore,
  invoicesStore,
  notificationsStore,
  messagesStore,
  activityStore,
  calendarStore,
  filesStore,
} from "@/template/rivera/data";
import type { LocalStore } from "@/lib/localStore";
import type { Entity } from "@/types";
import { useLocalStore } from "@/lib/localStore";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Store registry — every entry is browsable in the console.          */
/* ------------------------------------------------------------------ */

interface StoreEntry {
  key: string;
  label: string;
  store: LocalStore<Entity>;
}

/* The cast to `LocalStore<Entity>` is safe here: the console only inspects
 * shared `Entity` fields and treats per-store columns dynamically. */
const STORES: StoreEntry[] = [
  { key: "users", label: "Users", store: usersStore as unknown as LocalStore<Entity> },
  { key: "roles", label: "Roles", store: rolesStore as unknown as LocalStore<Entity> },
  { key: "projects", label: "Projects", store: projectsStore as unknown as LocalStore<Entity> },
  { key: "tasks", label: "Tasks", store: tasksStore as unknown as LocalStore<Entity> },
  { key: "orders", label: "Orders", store: ordersStore as unknown as LocalStore<Entity> },
  { key: "products", label: "Products", store: productsStore as unknown as LocalStore<Entity> },
  { key: "invoices", label: "Invoices", store: invoicesStore as unknown as LocalStore<Entity> },
  { key: "notifications", label: "Notifications", store: notificationsStore as unknown as LocalStore<Entity> },
  { key: "messages", label: "Messages", store: messagesStore as unknown as LocalStore<Entity> },
  { key: "activity", label: "Activity", store: activityStore as unknown as LocalStore<Entity> },
  { key: "calendar", label: "Calendar Events", store: calendarStore as unknown as LocalStore<Entity> },
  { key: "files", label: "Files", store: filesStore as unknown as LocalStore<Entity> },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const SORT_DIRS = ["asc", "desc"] as const;

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Collect the union of keys across a sample of records. */
function collectKeys(items: readonly Entity[]): string[] {
  const keys = new Set<string>();
  for (const item of items.slice(0, 50)) {
    Object.keys(item as unknown as Record<string, unknown>).forEach((k) => keys.add(k));
  }
  return Array.from(keys);
}

/** Render an arbitrary cell value as a compact, readable string. */
function renderCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    // Trim ISO timestamps to date+minute for readability.
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 16).replace("T", " ");
    return value.length > 80 ? value.slice(0, 77) + "…" : value;
  }
  if (Array.isArray(value)) return value.length === 0 ? "[]" : `[${value.length}]`;
  try {
    const s = JSON.stringify(value);
    return s.length > 80 ? s.slice(0, 77) + "…" : s;
  } catch {
    return String(value);
  }
}

/** Coerce a string filter input into the most likely value type. */
function coerce(raw: string): unknown {
  const v = raw.trim();
  if (v === "") return "";
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

interface FilterRow {
  id: string;
  key: string;
  value: string;
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function DataConsole() {
  const [storeKey, setStoreKey] = useState<string>(STORES[0].key);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterRow[]>([]);
  const [sortKey, setSortKey] = useState<string>("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [resetOpen, setResetOpen] = useState(false);

  const entry = useMemo(() => STORES.find((s) => s.key === storeKey) ?? STORES[0], [storeKey]);

  // Subscribe to live updates so external mutations refresh the console.
  const liveItems = useLocalStore(entry.store);

  // Discover available keys for the current store from real data.
  const allKeys = useMemo(() => collectKeys(liveItems), [liveItems]);

  // Reset page-related state when switching stores.
  useEffect(() => {
    setPage(1);
    setSearch("");
    setFilters([]);
    setSortKey(allKeys.includes("updatedAt") ? "updatedAt" : (allKeys[0] ?? "id"));
  }, [storeKey, allKeys]);

  // Reset to page 1 when filter signature changes.
  useEffect(() => {
    setPage(1);
  }, [search, sortKey, sortDir, pageSize, filters]);

  // Build QueryOptions from the form state.
  const result = useMemo(() => {
    const filterMap: Record<string, unknown> = {};
    for (const f of filters) {
      if (!f.key) continue;
      const v = coerce(f.value);
      if (v === "") continue;
      filterMap[f.key] = v;
    }
    return entry.store.query({
      search: search || undefined,
      filters: Object.keys(filterMap).length
        ? (filterMap as unknown as Partial<Record<keyof Entity, unknown>>)
        : undefined,
      sort: sortKey ? { key: sortKey as keyof Entity, direction: sortDir } : undefined,
      page,
      pageSize,
    });
    // `liveItems` participates in the dependency list to refresh on store mutation.
  }, [entry, search, filters, sortKey, sortDir, page, pageSize, liveItems]);

  /* ----- Filter row management ----- */
  const addFilter = () =>
    setFilters((prev) => [...prev, { id: crypto.randomUUID(), key: allKeys[0] ?? "", value: "" }]);
  const updateFilter = (id: string, patch: Partial<FilterRow>) =>
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const removeFilter = (id: string) => setFilters((prev) => prev.filter((f) => f.id !== id));
  const clearAll = () => {
    setSearch("");
    setFilters([]);
    toast("Cleared", { description: "Search and filters reset." });
  };

  /* ----- Reset store (seed data) ----- */
  const resetStore = () => {
    entry.store.reset();
    setResetOpen(false);
    toast.success(`Reset ${entry.label}`, { description: "Store restored to seed data." });
  };

  /* ----- Columns: pick a sensible subset, always include id + updatedAt last ----- */
  const columns = useMemo(() => {
    if (allKeys.length === 0) return [];
    const preferred = ["id", "name", "title", "label", "reference", "number"];
    const head = preferred.filter((k) => allKeys.includes(k));
    const rest = allKeys.filter((k) => !head.includes(k) && !["createdAt", "updatedAt"].includes(k));
    const tail = ["updatedAt"].filter((k) => allKeys.includes(k));
    return [...head, ...rest, ...tail].slice(0, 8);
  }, [allKeys]);

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Data Console"
        description="Run search, filters, sorting, and pagination against any mock store. Results update live."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={clearAll} disabled={!search && filters.length === 0}>
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Reset store
            </Button>
          </>
        }
      />

      <DataCard
        title="Query"
        description={`Inspecting ${liveItems.length} record${liveItems.length === 1 ? "" : "s"} in localStorage`}
      >
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Store picker */}
          <div className="space-y-1.5 lg:col-span-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Store</Label>
            <Select value={storeKey} onValueChange={setStoreKey}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STORES.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-1.5 lg:col-span-5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Search</Label>
            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search across all string fields…"
            />
          </div>

          {/* Sort key */}
          <div className="space-y-1.5 lg:col-span-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sort by</Label>
            <Select value={sortKey} onValueChange={setSortKey}>
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {allKeys.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort direction */}
          <div className="space-y-1.5 lg:col-span-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Direction</Label>
            <Select value={sortDir} onValueChange={(v) => setSortDir(v as "asc" | "desc")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_DIRS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 surface-card-muted-compact p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Filters</p>
              <p className="text-xs text-muted-foreground">
                Equality match. Numbers, <span className="font-mono">true</span>, <span className="font-mono">false</span>, and <span className="font-mono">null</span> are auto-coerced.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={addFilter}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add filter
            </Button>
          </div>

          {filters.length === 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">No filters applied.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {filters.map((f) => (
                <div key={f.id} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-12">
                  <Select value={f.key} onValueChange={(v) => updateFilter(f.id, { key: v })}>
                    <SelectTrigger className="sm:col-span-4">
                      <SelectValue placeholder="Key" />
                    </SelectTrigger>
                    <SelectContent>
                      {allKeys.map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={f.value}
                    onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                    placeholder="Value (e.g. paid, 12, true)"
                    className="sm:col-span-7"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFilter(f.id)}
                    aria-label="Remove filter"
                    className="sm:col-span-1"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DataCard>

      {/* Results */}
      <DataCard
        title="Results"
        description={`${result.total} match${result.total === 1 ? "" : "es"} · page ${result.page} of ${result.pageCount}`}
        flush
      >
        {result.items.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching records"
            description="Adjust the search, filters, or pick a different store."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c}
                      className={cn(
                        "cursor-pointer px-4 py-3 font-medium transition-fast hover:text-foreground",
                        sortKey === c && "text-foreground",
                      )}
                      onClick={() => {
                        if (sortKey === c) setSortDir(sortDir === "asc" ? "desc" : "asc");
                        else {
                          setSortKey(c);
                          setSortDir("asc");
                        }
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c}
                        {sortKey === c && (
                          <span className="font-mono text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.items.map((row) => {
                  const r = row as unknown as Record<string, unknown>;
                  return (
                    <tr key={String(r.id)} className="transition-fast hover:bg-muted/50">
                      {columns.map((c) => (
                        <td key={c} className="px-4 py-3 align-top text-foreground">
                          {c === "status" || c === "priority" ? (
                            <StatusBadge tone="neutral">{renderCell(r[c])}</StatusBadge>
                          ) : (
                            <span className={cn("tabular-nums", c === "id" && "font-mono text-xs text-muted-foreground")}>
                              {renderCell(r[c])}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <TablePagination
          page={result.page}
          pageCount={result.pageCount}
          pageSize={result.pageSize}
          total={result.total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          pageSizes={PAGE_SIZE_OPTIONS}
        />
      </DataCard>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={`Reset ${entry.label}?`}
        description="This restores the store to its original seed data. Any local changes will be lost."
        confirmLabel="Reset store"
        tone="destructive"
        onConfirm={resetStore}
      />
    </PageContainer>
  );
}