import { useMemo, useState } from "react";
import {
  ArrowDown, ArrowUp, ArrowUpDown, Download, FileText, MoreHorizontal,
  Pencil, Plus, Printer, Trash2,
} from "lucide-react";
import { ConfirmDialog, DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge, TablePagination } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { invoicesStore } from "@/data";
import { useLocalStore } from "@/lib/localStore";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Invoice, InvoiceStatus } from "@/types";
import { invoiceStatusTone } from "@/features/commerce/shared";
import { InvoiceDialog, type InvoiceDraft } from "@/features/commerce/InvoiceDialog";
import { InvoicePrintDialog } from "@/features/commerce/InvoicePrintDialog";
import { useFocusParam } from "@/hooks/use-focus-param";

type SortKey = "number" | "customer" | "total" | "status" | "dueDate" | "issueDate";
const STATUSES: InvoiceStatus[] = ["draft", "sent", "paid", "overdue", "void"];

function buildPayload(d: InvoiceDraft) {
  const subtotal = d.lines.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0);
  const tax = subtotal * (d.taxRate / 100);
  return {
    number: d.number,
    customer: d.customer,
    customerEmail: d.customerEmail,
    issueDate: new Date(d.issueDate).toISOString(),
    dueDate: new Date(d.dueDate).toISOString(),
    status: d.status,
    currency: d.currency,
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round((subtotal + tax) * 100) / 100,
    lines: d.lines,
  };
}

export default function InvoicesPage() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const invoices = useLocalStore(invoicesStore);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("issueDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState<Invoice | null>(null);
  const [printing, setPrinting] = useState<Invoice | null>(null);

  useFocusParam(invoices, (inv) => setEditing(inv), {
    scrollToId: (id) => `invoice-row-${id}`,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let items = invoices.filter((i) => {
      if (q && !(i.number.toLowerCase().includes(q) || i.customer.toLowerCase().includes(q) || i.customerEmail.toLowerCase().includes(q))) return false;
      if (statusFilter.length && !statusFilter.includes(i.status)) return false;
      return true;
    });
    items = [...items].sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      const dir = sortDir === "asc" ? 1 : -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return items;
  }, [invoices, search, statusFilter, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const stats = useMemo(() => {
    const usd = invoices.filter((i) => i.currency === "USD");
    return {
      total: invoices.length,
      paid: invoices.filter((i) => i.status === "paid").length,
      overdue: invoices.filter((i) => i.status === "overdue").length,
      outstanding: usd.filter((i) => i.status === "sent" || i.status === "overdue").reduce((acc, i) => acc + i.total, 0),
    };
  }, [invoices]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  };

  const handleCreate = (d: InvoiceDraft) => {
    invoicesStore.create(buildPayload(d));
    setCreateOpen(false);
    toast({ title: "Invoice created", description: `${d.number} added.` });
  };
  const handleEdit = (d: InvoiceDraft) => {
    if (!editing) return;
    invoicesStore.update(editing.id, buildPayload(d));
    setEditing(null);
    toast({ title: "Invoice updated", description: `${d.number} saved.` });
  };
  const handleDelete = () => {
    if (!deleting) return;
    invoicesStore.remove(deleting.id);
    toast({ title: "Invoice deleted", description: `${deleting.number} removed.` });
    setDeleting(null);
  };

  const SortHead = ({ k, children, align = "left" }: { k: SortKey; children: React.ReactNode; align?: "left" | "right" }) => (
    <th className={`px-5 py-3 font-medium ${align === "right" ? "text-right" : "text-left"}`}>
      <button onClick={() => toggleSort(k)} className={`inline-flex items-center gap-1 transition-fast hover:text-foreground ${sortKey === k ? "text-foreground" : ""}`}>
        {children}
        {sortKey === k ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
      </button>
    </th>
  );

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Management"
        title="Invoices"
        description="Issue, track, and download client invoices."
        breadcrumbs={trail.length ? trail : [{ label: "Management" }, { label: "Invoices" }]}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New invoice
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total invoices" value={String(stats.total)} icon={FileText} accent="primary" compact />
        <StatCard label="Paid" value={String(stats.paid)} accent="success" compact />
        <StatCard label="Overdue" value={String(stats.overdue)} accent="gold" compact />
        <StatCard label="Outstanding (USD)" value={formatCurrency(stats.outstanding, "USD", { compact: true })} accent="info" compact />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <SearchInput value={search} onValueChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search number, client, email…" size="sm" containerClassName="w-80" />
        <FilterDropdown
          label="Status" multiple value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} size="sm" align="end"
          options={STATUSES.map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), value: s }))}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <DataCard>
            <EmptyState
              icon={FileText}
              title="No invoices match your filters"
              description="Try adjusting search or filters, or issue a new invoice."
              action={<Button onClick={() => setCreateOpen(true)} size="sm">New invoice</Button>}
            />
          </DataCard>
        </div>
      ) : (
        <div className="mt-6">
          <DataCard flush>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <SortHead k="number">Invoice</SortHead>
                    <SortHead k="customer">Client</SortHead>
                    <SortHead k="total">Amount</SortHead>
                    <SortHead k="issueDate">Issued</SortHead>
                    <SortHead k="dueDate">Due</SortHead>
                    <SortHead k="status">Status</SortHead>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.map((inv) => (
                    <tr id={`invoice-row-${inv.id}`} key={inv.id} className="transition-fast hover:bg-muted/50">
                      <td className="px-5 py-3 font-mono text-xs text-foreground">{inv.number}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-foreground">{inv.customer}</p>
                        <p className="text-xs text-muted-foreground">{inv.customerEmail}</p>
                      </td>
                      <td className="px-5 py-3 font-mono tabular-nums text-foreground">{formatCurrency(inv.total, inv.currency)}</td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(inv.issueDate)}</td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(inv.dueDate)}</td>
                      <td className="px-5 py-3"><StatusBadge tone={invoiceStatusTone[inv.status]} dot>{inv.status}</StatusBadge></td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setPrinting(inv)} className="h-8 gap-1 px-2 text-xs">
                            <Download className="h-3.5 w-3.5" /> Download
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onClick={() => setPrinting(inv)}>
                                <Printer className="mr-2 h-3.5 w-3.5" /> Preview / Print
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditing(inv)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleting(inv)} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={safePage}
              pageCount={pageCount}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />
          </DataCard>
        </div>
      )}

      <InvoiceDialog open={createOpen} onOpenChange={setCreateOpen} onSubmit={handleCreate} />
      <InvoiceDialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} invoice={editing} onSubmit={handleEdit} />
      <InvoicePrintDialog open={!!printing} onOpenChange={(o) => !o && setPrinting(null)} invoice={printing} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        tone="destructive"
        title={deleting ? `Delete ${deleting.number}?` : "Delete invoice?"}
        description="This permanently removes the invoice from the mock data. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}