import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Mail, Users } from "lucide-react";
import { DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge, TablePagination } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { customersStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";
import { formatCurrency, formatDate, getInitials } from "@/lib/formatters";
import type { CustomerTier } from "@/types";

const TIERS: CustomerTier[] = ["lead", "standard", "vip", "wholesale"];
const TIER_TONE: Record<CustomerTier, "neutral" | "info" | "warning" | "success"> = {
  lead: "neutral", standard: "info", vip: "warning", wholesale: "success",
};

export default function CustomersListing() {
  const { trail } = useBreadcrumbs();
  const customers = useLocalStore(customersStore);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (q && !(c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.country.toLowerCase().includes(q))) return false;
      if (tierFilter.length && !tierFilter.includes(c.tier)) return false;
      return true;
    });
  }, [customers, search, tierFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = useMemo(() => ({
    total: customers.length,
    vip: customers.filter((c) => c.tier === "vip").length,
    revenue: customers.reduce((acc, c) => acc + c.totalSpent, 0),
  }), [customers]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="eCommerce"
        title="Customers"
        description="Browse customer accounts, lifetime spend, and engagement."
        breadcrumbs={trail.length ? trail : [{ label: "eCommerce" }, { label: "Customers" }]}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard label="Total customers" value={String(stats.total)} icon={Users} accent="primary" compact />
        <StatCard label="VIP" value={String(stats.vip)} accent="gold" compact />
        <StatCard label="Lifetime revenue" value={formatCurrency(stats.revenue, "USD", { compact: true })} accent="success" compact />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <SearchInput value={search} onValueChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name, email, country…" size="sm" containerClassName="w-80" />
        <FilterDropdown
          label="Tier" multiple value={tierFilter} onChange={(v) => { setTierFilter(v); setPage(1); }} size="sm" align="end"
          options={TIERS.map((t) => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t }))}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6"><DataCard><EmptyState icon={Users} title="No customers" description="Try adjusting your filters." /></DataCard></div>
      ) : (
        <div className="mt-6">
          <DataCard flush>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Tier</th>
                    <th className="px-5 py-3 font-medium">Country</th>
                    <th className="px-5 py-3 font-medium">Orders</th>
                    <th className="px-5 py-3 font-medium">Lifetime Value</th>
                    <th className="px-5 py-3 font-medium">Last Order</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.map((c) => (
                    <tr key={c.id} className="transition-fast hover:bg-muted/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarFallback className="bg-info-soft text-xs font-semibold text-info">{getInitials(c.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">{c.name}</p>
                            <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" /> {c.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3"><StatusBadge tone={TIER_TONE[c.tier]} dot>{c.tier}</StatusBadge></td>
                      <td className="px-5 py-3 text-muted-foreground">{c.city}, {c.country}</td>
                      <td className="px-5 py-3 font-mono tabular-nums text-foreground">{c.ordersCount}</td>
                      <td className="px-5 py-3 font-mono tabular-nums text-foreground">{formatCurrency(c.totalSpent, c.currency)}</td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(c.lastOrderAt)}</td>
                      <td className="px-5 py-3 text-right">
                        <Button asChild variant="ghost" size="sm" className="h-8 px-2">
                          <Link to={`/ecommerce/customers/details?id=${c.id}`}>
                            <Eye className="mr-1 h-3.5 w-3.5" /> View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={safePage}
              pageCount={pageCount}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />
          </DataCard>
        </div>
      )}
    </PageContainer>
  );
}
