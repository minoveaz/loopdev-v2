import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizes?: number[];
}

export function TablePagination({
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizes = [10, 25, 50],
}: Props) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center justify-between gap-3 border-t border-border bg-card-muted/50 px-4 py-2.5 text-xs text-muted-foreground sm:flex-row"
    >
      <span className="tabular-nums">
        Showing <span className="font-semibold text-foreground">{start}–{end}</span> of{" "}
        <span className="font-semibold text-foreground">{total.toLocaleString()}</span>
      </span>
      <div className="flex items-center gap-4">
        {onPageSizeChange && (
          <label className="flex items-center gap-2">
            <span className="text-muted-foreground">Rows per page</span>
            <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
              <SelectTrigger aria-label="Rows per page" className="h-7 w-16 bg-card px-2 text-xs font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizes.map((s) => <SelectItem key={s} value={String(s)}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
        )}
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 shadow-[0_1px_2px_0_hsl(var(--foreground)/0.04)]">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            disabled={page <= 1}
            onClick={() => onPageChange(1)}
            aria-label="First page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span
            className="px-2 tabular-nums text-foreground"
            aria-live="polite"
          >
            Page <span className="font-semibold">{page}</span> of {pageCount}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            disabled={page >= pageCount}
            onClick={() => onPageChange(pageCount)}
            aria-label="Last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}