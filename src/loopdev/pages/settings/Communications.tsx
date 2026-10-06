import { useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleOff,
  FileText,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  ToggleRight,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageContainer, PageHeader, StatusBadge, SurfaceCard, SurfaceCardBody, SurfaceCardHeader } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useT } from "@/i18n";
import {
  CHANNEL_LABELS,
  COMMUNICATIONS_LOCAL_CONTEXT,
  type ChannelConnectionState,
  type CommunicationChannelAccount,
} from "@/loopdev/domains/communications";
import { useCommunicationsInbox } from "@/loopdev/domains/communications/hooks/use-communications";

const stateLabels: Record<ChannelConnectionState, string> = {
  connected: "communicationsSettings.states.connected",
  disconnected: "communicationsSettings.states.disconnected",
  pending: "communicationsSettings.states.pending",
  error: "communicationsSettings.states.error",
  coming_soon: "communicationsSettings.states.comingSoon",
  disabled: "communicationsSettings.states.disabled",
};

function stateTone(state: ChannelConnectionState): "success" | "warning" | "info" | "neutral" {
  if (state === "connected") return "success";
  if (state === "error" || state === "disconnected") return "warning";
  if (state === "pending") return "info";
  return "neutral";
}

function ChannelCapabilities({ account }: { account: CommunicationChannelAccount }) {
  const t = useT();
  const capabilities: Array<[string, boolean]> = [
    ["communicationsSettings.capabilities.reply", account.capabilities.canReply],
    ["communicationsSettings.capabilities.internalNotes", account.capabilities.canAddInternalNote],
    ["communicationsSettings.capabilities.templates", account.capabilities.supportsTemplates],
    ["communicationsSettings.capabilities.attachments", account.capabilities.supportsAttachments],
  ];
  return (
    <ul className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
      {capabilities.map(([label, enabled]) => (
        <li key={label} className="flex items-center gap-1.5">
          {enabled ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <CircleOff className="h-3.5 w-3.5 text-muted-foreground/60" />}
          <span>{t(label)}</span>
        </li>
      ))}
    </ul>
  );
}

function ChannelCard({ account, policyEnabled, onPolicyChange }: { account: CommunicationChannelAccount; policyEnabled: boolean; onPolicyChange: (checked: boolean) => void }) {
  const t = useT();
  const connected = account.state === "connected";
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <h3 className="font-medium">{CHANNEL_LABELS[account.channel]}</h3>
            <StatusBadge tone={stateTone(account.state)} dot>{t(stateLabels[account.state])}</StatusBadge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{account.label}</p>
        </div>
        <Button variant="outline" size="sm" disabled={!connected}>{t("communicationsSettings.manageConnection")}</Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{account.statusMessage}.</p>
      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("communicationsSettings.capabilities.title")}</p>
        <ChannelCapabilities account={account} />
      </div>
      {connected && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
          <div>
            <p className="text-xs font-medium">Channel policy</p>
            <p className="text-[11px] text-muted-foreground">Allow local replies and internal notes.</p>
          </div>
          <Switch checked={policyEnabled} onCheckedChange={onPolicyChange} aria-label="Enable WhatsApp channel policy" />
        </div>
      )}
    </div>
  );
}

export default function CommunicationsSettings() {
  const { trail } = useBreadcrumbs();
  const t = useT();
  const inbox = useCommunicationsInbox({}, COMMUNICATIONS_LOCAL_CONTEXT);
  const [killSwitch, setKillSwitch] = useState(false);
  const [policyEnabled, setPolicyEnabled] = useState(true);
  const connectedCount = useMemo(() => inbox.channels.filter((account) => account.state === "connected").length, [inbox.channels]);

  return (
    <PageContainer width="wide">
      <PageHeader
        title={t("communicationsSettings.title")}
        description={t("communicationsSettings.description")}
        breadcrumbs={trail.length ? trail : [{ label: t("settings.title") }, { label: t("settings.communications") }]}
        actions={<Button variant="outline" onClick={inbox.reload}><RefreshCw className="me-1.5 h-3.5 w-3.5" />{t("communicationsSettings.refresh")}</Button>}
      />

      {inbox.error && <div role="alert" className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{inbox.error}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <SurfaceCard><SurfaceCardBody className="flex items-center gap-3 p-4"><CheckCircle2 className="h-5 w-5 text-success" /><div><p className="text-xs text-muted-foreground">{t("communicationsSettings.connectedAccounts")}</p><p className="text-xl font-semibold">{connectedCount}</p></div></SurfaceCardBody></SurfaceCard>
        <SurfaceCard><SurfaceCardBody className="flex items-center gap-3 p-4"><ShieldCheck className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">{t("communicationsSettings.localMode")}</p><p className="text-sm font-semibold">{t("communicationsSettings.noProviders")}</p></div></SurfaceCardBody></SurfaceCard>
        <SurfaceCard><SurfaceCardBody className="flex items-center gap-3 p-4"><LockKeyhole className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{t("communicationsSettings.policy")}</p><p className="text-sm font-semibold">{killSwitch ? t("communicationsSettings.paused") : t("communicationsSettings.operational")}</p></div></SurfaceCardBody></SurfaceCard>
      </div>

      <SurfaceCard className="mt-6">
        <SurfaceCardHeader title={t("communicationsSettings.channelAccounts")} description={t("communicationsSettings.channelAccountsDescription")} icon={SlidersHorizontal} />
        <SurfaceCardBody className="space-y-3">
          {inbox.loading && <p className="text-sm text-muted-foreground">{t("communicationsSettings.loading")}</p>}
          {!inbox.loading && inbox.channels.map((account) => (
            <ChannelCard key={account.id} account={account} policyEnabled={policyEnabled} onPolicyChange={setPolicyEnabled} />
          ))}
        </SurfaceCardBody>
      </SurfaceCard>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SurfaceCard>
          <SurfaceCardHeader title={t("communicationsSettings.templates")} description={t("communicationsSettings.templatesDescription")} icon={FileText} />
          <SurfaceCardBody className="space-y-3">
            <div className="rounded-md border border-dashed border-border px-3 py-4 text-sm">
              <p className="font-medium">{t("communicationsSettings.templatesReady")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("communicationsSettings.templatesNotRegistered")}</p>
            </div>
            <Button variant="outline" disabled>{t("communicationsSettings.manageTemplates")}</Button>
          </SurfaceCardBody>
        </SurfaceCard>

        <SurfaceCard>
          <SurfaceCardHeader title={t("communicationsSettings.permissionsTitle")} description={t("communicationsSettings.permissionsDescription")} icon={ShieldCheck} />
          <SurfaceCardBody className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm font-medium">{t("communicationsSettings.allowActions")}</p><p className="text-xs text-muted-foreground">{t("communicationsSettings.allowActionsDescription")}</p></div>
              <Switch checked={policyEnabled && !killSwitch} disabled={killSwitch} onCheckedChange={setPolicyEnabled} aria-label={t("communicationsSettings.allowActions")} />
            </div>
            <div className="flex items-start justify-between gap-3 rounded-md border border-warning/30 bg-warning-soft/40 p-3">
              <div className="flex gap-2"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" /><div><p className="text-sm font-medium">{t("communicationsSettings.killSwitch")}</p><p className="text-xs text-muted-foreground">{t("communicationsSettings.killSwitchDescription")}</p></div></div>
              <Switch checked={killSwitch} onCheckedChange={setKillSwitch} aria-label={t("communicationsSettings.killSwitch")} />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><ToggleRight className="h-4 w-4" />{t("communicationsSettings.noExternalProviders")}</div>
          </SurfaceCardBody>
        </SurfaceCard>
      </div>
    </PageContainer>
  );
}
