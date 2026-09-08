import { type ReactNode, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "./EmptyState";
import { TablePagination } from "./TablePagination";
import { TableSkeleton } from "./TableSkeleton";

/**
 * Column definition for {@link DataTable}.
 *
 * @template T row type
 */
export interface DataTableColumn<T> {
  /** Stable identifier; doubles as the sort key when `sortable` is true unless {@link sortAccessor} is provided. */
  key: string;
  /** Header label or custom React node. */
  header: ReactNode;
  /** Cell renderer — receives the row. */
  cell: (row: T) => ReactNode;
  /** Mark this column sortable. */
  sortable?: boolean;
  /** Optional cell width / Tailwind classes for the `<td>` and `<th>`. */
  className?: string;
  /** Right-align numbers / actions. */
  align?: "left" | "right" | "center";
  /** Hide on small screens (table becomes horizontally scrollable). */
  hideOnMobile?: boolean;
  /** Custom comparator — return positive/negative/zero like `Array.sort`. */
  sortAccessor?: (row: T) => string | number | Date | null | undefined;
}

export interface DataTableAction<T> {
  label: string;
  icon?: LucideIcon;
  onClick: (row: T) => void;
  /** Mark as destructive (red text). */
  destructive?: boolean;
  /** Show separator above this item. */
  separator?: boolean;
  /** Hide for specific rows. */
  hidden?: (row: T) => boolean;
}

export interface BulkAction<T> {
  label: string;
  icon?: LucideIcon;
  onClick: (rows: T[]) => void;
  destructive?: boolean;
}

export interface DataTableProps<T extends { id: string }> {
  /** Full filtered dataset. The component handles sorting + pagination internally. */
  data: T[];
  columns: DataTableColumn<T>[];
  /** Per-row dropdown actions; renders trailing actions column when set. */
  rowActions?: DataTableAction<T>[];
  /** Bulk actions activate the selection checkbox column. */
  bulkActions?: BulkAction<T>[];
  /** Toolbar contents (search, filters, "Add" button). */
  toolbar?: ReactNode;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyAction?: ReactNode;
  /** Default sort. */
  initialSort?: { key: string; dir: "asc" | "desc" };
  /** Initial page size. */
  initialPageSize?: number;
  /** Available page size options in the footer. */
  pageSizes?: number[];
  /** Optional row click handler — does not fire when interacting with checkboxes / actions. */
  onRowClick?: (row: T) => void;
  /** Hide the pagination footer (useful for very small tables). */
  hidePagination?: boolean;
  /** Row density. "compact" is the new Rivera default. */
  density?: "compact" | "comfortable";
  /** Stripe alternating rows for very dense, scannable lists. */
  striped?: boolean;
  className?: string;
}

/**
 * Reusable, frontend-only table for the Rivera admin.
 *
 * Features:
 * - Sorting (click headers, with accessible icon affordance)
 * - Pagination with page-size picker
 * - Row dropdown actions
 * - Bulk selection + bulk action bar
 * - Loading skeleton, empty state
 * - Mobile-responsive (horizontal scroll + per-column `hideOnMobile`)
 */
export function DataTable<T extends { id: string }>({
  data,
  columns,
  rowActions,
  bulkActions,
  toolbar,
  loading = false,
  emptyTitle = "No results",
  emptyDescription = "Try adjusting your search or filters.",
  emptyIcon,
  emptyAction,
  initialSort,
  initialPageSize = 10,
  pageSizes = [10, 25, 50, 100],
  onRowClick,
  hidePagination = false,
  density = "compact",
  striped = false,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(initialSort?.key ?? null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSort?.dir ?? "asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const colByKey = useMemo(() => {
    const m = new Map<string, DataTableColumn<T>>();
    columns.forEach((c) => m.set(c.key, c));
    return m;
  }, [columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const col = colByKey.get(sortKey);
    if (!col) return data;
    const dir = sortDir === "asc" ? 1 : -1;
    const acc = col.sortAccessor ?? ((r: T) => (r as Record<string, unknown>)[sortKey] as string | number);
    return [...data].sort((a, b) => {
      const av = acc(a);
      const bv = acc(b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      if (av instanceof Date && bv instanceof Date) return (av.getTime() - bv.getTime()) * dir;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
    });
  }, [data, sortKey, sortDir, colByKey]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const pageRows = hidePagination ? sorted : sorted.slice(start, start + pageSize);

  const showBulk = !!bulkActions?.length;
  const allSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));
  const someSelected = pageRows.some((r) => selected.has(r.id)) && !allSelected;
  const selectedRows = useMemo(() => sorted.filter((r) => selected.has(r.id)), [sorted, selected]);

  const toggleSort = (col: DataTableColumn<T>) => {
    if (!col.sortable) return;
    if (sortKey === col.key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  };

  const togglePageSelection = (checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) pageRows.forEach((r) => next.add(r.id));
      else pageRows.forEach((r) => next.delete(r.id));
      return next;
    });
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const colCount =
    columns.length + (showBulk ? 1 : 0) + (rowActions?.length ? 1 : 0);

  const alignClass = (a?: "left" | "right" | "center") =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  const rowPad = density === "compact" ? "px-4 py-2.5" : "px-4 py-3.5";
  const headPad = density === "compact" ? "px-4 py-2.5" : "px-4 py-3";

  return (
    <div className={cn("flex flex-col", className)}>
      {(toolbar || (showBulk && selected.size > 0)) && (
        <div
          className={cn(
            "flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
            showBulk && selected.size > 0
              ? "bg-primary-soft/40"
              : "bg-card-muted/40",
          )}
        >
          {showBulk && selected.size > 0 ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {selected.size} selected
                </span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground transition-fast hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {bulkActions!.map((a) => {
                  const Icon = a.icon;
                  return (
                    <Button
                      key={a.label}
                      size="sm"
                      variant={a.destructive ? "destructive" : "outline"}
                      onClick={() => {
                        a.onClick(selectedRows);
                      }}
                      className="h-8 gap-1.5"
                    >
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {a.label}
                    </Button>
                  );
                })}
              </div>
            </>
          ) : (
            toolbar
          )}
        </div>
      )}

      {loading ? (
        <div className="p-6">
          <TableSkeleton rows={pageSize > 10 ? 8 : 6} columns={Math.min(columns.length || 5, 6)} />
        </div>
      ) : pageRows.length === 0 ? (
        <div className="p-8">
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
            variant="plain"
          />
        </div>
      ) : (
        <div className="overflow-x-auto -mx-px">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-card-muted/60 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                {showBulk && (
                  <th className={cn("w-10", headPad)}>
                    <Checkbox
                      aria-label="Select page"
                      checked={allSelected ? true : someSelected ? "indeterminate" : false}
                      onCheckedChange={(v) => togglePageSelection(!!v)}
                    />
                  </th>
                )}
                {columns.map((c) => {
                  const active = sortKey === c.key;
                  return (
                    <th
                      key={c.key}
                      className={cn(
                        headPad,
                        alignClass(c.align),
                        c.hideOnMobile && "hidden md:table-cell",
                        c.className,
                      )}
                    >
                      {c.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(c)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md transition-fast hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                            active && "text-foreground",
                            c.align === "right" && "ml-auto",
                          )}
                          aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                        >
                          {c.header}
                          {!active ? (
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          ) : sortDir === "asc" ? (
                            <ArrowUp className="h-3 w-3 text-primary" />
                          ) : (
                            <ArrowDown className="h-3 w-3 text-primary" />
                          )}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
                {rowActions?.length ? (
                  <th className={cn("w-12 text-right", headPad)}>
                    <span className="sr-only">Actions</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((row, idx) => {
                const isSelected = selected.has(row.id);
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "group/row transition-fast",
                      onRowClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset",
                      isSelected
                        ? "bg-primary-soft/40 hover:bg-primary-soft/50"
                        : striped && idx % 2 === 1
                          ? "bg-card-muted/30 hover:bg-muted/50"
                          : "hover:bg-muted/40",
                    )}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "button" : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                  >
                    {showBulk && (
                      <td className={rowPad} onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          aria-label="Select row"
                          checked={isSelected}
                          onCheckedChange={(v) => toggleRow(row.id, !!v)}
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          rowPad,
                          "align-middle text-foreground/90",
                          alignClass(c.align),
                          c.hideOnMobile && "hidden md:table-cell",
                          c.className,
                        )}
                      >
                        {c.cell(row)}
                      </td>
                    ))}
                    {rowActions?.length ? (
                      <td
                        className={cn(rowPad, "text-right")}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg text-muted-foreground opacity-70 transition-fast hover:bg-muted hover:text-foreground hover:opacity-100 focus-visible:opacity-100 group-hover/row:opacity-100 data-[state=open]:bg-muted data-[state=open]:text-foreground data-[state=open]:opacity-100"
                              aria-label="Row actions"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" sideOffset={4} className="w-48">
                            {rowActions.map((a, i) => {
                              if (a.hidden?.(row)) return null;
                              const Icon = a.icon;
                              return (
                                <div key={a.label}>
                                  {a.separator && i > 0 && <DropdownMenuSeparator />}
                                  <DropdownMenuItem
                                    onClick={() => a.onClick(row)}
                                    className={cn(
                                      "gap-2 text-sm",
                                      a.destructive && "text-destructive focus:text-destructive",
                                    )}
                                  >
                                    {Icon && <Icon className="h-4 w-4" />}
                                    {a.label}
                                  </DropdownMenuItem>
                                </div>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
            {colCount > 0 && pageRows.length === 0 && (
              <tfoot>
                <tr>
                  <td colSpan={colCount} className="py-8 text-center text-sm text-muted-foreground">
                    No data
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {!hidePagination && !loading && pageRows.length > 0 && (
        <TablePagination
          page={safePage}
          pageCount={pageCount}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          pageSizes={pageSizes}
        />
      )}
    </div>
  );
}