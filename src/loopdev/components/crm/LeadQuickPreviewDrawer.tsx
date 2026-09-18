import React from "react";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Flame,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Sparkles,
  TrendingUp,
  User,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AppDrawer } from "@/components/platform";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common";
import type { CRMContact, CRMLead, CRMLeadStatusCode } from "@/loopdev/domains/crm/adapter";
import { contactName } from "@/loopdev/domains/crm/adapter";
import { formatDate } from "@/lib/formatters";

interface Props {
  open: boolean;
  lead: CRMLead | null;
  contact: CRMContact | null;
  onClose: () => void;
  onUpdateStatus: (lead: CRMLead, status: CRMLeadStatusCode) => void;
  onConvert: (lead: CRMLead) => void;
}

const STAGES: Array<{ key: CRMLeadStatusCode; label: string }> = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "converted", label: "Converted" },
];

export function LeadQuickPreviewDrawer({
  open,
  lead,
  contact,
  onClose,
  onUpdateStatus,
  onConvert,
}: Props) {
  if (!lead) return null;

  const fullName = contact ? contactName(contact) : "Unknown Contact";
  const score = lead.score ?? 50;
  const isHot = score >= 75;
  const isWarm = score >= 50 && score < 75;

  return (
    <AppDrawer
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">Lead Preview</span>
          {isHot ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-xs font-bold text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300">
              <Flame className="h-3 w-3" />
              Hot ({score})
            </span>
          ) : isWarm ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-xs font-semibold text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300">
              <Zap className="h-3 w-3" />
              Warm ({score})
            </span>
          ) : null}
        </div>
      }
      description={lead.id}
      size="md"
    >
      <div className="space-y-6">
        {/* Contact Profile Header */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-bold text-primary">
              {fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-foreground">{fullName}</h3>
              <p className="text-sm text-muted-foreground">
                {[contact?.jobTitle, contact?.companyName].filter(Boolean).join(" · ") || "CRM Contact"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {contact?.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Mail className="h-3 w-3" />
                    {contact.email}
                  </a>
                )}
                {contact?.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="h-3 w-3" />
                    {contact.phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Communication Actions */}
          <div className="mt-4 flex gap-2 border-t border-border pt-3">
            {contact?.email && (
              <Button size="sm" variant="outline" className="h-8 flex-1 text-xs" asChild>
                <a href={`mailto:${contact.email}`}>
                  <Mail className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  Email
                </a>
              </Button>
            )}
            {contact?.phone && (
              <Button size="sm" variant="outline" className="h-8 flex-1 text-xs" asChild>
                <a href={`tel:${contact.phone}`}>
                  <Phone className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  Call
                </a>
              </Button>
            )}
            {contact && (
              <Button size="sm" variant="outline" className="h-8 flex-1 text-xs" asChild>
                <Link to={`/app/sales-crm/contacts/${contact.id}`}>
                  <User className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  Profile 360
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Pipeline Stage Progression */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Pipeline Stage
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {STAGES.map((s, index) => {
              const isCurrent = lead.status === s.key;
              const isPassed =
                (lead.status === "contacted" && index === 0) ||
                (lead.status === "qualified" && (index === 0 || index === 1)) ||
                (lead.status === "converted" && index <= 2);

              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onUpdateStatus(lead, s.key)}
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-all ${
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : isPassed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lead Qualification Scope (BANT) */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3 text-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Qualification Criteria
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 p-2.5">
              <span className="text-[11px] font-semibold text-muted-foreground">Estimated Value</span>
              <p className="mt-0.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {lead.estimatedValue ? `$${lead.estimatedValue.toLocaleString()} ${lead.estimatedCurrency || "USD"}` : "—"}
              </p>
            </div>

            <div className="rounded-lg bg-muted/40 p-2.5">
              <span className="text-[11px] font-semibold text-muted-foreground">Timeline</span>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {lead.qualificationTimeline || "1–3 months"}
              </p>
            </div>
          </div>

          {lead.interest && (
            <div className="rounded-lg bg-muted/40 p-2.5">
              <span className="text-[11px] font-semibold text-muted-foreground">Interest & Project Goal</span>
              <p className="mt-0.5 text-sm text-foreground">{lead.interest}</p>
            </div>
          )}

          {lead.qualificationNeed && (
            <div className="rounded-lg bg-muted/40 p-2.5">
              <span className="text-[11px] font-semibold text-muted-foreground">Need & Requirements</span>
              <p className="mt-0.5 text-sm text-foreground">{lead.qualificationNeed}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div>
              <span className="text-muted-foreground">Lead Source:</span>{" "}
              <span className="font-semibold text-foreground">{lead.source || "Website"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Assigned Owner:</span>{" "}
              <span className="font-semibold text-foreground">{lead.ownerName || "Unassigned"}</span>
            </div>
          </div>
        </div>

        {/* Conversion & Full Page Navigation Actions */}
        <div className="flex flex-col gap-2 pt-2">
          {lead.status !== "converted" ? (
            <Button
              className="w-full"
              onClick={() => {
                onClose();
                onConvert(lead);
              }}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Convert to Opportunity
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-sm font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Converted Lead
            </div>
          )}

          <Button variant="outline" className="w-full" asChild>
            <Link to={`/app/sales-crm/leads/${lead.id}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Full Lead Page
            </Link>
          </Button>
        </div>
      </div>
    </AppDrawer>
  );
}
