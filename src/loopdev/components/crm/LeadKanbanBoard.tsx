import React from "react";
import {
  ArrowRight,
  Clock,
  DollarSign,
  Flame,
  MoreHorizontal,
  Plus,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CRMContact, CRMLead, CRMLeadStatusCode } from "@/loopdev/domains/crm/adapter";
import { contactName } from "@/loopdev/domains/crm/adapter";
import { formatDate } from "@/lib/formatters";

interface Props {
  leads: CRMLead[];
  contacts: CRMContact[];
  onSelectLead: (lead: CRMLead) => void;
  onUpdateStatus: (lead: CRMLead, status: CRMLeadStatusCode) => void;
  onCreateLead?: () => void;
}

const COLUMNS: Array<{ key: CRMLeadStatusCode; label: string; color: string; bg: string }> = [
  { key: "new", label: "New Leads", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900" },
  { key: "contacted", label: "Contacted", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900" },
  { key: "qualified", label: "Qualified", color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900" },
  { key: "stalled", label: "Stalled", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900" },
  { key: "converted", label: "Converted", color: "text-green-700 dark:text-green-300", bg: "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900" },
];

const NEXT_STAGE_MAP: Partial<Record<CRMLeadStatusCode, CRMLeadStatusCode>> = {
  new: "contacted",
  contacted: "qualified",
  qualified: "converted",
  stalled: "contacted",
};

export function LeadKanbanBoard({
  leads,
  contacts,
  onSelectLead,
  onUpdateStatus,
  onCreateLead,
}: Props) {
  const contactMap = new Map(contacts.map((c) => [c.id, c]));

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
      {COLUMNS.map((column) => {
        const columnLeads = leads.filter((l) => l.status === column.key);
        const columnTotalValue = columnLeads.reduce(
          (sum, l) => sum + (l.estimatedValue ?? 0),
          0
        );

        return (
          <div
            key={column.key}
            className="flex w-80 shrink-0 flex-col rounded-xl border border-border/80 bg-muted/30 p-3"
          >
            {/* Column Header */}
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${column.bg.split(" ")[0]}`} />
                <h3 className="text-sm font-semibold text-foreground">{column.label}</h3>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-semibold text-muted-foreground">
                  {columnLeads.length}
                </span>
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                {columnTotalValue > 0 ? `$${(columnTotalValue / 1000).toFixed(0)}k` : ""}
              </div>
            </div>

            {/* Cards Container */}
            <div className="flex flex-1 flex-col gap-2.5">
              {columnLeads.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                  No leads in this stage
                </div>
              ) : (
                columnLeads.map((lead) => {
                  const contact = contactMap.get(lead.contactId);
                  const fullName = contact ? contactName(contact) : "Unknown Contact";
                  const score = lead.score ?? 50;
                  const isHot = score >= 75;
                  const isWarm = score >= 50 && score < 75;
                  const nextStage = NEXT_STAGE_MAP[lead.status];

                  const daysSinceActivity = lead.lastActivityAt
                    ? Math.floor((Date.now() - new Date(lead.lastActivityAt).getTime()) / 86400000)
                    : null;
                  const isStale = daysSinceActivity != null && daysSinceActivity >= 3;

                  return (
                    <div
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="group cursor-pointer rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      {/* Top row: Contact & Score */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                            {fullName}
                          </h4>
                          <p className="truncate text-xs text-muted-foreground">
                            {[contact?.jobTitle, contact?.companyName].filter(Boolean).join(" · ") || "CRM Contact"}
                          </p>
                        </div>
                        {isHot ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[11px] font-bold text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-300">
                            <Flame className="h-3 w-3" />
                            {score}
                          </span>
                        ) : isWarm ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[11px] font-semibold text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300">
                            <Zap className="h-3 w-3" />
                            {score}
                          </span>
                        ) : null}
                      </div>

                      {/* Lead Interest summary */}
                      {lead.interest && (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground/90">
                          {lead.interest}
                        </p>
                      )}

                      {/* Deal Value & Source Tag */}
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/50 pt-2.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          {lead.estimatedValue ? (
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              ${lead.estimatedValue.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                          {lead.source && (
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {lead.source}
                            </span>
                          )}
                        </div>

                        {/* Owner avatar or initials */}
                        <span className="truncate text-[11px] text-muted-foreground">
                          {lead.ownerName || "Unassigned"}
                        </span>
                      </div>

                      {/* SLA / Activity warning or Next Stage quick trigger */}
                      <div className="mt-2.5 flex items-center justify-between gap-2 pt-1">
                        {isStale ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            <Clock className="h-3 w-3" />
                            {daysSinceActivity}d no activity
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/80">
                            {formatDate(lead.lastActivityAt || lead.createdAt)}
                          </span>
                        )}

                        {nextStage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[11px] font-semibold text-primary hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStatus(lead, nextStage);
                            }}
                          >
                            Advance
                            <ArrowRight className="ms-1 h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
