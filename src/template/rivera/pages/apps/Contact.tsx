import { useEffect, useMemo, useState } from "react";
import {
  Building2, Grid3x3, List, Mail, MapPin, Pencil, Phone, Plus, Trash2, Users,
} from "lucide-react";
import { ConfirmDialog, DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { customersStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { formatCurrency, formatDate, getInitials } from "@/lib/formatters";
import type { Customer } from "@/types";

const TIERS: { value: Customer["tier"]; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "standard", label: "Standard" },
  { value: "vip", label: "VIP" },
  { value: "wholesale", label: "Wholesale" },
];

const tierTone = {
  lead: "neutral", standard: "info", vip: "gold", wholesale: "success",
} as const;

interface Draft {
  name: string; email: string; phone: string;
  country: string; city: string; tier: Customer["tier"];
}
const EMPTY: Draft = { name: "", email: "", phone: "", country: "", city: "", tier: "standard" };

export default function ContactPage() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const customers = useLocalStore(customersStore);

  const [view, setView] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [tierF, setTierF] = useState<string[]>([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  useEffect(() => {
    if (open) {
      setDraft(editing
        ? { name: editing.name, email: editing.email, phone: editing.phone, country: editing.country, city: editing.city, tier: editing.tier }
        : EMPTY);
    }
  }, [open, editing]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.city.toLowerCase().includes(q))
      .filter((c) => !tierF.length || tierF.includes(c.tier));
  }, [customers, search, tierF]);

  const stats = useMemo(() => ({
    total: customers.length,
    vip: customers.filter((c) => c.tier === "vip").length,
    leads: customers.filter((c) => c.tier === "lead").length,
    countries: new Set(customers.map((c) => c.country)).size,
  }), [customers]);

  const save = () => {
    if (!draft.name.trim() || !draft.email.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }
    if (editing) {
      customersStore.update(editing.id, draft);
    } else {
      customersStore.create({
        ...draft,
        totalSpent: 0, currency: "USD", ordersCount: 0, lastOrderAt: new Date().toISOString(),
      });
    }
    setOpen(false); setEditing(null);
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Applications"
        title="Contacts"
        description="Customers, leads, and partners in one place."
        breadcrumbs={trail}
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New contact
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Contacts" value={String(stats.total)} icon={Users} accent="primary" compact />
        <StatCard label="VIP" value={String(stats.vip)} accent="gold" compact />
        <StatCard label="Leads" value={String(stats.leads)} accent="info" compact />
        <StatCard label="Countries" value={String(stats.countries)} accent="success" compact />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={search} onValueChange={setSearch} placeholder="Search contacts…" size="sm" containerClassName="w-60" />
          <FilterDropdown label="Tier" multiple value={tierF} onChange={setTierF} options={TIERS.map((t) => ({ value: t.value, label: t.label }))} size="sm" align="end" />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
          <Button size="icon" variant={view === "grid" ? "secondary" : "ghost"} className="h-7 w-7" onClick={() => setView("grid")}><Grid3x3 className="h-3.5 w-3.5" /></Button>
          <Button size="icon" variant={view === "table" ? "secondary" : "ghost"} className="h-7 w-7" onClick={() => setView("table")}><List className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <DataCard><EmptyState icon={Users} title="No contacts found" /></DataCard>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c) => (
            <div key={c.id} className="group surface-card-interactive p-5">
              <div className="flex items-center justify-between">
                <Avatar className="h-12 w-12 border border-border"><AvatarFallback>{getInitials(c.name)}</AvatarFallback></Avatar>
                <StatusBadge tone={tierTone[c.tier]}>{c.tier}</StatusBadge>
              </div>
              <p className="mt-3 truncate font-medium">{c.name}</p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> <span className="truncate">{c.email}</span></p>
                <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {c.phone}</p>
                <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {c.city}, {c.country}</p>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>{c.ordersCount} orders</span>
                <span className="font-semibold text-foreground">{formatCurrency(c.totalSpent, c.currency)}</span>
              </div>
              <div className="mt-2 flex justify-end gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleting(c)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DataCard flush>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Last order</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 border border-border"><AvatarFallback className="text-[10px]">{getInitials(c.name)}</AvatarFallback></Avatar>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{c.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.phone}</TableCell>
                  <TableCell className="text-sm text-muted-foreground"><Building2 className="mr-1 inline h-3 w-3" />{c.city}, {c.country}</TableCell>
                  <TableCell><StatusBadge tone={tierTone[c.tier]}>{c.tier}</StatusBadge></TableCell>
                  <TableCell className="text-sm font-semibold">{formatCurrency(c.totalSpent, c.currency)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(c.lastOrderAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleting(c)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataCard>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit contact" : "New contact"}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5"><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Email</Label><Input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
            <div className="grid gap-1.5"><Label>Phone</Label><Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>City</Label><Input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></div>
              <div className="grid gap-1.5"><Label>Country</Label><Input value={draft.country} onChange={(e) => setDraft({ ...draft, country: e.target.value })} /></div>
            </div>
            <div className="grid gap-1.5">
              <Label>Tier</Label>
              <Select value={draft.tier} onValueChange={(v) => setDraft({ ...draft, tier: v as Customer["tier"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIERS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete contact?"
        description={deleting ? `${deleting.name} will be permanently removed.` : ""}
        confirmLabel="Delete"
        tone="destructive"
        onConfirm={() => { if (deleting) { customersStore.remove(deleting.id); setDeleting(null); } }}
      />
    </PageContainer>
  );
}