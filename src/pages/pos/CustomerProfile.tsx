import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Award, Mail, MapPin, Phone, Receipt, ArrowLeft } from "lucide-react";
import { DataCard, EmptyState, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { customersStore, posStore } from "@/data";
import { formatCurrency, formatDateTime, formatRelative, getInitials } from "@/lib/formatters";
import { loyaltyPointsFor, statusTone } from "@/features/pos/shared";
import type { Customer, PosTransaction } from "@/types";

export default function PosCustomerProfile() {
  const { trail } = useBreadcrumbs();
  const [params] = useSearchParams();
  const id = params.get("id");
  const customers = useLocalStore(customersStore) as readonly Customer[];
  const txns = useLocalStore(posStore) as readonly PosTransaction[];

  const customer = useMemo(() => customers.find((c) => c.id === id) ?? customers[0], [customers, id]);
  const history = useMemo(() => (customer ? txns.filter((t) => t.customerId === customer.id) : []), [txns, customer]);

  if (!customer) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader eyebrow="POS System" title="Customer profile" breadcrumbs={trail} />
        <EmptyState title="No customer found" />
      </div>
    );
  }

  const points = loyaltyPointsFor(customer.totalSpent);

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="POS System"
        title={customer.name}
        breadcrumbs={trail.length ? trail : [{ label: "POS System" }, { label: "Customer Profile" }]}
        actions={<Button variant="outline" asChild className="gap-2"><Link to="/pos/customers"><ArrowLeft className="h-4 w-4" /> All customers</Link></Button>}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <DataCard>
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20"><AvatarFallback className="text-xl">{getInitials(customer.name)}</AvatarFallback></Avatar>
            <h2 className="mt-3 font-display text-xl font-semibold">{customer.name}</h2>
            <StatusBadge tone={customer.tier === "vip" ? "gold" : "info"} className="mt-1 capitalize">{customer.tier}</StatusBadge>
          </div>
          <ul className="mt-5 space-y-3 text-sm">
            <li className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {customer.email}</li>
            <li className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {customer.phone}</li>
            <li className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {customer.city}, {customer.country}</li>
          </ul>
        </DataCard>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Lifetime Spend" value={formatCurrency(customer.totalSpent, customer.currency)} icon={Receipt} accent="primary" />
            <StatCard label="Orders" value={String(customer.ordersCount)} icon={Receipt} accent="info" />
            <StatCard label="Loyalty Points" value={`${points}`} hint="1 pt per $1 spent" icon={Award} accent="gold" />
          </div>

          <DataCard title="Purchase history" description="POS transactions tied to this customer">
            {history.length === 0 ? (
              <EmptyState icon={Receipt} title="No purchases yet" description="This customer has no POS transactions on record." size="sm" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs"><Link to={`/pos/orders/receipt?id=${t.id}`} className="hover:text-primary">{t.reference}</Link></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatRelative(t.createdAt)}</TableCell>
                      <TableCell>{t.items}</TableCell>
                      <TableCell><StatusBadge tone={statusTone(t.status)}>{t.status}</StatusBadge></TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(t.total, t.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataCard>
        </div>
      </div>
    </PageContainer>
  );
}