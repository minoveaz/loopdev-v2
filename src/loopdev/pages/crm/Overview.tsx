import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, BriefcaseBusiness, CheckCircle2, CircleDollarSign, ClipboardCheck, RefreshCw, Users, Activity as ActivityIcon } from "lucide-react";
import { DataCard, PageContainer, PageHeader, StatCard } from "@/components/common";
import { AnalyticsEmptyState } from "@/components/analytics";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { useT } from "@/i18n";
import { formatCurrency, formatNumber, formatRelative } from "@/lib/formatters";
import { usePlatformActivities, usePlatformTasks, platformAdapter } from "@/loopdev/domains/platform";
import { useAnalyticsBreakdown, useAnalyticsMetric } from "@/loopdev/domains/platform/analytics";
import { filterBusinessActivities, getTaskSummary } from "@/loopdev/domains/crm/overview";

function QueryState({ status, error, onRetry, children }: { status: string; error?: string | null; onRetry: () => void; children: ReactNode }) {
  const t = useT();
  if (status === "loading") return <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground" role="status">{t("crm.overview.loading")}</div>;
  if (status === "forbidden") return <AnalyticsEmptyState message={t("crm.overview.forbiddenTitle")} description={t("crm.overview.forbiddenDescription")} />;
  if (status === "error" || status === "offline") return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center" role="alert">
      <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
      <p className="text-sm font-medium">{t("crm.overview.errorTitle")}</p>
      <p className="text-xs text-muted-foreground">{error ?? t("crm.overview.errorDescription")}</p>
      <button type="button" className="text-sm font-medium text-primary underline-offset-4 hover:underline" onClick={onRetry}>{t("crm.overview.retry")}</button>
    </div>
  );
  return <>{children}</>;
}

export default function SalesCRM() {
  const t = useT();
  const navigate = useNavigate();
  const { activeOrganization } = useTenantContext();
  const { brandId } = platformAdapter.getScope();
  const organizationId = activeOrganization?.id ?? "";
  const workspaceId = organizationId && organizationId !== "local-development-organization" ? null : platformAdapter.getScope().workspaceId;
  const scope = useMemo(() => ({ organizationId, workspaceId, brandId }), [organizationId, workspaceId, brandId]);
  const filters = useMemo(() => ({ scope }), [scope]);
  const pipelineMetric = useAnalyticsMetric("crm.pipeline_value", filters);
  const leadsMetric = useAnalyticsMetric("crm.open_leads", filters);
  const opportunitiesMetric = useAnalyticsMetric("crm.open_opportunities", filters);
  const kpis = [
    { id: "crm.pipeline_value", label: t("crm.overview.openPipeline"), icon: CircleDollarSign, format: "currency" as const, query: pipelineMetric },
    { id: "crm.open_leads", label: t("crm.overview.openLeads"), icon: Users, format: "number" as const, query: leadsMetric },
    { id: "crm.open_opportunities", label: t("crm.overview.openOpportunities"), icon: BriefcaseBusiness, format: "number" as const, query: opportunitiesMetric },
  ];
  const pipeline = useAnalyticsBreakdown("crm.pipeline_by_stage", filters);
  const tasks = usePlatformTasks({ scope, includeCompleted: false, limit: 8 });
  const activities = usePlatformActivities({ scope, limit: 20 });
  const businessActivities = useMemo(() => filterBusinessActivities(activities.activities), [activities.activities]);
  const taskSummary = useMemo(() => getTaskSummary(tasks.tasks), [tasks.tasks]);
  const retryAll = () => { tasks.reload(); activities.reload(); };

  return (
    <PageContainer width="wide">
      <PageHeader title={t("crm.overview.dashboard")} description={t("crm.overview.description")} breadcrumbs={[{ label: "CRM" }, { label: t("crm.overview.dashboard") }]} />
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{t("crm.overview.scopeHint")}</p>
        <button type="button" className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted" onClick={retryAll}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> {t("crm.overview.refresh")}
        </button>
      </div>

      <section aria-labelledby="overview-kpis" className="mb-6">
        <h2 id="overview-kpis" className="sr-only">{t("crm.overview.kpisTitle")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map(({ id, label, icon, format, query }) => (
            <StatCard key={id} loading={query.status === "loading"} label={label}
              value={query.data ? format === "currency" ? formatCurrency(query.data.value) : formatNumber(query.data.value) : "—"}
              hint={query.status === "empty" ? t("crm.overview.noData") : query.status === "error" ? t("crm.overview.unavailable") : t("crm.overview.rlsVisible")}
              icon={icon} accent="primary" />
          ))}
          <StatCard loading={tasks.loading} label={t("crm.overview.overdueToday")} value={`${taskSummary.overdueCount} / ${taskSummary.todayCount}`} hint={tasks.forbidden ? t("crm.overview.forbiddenTitle") : tasks.freshness === "stale" ? t("crm.overview.stale") : t("crm.overview.tasksHint")} icon={ClipboardCheck} accent="gold" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DataCard title={t("crm.overview.pipelineTitle")} description={t("crm.overview.pipelineDescription")} className="lg:col-span-2">
          <QueryState status={pipeline.status} error={pipeline.error} onRetry={pipeline.reload}>
            {pipeline.data?.items.length ? <ul className="space-y-4">{pipeline.data.items.map((item) => (
              <li key={item.key}>
                <div className="mb-1 flex justify-between text-sm"><span>{t(`crm.opportunities.stages.${item.key}`)}</span><span className="font-mono">{formatNumber(item.value)}</span></div>
                <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, item.value)}%` }} /></div>
              </li>
            ))}</ul> : <AnalyticsEmptyState message={t("crm.overview.noPipeline")} description={t("crm.overview.noPipelineDescription")} />}
          </QueryState>
        </DataCard>
        <DataCard title={t("crm.overview.tasksTitle")} description={t("crm.overview.tasksDescription")}>
          <QueryState status={tasks.forbidden ? "forbidden" : tasks.error && tasks.freshness === "unavailable" ? "error" : tasks.loading ? "loading" : "success"} error={tasks.error} onRetry={tasks.reload}>
            {tasks.freshness === "stale" && <p className="mb-2 text-xs text-warning" role="status">{t("crm.overview.stale")}</p>}
            {taskSummary.next.length ? <ul className="space-y-3">{taskSummary.next.map((task) => (
              <li key={task.id}><button type="button" className="w-full rounded-md p-2 text-left hover:bg-muted" onClick={() => navigate(`/app/sales-crm/tasks?taskId=${encodeURIComponent(task.id)}`)}>
                <span className="block truncate text-sm font-medium">{task.title}</span><span className="text-xs text-muted-foreground">{task.dueAt ? formatRelative(task.dueAt) : t("crm.overview.noDueDate")}</span>
              </button></li>
            ))}</ul> : <AnalyticsEmptyState message={t("crm.overview.noTasks")} description={t("crm.overview.noTasksDescription")} />}
            <button type="button" className="mt-4 text-sm font-medium text-primary underline-offset-4 hover:underline" onClick={() => navigate("/app/sales-crm/tasks")}>{t("crm.overview.openTasks")}</button>
          </QueryState>
        </DataCard>
      </div>

      <DataCard className="mt-6" title={t("crm.overview.activityTitle")} description={t("crm.overview.activityDescription")}>
        <QueryState status={activities.error && activities.freshness === "unavailable" ? "error" : activities.loading ? "loading" : "success"} error={activities.error} onRetry={activities.reload}>
          {activities.freshness === "stale" && <p className="mb-2 text-xs text-warning" role="status">{t("crm.overview.stale")}</p>}
          {businessActivities.length ? <ul className="divide-y divide-border">{businessActivities.slice(0, 8).map((activity) => (
            <li key={activity.id} className="flex items-start gap-3 py-3"><ActivityIcon className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-sm">{activity.summary === "Contact update" ? t("crm.overview.contactUpdate") : activity.summary === "Opportunity update" ? t("crm.overview.opportunityUpdate") : activity.summary}</p><p className="text-xs text-muted-foreground">{activity.type === "assignment" ? t("crm.overview.assignment") : activity.type === "stage_change" ? t("crm.overview.stageChange") : activity.type} · {formatRelative(activity.occurredAt)}</p></div></li>
          ))}</ul> : <AnalyticsEmptyState message={t("crm.overview.noActivity")} description={t("crm.overview.noActivityDescription")} />}
        </QueryState>
      </DataCard>
    </PageContainer>
  );
}
