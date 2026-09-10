import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { useMemo } from "react";
import {
  ArrowUpRight,
  Database,
  HandCoins,
  PhoneCall,
  Mail,
  MessageSquare,
  RefreshCw,
  UserPlus,
  Users,
  Briefcase,
  CalendarClock,
} from "lucide-react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Bar, BarChart, CartesianGrid, Legend } from "recharts";
import { DataCard, PageContainer, PageHeader, StatCard, StatusBadge, type StatusTone } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useSimulatedLoad } from "@/hooks/use-simulated-load";
import { formatCurrency, formatNumber, formatPercent, formatRelative, getInitials } from "@/lib/formatters";
import {
  PlatformActivityFeed,
  PlatformAttachmentsPanel,
  PlatformNotesPanel,
  PlatformRelationsPanel,
  PlatformTaskWorkspace,
  PlatformTimeline,
} from "@/loopdev/components/platform";
import {
  usePlatformActivities,
  usePlatformAttachments,
  usePlatformNotes,
  usePlatformTasks,
  usePlatformTimeline,
  platformAdapter,
} from "@/loopdev/domains/platform";
import type { EntityRef } from "@/loopdev/domains/platform";

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
  padding: "8px 12px",
  boxShadow: "0 12px 32px -12px hsl(var(--foreground) / 0.18)",
};

const pipeline = [
  { stage: "Prospect", value: 28, amount: 184000 },
  { stage: "Qualified", value: 19, amount: 142000 },
  { stage: "Proposal", value: 12, amount: 98000 },
  { stage: "Negotiation", value: 7, amount: 64000 },
  { stage: "Won", value: 5, amount: 41000 },
];

const funnel = [
  { stage: "Visits", value: 14820 },
  { stage: "Leads", value: 4280 },
  { stage: "MQLs", value: 1920 },
  { stage: "SQLs", value: 720 },
  { stage: "Opportunities", value: 215 },
  { stage: "Closed-won", value: 64 },
];

const contactsByDay = [
  { label: "Mon", calls: 18, emails: 42, meetings: 6 },
  { label: "Tue", calls: 22, emails: 51, meetings: 9 },
  { label: "Wed", calls: 17, emails: 38, meetings: 5 },
  { label: "Thu", calls: 26, emails: 60, meetings: 11 },
  { label: "Fri", calls: 21, emails: 47, meetings: 8 },
  { label: "Sat", calls: 6, emails: 12, meetings: 1 },
  { label: "Sun", calls: 3, emails: 8, meetings: 0 },
];

const crmOwners = [
  { id: "u_02", name: "Maya Chen", title: "Account Executive" },
  { id: "u_03", name: "Daniel Ortiz", title: "Sales Manager" },
  { id: "u_05", name: "Sofia Rossi", title: "Account Executive" },
  { id: "u_07", name: "Liam Wilson", title: "Customer Success" },
  { id: "u_08", name: "Nora Patel", title: "Sales Development" },
];

type InteractionType = "call" | "email" | "meeting" | "note";
const interactionTone: Record<InteractionType, StatusTone> = {
  call: "info",
  email: "primary",
  meeting: "gold",
  note: "neutral",
};
const interactionIcon: Record<InteractionType, typeof PhoneCall> = {
  call: PhoneCall,
  email: Mail,
  meeting: CalendarClock,
  note: MessageSquare,
};

const interactions: {
  id: string;
  type: InteractionType;
  contact: string;
  company: string;
  ownerId: string;
  summary: string;
  at: string;
}[] = [
  { id: "i1", type: "call", contact: "Helena Park", company: "Atlas Coffee Co.", ownerId: "u_02", summary: "Renewal discussion — extending to annual plan", at: new Date(Date.now() - 1000 * 60 * 35).toISOString() },
  { id: "i2", type: "email", contact: "Tomás Iglesias", company: "Harbor Logistics", ownerId: "u_03", summary: "Sent proposal v3 with revised pricing", at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: "i3", type: "meeting", contact: "Naomi Ferrer", company: "Coral Boutique", ownerId: "u_07", summary: "Quarterly review — expansion to 5 stores", at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  { id: "i4", type: "note", contact: "Jack Whitcombe", company: "Northwind Supply", ownerId: "u_05", summary: "Logged budget approval signal from CFO", at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString() },
  { id: "i5", type: "call", contact: "Sara Lindqvist", company: "Sage Magazine", ownerId: "u_02", summary: "Discovery call — editorial CMS pain points", at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString() },
  { id: "i6", type: "email", contact: "Owen Rhodes", company: "Driftwood Studio", ownerId: "u_03", summary: "Follow-up after demo, awaiting signature", at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
];

export default function SalesCRM() {
  const { config: __theme } = useThemeConfig();
  const { curve } = resolveChartStyle(__theme.chartStyle);
  const { trail } = useBreadcrumbs();
  const loading = useSimulatedLoad(700);
  const userMap = useMemo(() => new Map(crmOwners.map((u) => [u.id, u])), []);
  const totalPipeline = pipeline.reduce((s, p) => s + p.amount, 0);
  const { organizationId, workspaceId, brandId } = platformAdapter.getScope();
  const platformScope = useMemo(() => ({ organizationId, workspaceId, brandId }), [organizationId, workspaceId, brandId]);
  const contactRef: EntityRef<"contact"> = useMemo(() => ({
    entityType: "contact",
    entityId: "crm_cust_1",
    scope: platformScope,
  }), [platformScope]);
  const leadRef: EntityRef<"lead"> = useMemo(() => ({
    entityType: "lead",
    entityId: "local-lead-crm_cust_1",
    scope: platformScope,
  }), [platformScope]);
  const opportunityRef: EntityRef<"opportunity"> = useMemo(() => ({
    entityType: "opportunity",
    entityId: "crm_opp_1",
    scope: platformScope,
  }), [platformScope]);
  const platformTasks = usePlatformTasks({ includeCompleted: false, limit: 10 });
  const platformNotes = usePlatformNotes({ limit: 10 });
  const platformTimeline = usePlatformTimeline({ limit: 10 });
  const platformActivities = usePlatformActivities({ limit: 10 });
  const platformAttachments = usePlatformAttachments({ limit: 10 });

  return (
    <PageContainer width="wide">
      <PageHeader
        title="CRM"
        description="Pipeline health, customer activity, and sales performance."
        breadcrumbs={trail.length ? trail : [{ label: "Dashboard" }, { label: "CRM" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard loading={loading} label="New Leads" value={formatNumber(284)} delta={9.4} hint="this month" icon={UserPlus} accent="primary" />
        <StatCard loading={loading} label="Open Deals" value={formatNumber(71)} delta={3.8} hint={formatCurrency(totalPipeline, "USD", { compact: true }) + " in pipeline"} icon={Briefcase} accent="info" />
        <StatCard loading={loading} label="Customers" value={formatNumber(1284)} delta={2.1} hint="active accounts" icon={Users} accent="gold" />
        <StatCard loading={loading} label="Won This Month" value={formatCurrency(184500)} delta={14.6} hint="closed-won" icon={HandCoins} accent="success" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard title="Deals pipeline" description="Open deals by stage" className="lg:col-span-2" loading={loading} loadingHeight={272}>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipeline} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stage" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, n: string) => (n === "amount" ? formatCurrency(v) : v)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
                <Bar name="Deals" dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Sales funnel" description="Conversion across the journey" loading={loading} loadingHeight={240}>
          <ul className="space-y-3">
            {funnel.map((f, i) => {
              const pct = (f.value / funnel[0].value) * 100;
              const conv = i === 0 ? null : (f.value / funnel[i - 1].value) * 100;
              return (
                <li key={f.stage}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{f.stage}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatNumber(f.value)}
                      {conv !== null && <span className="ml-2 text-muted-foreground/70">{formatPercent(conv, { alreadyPercent: true, decimals: 1 })}</span>}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-primary transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </DataCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard title="Contact activity" description="Calls, emails, and meetings this week" className="lg:col-span-2" loading={loading} loadingHeight={224}>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={contactsByDay} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="hsl(var(--border) / 0.6)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
                <Line type={curve} dataKey="calls" stroke="hsl(var(--info))" strokeWidth={2} dot={false} />
                <Line type={curve} dataKey="emails" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
                <Line type={curve} dataKey="meetings" stroke="hsl(var(--gold))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DataCard>

        <DataCard title="Top owners" description="By pipeline this week" loading={loading} loadingHeight={224}>
          <ul className="space-y-3">
            {crmOwners.map((u, i) => {
              const amount = 84000 - i * 12500;
              return (
                <li key={u.id} className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">
                      {getInitials(u.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.title}</p>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-foreground">{formatCurrency(amount, "USD", { compact: true })}</span>
                </li>
              );
            })}
          </ul>
        </DataCard>
      </div>

      <div className="mt-6">
        <DataCard
          title="Recent interactions"
          description="Latest touchpoints across your team"
          flush
          loading={loading}
          loadingHeight={260}
          empty={!loading && interactions.length === 0}
          emptyIcon={MessageSquare}
          emptyTitle="No interactions yet"
          emptyDescription="Logged calls, emails, and meetings will appear here."
          footer={
            <span className="inline-flex items-center gap-1 font-medium text-primary">
              {interactions.length} interactions <ArrowUpRight className="h-3 w-3" />
            </span>
          }
        >
          <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Contact</th>
                    <th className="px-5 py-3 font-medium">Company</th>
                    <th className="px-5 py-3 font-medium">Owner</th>
                    <th className="px-5 py-3 font-medium">Summary</th>
                    <th className="px-5 py-3 font-medium">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {interactions.map((it) => {
                    const Icon = interactionIcon[it.type];
                    const owner = userMap.get(it.ownerId);
                    return (
                      <tr key={it.id} className="transition-fast hover:bg-muted/50">
                        <td className="px-5 py-3">
                          <StatusBadge tone={interactionTone[it.type]}>
                            <Icon className="h-3 w-3" />
                            {it.type}
                          </StatusBadge>
                        </td>
                        <td className="px-5 py-3 font-medium text-foreground">{it.contact}</td>
                        <td className="px-5 py-3 text-muted-foreground">{it.company}</td>
                        <td className="px-5 py-3">
                          {owner ? (
                            <span className="inline-flex items-center gap-2">
                              <Avatar className="h-6 w-6 border border-border">
                                <AvatarFallback className="bg-primary-soft text-[10px] font-semibold text-primary">
                                  {getInitials(owner.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-foreground">{owner.name}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{it.summary}</td>
                        <td className="px-5 py-3 text-muted-foreground">{formatRelative(it.at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </div>
        </DataCard>
      </div>

      <div className="mt-8">
        <div className="mb-4">
          <h2 className="font-display text-xl font-semibold tracking-tight">CRM work center</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Shared Platform capabilities across the commercial workspace.
          </p>
        </div>

        <DataCard className="mb-6" borderless>
          <div className="flex flex-wrap items-start gap-3">
            <div className="rounded-lg bg-primary-soft p-2 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">Platform work signals</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tasks, notes, activities, timeline and files are scoped for the active organization and ready for the future Supabase adapter.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={platformTasks.reload}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </DataCard>

        <PlatformRelationsPanel references={[
          { label: "Contact", reference: contactRef, href: "/app/sales-crm/contacts/crm_cust_1" },
          { label: "Lead", reference: leadRef, href: "/app/sales-crm/leads" },
          { label: "Opportunity", reference: opportunityRef, href: "/app/sales-crm/opportunities" },
        ]} />

        <div className="mt-6">
          <PlatformTaskWorkspace
            tasks={platformTasks.tasks}
            loading={platformTasks.loading}
            error={platformTasks.error}
            forbidden={platformTasks.forbidden}
            relation={contactRef}
            onTransition={(task, status) => platformTasks.transitionTask(task.id, status, task.version)}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PlatformNotesPanel
            notes={platformNotes.notes}
            loading={platformNotes.loading}
            error={platformNotes.error}
            forbidden={platformNotes.forbidden}
          />
          <PlatformTimeline events={platformTimeline.events} loading={platformTimeline.loading} error={platformTimeline.error} />
          <PlatformActivityFeed activities={platformActivities.activities} loading={platformActivities.loading} error={platformActivities.error} />
          <PlatformAttachmentsPanel attachments={platformAttachments.attachments} loading={platformAttachments.loading} error={platformAttachments.error} />
        </div>

      </div>
    </PageContainer>
  );
}
