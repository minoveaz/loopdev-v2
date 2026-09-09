import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CreditCard, Mail, ShoppingCart } from "lucide-react";
import { DataCard, EmptyState, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { ordersStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { fulfillmentFor, fulfillmentTone, orderStatusTone } from "@/template/rivera/features/commerce/shared";

export default function OrderDetails() {
  const { trail } = useBreadcrumbs();
  const [params] = useSearchParams();
  const orders = useLocalStore(ordersStore);
  const id = params.get("id");
  const order = useMemo(() => (id ? orders.find((o) => o.id === id) : orders[0]) ?? null, [id, orders]);

  if (!order) {
    return (
      <PageContainer width="narrow">
        <PageHeader title="Order details" eyebrow="eCommerce" breadcrumbs={trail} />
        <DataCard><EmptyState icon={ShoppingCart} title="No order selected" description="Pick an order from the list." /></DataCard>
      </PageContainer>
    );
  }

  const fulfill = fulfillmentFor(order.status);
  const lineUnit = order.amount / Math.max(1, order.items);

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="eCommerce"
        title={`Order ${order.reference}`}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        breadcrumbs={trail.length ? trail : [{ label: "eCommerce" }, { label: "Sales" }, { label: "Order Details" }]}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/ecommerce/sales/orders"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back</Link>
            </Button>
            <Button asChild size="sm">
              <Link to={`/ecommerce/sales/orders/edit?id=${order.id}`}>Edit</Link>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <DataCard title="Items" flush>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Description</th>
                    <th className="px-5 py-3 font-medium">Qty</th>
                    <th className="px-5 py-3 text-right font-medium">Unit</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-5 py-3 text-foreground">Order items (mock)</td>
                    <td className="px-5 py-3 font-mono tabular-nums">{order.items}</td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums">{formatCurrency(lineUnit, order.currency)}</td>
                    <td className="px-5 py-3 text-right font-mono tabular-nums text-foreground">{formatCurrency(order.amount, order.currency)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </DataCard>

          <DataCard title="Timeline">
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-2 w-2 rounded-full bg-primary" />
                <div><p className="font-medium text-foreground">Order created</p><p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p></div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 flex h-2 w-2 rounded-full bg-info" />
                <div><p className="font-medium text-foreground">Status: {order.status}</p><p className="text-xs text-muted-foreground">{formatDateTime(order.updatedAt)}</p></div>
              </li>
            </ol>
          </DataCard>
        </div>

        <div className="space-y-6">
          <DataCard title="Summary">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Payment</dt><dd><StatusBadge tone={orderStatusTone[order.status]} dot>{order.status}</StatusBadge></dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Fulfillment</dt><dd><StatusBadge tone={fulfillmentTone[fulfill]} dot>{fulfill}</StatusBadge></dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Method</dt><dd className="capitalize text-foreground"><CreditCard className="mr-1 inline h-3.5 w-3.5" />{order.paymentMethod}</dd></div>
              <div className="flex justify-between border-t border-border pt-2"><dt className="font-medium text-foreground">Total</dt><dd className="font-mono font-semibold text-foreground">{formatCurrency(order.amount, order.currency)}</dd></div>
            </dl>
          </DataCard>
          <DataCard title="Customer">
            <p className="font-medium text-foreground">{order.customer}</p>
            <a href={`mailto:${order.customerEmail}`} className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Mail className="h-3 w-3" /> {order.customerEmail}
            </a>
          </DataCard>
        </div>
      </div>
    </PageContainer>
  );
}
