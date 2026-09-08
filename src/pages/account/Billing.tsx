import { useMemo, useState } from "react";
import {
  CreditCard,
  Download,
  Loader2,
  Plus,
  Receipt,
  Save,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog, DataCard, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { storage } from "@/lib/storage";
import { cn } from "@/lib/utils";

const BILLING_KEY = "account:billing";

type Plan = "starter" | "pro" | "enterprise";
type Cycle = "monthly" | "yearly";

interface PaymentMethod {
  id: string;
  brand: "Visa" | "Mastercard" | "Amex";
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface BillingState {
  plan: Plan;
  cycle: Cycle;
  seats: number;
  company: string;
  taxId: string;
  email: string;
  country: string;
  address: string;
  city: string;
  postalCode: string;
  methods: PaymentMethod[];
}

const DEFAULTS: BillingState = {
  plan: "pro",
  cycle: "monthly",
  seats: 5,
  company: "Rivera Studio",
  taxId: "PT123456789",
  email: "billing@rivera.studio",
  country: "PT",
  address: "Rua das Flores 12",
  city: "Lisbon",
  postalCode: "1100-052",
  methods: [
    { id: "pm_1", brand: "Visa", last4: "4242", expMonth: 8, expYear: 2027, isDefault: true },
    { id: "pm_2", brand: "Mastercard", last4: "8210", expMonth: 3, expYear: 2026, isDefault: false },
  ],
};

const PLANS: { id: Plan; name: string; price: number; tagline: string; features: string[] }[] = [
  {
    id: "starter",
    name: "Starter",
    price: 12,
    tagline: "For solo operators",
    features: ["Up to 3 projects", "Basic analytics", "Email support"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 29,
    tagline: "For growing teams",
    features: ["Unlimited projects", "Advanced analytics", "Priority support", "Custom roles"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 79,
    tagline: "For scaling orgs",
    features: ["SSO & audit logs", "Dedicated CSM", "99.99% SLA", "Custom contracts"],
  },
];

const COUNTRIES = [
  { value: "PT", label: "Portugal" },
  { value: "ES", label: "Spain" },
  { value: "FR", label: "France" },
  { value: "DE", label: "Germany" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
];

const INVOICES = [
  { id: "INV-2026-005", date: "2026-05-01", amount: 145, status: "paid" as const },
  { id: "INV-2026-004", date: "2026-04-01", amount: 145, status: "paid" as const },
  { id: "INV-2026-003", date: "2026-03-01", amount: 145, status: "paid" as const },
  { id: "INV-2026-002", date: "2026-02-01", amount: 116, status: "paid" as const },
  { id: "INV-2026-001", date: "2026-01-01", amount: 116, status: "refunded" as const },
];

const billingSchema = z.object({
  company: z.string().trim().min(2, "Company is required.").max(120),
  taxId: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid billing email.").max(255),
  country: z.string().trim().min(2).max(2),
  address: z.string().trim().min(3, "Address is required.").max(160),
  city: z.string().trim().min(2, "City is required.").max(80),
  postalCode: z.string().trim().min(3, "Postal code is required.").max(20),
  seats: z.number().int().min(1).max(500),
});

function priceFor(plan: Plan, cycle: Cycle, seats: number) {
  const base = PLANS.find((p) => p.id === plan)!.price;
  const monthly = base * seats;
  return cycle === "yearly" ? Math.round(monthly * 12 * 0.8) : monthly;
}

export default function BillingPage() {
  const { trail } = useBreadcrumbs();
  const [state, setState] = useState<BillingState>(() => storage.get<BillingState>(BILLING_KEY, DEFAULTS));
  const [errors, setErrors] = useState<Partial<Record<keyof BillingState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const total = useMemo(() => priceFor(state.plan, state.cycle, state.seats), [state.plan, state.cycle, state.seats]);

  function update<K extends keyof BillingState>(key: K, value: BillingState[K]) {
    setState((s) => ({ ...s, [key]: value }));
    setDirty(true);
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSave() {
    const result = billingSchema.safeParse({
      company: state.company,
      taxId: state.taxId,
      email: state.email,
      country: state.country,
      address: state.address,
      city: state.city,
      postalCode: state.postalCode,
      seats: state.seats,
    });
    if (!result.success) {
      const next: typeof errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof BillingState;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      storage.set(BILLING_KEY, state);
      setSaving(false);
      setDirty(false);
      toast.success("Billing details saved");
    }, 500);
  }

  function makeDefault(id: string) {
    setState((s) => ({ ...s, methods: s.methods.map((m) => ({ ...m, isDefault: m.id === id })) }));
    setDirty(true);
    toast.success("Default payment method updated");
  }

  function removeMethod(id: string) {
    setState((s) => {
      const remaining = s.methods.filter((m) => m.id !== id);
      if (remaining.length && !remaining.some((m) => m.isDefault)) remaining[0].isDefault = true;
      return { ...s, methods: remaining };
    });
    setDirty(true);
    toast.success("Payment method removed");
  }

  function addMockMethod() {
    const last4 = String(Math.floor(1000 + Math.random() * 9000));
    const id = `pm_${Date.now()}`;
    setState((s) => ({
      ...s,
      methods: [
        ...s.methods,
        { id, brand: "Visa", last4, expMonth: 12, expYear: 2028, isDefault: s.methods.length === 0 },
      ],
    }));
    setDirty(true);
    toast.success(`Card ending in ${last4} added`);
  }

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Account Settings"
        title="Billing"
        description="Manage your subscription, payment methods, billing details, and invoices."
        breadcrumbs={trail.length ? trail : [{ label: "Account Settings" }, { label: "Billing" }]}
        actions={
          <Button size="sm" onClick={handleSave} disabled={saving || !dirty} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save changes"}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DataCard title="Subscription" description="Choose the plan that fits your team">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-lg border border-border bg-card p-1">
                {(["monthly", "yearly"] as Cycle[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update("cycle", c)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-fast",
                      state.cycle === c ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {c}
                    {c === "yearly" && <span className="ml-1.5 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-semibold text-success">−20%</span>}
                  </button>
                ))}
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Estimated total</p>
                <p className="font-display text-xl font-semibold text-foreground">${total}<span className="text-xs font-normal text-muted-foreground">/{state.cycle === "yearly" ? "yr" : "mo"}</span></p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {PLANS.map((p) => {
                const active = state.plan === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => update("plan", p.id)}
                    className={cn(
                      "group relative rounded-xl border p-4 text-left transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "border-primary bg-primary-soft/30 shadow-elegant"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/40",
                    )}
                  >
                    {active && (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        <Sparkles className="h-3 w-3" /> Current
                      </span>
                    )}
                    <p className="font-display text-base font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.tagline}</p>
                    <p className="mt-3 font-display text-2xl font-bold text-foreground">
                      ${p.price}
                      <span className="text-xs font-normal text-muted-foreground">/seat/mo</span>
                    </p>
                    <ul className="mt-3 space-y-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <span className="mt-0.5 h-1 w-1 rounded-full bg-primary" /> {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="seats">Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  min={1}
                  max={500}
                  value={state.seats}
                  onChange={(e) => update("seats", Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
                  aria-invalid={!!errors.seats}
                />
                {errors.seats && <p className="text-xs text-destructive">{errors.seats}</p>}
              </div>
            </div>
          </DataCard>

          <DataCard
            title="Payment methods"
            description="Cards used to charge your subscription"
            action={
              <Button size="sm" variant="outline" onClick={addMockMethod} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add card
              </Button>
            }
          >
            {state.methods.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No payment methods yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {state.methods.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex h-9 w-12 items-center justify-center rounded-md bg-muted text-[11px] font-semibold uppercase tracking-wider text-foreground">
                      {m.brand}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        •••• {m.last4}
                        {m.isDefault && (
                          <StatusBadge tone="success" dot className="ml-2 align-middle">Default</StatusBadge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Expires {String(m.expMonth).padStart(2, "0")}/{m.expYear}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!m.isDefault && (
                        <Button size="sm" variant="ghost" onClick={() => makeDefault(m.id)} className="gap-1.5">
                          <Star className="h-3.5 w-3.5" /> Make default
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Remove card"
                        onClick={() => setRemovingId(m.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DataCard>

          <DataCard title="Billing details" description="Used on invoices and tax documents">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={state.company} onChange={(e) => update("company", e.target.value)} aria-invalid={!!errors.company} />
                {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxId">Tax / VAT ID</Label>
                <Input id="taxId" value={state.taxId} onChange={(e) => update("taxId", e.target.value)} placeholder="e.g. PT123456789" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bemail">Billing email</Label>
                <Input id="bemail" type="email" value={state.email} onChange={(e) => update("email", e.target.value)} aria-invalid={!!errors.email} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <Select value={state.country} onValueChange={(v) => update("country", v)}>
                  <SelectTrigger id="country"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={state.address} onChange={(e) => update("address", e.target.value)} aria-invalid={!!errors.address} />
                {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={state.city} onChange={(e) => update("city", e.target.value)} aria-invalid={!!errors.city} />
                {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zip">Postal code</Label>
                <Input id="zip" value={state.postalCode} onChange={(e) => update("postalCode", e.target.value)} aria-invalid={!!errors.postalCode} />
                {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
              </div>
            </div>
          </DataCard>

          <DataCard title="Invoices" description="Download past invoices and receipts">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {INVOICES.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                    <TableCell className="text-sm">{new Date(inv.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm font-medium">${inv.amount}</TableCell>
                    <TableCell>
                      <StatusBadge tone={inv.status === "paid" ? "success" : "warning"} dot>
                        {inv.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => toast(`Downloading ${inv.id}`)}>
                        <Download className="h-3.5 w-3.5" /> PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataCard>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <DataCard title="Current plan">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-base font-semibold text-foreground capitalize">{state.plan}</p>
                <p className="text-xs text-muted-foreground">{state.seats} seats · {state.cycle}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Next charge</span>
                <span className="font-medium text-foreground">Jun 1, 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium text-foreground">${total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Billed to</span>
                <span className="font-mono text-xs text-foreground">
                  •••• {state.methods.find((m) => m.isDefault)?.last4 ?? "—"}
                </span>
              </div>
            </div>
          </DataCard>

          <DataCard title="Need help?" description="We're here for billing questions">
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Receipt className="mt-0.5 h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Request a custom invoice or PO terms.</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Switching plans? Pro-rated automatically.</span>
              </li>
            </ul>
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => toast("Support contacted")}>
              Contact billing support
            </Button>
          </DataCard>
        </div>
      </div>

      <ConfirmDialog
        open={!!removingId}
        onOpenChange={(o) => !o && setRemovingId(null)}
        title="Remove payment method?"
        description="This card will no longer be used for future charges. You can add it back at any time."
        confirmLabel="Remove card"
        tone="destructive"
        onConfirm={() => {
          if (removingId) removeMethod(removingId);
          setRemovingId(null);
        }}
      />
    </PageContainer>
  );
}