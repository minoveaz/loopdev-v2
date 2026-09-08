import { useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common";
import { Download, Printer } from "lucide-react";
import type { Invoice } from "@/types";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { invoiceStatusTone } from "./shared";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  invoice: Invoice | null;
}

export function InvoicePrintDialog({ open, onOpenChange, invoice }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  if (!invoice) return null;

  const handlePrint = () => {
    if (!printRef.current) return;
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>${invoice.number}</title>
      <style>
        *{box-sizing:border-box}
        body{font-family:ui-sans-serif,system-ui,sans-serif;margin:0;padding:48px;color:#0b0b0c;background:#fff}
        h1{font-size:28px;margin:0 0 4px;letter-spacing:-0.02em}
        .muted{color:#737380;font-size:12px}
        table{width:100%;border-collapse:collapse;margin-top:24px;font-size:13px}
        th,td{padding:10px 8px;border-bottom:1px solid #e6e6ea;text-align:left}
        th{background:#f7f7f8;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#737380}
        .right{text-align:right}
        .total{font-weight:600;font-size:16px}
        .row{display:flex;justify-content:space-between;align-items:flex-start;gap:24px}
        .pill{display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600;background:#eef0ff;color:#4338ca;text-transform:uppercase;letter-spacing:.06em}
      </style></head><body>${printRef.current.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 250);
  };

  const handleDownload = () => {
    if (!printRef.current) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${invoice.number}</title>
      <style>
        body{font-family:ui-sans-serif,system-ui,sans-serif;margin:0;padding:48px;color:#0b0b0c}
        h1{font-size:28px;margin:0 0 4px}
        .muted{color:#737380;font-size:12px}
        table{width:100%;border-collapse:collapse;margin-top:24px;font-size:13px}
        th,td{padding:10px 8px;border-bottom:1px solid #e6e6ea;text-align:left}
        th{background:#f7f7f8;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#737380}
        .right{text-align:right}
        .total{font-weight:600;font-size:16px}
        .row{display:flex;justify-content:space-between;align-items:flex-start;gap:24px}
      </style></head><body>${printRef.current.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoice.number}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Invoice preview</DialogTitle>
        </DialogHeader>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Download .html
          </Button>
          <Button size="sm" onClick={handlePrint} className="gap-1.5">
            <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
          </Button>
        </div>

        <div ref={printRef} className="surface-card-compact p-8 text-sm text-foreground">
          <div className="row flex items-start justify-between gap-6">
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight">Rivera</h1>
              <p className="muted text-xs text-muted-foreground">Rivera Studio · Lisbon, Portugal</p>
              <p className="muted text-xs text-muted-foreground">billing@rivera.app</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Invoice</p>
              <p className="font-mono text-base font-semibold text-foreground">{invoice.number}</p>
              <div className="mt-2">
                <StatusBadge tone={invoiceStatusTone[invoice.status]}>{invoice.status}</StatusBadge>
              </div>
            </div>
          </div>

          <div className="row mt-8 grid grid-cols-2 gap-6">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Bill to</p>
              <p className="mt-1 font-semibold text-foreground">{invoice.customer}</p>
              <p className="text-xs text-muted-foreground">{invoice.customerEmail}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Issue date</p>
              <p className="text-foreground">{formatDate(invoice.issueDate, "long")}</p>
              <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">Due date</p>
              <p className="text-foreground">{formatDate(invoice.dueDate, "long")}</p>
            </div>
          </div>

          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Unit</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((l, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="py-2 text-foreground">{l.description}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{l.quantity}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{formatCurrency(l.unitPrice, invoice.currency)}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{formatCurrency(l.unitPrice * l.quantity, invoice.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-foreground">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span className="font-mono tabular-nums text-foreground">{formatCurrency(invoice.tax, invoice.currency)}</span>
              </div>
              <div className="total flex justify-between border-t border-border pt-2">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-mono tabular-nums font-semibold text-foreground">{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>

          <p className="muted mt-10 border-t border-border pt-4 text-center text-[11px] text-muted-foreground">
            Thank you for your business. Please remit payment by {formatDate(invoice.dueDate, "long")}.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}