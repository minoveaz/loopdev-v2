import { useMemo, useState } from "react";
import {
  ArrowDown, ArrowUp, ArrowUpDown, CreditCard, Eye, MoreHorizontal,
  Receipt, ShoppingCart, Trash2,
} from "lucide-react";
import { ConfirmDialog, DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge, TablePagination } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { ordersStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Order, OrderStatus } from "@/types";
import {
  fulfillmentFor, fulfillmentTone, orderStatusTone,
} from "@/features/commerce/shared";
import { OrderDetailsDrawer } from "@/features/commerce/OrderDetailsDrawer";
import { useFocusParam } from "@/hooks/use-focus-param";

type SortKey = "reference" | "customer" | "amount" | "status" | "createdAt" | "items";
const STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "refunded", "failed", "cancelled"];

export default function OrdersPage() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const orders = useLocalStore(ordersStore);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [viewing, setViewing] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState<Order | null>(null);

  useFocusParam(orders, (o) => setViewing(o), {
    scrollToId: (id) => `order-row-${id}`,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let items = orders.filter((o) => {
      if (q && !(o.reference.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.customerEmail.toLowerCase().includes(q))) return false;
      if (statusFilter.length && !statusFilter.includes(o.status)) return false;
      if (paymentFilter.length && !paymentFilter.includes(o.paymentMethod)) return false;
      return true;
    });
    items = [...items].sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      const dir = sortDir === "asc" ? 1 : -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return items;
  }, [orders, search, statusFilter, paymentFilter, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = useMemo(() => {
    const usd = orders.filter((o) => o.currency === "USD");
    return {
      total: orders.length,
      paid: orders.filter((o) => o.status === "paid").length,
      pending: orders.filter((o) => o.status === "pending").length,
      revenue: usd.filter((o) => o.status === "paid" || o.status === "shipped").reduce((acc, o) => acc + o.amount, 0),
    };
  }, [orders]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  };

  const updateStatus = (id: string, status: OrderStatus) => {
    ordersStore.update(id, { status });
    const order = ordersStore.get(id);
    if (order && viewing?.id === id) setViewing(order);
    toast({ title: "Status updated", description: `Order is now ${status}.` });
  };

  const handleDelete = () => {
    if (!deleting) return;
    ordersStore.remove(deleting.id);
    if (viewing?.id === deleting.id) setViewing(null);
    toast({ title: "Order deleted", description: `${deleting.reference} removed.` });
    setDeleting(null);
  };

  const SortHead = ({ k, children, align = "left" }: { k: SortKey; children: React.ReactNode; align?: "left" | "right" }) => (
    <th className={`px-5 py-3 font-medium ${align === "right" ? "text-right" : "text-left"}`}>
      <button onClick={() => toggleSort(k)} className={`inline-flex items-center gap-1 transition-fast hover:text-foreground ${sortKey === k ? "text-foreground" : ""}`}>
        {children}
        {sortKey === k ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
      </button>
    </th>
  );

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Management"
        title="Orders"
        description="Review payments, fulfillment, and customer transactions."
        breadcrumbs={trail.length ? trail : [{ label: "Management" }, { label: "Orders" }]}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total orders" value={String(stats.total)} icon={ShoppingCart} accent="primary" compact />
        <StatCard label="Paid" value={String(stats.paid)} accent="success" compact />
        <StatCard label="Pending" value={String(stats.pending)} accent="gold" compact />
        <StatCard label="Revenue (USD)" value={formatCurrency(stats.revenue, "USD", { compact: true })} icon={Receipt} accent="info" compact />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <SearchInput value={search} onValueChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search reference, customer, email…" size="sm" containerClassName="w-80" />
        <FilterDropdown
          label="Payment status" multiple value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} size="sm" align="end"
          options={STATUSES.map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))}
        />
        <FilterDropdown
          label="Method" multiple value={paymentFilter} onChange={(v) => { setPaymentFilter(v); setPage(1); }} size="sm" align="end"
          options={[
            { label: "Card", value: "card" }, { label: "Wire", value: "wire" },
            { label: "PayPal", value: "paypal" }, { label: "Credit", value: "credit" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <DataCard>
            <EmptyState
              icon={ShoppingCart}
              title="No orders match your filters"
              description="Try adjusting search or filters to see more results."
            />
          </DataCard>
        </div>
      ) : (
        <div className="mt-6">
          <DataCard flush>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <SortHead k="reference">Order ID</SortHead>
                    <SortHead k="customer">Customer</SortHead>
                    <SortHead k="amount">Amount</SortHead>
                    <SortHead k="status">Payment</SortHead>
                    <th className="px-5 py-3 font-medium">Fulfillment</th>
                    <SortHead k="items">Items</SortHead>
                    <SortHead k="createdAt">Date</SortHead>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.map((o) => {
                    const fulfill = fulfillmentFor(o.status);
                    return (
                      <tr id={`order-row-${o.id}`} key={o.id} className="cursor-pointer transition-fast hover:bg-muted/50" onClick={() => setViewing(o)}>
                        <td className="px-5 py-3 font-mono text-xs text-foreground">{o.reference}</td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-foreground">{o.customer}</p>
                          <p className="text-xs text-muted-foreground">{o.customerEmail}</p>
                        </td>
                        <td className="px-5 py-3 font-mono tabular-nums text-foreground">{formatCurrency(o.amount, o.currency)}</td>
                        <td className="px-5 py-3"><StatusBadge tone={orderStatusTone[o.status]} dot>{o.status}</StatusBadge></td>
                        <td className="px-5 py-3"><StatusBadge tone={fulfillmentTone[fulfill]} dot>{fulfill}</StatusBadge></td>
                        <td className="px-5 py-3 font-mono tabular-nums text-foreground">{o.items}</td>
                        <td className="px-5 py-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                        <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem onClick={() => setViewing(o)}>
                                <Eye className="mr-2 h-3.5 w-3.5" /> View details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Update status
                              </DropdownMenuLabel>
                              {STATUSES.map((s) => (
                                <DropdownMenuItem key={s} onClick={() => updateStatus(o.id, s)} className="capitalize">
                                  <CreditCard className="mr-2 h-3.5 w-3.5 opacity-60" /> {s}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleting(o)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
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

      <OrderDetailsDrawer
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        order={viewing}
        onStatusChange={updateStatus}
        onDelete={(o) => setDeleting(o)}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        tone="destructive"
        title={deleting ? `Delete ${deleting.reference}?` : "Delete order?"}
        description="This permanently removes the order from the mock data. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}