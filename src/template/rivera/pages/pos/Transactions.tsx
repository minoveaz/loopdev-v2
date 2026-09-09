import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, Search } from "lucide-react";
import { EmptyState, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { posStore } from "@/template/rivera/data";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { statusTone } from "@/template/rivera/features/pos/shared";
import type { PosTransaction } from "@/types";

export default function PosTransactions() {
  const { trail } = useBreadcrumbs();
  const navigate = useNavigate();
  const txns = useLocalStore(posStore) as readonly PosTransaction[];
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [drawer, setDrawer] = useState<PosTransaction | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return txns.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (!q) return true;
      return t.reference.toLowerCase().includes(q) || t.cashier.toLowerCase().includes(q);
    });
  }, [txns, search, status]);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="POS System"
        title="Transactions"
        description="All register transactions across cashiers."
        breadcrumbs={trail.length ? trail : [{ label: "POS System" }, { label: "Transactions" }]}
      />

      <div className="surface-card">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reference or cashier…" className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="voided">Voided</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="No transactions found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Register</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className="cursor-pointer" onClick={() => setDrawer(t)}>
                  <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDateTime(t.createdAt)}</TableCell>
                  <TableCell>{t.cashier}</TableCell>
                  <TableCell className="font-mono text-xs">{t.registerId}</TableCell>
                  <TableCell>{t.items}</TableCell>
                  <TableCell className="capitalize">{t.payment}</TableCell>
                  <TableCell><StatusBadge tone={statusTone(t.status)}>{t.status}</StatusBadge></TableCell>
                  <TableCell className="text-right font-mono font-semibold">{formatCurrency(t.total, t.currency)}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/pos/orders/receipt?id=${t.id}`); }}>Receipt</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Sheet open={!!drawer} onOpenChange={(o) => !o && setDrawer(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader><SheetTitle>{drawer?.reference}</SheetTitle></SheetHeader>
          {drawer && (
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{formatDateTime(drawer.createdAt)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cashier</span><span>{drawer.cashier}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Register</span><span className="font-mono">{drawer.registerId}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="capitalize">{drawer.payment}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge tone={statusTone(drawer.status)}>{drawer.status}</StatusBadge></div>
              {drawer.lineItems && drawer.lineItems.length > 0 && (
                <div className="rounded-lg border border-border p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Line items</p>
                  <ul className="space-y-1.5">
                    {drawer.lineItems.map((l) => (
                      <li key={l.productId} className="flex justify-between text-sm">
                        <span>{l.quantity}× {l.name}</span>
                        <span className="font-mono">{formatCurrency(l.price * l.quantity, drawer.currency)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="space-y-1 border-t border-border pt-3">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="font-mono">{formatCurrency(drawer.subtotal, drawer.currency)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Tax</span><span className="font-mono">{formatCurrency(drawer.tax, drawer.currency)}</span></div>
                <div className="flex justify-between font-semibold"><span>Total</span><span className="font-mono">{formatCurrency(drawer.total, drawer.currency)}</span></div>
              </div>
              <Button className="w-full" onClick={() => navigate(`/pos/orders/receipt?id=${drawer.id}`)}>Open full receipt</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}