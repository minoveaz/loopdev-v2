import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Currency, Order, OrderStatus } from "@/types";

export interface OrderDraft {
  reference: string;
  customer: string;
  customerEmail: string;
  amount: number;
  currency: Currency;
  status: OrderStatus;
  items: number;
  paymentMethod: Order["paymentMethod"];
}

const nextRef = () => `RV-${Math.floor(10000 + Math.random() * 89999)}`;

const DEFAULT: OrderDraft = {
  reference: nextRef(), customer: "", customerEmail: "",
  amount: 0, currency: "USD", status: "pending", items: 1, paymentMethod: "card",
};

interface Props {
  order?: Order | null;
  onSubmit: (d: OrderDraft) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function OrderForm({ order, onSubmit, onCancel, submitLabel = "Save order" }: Props) {
  const [draft, setDraft] = useState<OrderDraft>(DEFAULT);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order) {
      setDraft({
        reference: order.reference, customer: order.customer, customerEmail: order.customerEmail,
        amount: order.amount, currency: order.currency, status: order.status,
        items: order.items, paymentMethod: order.paymentMethod,
      });
    } else {
      setDraft({ ...DEFAULT, reference: nextRef() });
    }
    setError(null);
  }, [order]);

  const set = <K extends keyof OrderDraft>(k: K, v: OrderDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.customer.trim()) return setError("Customer name is required.");
    if (!draft.customerEmail.trim()) return setError("Customer email is required.");
    onSubmit({
      ...draft,
      reference: draft.reference.trim() || nextRef(),
      customer: draft.customer.trim(),
      customerEmail: draft.customerEmail.trim(),
      amount: Math.max(0, Number(draft.amount) || 0),
      items: Math.max(1, Math.round(Number(draft.items) || 1)),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="o-ref">Reference</Label>
          <Input id="o-ref" value={draft.reference} onChange={(e) => set("reference", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={draft.status} onValueChange={(v) => set("status", v as OrderStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["pending","paid","shipped","refunded","failed","cancelled"] as OrderStatus[]).map((s) => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="o-cust">Customer</Label>
          <Input id="o-cust" value={draft.customer} onChange={(e) => set("customer", e.target.value)} placeholder="Atlas Coffee Co." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="o-mail">Email</Label>
          <Input id="o-mail" type="email" value={draft.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="o-amt">Amount</Label>
          <Input id="o-amt" type="number" min={0} step="0.01" value={draft.amount} onChange={(e) => set("amount", Number(e.target.value))} />
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Select value={draft.currency} onValueChange={(v) => set("currency", v as Currency)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="o-items">Items</Label>
          <Input id="o-items" type="number" min={1} value={draft.items} onChange={(e) => set("items", Number(e.target.value))} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Payment method</Label>
        <Select value={draft.paymentMethod} onValueChange={(v) => set("paymentMethod", v as Order["paymentMethod"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="wire">Wire</SelectItem>
            <SelectItem value="paypal">PayPal</SelectItem>
            <SelectItem value="credit">Credit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
