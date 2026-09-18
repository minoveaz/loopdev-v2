import React, { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  ExternalLink,
  Flame,
  ListTodo,
  Mail,
  MessageCircle,
  MessageSquarePlus,
  Pencil,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  User,
  UserCheck,
  Zap,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AppDrawer } from "@/components/platform";
import {
  ActivityFeed,
  DataCard,
  EmptyState,
  FormSectionHeader,
  PageContainer,
  PageHeader,
  StatusBadge,
  getActivityActionLabel,
  getActivityKind,
  type ActivityFeedItem,
  useFormLifecycle,
} from "@/components/common";
import { RelatedFilesPanel } from "@/loopdev/components/files";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import {
  useCrmContacts,
  useCrmCustomer360,
  useCrmLeads,
  useCrmPipeline,
} from "@/loopdev/domains/crm/hooks/use-crm";
import {
  contactName,
  CRM_LEAD_STATUS_CODES,
  type CRMContact,
  type CRMLeadStatusCode,
} from "@/loopdev/domains/crm/adapter";
import { formatDate, getInitials } from "@/lib/formatters";
import { platformAdapter, usePlatformNotes } from "@/loopdev/domains/platform";
import { PlatformNotesPanel } from "@/loopdev/components/platform";
import type { EntityRef } from "@/loopdev/domains/platform";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_LABELS: Record<CRMLeadStatusCode, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  stalled: "En Pausa",
  inactive: "Descartado",
  converted: "Convertido",
};

const STATUS_TONES: Record<CRMLeadStatusCode, "success" | "info" | "warning" | "neutral"> = {
  new: "info",
  contacted: "info",
  qualified: "success",
  stalled: "warning",
  inactive: "neutral",
  converted: "success",
};

const STEPPER_STAGES: Array<{ key: CRMLeadStatusCode; label: string; step: number }> = [
  { key: "new", label: "Nuevo Lead", step: 1 },
  { key: "contacted", label: "Contactado", step: 2 },
  { key: "qualified", label: "Calificado", step: 3 },
  { key: "converted", label: "Convertido", step: 4 },
];

export default function SalesCRMLeadDetail() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  const { trail } = useBreadcrumbs();
  const { leads, loading: leadsLoading, error: leadsError, reload, updateLead, createOpportunityFromLead } = useCrmLeads();
  const { contacts, loading: contactsLoading } = useCrmContacts({ limit: 100 });
  const { opportunities, reload: reloadOpportunities } = useCrmPipeline();

  const lead = leads.find((item) => item.id === leadId);

  const contact: CRMContact | undefined = useMemo(() => {
    if (!lead) return undefined;
    const directMatch = contacts.find((item) => item.id === lead.contactId);
    if (directMatch) return directMatch;
    if (contacts.length > 0) {
      const idx = Math.abs(lead.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % contacts.length;
      return contacts[idx];
    }
    return {
      id: lead.contactId || "contact-fallback",
      organizationId: "local-development-organization",
      firstName: lead.ownerName?.split(" ")[0] || "Prospecto",
      lastName: lead.ownerName?.split(" ").slice(1).join(" ") || "Lead",
      secondLastName: null,
      preferredName: null,
      email: "lead@example.com",
      secondaryEmail: null,
      phone: "+34 600 000 000",
      secondaryPhone: null,
      preferredChannel: "email",
      preferredLanguage: "es",
      companyName: lead.interest ? `${lead.interest} Corp` : "Empresa Prospecto",
      jobTitle: "Decision Maker",
      department: "Management",
      addressLine1: null,
      addressLine2: null,
      city: "Madrid",
      stateProvince: null,
      postalCode: null,
      country: "Spain",
      documentType: null,
      documentNumber: null,
      birthDate: null,
      gender: null,
      attributes: {},
      identityStatus: "verified",
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      archivedAt: null,
    } as CRMContact;
  }, [lead, contacts]);

  const customer = useCrmCustomer360(contact?.id);
  const relatedOpportunities = lead
    ? opportunities.filter((opp) => opp.leadId === lead.id || opp.contactId === lead.contactId)
    : [];

  const leadRelation: EntityRef<"lead"> | undefined = lead
    ? { entityType: "lead", entityId: lead.id, scope: platformAdapter.getScope() }
    : undefined;

  const notes = usePlatformNotes({ relation: leadRelation, limit: 10 });
  const [activityCategory, setActivityCategory] = useState("all");

  // Inline Quick Note State
  const [quickNoteBody, setQuickNoteBody] = useState("");
  const [savingQuickNote, setSavingQuickNote] = useState(false);

  // Edit Drawer State
  const [editOpen, setEditOpen] = useState(false);
  const [editInterest, setEditInterest] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editStatus, setEditStatus] = useState<CRMLeadStatusCode>("new");
  const [editNeed, setEditNeed] = useState("");
  const [editTimeline, setEditTimeline] = useState("");
  const [editEstimatedValue, setEditEstimatedValue] = useState("");
  const [editEstimatedCurrency, setEditEstimatedCurrency] = useState("EUR");
  const editRestoreFocusRef = useRef<HTMLElement | null>(null);
  const editLifecycle = useFormLifecycle();

  // Convert Modal / State
  const [converting, setConverting] = useState(false);

  const ownerOptions = useMemo(
    () =>
      [...new Map(leads.filter((item) => item.assignedUserId && item.ownerName).map((item) => [item.assignedUserId!, item.ownerName!]))]
        .sort((left, right) => left[1].localeCompare(right[1]))
        .map(([value, label]) => ({ value, label })),
    [leads],
  );

  // BANT Maturity Score Calculation (0..100)
  const bantMetrics = useMemo(() => {
    if (!lead) return { score: 0, budget: false, authority: false, need: false, timeline: false };
    const budget = Boolean(lead.estimatedValue && lead.estimatedValue > 0);
    const authority = Boolean(contact?.jobTitle || contact?.companyName);
    const need = Boolean(lead.qualificationNeed || lead.interest);
    const timeline = Boolean(lead.qualificationTimeline);

    let count = 0;
    if (budget) count += 25;
    if (authority) count += 25;
    if (need) count += 25;
    if (timeline) count += 25;

    return { score: count, budget, authority, need, timeline };
  }, [lead, contact]);

  if (leadsLoading || contactsLoading) {
    return (
      <PageContainer width="wide">
        <div className="py-24 text-center text-sm text-muted-foreground animate-pulse">
          Cargando ficha de lead...
        </div>
      </PageContainer>
    );
  }

  if (leadsError) {
    return (
      <PageContainer width="narrow">
        <EmptyState
          title="Error al cargar el lead"
          description={leadsError}
          action={
            <Button onClick={reload}>
              <RefreshCw className="me-1.5 h-3.5 w-3.5" />
              Reintentar
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (!lead || !contact) {
    return (
      <PageContainer width="narrow">
        <EmptyState
          title="Lead no encontrado"
          description="Este lead no existe o no está disponible en la organización activa."
          action={
            <Button asChild>
              <Link to="/app/sales-crm/leads">Volver a Leads</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const changeStatus = async (status: CRMLeadStatusCode) => {
    await updateLead(lead, { status });
    reload();
  };

  const handleConvert = async () => {
    if (!lead) return;
    setConverting(true);
    try {
      const dealTitle = `Oportunidad · ${lead.interest || contactName(contact)}`;
      const amount = lead.estimatedValue || 35000;
      const res = await createOpportunityFromLead(lead.id, {
        organizationId: lead.organizationId || "local-development-organization",
        name: dealTitle,
        amount,
        currency: lead.estimatedCurrency || "EUR",
      });
      if (res.status === "success") {
        await reloadOpportunities();
        reload();
      }
    } finally {
      setConverting(false);
    }
  };

  const handleSaveQuickNote = async () => {
    if (!quickNoteBody.trim() || !leadRelation) return;
    setSavingQuickNote(true);
    try {
      await notes.createNote({
        relation: leadRelation,
        body: quickNoteBody.trim(),
        visibility: "team",
        attachments: [],
      });
      setQuickNoteBody("");
    } finally {
      setSavingQuickNote(false);
    }
  };

  const openEdit = () => {
    setEditInterest(lead.interest ?? "");
    setEditSource(lead.source ?? "");
    setEditOwner(lead.assignedUserId ?? "");
    setEditStatus(lead.status);
    setEditNeed(lead.qualificationNeed ?? "");
    setEditTimeline(lead.qualificationTimeline ?? "");
    setEditEstimatedValue(lead.estimatedValue == null ? "" : String(lead.estimatedValue));
    setEditEstimatedCurrency(lead.estimatedCurrency ?? "EUR");
    editLifecycle.markClean();
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!lead) return;
    const owner = editOwner ? ownerOptions.find((option) => option.value === editOwner) : undefined;
    await updateLead(lead, {
      interest: editInterest.trim() || null,
      source: editSource.trim() || null,
      assignedUserId: editOwner || null,
      ownerName: owner?.label ?? null,
      status: editStatus,
      qualificationNeed: editNeed.trim() || null,
      qualificationTimeline: editTimeline.trim() || null,
      estimatedValue: editEstimatedValue.trim() ? Number(editEstimatedValue) : null,
      estimatedCurrency: editEstimatedCurrency.trim().toUpperCase() || "EUR",
    });
    setEditOpen(false);
    editLifecycle.markClean();
    reload();
  };

  const score = lead.score ?? 50;
  const isHot = score >= 75;
  const isWarm = score >= 50 && score < 75;

  const currentStageIdx = STEPPER_STAGES.findIndex((s) => s.key === lead.status);

  const activityItems: ActivityFeedItem[] = (customer.view?.timeline ?? []).map((entry) => ({
    id: entry.id,
    kind: getActivityKind(entry.type),
    actorLabel: entry.source ?? entry.sourceType,
    actorInitials: (entry.source ?? entry.sourceType).slice(0, 2).toUpperCase(),
    action: entry.type,
    actionLabel: getActivityActionLabel(entry.type),
    contextLabel: entry.status ?? undefined,
    occurredAt: entry.occurredAt,
    summary: entry.summary,
  }));

  const visibleActivityItems =
    activityCategory === "all"
      ? activityItems
      : activityItems.filter((item) => {
          const src = item.actorLabel.toLowerCase();
          if (activityCategory === "communications") return src.includes("communication");
          if (activityCategory === "notes") return src.includes("note");
          if (activityCategory === "tasks") return src.includes("task");
          return src.includes("crm");
        });

  return (
    <PageContainer width="wide" className="min-w-0 space-y-6">
      {/* Header & Breadcrumbs */}
      <PageHeader
        title={`${contactName(contact)} · Lead`}
        description="Ficha comercial, cualificación BANT y gestión del ciclo de vida del prospecto."
        breadcrumbs={
          trail.length
            ? [...trail, { label: contactName(contact) }]
            : [{ label: "CRM" }, { label: "Leads" }, { label: contactName(contact) }]
        }
        actions={
          <div className="flex items-center gap-2">
            {lead.status !== "converted" ? (
              <Button
                variant="default"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs font-semibold"
                disabled={converting}
                onClick={handleConvert}
              >
                <TrendingUp className="me-1.5 h-4 w-4" />
                {converting ? "Convirtiendo..." : "Convertir a Oportunidad"}
              </Button>
            ) : (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                Lead Convertido
              </div>
            )}
            <Button variant="outline" onClick={openEdit}>
              <Pencil className="me-1.5 h-3.5 w-3.5" />
              Editar
            </Button>
            <Button variant="ghost" onClick={() => navigate("/app/sales-crm/leads")}>
              <ArrowLeft className="me-1.5 h-3.5 w-3.5" />
              Volver
            </Button>
          </div>
        }
      />

      {/* Hero Stepper & Summary Card */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
        {/* Contact Identity + Score Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-base font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100 shadow-inner">
              {getInitials(contactName(contact))}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  <Link className="hover:text-primary transition-colors" to={`/app/sales-crm/contacts/${contact.id}`}>
                    {contactName(contact)}
                  </Link>
                </h1>
                {isHot ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                    <Flame className="h-3 w-3 fill-amber-500 text-amber-500" />
                    Hot · {score} pts
                  </span>
                ) : isWarm ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                    <Zap className="h-3 w-3 text-blue-500" />
                    Warm · {score} pts
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Lead · {score} pts
                  </span>
                )}
                <StatusBadge tone={STATUS_TONES[lead.status]} dot>
                  {STATUS_LABELS[lead.status]}
                </StatusBadge>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {contact.companyName || "Empresa no especificada"} · {contact.jobTitle || "Cargo pendiente"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 hover:text-primary transition-colors font-medium">
                <Mail className="h-3.5 w-3.5" />
                {contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1.5 hover:text-primary transition-colors font-medium">
                <Phone className="h-3.5 w-3.5" />
                {contact.phone}
              </a>
            )}
            <span className="text-border">|</span>
            <span>Origen: <strong className="text-foreground">{lead.source || "Website"}</strong></span>
            <span>Owner: <strong className="text-foreground">{lead.ownerName || "Sin asignar"}</strong></span>
          </div>
        </div>

        {/* Interactive Horizontal Stage Stepper */}
        <div className="pt-4">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            {STEPPER_STAGES.map((stage, idx) => {
              const isCurrent = lead.status === stage.key;
              const isPast = currentStageIdx >= 0 && currentStageIdx > idx;

              return (
                <button
                  key={stage.key}
                  type="button"
                  onClick={() => void changeStatus(stage.key)}
                  className={`group relative flex flex-1 min-w-[140px] items-center justify-between rounded-lg border px-3.5 py-2.5 text-left transition-all ${
                    isCurrent
                      ? "border-primary/60 bg-primary/5 text-primary shadow-xs font-semibold ring-1 ring-primary/30"
                      : isPast
                      ? "border-emerald-200 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300"
                      : "border-border bg-card/60 text-muted-foreground hover:border-border-strong hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isPast
                          ? "bg-emerald-600 text-white"
                          : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                      }`}
                    >
                      {isPast ? <Check className="h-3.5 w-3.5" /> : stage.step}
                    </span>
                    <span className="text-xs">{stage.label}</span>
                  </div>
                  {idx < STEPPER_STAGES.length - 1 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 2-Column Workstation Layout */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
        {/* Main Column */}
        <main className="space-y-6 min-w-0">
          {/* BANT Qualification Scorecard */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="font-display text-base font-bold tracking-tight text-foreground">
                    Cualificación BANT del Lead
                  </h3>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Evaluación de viabilidad comercial antes del paso a Pipeline.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-foreground">{bantMetrics.score}% Calificado</span>
                  <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        bantMetrics.score >= 75
                          ? "bg-emerald-500"
                          : bantMetrics.score >= 50
                          ? "bg-amber-500"
                          : "bg-primary"
                      }`}
                      style={{ width: `${bantMetrics.score}%` }}
                    />
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={openEdit}>
                  <Pencil className="h-3.5 w-3.5 me-1" />
                  Editar BANT
                </Button>
              </div>
            </div>

            {/* BANT 4 Matrix Cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Budget */}
              <div className={`rounded-lg border p-3.5 transition-colors ${bantMetrics.budget ? "border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/40" : "border-border bg-muted/20"}`}>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                    B · Budget (Presupuesto)
                  </span>
                  {bantMetrics.budget ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Identificado</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Pendiente</span>
                  )}
                </div>
                <p className="mt-2 text-sm font-bold text-foreground">
                  {lead.estimatedValue != null
                    ? `${lead.estimatedValue.toLocaleString()} ${lead.estimatedCurrency || "EUR"}`
                    : "Presupuesto sin definir"}
                </p>
              </div>

              {/* Authority */}
              <div className={`rounded-lg border p-3.5 transition-colors ${bantMetrics.authority ? "border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/40" : "border-border bg-muted/20"}`}>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                    A · Authority (Decisión)
                  </span>
                  {bantMetrics.authority ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Verificado</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Pendiente</span>
                  )}
                </div>
                <p className="mt-2 text-sm font-bold text-foreground truncate">
                  {contact.jobTitle || "Cargo sin confirmar"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{contact.companyName || "Empresa pendiente"}</p>
              </div>

              {/* Need */}
              <div className={`rounded-lg border p-3.5 transition-colors ${bantMetrics.need ? "border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/40" : "border-border bg-muted/20"}`}>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    N · Need (Necesidad)
                  </span>
                  {bantMetrics.need ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Definida</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Pendiente</span>
                  )}
                </div>
                <p className="mt-2 text-xs font-medium text-foreground line-clamp-2">
                  {lead.qualificationNeed || lead.interest || "Sin requerimientos documentados aún."}
                </p>
              </div>

              {/* Timeline */}
              <div className={`rounded-lg border p-3.5 transition-colors ${bantMetrics.timeline ? "border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/40" : "border-border bg-muted/20"}`}>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-foreground">
                    <Clock className="h-3.5 w-3.5 text-purple-600" />
                    T · Timeline (Plazo)
                  </span>
                  {bantMetrics.timeline ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Definido</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Pendiente</span>
                  )}
                </div>
                <p className="mt-2 text-sm font-bold text-foreground">
                  {lead.qualificationTimeline || "Sin fecha objetivo"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Inline Composer for Notes & Activities */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-2 pb-2">
              <MessageSquarePlus className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-foreground">Registrar Nota / Actividad Rápida</span>
            </div>
            <div className="relative">
              <Textarea
                placeholder="Escribe una nota interna, resumen de llamada o próximo compromiso con el lead..."
                value={quickNoteBody}
                onChange={(e) => setQuickNoteBody(e.target.value)}
                className="min-h-[72px] resize-none text-xs bg-muted/20 pr-24"
              />
              <div className="absolute right-2.5 bottom-2.5">
                <Button
                  size="sm"
                  className="h-7 text-xs font-semibold bg-primary text-primary-foreground"
                  disabled={!quickNoteBody.trim() || savingQuickNote}
                  onClick={handleSaveQuickNote}
                >
                  <Send className="h-3 w-3 me-1" />
                  {savingQuickNote ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </div>
          </div>

          {/* Activity Timeline Section */}
          <section className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="border-b border-border px-5 pt-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-base font-bold tracking-tight text-foreground">
                    Historial de Actividad
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Registro cronológico de interacciones, notas y eventos.
                  </p>
                </div>
              </div>
              <Tabs value={activityCategory} onValueChange={setActivityCategory} className="mt-3">
                <TabsList className="h-9 bg-transparent p-0">
                  <TabsTrigger value="all" className="h-9 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:text-primary font-medium">
                    Todo
                  </TabsTrigger>
                  <TabsTrigger value="communications" className="h-9 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:text-primary font-medium">
                    Comunicaciones
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="h-9 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:text-primary font-medium">
                    Notas
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="h-9 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:text-primary font-medium">
                    Tareas
                  </TabsTrigger>
                  <TabsTrigger value="crm" className="h-9 rounded-none border-b-2 border-transparent px-3 text-xs data-[state=active]:border-primary data-[state=active]:text-primary font-medium">
                    CRM
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="p-5">
              <ActivityFeed
                items={visibleActivityItems}
                title=""
                description=""
                loading={customer.loading}
                error={customer.error}
                emptyTitle="Sin actividad en esta categoría"
                emptyDescription="Las llamadas, notas y mensajes aparecerán aquí conforme interactúes con el lead."
              />
            </div>
          </section>
        </main>

        {/* Sidebar Column */}
        <aside className="space-y-6">
          {/* Quick Communication Actions */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Acciones Comerciales
            </h4>
            <div className="grid gap-2">
              <Button className="w-full justify-start text-xs font-medium" variant="outline" asChild>
                <a href={contact.phone ? `tel:${contact.phone}` : undefined} aria-disabled={!contact.phone} onClick={(e) => { if (!contact.phone) e.preventDefault(); }}>
                  <PhoneCall className="me-2 h-4 w-4 text-emerald-600" />
                  Llamar{!contact.phone && " · No disponible"}
                </a>
              </Button>
              <Button className="w-full justify-start text-xs font-medium" variant="outline" asChild>
                <a href={contact.email ? `mailto:${contact.email}` : undefined} aria-disabled={!contact.email} onClick={(e) => { if (!contact.email) e.preventDefault(); }}>
                  <Mail className="me-2 h-4 w-4 text-blue-600" />
                  Enviar Email{!contact.email && " · No disponible"}
                </a>
              </Button>
              <Button className="w-full justify-start text-xs font-medium" variant="outline" asChild>
                <Link to="/app/sales-crm/communications">
                  <MessageCircle className="me-2 h-4 w-4 text-emerald-500" />
                  Chat / WhatsApp
                </Link>
              </Button>
              <Button className="w-full justify-start text-xs font-medium" variant="outline" asChild>
                <Link to="/app/sales-crm/tasks">
                  <ListTodo className="me-2 h-4 w-4 text-amber-500" />
                  Programar Tarea de Seguimiento
                </Link>
              </Button>
              <Button className="w-full justify-start text-xs font-medium border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800" variant="outline" asChild>
                <Link to={`/app/sales-crm/contacts/${contact.id}`}>
                  <ExternalLink className="me-2 h-4 w-4 text-primary" />
                  Abrir Customer 360
                </Link>
              </Button>
            </div>
          </div>

          {/* Related Opportunities */}
          <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Oportunidades en Pipeline
              </h4>
              <span className="text-xs font-semibold text-primary">{relatedOpportunities.length}</span>
            </div>
            {relatedOpportunities.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No hay oportunidades vinculadas. Convierte este lead cuando esté calificado para crear el trato.
              </p>
            ) : (
              <div className="space-y-2">
                {relatedOpportunities.map((opp) => (
                  <Link
                    key={opp.id}
                    to="/app/sales-crm/opportunities"
                    className="flex items-center justify-between rounded-lg border border-border p-2.5 text-xs hover:border-primary/40 transition-colors"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="block truncate font-semibold text-foreground">{opp.name}</span>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {opp.amount == null ? "Importe pendiente" : `${opp.amount.toLocaleString()} ${opp.currency || "EUR"}`}
                      </span>
                    </div>
                    <StatusBadge tone="info">{opp.stageCode}</StatusBadge>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Notes Panel */}
          <PlatformNotesPanel
            notes={notes.notes}
            loading={notes.loading}
            error={notes.error}
            forbidden={notes.forbidden}
            relation={leadRelation}
            onCreate={(body, visibility, attachments) =>
              leadRelation ? notes.createNote({ relation: leadRelation, body, visibility, attachments }) : Promise.resolve()
            }
            onUpdate={(noteId, body, expectedVersion) => notes.updateNote(noteId, { body, expectedVersion })}
          />

          {/* Related Files */}
          <RelatedFilesPanel relation={{ entityType: "lead", entityId: lead.id, scope: platformAdapter.getScope() }} />
        </aside>
      </div>

      {/* Edit Drawer Modal */}
      <AppDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Editar Lead y BANT"
        eyebrow="CRM / Leads"
        mode="Editing"
        headerMeta={<span>Formulario de Cualificación</span>}
        description="Actualiza el contexto comercial, atribución y criterios BANT."
        restoreFocusRef={editRestoreFocusRef}
        dirty={() => editLifecycle.dirtyRef.current}
        showDirtyState={editLifecycle.dirty}
        confirmOnClose
        confirmTitle="¿Descartar cambios?"
        confirmDescription="Los cambios no guardados se perderán."
        confirmLabel="Descartar"
        cancelLabel="Seguir editando"
        onDiscard={() => editLifecycle.markClean()}
        size="md"
        layoutMode="standard"
        responsive="auto"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void saveEdit()}>
              Guardar Cambios
            </Button>
          </div>
        }
      >
        <form
          id="edit-lead-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void saveEdit();
          }}
        >
          <section className="space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs">
            <FormSectionHeader
              eyebrow="Perfil"
              title="Detalles del Lead"
              description="Datos de contacto y responsable comercial."
              mode="expanded"
              responsive="auto"
              meta={<span>Básico</span>}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Contacto</Label>
                <Input value={contactName(contact)} readOnly className="bg-muted/40" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-lead-interest">Interés / Objetivo</Label>
                <Input
                  id="edit-lead-interest"
                  value={editInterest}
                  onChange={(e) => {
                    editLifecycle.markDirty();
                    setEditInterest(e.target.value);
                  }}
                  placeholder="ej. Expansión Enterprise Cloud"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-lead-source">Fuente de Atribución</Label>
                <Input
                  id="edit-lead-source"
                  value={editSource}
                  onChange={(e) => {
                    editLifecycle.markDirty();
                    setEditSource(e.target.value);
                  }}
                  placeholder="Website, Referral, Evento..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-lead-owner">Comercial Asignado (Owner)</Label>
                <Select
                  value={editOwner || "unassigned"}
                  onValueChange={(val) => {
                    editLifecycle.markDirty();
                    setEditOwner(val === "unassigned" ? "" : val);
                  }}
                >
                  <SelectTrigger id="edit-lead-owner">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Sin asignar</SelectItem>
                    {ownerOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-lead-status">Estado del Lead</Label>
                <Select
                  value={editStatus}
                  onValueChange={(val) => {
                    editLifecycle.markDirty();
                    setEditStatus(val as CRMLeadStatusCode);
                  }}
                >
                  <SelectTrigger id="edit-lead-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CRM_LEAD_STATUS_CODES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs">
            <FormSectionHeader
              eyebrow="Cualificación BANT"
              title="Contexto Comercial"
              description="Datos clave para madurar el lead antes de pasar a propuesta."
              mode="expanded"
              responsive="auto"
              meta={<span>Criterios</span>}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-lead-need">Necesidad Detectada (Need)</Label>
                <Input
                  id="edit-lead-need"
                  value={editNeed}
                  onChange={(e) => {
                    editLifecycle.markDirty();
                    setEditNeed(e.target.value);
                  }}
                  placeholder="¿Qué problema u oportunidad busca resolver?"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-lead-timeline">Plazo Objetivo (Timeline)</Label>
                <Input
                  id="edit-lead-timeline"
                  value={editTimeline}
                  onChange={(e) => {
                    editLifecycle.markDirty();
                    setEditTimeline(e.target.value);
                  }}
                  placeholder="Este trimestre, 3-6 meses..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-lead-value">Presupuesto Estimado (Budget)</Label>
                <Input
                  id="edit-lead-value"
                  type="number"
                  min="0"
                  value={editEstimatedValue}
                  onChange={(e) => {
                    editLifecycle.markDirty();
                    setEditEstimatedValue(e.target.value);
                  }}
                  placeholder="35000"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-lead-currency">Moneda</Label>
                <Input
                  id="edit-lead-currency"
                  maxLength={3}
                  value={editEstimatedCurrency}
                  onChange={(e) => {
                    editLifecycle.markDirty();
                    setEditEstimatedCurrency(e.target.value);
                  }}
                  placeholder="EUR"
                />
              </div>
            </div>
          </section>
        </form>
      </AppDrawer>
    </PageContainer>
  );
}
