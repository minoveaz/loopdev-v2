import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar, Mail, MapPin, Phone, ShoppingBag, Star } from "lucide-react";
import { DataCard, EmptyState, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useToast } from "@/hooks/use-toast";
import { customersStore, ordersStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";
import { storage } from "@/lib/storage";
import { formatCurrency, formatDate, getInitials } from "@/lib/formatters";
import { orderStatusTone } from "@/features/commerce/shared";

const NOTES_KEY = (id: string) => `ecom:customer-notes:${id}`;

export default function CustomerDetails() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const customers = useLocalStore(customersStore);
  const orders = useLocalStore(ordersStore);

  const idParam = params.get("id");
  const customer = useMemo(() => {
    if (idParam) return customers.find((c) => c.id === idParam) ?? customers[0];
    return customers[0];
  }, [idParam, customers]);

  const customerOrders = useMemo(
    () => (customer ? orders.filter((o) => o.customerEmail === customer.email) : []),
    [customer, orders],
  );

  const [notes, setNotes] = useState<string>(() =>
    customer ? storage.get<string>(NOTES_KEY(customer.id), "") : "",
  );

  const saveNotes = () => {
    if (!customer) return;
    storage.set(NOTES_KEY(customer.id), notes);
    toast({ title: "Notes saved", description: "Stored locally." });
  };

  if (!customer) {
    return (
      <PageContainer width="narrow">
        <PageHeader title="Customer details" eyebrow="eCommerce" breadcrumbs={trail} />
        <DataCard><EmptyState icon={ShoppingBag} title="No customer selected" description="Choose a customer from the listing." /></DataCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="eCommerce"
        title={customer.name}
        description={`Customer profile · joined ${formatDate(customer.createdAt)}`}
        breadcrumbs={trail.length ? trail : [{ label: "eCommerce" }, { label: "Customers", to: "/ecommerce/customers" }, { label: customer.name }]}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/ecommerce/customers"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to list</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 border border-border">
              <AvatarFallback className="bg-info-soft text-xl font-semibold text-info">{getInitials(customer.name)}</AvatarFallback>
            </Avatar>
            <h2 className="mt-3 font-display text-xl font-semibold text-foreground">{customer.name}</h2>
            <StatusBadge tone="info" dot>{customer.tier}</StatusBadge>
          </div>
          <ul className="mt-5 space-y-2.5 text-sm">
            <li className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {customer.email}</li>
            <li className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {customer.phone}</li>
            <li className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {customer.city}, {customer.country}</li>
            <li className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> Last order {formatDate(customer.lastOrderAt)}</li>
          </ul>
        </DataCard>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            <StatCard label="Lifetime value" value={formatCurrency(customer.totalSpent, customer.currency)} icon={Star} accent="success" compact />
            <StatCard label="Orders" value={String(customer.ordersCount)} icon={ShoppingBag} accent="primary" compact />
            <StatCard label="Avg. order" value={formatCurrency(customer.totalSpent / Math.max(1, customer.ordersCount), customer.currency)} accent="info" compact />
          </div>

          <DataCard title="Order history" description={`${customerOrders.length} orders found in this account`} flush>
            {customerOrders.length === 0 ? (
              <div className="p-6"><EmptyState icon={ShoppingBag} title="No orders yet" description="This customer hasn't placed an order." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Reference</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Items</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {customerOrders.map((o) => (
                      <tr key={o.id} className="transition-fast hover:bg-muted/50">
                        <td className="px-5 py-3 font-mono text-xs text-foreground">{o.reference}</td>
                        <td className="px-5 py-3"><StatusBadge tone={orderStatusTone[o.status]} dot>{o.status}</StatusBadge></td>
                        <td className="px-5 py-3 font-mono tabular-nums text-foreground">{o.items}</td>
                        <td className="px-5 py-3 font-mono tabular-nums text-foreground">{formatCurrency(o.amount, o.currency)}</td>
                        <td className="px-5 py-3 text-muted-foreground">{formatDate(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DataCard>

          <DataCard title="Notes" description="Internal notes — saved to localStorage.">
            <Textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a private note about this customer…"
            />
            <div className="mt-3 flex justify-end">
              <Button size="sm" onClick={saveNotes}>Save notes</Button>
            </div>
          </DataCard>
        </div>
      </div>
    </PageContainer>
  );
}
