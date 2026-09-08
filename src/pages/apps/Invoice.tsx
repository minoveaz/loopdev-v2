import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, CheckCircle2, Download, FileText, Plus, Printer, Send,
} from "lucide-react";
import { DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { invoicesStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Currency, Invoice, InvoiceLine, InvoiceStatus } from "@/types";

const STATUS_TONE: Record<InvoiceStatus, "neutral" | "info" | "success" | "destructive" | "warning"> = {
  draft: "neutral", sent: "info", paid: "success", overdue: "destructive", void: "warning",
};

const STATUS_OPTS: { value: InvoiceStatus; label: string }[] = [
  { value: "draft", label: "Draft" }, { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" }, { value: "overdue", label: "Overdue" }, { value: "void", label: "Void" },
];

const today = () => new Date().toISOString().slice(0, 10);
const plus = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString().slice(0, 10); };

interface Draft {
  customer: string; customerEmail: string;
  issueDate: string; dueDate: string; currency: Currency;
  lines: InvoiceLine[];
}

export default function InvoicePage() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const invoices = useLocalStore(invoicesStore);

  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    customer: "", customerEmail: "", issueDate: today(), dueDate: plus(30), currency: "USD",
    lines: [{ description: "", quantity: 1, unitPrice: 0 }],
  });

  useEffect(() => {
    if (createOpen) setDraft({
      customer: "", customerEmail: "", issueDate: today(), dueDate: plus(30), currency: "USD",
      lines: [{ description: "", quantity: 1, unitPrice: 0 }],
    });
  }, [createOpen]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices
      .filter((i) => !q || i.number.toLowerCase().includes(q) || i.customer.toLowerCase().includes(q))
      .filter((i) => !statusF.length || statusF.includes(i.status))
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }, [invoices, search, statusF]);

  const stats = useMemo(() => {
    const totals = invoices.reduce((s, i) => s + i.total, 0);
    const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
    const outstanding = invoices.filter((i) => ["sent", "overdue"].includes(i.status)).reduce((s, i) => s + i.total, 0);
    const overdue = invoices.filter((i) => i.status === "overdue").length;
    return { totals, paid, outstanding, overdue };
  }, [invoices]);

  const opened = openId ? invoices.find((i) => i.id === openId) : null;

  const updateLine = (idx: number, patch: Partial<InvoiceLine>) =>
    setDraft((d) => ({ ...d, lines: d.lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)) }));
  const addLine = () => setDraft((d) => ({ ...d, lines: [...d.lines, { description: "", quantity: 1, unitPrice: 0 }] }));
  const removeLine = (idx: number) => setDraft((d) => ({ ...d, lines: d.lines.filter((_, i) => i !== idx) }));

  const create = () => {
    if (!draft.customer.trim()) { toast({ title: "Customer required", variant: "destructive" }); return; }
    const subtotal = draft.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const tax = Math.round(subtotal * 0.08);
    const num = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, "0")}`;
    invoicesStore.create({
      number: num, customer: draft.customer, customerEmail: draft.customerEmail,
      issueDate: draft.issueDate, dueDate: draft.dueDate,
      status: "draft", currency: draft.currency,
      subtotal, tax, total: subtotal + tax, lines: draft.lines,
    });
    setCreateOpen(false);
    toast({ title: "Invoice created", description: num });
  };

  if (opened) return <InvoiceDetail invoice={opened} onBack={() => setOpenId(null)} />;

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Applications"
        title="Invoices"
        description="Issue, track, and download invoices."
        breadcrumbs={trail}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New invoice
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total billed"  value={formatCurrency(stats.totals)}     icon={FileText}     accent="primary" compact />
        <StatCard label="Paid"          value={formatCurrency(stats.paid)}       icon={CheckCircle2} accent="success" compact />
        <StatCard label="Outstanding"   value={formatCurrency(stats.outstanding)} accent="info"      compact />
        <StatCard label="Overdue"       value={String(stats.overdue)}             accent="gold"      compact invertTrend />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onValueChange={setSearch} placeholder="Search invoices…" size="sm" containerClassName="w-60" />
        <FilterDropdown label="Status" multiple value={statusF} onChange={setStatusF} options={STATUS_OPTS.map((s) => ({ value: s.value, label: s.label }))} size="sm" align="end" />
      </div>

      <DataCard flush>
        {list.length === 0 ? <EmptyState icon={FileText} title="No invoices" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((i) => (
                <TableRow key={i.id} className="cursor-pointer" onClick={() => setOpenId(i.id)}>
                  <TableCell className="font-mono text-xs">{i.number}</TableCell>
                  <TableCell>
                    <div className="font-medium">{i.customer}</div>
                    <div className="text-xs text-muted-foreground">{i.customerEmail}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(i.issueDate)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(i.dueDate)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(i.total, i.currency)}</TableCell>
                  <TableCell><StatusBadge tone={STATUS_TONE[i.status]}>{i.status}</StatusBadge></TableCell>
                  <TableCell><Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setOpenId(i.id); }}>View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataCard>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New invoice</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Customer</Label><Input value={draft.customer} onChange={(e) => setDraft({ ...draft, customer: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Email</Label><Input type="email" value={draft.customerEmail} onChange={(e) => setDraft({ ...draft, customerEmail: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Issue date</Label><Input type="date" value={draft.issueDate} onChange={(e) => setDraft({ ...draft, issueDate: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Due date</Label><Input type="date" value={draft.dueDate} onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} /></div>
              <div className="grid gap-1.5">
                <Label>Currency</Label>
                <Select value={draft.currency} onValueChange={(v) => setDraft({ ...draft, currency: v as Currency })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Line items</Label>
              <div className="mt-2 space-y-2">
                {draft.lines.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_60px_90px_auto] items-center gap-2">
                    <Input value={l.description} onChange={(e) => updateLine(i, { description: e.target.value })} placeholder="Description" />
                    <Input type="number" min="1" value={l.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })} />
                    <Input type="number" min="0" value={l.unitPrice} onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })} />
                    <Button size="sm" variant="ghost" onClick={() => removeLine(i)} disabled={draft.lines.length === 1}>×</Button>
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={addLine} className="gap-1.5"><Plus className="h-3 w-3" /> Add line</Button>
              </div>
            </div>
            <div className="flex justify-end text-sm">
              <div className="w-48 space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(draft.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0), draft.currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax (8%)</span><span>{formatCurrency(Math.round(draft.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0) * 0.08), draft.currency)}</span></div>
                <div className="flex justify-between border-t border-border pt-1 font-semibold"><span>Total</span><span>{formatCurrency(Math.round(draft.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0) * 1.08), draft.currency)}</span></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={create}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function InvoiceDetail({ invoice, onBack }: { invoice: Invoice; onBack: () => void }) {
  const { toast } = useToast();
  const print = () => window.print();
  const download = () => {
    toast({ title: "Download started", description: `${invoice.number}.pdf (mock)` });
  };
  const markPaid = () => {
    invoicesStore.update(invoice.id, { status: "paid" });
    toast({ title: "Invoice marked paid" });
  };
  return (
    <PageContainer width="narrow">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={onBack} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <div className="flex gap-2">
          {invoice.status !== "paid" && <Button variant="outline" onClick={markPaid} className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Mark paid</Button>}
          <Button variant="outline" onClick={print} className="gap-1.5"><Printer className="h-3.5 w-3.5" /> Print</Button>
          <Button onClick={download} className="gap-1.5"><Download className="h-3.5 w-3.5" /> Download PDF</Button>
        </div>
      </div>
      <div className="surface-card p-10 print:border-0 print:shadow-none">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-2xl font-semibold">Rivera Studio</p>
            <p className="text-sm text-muted-foreground">123 Atlas Way · Lisbon, Portugal</p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-semibold">INVOICE</p>
            <p className="font-mono text-sm text-muted-foreground">{invoice.number}</p>
            <StatusBadge tone={STATUS_TONE[invoice.status]} className="mt-2">{invoice.status}</StatusBadge>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Bill to</p>
            <p className="mt-1 font-semibold">{invoice.customer}</p>
            <p className="text-muted-foreground">{invoice.customerEmail}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-right">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Issued</p>
              <p className="mt-1">{formatDate(invoice.issueDate)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Due</p>
              <p className="mt-1">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>
        </div>
        <table className="mt-8 w-full text-sm">
          <thead><tr className="border-b border-border text-left"><th className="py-2">Description</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Unit</th><th className="py-2 text-right">Total</th></tr></thead>
          <tbody>
            {invoice.lines.map((l, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="py-3">{l.description}</td>
                <td className="py-3 text-right">{l.quantity}</td>
                <td className="py-3 text-right">{formatCurrency(l.unitPrice, invoice.currency)}</td>
                <td className="py-3 text-right">{formatCurrency(l.unitPrice * l.quantity, invoice.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(invoice.subtotal, invoice.currency)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatCurrency(invoice.tax, invoice.currency)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold"><span>Total</span><span>{formatCurrency(invoice.total, invoice.currency)}</span></div>
          </div>
        </div>
        <p className="mt-10 text-xs text-muted-foreground">Thank you for your business. Payment is due within 30 days of issue.</p>
      </div>
    </PageContainer>
  );
}