import { useMemo, useState, type DragEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle, CalendarClock, ExternalLink, MoreHorizontal, MoveRight, RefreshCw, SearchX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DataCard, FilterDropdown, PageContainer, PageHeader, SearchInput, StatusBadge,
} from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { formatCurrency, formatDate, formatPercent, getInitials } from "@/lib/formatters";
import type { Currency } from "@/types";
import {
  CRM_PIPELINE_STAGE_CODES,
  type CRMPipelineOpportunity,
  type CRMPipelineStageCode,
} from "@/loopdev/domains/crm/adapter";
import { useCrmPipeline } from "@/loopdev/domains/crm/hooks/use-crm";
import { pipelineStageLabels as STAGE_LABELS } from "../../../../packages/contracts/src/pipeline-capability";

const STAGE_TONES: Record<CRMPipelineStageCode, string> = {
  prospecting: "bg-muted text-muted-foreground",
  qualified: "bg-primary-soft text-primary",
  proposal: "bg-info-soft text-info",
  negotiation: "bg-gold-soft text-gold",
  won: "bg-success-soft text-success",
  lost: "bg-destructive-soft text-destructive",
};

export default function SalesCRMPipeline() {
  const { trail } = useBreadcrumbs();
  const [query, setQuery] = useState("");
  const [stageCodes, setStageCodes] = useState<CRMPipelineStageCode[]>([]);
  const [ownerIds, setOwnerIds] = useState<string[]>([]);
  const [dragOverStage, setDragOverStage] = useState<CRMPipelineStageCode | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [reopenTarget, setReopenTarget] = useState<CRMPipelineOpportunity | null>(null);
  const [reopenReason, setReopenReason] = useState("");
  const {
    opportunities,
    loading,
    error,
    forbidden,
    mutation,
    moveStage,
    reopenOpportunity,
    reload,
  } = useCrmPipeline({ query, stageCodes, ownerIds });

  const ownerOptions = useMemo(
    () => [...new Map(
      opportunities
        .filter((opportunity) => opportunity.owner)
        .map((opportunity) => [opportunity.owner!.id, opportunity.owner!.displayName]),
    )].map(([value, label]) => ({ value, label })),
    [opportunities],
  );

  const mutationMessage = mutation.status === "pending"
    ? "Saving stage change…"
    : mutation.status === "success"
      ? "Stage updated."
      : mutation.status === "idle"
        ? null
        : `${mutation.status === "conflict" ? "Conflict: " : mutation.status === "forbidden" ? "Permission denied: " : "Server error: "}${mutation.message}`;

  const moveOpportunity = (opportunity: CRMPipelineOpportunity, stageCode: CRMPipelineStageCode) => {
    if (opportunity.stageCode === stageCode || mutation.status === "pending") return;
    void moveStage(opportunity, stageCode);
  };

  const onDragStart = (event: DragEvent<HTMLElement>, opportunityId: string) => {
    setDraggingId(opportunityId);
    event.dataTransfer.setData("text/plain", opportunityId);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (event: DragEvent<HTMLElement>, stageCode: CRMPipelineStageCode) => {
    event.preventDefault();
    const opportunityId = event.dataTransfer.getData("text/plain") || draggingId;
    const opportunity = opportunities.find((item) => item.id === opportunityId);
    if (opportunity) moveOpportunity(opportunity, stageCode);
    setDragOverStage(null);
    setDraggingId(null);
  };

  const submitReopen = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reopenTarget || !reopenReason.trim()) return;
    const result = await reopenOpportunity(reopenTarget, { reason: reopenReason });
    if (result.status === "success") {
      setReopenTarget(null);
      setReopenReason("");
    }
  };

  return (
    <PageContainer width="wide" className="max-w-[1600px]">
      <PageHeader
        eyebrow="CRM"
        title="Pipeline"
        description="Drag opportunities between stages or use the menu to move them."
        breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Pipeline" }]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search deals, contacts, or owners…"
          size="sm"
          containerClassName="w-72"
        />
        <FilterDropdown
          label="Stage"
          multiple
          value={stageCodes}
          onChange={(values) => setStageCodes(values as CRMPipelineStageCode[])}
          options={CRM_PIPELINE_STAGE_CODES.map((value) => ({ value, label: STAGE_LABELS[value] }))}
          size="sm"
        />
        <FilterDropdown
          label="Owner"
          multiple
          value={ownerIds}
          onChange={setOwnerIds}
          options={ownerOptions}
          size="sm"
        />
      </div>

      {mutationMessage && (
        <div
          role={mutation.status === "success" ? "status" : mutation.status === "pending" ? "status" : "alert"}
          className={`rounded-md border px-3 py-2 text-sm ${
            mutation.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : mutation.status === "pending"
                ? "border-border bg-card-muted text-muted-foreground"
                : "border-destructive/30 bg-destructive-soft text-destructive"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{mutationMessage}</span>
            {mutation.status === "conflict" && (
              <Button variant="outline" size="sm" onClick={reload}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Refresh
              </Button>
            )}
          </div>
        </div>
      )}

      <DataCard
        flush
        loading={loading}
        error={forbidden ? (
          <span role="alert">You do not have permission to view this pipeline.</span>
        ) : error ? (
          <>
            <span>{error}</span>
            <Button className="mt-3" size="sm" variant="outline" onClick={reload}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />Try again
            </Button>
          </>
        ) : undefined}
        empty={!loading && !error && !forbidden && opportunities.length === 0}
        emptyIcon={query || stageCodes.length || ownerIds.length ? SearchX : AlertTriangle}
        emptyTitle={query || stageCodes.length || ownerIds.length ? "No opportunities found" : "No opportunities yet"}
        emptyDescription={query || stageCodes.length || ownerIds.length
          ? "Try changing the search or filters."
          : "Opportunities will appear here when they are added to your workspace."}
      >
        <div className="flex gap-4 overflow-x-auto p-3 pb-4">
          {CRM_PIPELINE_STAGE_CODES.map((stageCode) => {
            const items = opportunities.filter((opportunity) => opportunity.stageCode === stageCode);
            const isOver = dragOverStage === stageCode;
            return (
              <section
                key={stageCode}
                aria-labelledby={`pipeline-stage-${stageCode}`}
                className={`flex w-72 shrink-0 flex-col rounded-xl border bg-card-muted/40 transition-fast ${isOver ? "border-primary bg-primary-soft/40" : "border-border"}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  if (dragOverStage !== stageCode) setDragOverStage(stageCode);
                }}
                onDragLeave={() => setDragOverStage((current) => current === stageCode ? null : current)}
                onDrop={(event) => onDrop(event, stageCode)}
              >
                <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-[11px] font-semibold ${STAGE_TONES[stageCode]}`}>
                      {items.length}
                    </span>
                    <h2 id={`pipeline-stage-${stageCode}`} className="text-sm font-semibold text-foreground">
                      {STAGE_LABELS[stageCode]}
                    </h2>
                  </div>
                </header>
                <div className="flex flex-1 flex-col gap-2.5 p-3">
                  {items.length ? items.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      moving={mutation.status === "pending" && mutation.opportunityId === opportunity.id}
                      dragging={draggingId === opportunity.id}
                      onDragStart={(event) => onDragStart(event, opportunity.id)}
                      onDragEnd={() => {
                        setDragOverStage(null);
                        setDraggingId(null);
                      }}
                      onMove={(nextStage) => moveOpportunity(opportunity, nextStage)}
                      onReopen={() => setReopenTarget(opportunity)}
                    />
                  )) : (
                    <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                      Drop opportunities here
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </DataCard>
      <Dialog open={Boolean(reopenTarget)} onOpenChange={(open) => { if (!open) setReopenTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Reopen terminal opportunity</DialogTitle><DialogDescription>Won and lost opportunities require a non-empty reason before re-entering the pipeline.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void submitReopen(event)}>
            <div className="space-y-1.5"><Label htmlFor="pipeline-reopen-reason">Reason</Label><Input id="pipeline-reopen-reason" required value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setReopenTarget(null)}>Cancel</Button><Button type="submit" disabled={!reopenReason.trim()}>Reopen opportunity</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function OpportunityCard({
  opportunity,
  moving,
  dragging,
  onDragStart,
  onDragEnd,
  onMove,
  onReopen,
}: {
  opportunity: CRMPipelineOpportunity;
  moving: boolean;
  dragging: boolean;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onMove: (stageCode: CRMPipelineStageCode) => void;
  onReopen: () => void;
}) {
  const navigate = useNavigate();

  const handleCardClick = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button") || target.closest("a") || target.closest("[role='menuitem']")) {
      return;
    }
    navigate(`/app/sales-crm/opportunities/${opportunity.id}`);
  };

  return (
    <article
      draggable={!moving}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={handleCardClick}
      className={`group cursor-pointer surface-card-compact p-3 shadow-soft transition-smooth hover:-translate-y-0.5 surface-card-hover active:cursor-grabbing ${dragging || moving ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Link
            to={`/app/sales-crm/opportunities/${opportunity.id}`}
            className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary hover:underline"
            title={opportunity.name}
          >
            {opportunity.name}
          </Link>
          <p className="mt-0.5 truncate text-xs text-muted-foreground" title={opportunity.contact.displayName}>
            {opportunity.contact.displayName}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-fast hover:bg-muted hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
              aria-label={`Opportunity actions for ${opportunity.name}`}
              disabled={moving}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link to={`/app/sales-crm/opportunities/${opportunity.id}`} className="flex items-center">
                <ExternalLink className="mr-2 h-3.5 w-3.5" /> Open full opportunity page
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">Move to</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(opportunity.stageCode === "won" || opportunity.stageCode === "lost") && (
              <DropdownMenuItem onClick={onReopen}>Reopen with reason…</DropdownMenuItem>
            )}
            {CRM_PIPELINE_STAGE_CODES.filter((stageCode) => stageCode !== opportunity.stageCode && opportunity.stageCode !== "won" && opportunity.stageCode !== "lost").map((stageCode) => (
              <DropdownMenuItem key={stageCode} onClick={() => onMove(stageCode)}>
                <MoveRight className="mr-2 h-3.5 w-3.5" /> {STAGE_LABELS[stageCode]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2 text-xs">
        <div>
          <dt className="text-muted-foreground">Amount</dt>
          <dd className="font-medium tabular-nums">{opportunity.amount === null ? "—" : formatCurrency(opportunity.amount, asCurrency(opportunity.currency))}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Probability</dt>
          <dd className="font-medium tabular-nums">{opportunity.probability === null ? "—" : formatPercent(opportunity.probability)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">Expected close</dt>
          <dd className="font-medium">{opportunity.expectedCloseDate ? formatDate(opportunity.expectedCloseDate, "medium") : "—"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">Owner</dt>
          <dd className="truncate font-medium">{opportunity.owner?.displayName ?? "Unassigned"}</dd>
        </div>
      </dl>
      <footer className="mt-3 flex items-center justify-between text-xs">
        <div className="inline-flex items-center gap-1 text-muted-foreground">
          {opportunity.expectedCloseDate ? (
            <>
              <CalendarClock className="h-3 w-3" />
              {formatDate(opportunity.expectedCloseDate, "short")}
            </>
          ) : <span className="text-muted-foreground/70">No close date</span>}
        </div>
        {opportunity.owner ? (
          <Avatar className="h-6 w-6 border border-border" title={opportunity.owner.displayName}>
            <AvatarFallback className="bg-primary-soft text-[10px] font-semibold text-primary">
              {getInitials(opportunity.owner.displayName)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className="text-[11px] text-muted-foreground">Unassigned</span>
        )}
      </footer>
    </article>
  );
}

function asCurrency(value: string | null): Currency {
  return value === "EUR" || value === "GBP" ? value : "USD";
}
