import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer, Receipt as ReceiptIcon } from "lucide-react";
import { EmptyState, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { posStore } from "@/data";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { getPosSettings, statusTone } from "@/features/pos/shared";
import type { PosTransaction } from "@/types";

export default function PosReceipt() {
  const { trail } = useBreadcrumbs();
  const [params] = useSearchParams();
  const id = params.get("id");
  const txns = useLocalStore(posStore) as readonly PosTransaction[];
  const settings = getPosSettings();

  const txn = useMemo(() => txns.find((t) => t.id === id) ?? txns[0], [txns, id]);

  if (!txn) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader eyebrow="POS System" title="Order receipt" breadcrumbs={trail} />
        <EmptyState icon={ReceiptIcon} title="No transaction selected" action={<Button asChild><Link to="/pos/orders/transactions">Browse transactions</Link></Button>} />
      </div>
    );
  }

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="POS System"
        title="Order receipt"
        breadcrumbs={trail.length ? trail : [{ label: "POS System" }, { label: "Order Receipt" }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild className="gap-2"><Link to="/pos/orders/transactions"><ArrowLeft className="h-4 w-4" /> All transactions</Link></Button>
            <Button onClick={() => window.print()} className="gap-2"><Printer className="h-4 w-4" /> Print</Button>
          </div>
        }
      />

      <article className="mx-auto max-w-md surface-card p-8">
        <header className="text-center">
          <h2 className="font-display text-2xl font-semibold">{settings.storeName}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{settings.storeAddress}</p>
        </header>

        <div className="my-6 border-t border-dashed border-border" />

        <dl className="space-y-1 text-xs">
          <div className="flex justify-between"><dt className="text-muted-foreground">Reference</dt><dd className="font-mono">{txn.reference}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Date</dt><dd>{formatDateTime(txn.createdAt)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Cashier</dt><dd>{txn.cashier}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Register</dt><dd className="font-mono">{txn.registerId}</dd></div>
          {txn.customerName && <div className="flex justify-between"><dt className="text-muted-foreground">Customer</dt><dd>{txn.customerName}</dd></div>}
        </dl>

        <div className="my-4 border-t border-dashed border-border" />

        {txn.lineItems && txn.lineItems.length > 0 ? (
          <ul className="space-y-1.5 text-sm">
            {txn.lineItems.map((l) => (
              <li key={l.productId} className="flex justify-between gap-2">
                <span className="min-w-0 truncate">{l.quantity}× {l.name}</span>
                <span className="font-mono">{formatCurrency(l.price * l.quantity, txn.currency)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-sm text-muted-foreground">{txn.items} items</p>
        )}

        <div className="my-4 border-t border-dashed border-border" />

        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="font-mono">{formatCurrency(txn.subtotal, txn.currency)}</dd></div>
          {txn.discount && txn.discount > 0 ? (
            <div className="flex justify-between text-success"><dt>Discount</dt><dd className="font-mono">−{formatCurrency(txn.discount, txn.currency)}</dd></div>
          ) : null}
          <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd className="font-mono">{formatCurrency(txn.tax, txn.currency)}</dd></div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold"><dt>Total</dt><dd className="font-mono">{formatCurrency(txn.total, txn.currency)}</dd></div>
          <div className="flex justify-between pt-2"><dt className="text-muted-foreground">Paid via</dt><dd className="capitalize">{txn.payment}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd><StatusBadge tone={statusTone(txn.status)}>{txn.status}</StatusBadge></dd></div>
        </dl>

        <div className="my-6 border-t border-dashed border-border" />

        <p className="text-center text-xs text-muted-foreground">{settings.receiptFooter}</p>
      </article>
    </PageContainer>
  );
}