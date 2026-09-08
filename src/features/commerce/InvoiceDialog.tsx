import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { Currency, Invoice, InvoiceLine, InvoiceStatus } from "@/types";

export interface InvoiceDraft {
  number: string;
  customer: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  currency: Currency;
  taxRate: number; // percent
  lines: InvoiceLine[];
}

const today = () => new Date().toISOString().slice(0, 10);
const plus = (d: number) => {
  const dt = new Date(); dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
};

function nextInvoiceNumber(): string {
  const yr = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `INV-${yr}-${seq}`;
}

const DEFAULT: InvoiceDraft = {
  number: nextInvoiceNumber(),
  customer: "", customerEmail: "",
  issueDate: today(), dueDate: plus(30),
  status: "draft", currency: "USD",
  taxRate: 8,
  lines: [{ description: "", quantity: 1, unitPrice: 0 }],
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  invoice?: Invoice | null;
  onSubmit: (draft: InvoiceDraft) => void;
}

export function InvoiceDialog({ open, onOpenChange, invoice, onSubmit }: Props) {
  const isEdit = !!invoice;
  const [draft, setDraft] = useState<InvoiceDraft>(DEFAULT);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (invoice) {
      const subtotal = invoice.lines.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0);
      const taxRate = subtotal > 0 ? Math.round((invoice.tax / subtotal) * 1000) / 10 : 0;
      setDraft({
        number: invoice.number,
        customer: invoice.customer,
        customerEmail: invoice.customerEmail,
        issueDate: invoice.issueDate.slice(0, 10),
        dueDate: invoice.dueDate.slice(0, 10),
        status: invoice.status,
        currency: invoice.currency,
        taxRate,
        lines: invoice.lines.map((l) => ({ ...l })),
      });
    } else {
      setDraft({ ...DEFAULT, number: nextInvoiceNumber(), lines: [{ description: "", quantity: 1, unitPrice: 0 }] });
    }
  }, [open, invoice]);

  const set = <K extends keyof InvoiceDraft>(k: K, v: InvoiceDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const updateLine = (idx: number, patch: Partial<InvoiceLine>) =>
    setDraft((d) => ({
      ...d, lines: d.lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    }));
  const removeLine = (idx: number) =>
    setDraft((d) => ({ ...d, lines: d.lines.filter((_, i) => i !== idx) }));
  const addLine = () =>
    setDraft((d) => ({ ...d, lines: [...d.lines, { description: "", quantity: 1, unitPrice: 0 }] }));

  const subtotal = draft.lines.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0);
  const taxAmount = subtotal * (draft.taxRate / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.number.trim()) return setError("Invoice number is required.");
    if (!draft.customer.trim()) return setError("Customer is required.");
    if (draft.lines.length === 0) return setError("Add at least one line item.");
    if (draft.lines.some((l) => !l.description.trim())) return setError("Every line needs a description.");
    onSubmit({
      ...draft,
      number: draft.number.trim(),
      customer: draft.customer.trim(),
      customerEmail: draft.customerEmail.trim(),
      lines: draft.lines.map((l) => ({
        description: l.description.trim(),
        quantity: Math.max(0, Number(l.quantity) || 0),
        unitPrice: Math.max(0, Number(l.unitPrice) || 0),
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{isEdit ? "Edit invoice" : "New invoice"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update invoice details and line items." : "Build a printable invoice with line items."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="i-number">Invoice number</Label>
              <Input id="i-number" value={draft.number} onChange={(e) => set("number", e.target.value)} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(v) => set("status", v as InvoiceStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="i-cust">Customer</Label>
              <Input id="i-cust" value={draft.customer} onChange={(e) => set("customer", e.target.value)} placeholder="Atlas Coffee Co." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="i-email">Customer email</Label>
              <Input id="i-email" type="email" value={draft.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} placeholder="ap@atlascoffee.co" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="i-issue">Issue date</Label>
              <Input id="i-issue" type="date" value={draft.issueDate} onChange={(e) => set("issueDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="i-due">Due date</Label>
              <Input id="i-due" type="date" value={draft.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
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
              <Label htmlFor="i-tax">Tax rate (%)</Label>
              <Input id="i-tax" type="number" min={0} step="0.1" value={draft.taxRate} onChange={(e) => set("taxRate", Number(e.target.value))} />
            </div>
          </div>

          <div className="rounded-xl border border-border">
            <div className="grid grid-cols-12 gap-2 border-b border-border bg-card-muted px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-3 text-right">Unit price</div>
              <div className="col-span-1" />
            </div>
            <div className="divide-y divide-border">
              {draft.lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center gap-2 px-4 py-2">
                  <Input
                    className="col-span-6"
                    value={line.description}
                    onChange={(e) => updateLine(idx, { description: e.target.value })}
                    placeholder="Service or product description"
                  />
                  <Input
                    className="col-span-2 text-right"
                    type="number" min={0}
                    value={line.quantity}
                    onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                  />
                  <Input
                    className="col-span-3 text-right font-mono"
                    type="number" min={0} step="0.01"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value) })}
                  />
                  <Button
                    type="button" variant="ghost" size="icon"
                    className="col-span-1 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeLine(idx)}
                    disabled={draft.lines.length === 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-border px-4 py-2">
              <Button type="button" variant="ghost" size="sm" onClick={addLine} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add line
              </Button>
              <div className="space-y-0.5 text-right text-xs">
                <div className="flex items-center gap-6">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="w-24 font-mono tabular-nums text-foreground">{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-muted-foreground">Tax ({draft.taxRate}%)</span>
                  <span className="w-24 font-mono tabular-nums text-foreground">{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-6 border-t border-border pt-1">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="w-24 font-mono tabular-nums font-semibold text-foreground">{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isEdit ? "Save changes" : "Create invoice"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}