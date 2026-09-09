import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog, DataCard, FilterDropdown, PageContainer, PageHeader, StatusBadge, TablePagination, type StatusTone } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { ticketsStore } from "@/template/rivera/data";
import { formatRelative, titleCase } from "@/lib/formatters";
import type { Ticket } from "@/types";

const statusTone: Record<Ticket["status"], StatusTone> = {
  open: "info",
  pending: "warning",
  resolved: "success",
  closed: "neutral",
};
const priorityTone: Record<Ticket["priority"], StatusTone> = {
  low: "neutral",
  normal: "info",
  high: "warning",
  urgent: "destructive",
};

export default function HelpdeskTickets() {
  const { trail } = useBreadcrumbs();
  const tickets = useLocalStore(ticketsStore);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toDelete, setToDelete] = useState<Ticket | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tickets.filter((t) => {
      if (term &&
        !t.subject.toLowerCase().includes(term) &&
        !t.reference.toLowerCase().includes(term) &&
        !t.requester.toLowerCase().includes(term) &&
        !t.requesterEmail.toLowerCase().includes(term)
      ) return false;
      if (statusFilter.length && !statusFilter.includes(t.status)) return false;
      if (priorityFilter.length && !priorityFilter.includes(t.priority)) return false;
      return true;
    });
  }, [tickets, q, statusFilter, priorityFilter]);

  const counts = useMemo(() => {
    const c: Record<Ticket["status"], number> = { open: 0, pending: 0, resolved: 0, closed: 0 };
    tickets.forEach((t) => (c[t.status] += 1));
    return c;
  }, [tickets]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  useEffect(() => { if (page > pageCount) setPage(1); }, [page, pageCount]);
  useEffect(() => { setPage(1); }, [q, statusFilter, priorityFilter, pageSize]);
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const statusOptions = (["open", "pending", "resolved", "closed"] as const).map((s) => ({
    label: titleCase(s), value: s, count: counts[s],
  }));
  const priorityOptions = (["low", "normal", "high", "urgent"] as const).map((p) => ({
    label: titleCase(p), value: p,
  }));

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Helpdesk"
        title="Support tickets"
        description="Track issues, requests, and conversations from your customers."
        breadcrumbs={trail.length ? trail : [{ label: "Helpdesk" }, { label: "Tickets" }]}
        actions={
          <Button asChild size="sm" className="gap-2">
            <Link to="/helpdesk/tickets/create"><Plus className="h-4 w-4" /> New ticket</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(counts) as Ticket["status"][]).map((s) => (
          <DataCard key={s} title={titleCase(s)} description={`${counts[s]} tickets`}>
            <p className="font-display text-3xl font-semibold">{counts[s]}</p>
            <StatusBadge tone={statusTone[s]} dot className="mt-2">{titleCase(s)}</StatusBadge>
          </DataCard>
        ))}
      </div>

      <DataCard title="All tickets" description="Filter by reference, subject or requester">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tickets…" className="pl-9" />
          </div>
          <FilterDropdown label="Status" multiple value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
          <FilterDropdown label="Priority" multiple value={priorityFilter} onChange={setPriorityFilter} options={priorityOptions} />
          {(q || statusFilter.length || priorityFilter.length) ? (
            <Button variant="ghost" size="sm" onClick={() => { setQ(""); setStatusFilter([]); setPriorityFilter([]); }}>
              Clear
            </Button>
          ) : null}
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">Ref</th>
                <th className="px-3 py-2 font-semibold">Subject</th>
                <th className="px-3 py-2 font-semibold">Requester</th>
                <th className="px-3 py-2 font-semibold">Priority</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Updated</th>
                <th className="px-3 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((t) => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono text-[12px]">
                    <Link to={`/helpdesk/tickets/details/${t.id}`} className="text-primary hover:underline">{t.reference}</Link>
                  </td>
                  <td className="px-3 py-2">{t.subject}</td>
                  <td className="px-3 py-2 text-muted-foreground">{t.requester}</td>
                  <td className="px-3 py-2"><StatusBadge tone={priorityTone[t.priority]}>{titleCase(t.priority)}</StatusBadge></td>
                  <td className="px-3 py-2"><StatusBadge tone={statusTone[t.status]} dot>{titleCase(t.status)}</StatusBadge></td>
                  <td className="px-3 py-2 text-muted-foreground">{formatRelative(t.updatedAt)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="icon" variant="ghost" className="h-8 w-8" aria-label="Edit ticket">
                        <Link to={`/helpdesk/tickets/edit/${t.id}`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" aria-label="Delete ticket" onClick={() => setToDelete(t)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No tickets match your search.</td></tr>
              )}
            </tbody>
          </table>
          <TablePagination
            page={Math.min(page, pageCount)}
            pageCount={pageCount}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </DataCard>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={toDelete ? `Delete ${toDelete.reference}?` : "Delete ticket?"}
        description="This permanently removes the ticket from local storage."
        confirmLabel="Delete"
        tone="destructive"
        onConfirm={() => {
          if (toDelete) {
            ticketsStore.remove(toDelete.id);
            toast.success(`Ticket ${toDelete.reference} deleted`);
          }
          setToDelete(null);
        }}
      />
    </PageContainer>
  );
}