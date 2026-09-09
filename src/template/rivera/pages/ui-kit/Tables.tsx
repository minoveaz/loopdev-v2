import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataCard, PageContainer, PageHeader, StatusBadge, TablePagination, type StatusTone } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Showcase } from "@/template/rivera/features/ui-kit/Showcase";
import { formatCurrency, getInitials } from "@/lib/formatters";

const orderStatus: Record<string, StatusTone> = {
  paid: "success",
  pending: "warning",
  refunded: "neutral",
  failed: "destructive",
};

const rows = [
  { id: "ORD-30418", customer: "Aurora Studio",   email: "billing@aurora.studio",   amount: 1240, status: "paid" },
  { id: "ORD-30417", customer: "Northwind Co.",   email: "ap@northwind.co",         amount:  890, status: "pending" },
  { id: "ORD-30416", customer: "Atlas Rebrand",   email: "team@atlas.design",       amount: 3120, status: "paid" },
  { id: "ORD-30415", customer: "Driftwood Ltd.",  email: "hello@driftwood.io",      amount:  540, status: "failed" },
  { id: "ORD-30414", customer: "Sage Editorial",  email: "billing@sage.press",      amount: 2080, status: "paid" },
  { id: "ORD-30413", customer: "Coastline Brand", email: "ap@coastline.co",         amount:  720, status: "refunded" },
];

export default function TablesPage() {
  const { trail } = useBreadcrumbs();

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="UI Kit"
        title="Tables"
        description="Data tables with selection, status badges, sorting affordances, and pagination."
        breadcrumbs={trail.length ? trail : [{ label: "UI Kit" }, { label: "Tables" }]}
      />

      <div className="space-y-6">
        <Showcase title="Data table" description="Selection, sorting, status badges, row actions" hint="full" bodyClassName="p-0">
          <DataCard flush borderless className="border-0 shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="w-10 px-5 py-3"><Checkbox aria-label="Select all" /></th>
                    <th className="px-5 py-3 font-medium">
                      <button className="inline-flex items-center gap-1 hover:text-foreground">
                        Order <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">
                      <button className="inline-flex items-center gap-1 hover:text-foreground">
                        Amount <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="w-10 px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((r) => (
                    <tr key={r.id} className="transition-fast hover:bg-muted/50">
                      <td className="px-5 py-3"><Checkbox aria-label={`Select ${r.id}`} /></td>
                      <td className="px-5 py-3 font-mono text-xs text-foreground">{r.id}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border border-border">
                            <AvatarFallback className="bg-primary-soft text-[11px] text-primary">{getInitials(r.customer)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{r.customer}</div>
                            <div className="text-xs text-muted-foreground">{r.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge tone={orderStatus[r.status] ?? "neutral"} dot>{r.status}</StatusBadge>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium text-foreground">{formatCurrency(r.amount)}</td>
                      <td className="px-5 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View order</DropdownMenuItem>
                            <DropdownMenuItem>Mark as paid</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">Refund</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination page={1} pageCount={4} pageSize={10} total={36} onPageChange={() => {}} />
          </DataCard>
        </Showcase>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Showcase title="Compact table" description="Dense rows for sidebars" hint="compact">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {rows.slice(0, 4).map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 text-muted-foreground">{r.id}</td>
                    <td className="py-2 text-foreground">{r.customer}</td>
                    <td className="py-2 text-right tabular-nums text-foreground">{formatCurrency(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Showcase>

          <Showcase title="Empty state" description="Inline placeholder when no data is available" hint="empty">
            <div className="rounded-xl border border-dashed border-border bg-card-muted p-8 text-center">
              <p className="font-display text-lg font-semibold text-foreground">No records found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or import data to get started.</p>
              <Button size="sm" className="mt-4">Import data</Button>
            </div>
          </Showcase>
        </div>
      </div>
    </PageContainer>
  );
}