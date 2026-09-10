import { useState } from "react";
import { Activity, CheckCircle2, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContainer, PageHeader, StatusBadge, SurfaceCard, SurfaceCardBody, SurfaceCardHeader } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useCrmAutomations } from "@/loopdev/domains/crm/hooks/use-crm-automations";
import { useOrganizationEntitlements } from "@/loopdev/domains/platform";

export default function CRMAutomations() {
  const { trail } = useBreadcrumbs();
  const [name, setName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const automationState = useCrmAutomations();
  const entitlementState = useOrganizationEntitlements();

  const createAutomation = async () => {
    if (!name.trim()) return;
    try {
      await automationState.createAutomation({
        name,
        description: "Create a follow-up task when a lead becomes qualified.",
        trigger: { eventType: "lead.status_changed", conditions: { status: "qualified" } },
        actions: [{ type: "create_task", payload: { title: "Follow up with qualified lead", priority: "high" } }],
      });
      setName("");
      setNotice("Automation created locally.");
    } catch (cause: unknown) {
      setNotice(cause instanceof Error ? cause.message : "Automation could not be created.");
    }
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        title="CRM automations"
        description="Local event triggers, actions, execution history, and organization limits."
        breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Automations" }]}
        actions={<Button variant="outline" onClick={() => { automationState.reload(); entitlementState.reload(); }}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Refresh</Button>}
      />
      {notice && <div role="status" className="rounded-lg border border-primary/20 bg-primary-soft/30 px-3 py-2 text-sm">{notice}</div>}
      {automationState.error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{automationState.error}</div>}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <SurfaceCard>
          <SurfaceCardHeader title="Automation rules" description="Rules are scoped to the active local organization." icon={Activity} />
          <SurfaceCardBody className="space-y-4">
            <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); void createAutomation(); }}>
              <div className="min-w-60 flex-1"><Label htmlFor="automation-name">New rule</Label><Input id="automation-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Qualified lead follow-up" /></div>
              <Button type="submit"><Plus className="mr-1.5 h-3.5 w-3.5" />Add rule</Button>
            </form>
            {automationState.loading ? <p className="text-sm text-muted-foreground">Loading automations…</p> : automationState.automations.length === 0 ? <p className="text-sm text-muted-foreground">No automations configured.</p> : <div className="divide-y divide-border rounded-lg border border-border">{automationState.automations.map((automation) => <div key={automation.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"><div><p className="font-medium">{automation.name}</p><p className="text-xs text-muted-foreground">When {automation.trigger.eventType} · {automation.actions.length} action{automation.actions.length === 1 ? "" : "s"}</p></div><Button size="sm" variant="outline" onClick={() => void automationState.toggleAutomation(automation)}>{automation.active ? "Disable" : "Enable"}</Button></div>)}</div>}
          </SurfaceCardBody>
        </SurfaceCard>

        <SurfaceCard>
          <SurfaceCardHeader title="Organization entitlements" description="Local limits replace billing until a provider is approved." icon={ShieldCheck} />
          <SurfaceCardBody className="space-y-3">
            {entitlementState.entitlements.map((entitlement) => <div key={entitlement.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2"><div><p className="text-sm font-medium">{entitlement.key}</p><p className="text-xs text-muted-foreground">{entitlement.limit === null ? "Unlimited" : `${entitlement.used} / ${entitlement.limit} used`}</p></div><StatusBadge tone={entitlement.enabled ? "success" : "neutral"}>{entitlement.enabled ? "Enabled" : "Disabled"}</StatusBadge></div>)}
          </SurfaceCardBody>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <SurfaceCardHeader title="Execution log" description="Idempotent events appear once even when delivered repeatedly." icon={CheckCircle2} />
        <SurfaceCardBody>{automationState.executionLog.length === 0 ? <p className="text-sm text-muted-foreground">No executions recorded yet.</p> : <div className="divide-y divide-border rounded-lg border border-border">{automationState.executionLog.map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"><div><p className="font-medium">{entry.status}</p><p className="text-xs text-muted-foreground">{entry.idempotencyKey} · {entry.actionCount} actions</p></div><span className="text-xs text-muted-foreground">{new Date(entry.completedAt).toLocaleString()}</span></div>)}</div>}</SurfaceCardBody>
      </SurfaceCard>
    </PageContainer>
  );
}
