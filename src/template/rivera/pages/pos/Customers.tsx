import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users } from "lucide-react";
import { EmptyState, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { customersStore } from "@/template/rivera/data";
import { formatCurrency, formatRelative, getInitials } from "@/lib/formatters";
import { loyaltyPointsFor } from "@/template/rivera/features/pos/shared";
import type { Customer } from "@/types";

const tierTone = { vip: "gold", wholesale: "primary", standard: "info", lead: "neutral" } as const;

export default function PosCustomers() {
  const { trail } = useBreadcrumbs();
  const customers = useLocalStore(customersStore) as readonly Customer[];
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [customers, search]);

  return (
    <PageContainer width="wide">
      <PageHeader eyebrow="POS System" title="Customers" description="Walk-in and loyalty customer base." breadcrumbs={trail.length ? trail : [{ label: "POS System" }, { label: "Customers" }]} />

      <div className="surface-card">
        <div className="border-b border-border p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers…" className="pl-9" />
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No customers found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Lifetime Spend</TableHead>
                <TableHead className="text-right">Loyalty</TableHead>
                <TableHead>Last visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link to={`/pos/customers/profile?id=${c.id}`} className="flex items-center gap-3 hover:text-primary">
                      <Avatar className="h-9 w-9"><AvatarFallback>{getInitials(c.name)}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell><StatusBadge tone={tierTone[c.tier]}>{c.tier}</StatusBadge></TableCell>
                  <TableCell>{c.country}</TableCell>
                  <TableCell className="text-right font-mono">{c.ordersCount}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(c.totalSpent, c.currency)}</TableCell>
                  <TableCell className="text-right font-mono">{loyaltyPointsFor(c.totalSpent)} pts</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatRelative(c.lastOrderAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </PageContainer>
  );
}