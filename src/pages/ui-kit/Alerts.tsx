import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  X,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, StatusBadge, type StatusTone } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Showcase, ShowcaseRow } from "@/features/ui-kit/Showcase";
import { cn } from "@/lib/utils";

/** Tone-aware alert built on top of shadcn's Alert primitive. */
function ToneAlert({
  tone,
  title,
  children,
  className,
  icon: Icon,
  onDismiss,
}: {
  tone: "info" | "success" | "warning" | "destructive";
  title: string;
  children: React.ReactNode;
  className?: string;
  icon: React.ComponentType<{ className?: string }>;
  onDismiss?: () => void;
}) {
  const toneClass: Record<typeof tone, string> = {
    info: "border-info/40 bg-info-soft text-foreground [&>svg]:text-info",
    success: "border-success/40 bg-success-soft text-foreground [&>svg]:text-success",
    warning: "border-warning/40 bg-warning-soft text-foreground [&>svg]:text-warning",
    destructive: "border-destructive/40 bg-destructive-soft text-foreground [&>svg]:text-destructive",
  };
  return (
    <Alert className={cn(toneClass[tone], "pr-12", className)}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="text-muted-foreground">{children}</AlertDescription>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-fast hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </Alert>
  );
}

const banners: { tone: StatusTone; label: string }[] = [
  { tone: "info", label: "Heads up" },
  { tone: "success", label: "Saved" },
  { tone: "warning", label: "Action needed" },
  { tone: "destructive", label: "Error" },
];

export default function AlertsPage() {
  const { trail } = useBreadcrumbs();
  const [dismissed, setDismissed] = useState(false);

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="UI Kit"
        title="Alerts"
        description="Inline messages, banners, and feedback patterns for status communication."
        breadcrumbs={trail.length ? trail : [{ label: "UI Kit" }, { label: "Alerts" }]}
      />

      <div className="space-y-6">
        <Showcase title="Inline alerts" description="Tone-aware status messages" hint="tone">
          <div className="space-y-3">
            <ToneAlert tone="info" title="New collaborator" icon={Info}>
              Henrik Voss accepted your invitation and has joined the workspace.
            </ToneAlert>
            <ToneAlert tone="success" title="Invoice paid" icon={CheckCircle2}>
              Payment for INV-2026-0042 was received and reconciled.
            </ToneAlert>
            <ToneAlert tone="warning" title="Storage almost full" icon={AlertTriangle}>
              You're using 92% of your plan storage. Upgrade to avoid interruptions.
            </ToneAlert>
            <ToneAlert tone="destructive" title="Payment failed" icon={AlertCircle}>
              The card on file was declined. Update billing details to keep services active.
            </ToneAlert>
          </div>
        </Showcase>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Showcase title="Dismissible" description="Closeable banner with X affordance" hint="dismiss">
            {dismissed ? (
              <div className="flex items-center justify-between rounded-xl border border-dashed border-border bg-card-muted p-4 text-sm text-muted-foreground">
                Banner dismissed.
                <Button size="sm" variant="ghost" onClick={() => setDismissed(false)}>Restore</Button>
              </div>
            ) : (
              <ToneAlert
                tone="info"
                title="What's new"
                icon={Sparkles}
                onDismiss={() => setDismissed(true)}
              >
                Reports now support CSV exports and saved filter presets.
              </ToneAlert>
            )}
          </Showcase>

          <Showcase title="With actions" description="Alert that drives a decision" hint="cta">
            <div className="rounded-xl border border-warning/40 bg-warning-soft p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Verify your email</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Confirm your email address to unlock invoicing and team invites.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button size="sm" variant="ghost">Later</Button>
                <Button size="sm">Resend email</Button>
              </div>
            </div>
          </Showcase>
        </div>

        <Showcase title="Top banners" description="Full-width announcement strips" hint="banner">
          <div className="space-y-2">
            {banners.map((b) => {
              const cls: Record<StatusTone, string> = {
                neutral: "bg-muted text-foreground",
                primary: "bg-primary-soft text-foreground",
                accent: "bg-accent-soft text-foreground",
                gold: "bg-gold-soft text-foreground",
                info: "bg-info-soft text-foreground",
                success: "bg-success-soft text-foreground",
                warning: "bg-warning-soft text-foreground",
                destructive: "bg-destructive-soft text-foreground",
              };
              return (
                <div
                  key={b.tone}
                  className={cn("flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-2.5 text-sm", cls[b.tone])}
                >
                  <span className="flex items-center gap-2">
                    <StatusBadge tone={b.tone} dot>{b.label}</StatusBadge>
                    <span className="text-muted-foreground">Scheduled maintenance on Sunday at 02:00 UTC.</span>
                  </span>
                  <Button size="sm" variant="ghost">Learn more</Button>
                </div>
              );
            })}
          </div>
        </Showcase>

        <Showcase title="Status badges" description="Compact tone tokens" hint="badge">
          <ShowcaseRow label="Soft">
            <StatusBadge tone="primary" dot>Primary</StatusBadge>
            <StatusBadge tone="success" dot>Active</StatusBadge>
            <StatusBadge tone="warning" dot>Pending</StatusBadge>
            <StatusBadge tone="destructive" dot>Failed</StatusBadge>
            <StatusBadge tone="info" dot>Info</StatusBadge>
            <StatusBadge tone="accent" dot>Accent</StatusBadge>
            <StatusBadge tone="gold" dot>Gold</StatusBadge>
            <StatusBadge tone="neutral" dot>Neutral</StatusBadge>
          </ShowcaseRow>
          <ShowcaseRow label="Solid">
            <StatusBadge tone="primary" variant="solid">Primary</StatusBadge>
            <StatusBadge tone="success" variant="solid">Success</StatusBadge>
            <StatusBadge tone="warning" variant="solid">Warning</StatusBadge>
            <StatusBadge tone="destructive" variant="solid">Danger</StatusBadge>
          </ShowcaseRow>
          <ShowcaseRow label="Outline">
            <StatusBadge tone="primary" variant="outline">Primary</StatusBadge>
            <StatusBadge tone="success" variant="outline">Success</StatusBadge>
            <StatusBadge tone="warning" variant="outline">Warning</StatusBadge>
            <StatusBadge tone="destructive" variant="outline">Danger</StatusBadge>
          </ShowcaseRow>
        </Showcase>
      </div>
    </PageContainer>
  );
}