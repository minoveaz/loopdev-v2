import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckSquare,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { DataCard, EmptyState, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { contactName } from "@/adapters/loopdev";
import { useLoopdevCustomer360 } from "@/hooks/use-loopdev-crm";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { formatDate, formatRelative, getInitials } from "@/lib/formatters";

export default function SalesCRMCustomer360() {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const { trail } = useBreadcrumbs();
  const { view, loading } = useLoopdevCustomer360(contactId);

  if (loading) {
    return (
      <PageContainer width="narrow">
        <div className="py-16 text-center text-sm text-muted-foreground">Loading contact...</div>
      </PageContainer>
    );
  }

  if (!view) {
    return (
      <PageContainer width="narrow">
        <EmptyState
          title="Contact not found"
          description="The contact you're looking for doesn't exist."
          action={
            <Button asChild>
              <Link to="/app/sales-crm/contacts">Back to contacts</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const contact = view.contact;
  const name = contactName(contact);
  const lifecycle = String(contact.attributes.localTier ?? "contact");
  const openTasks = view.tasks.filter((task) => task.status !== "completed");

  return (
    <PageContainer width="wide">
      <PageHeader
        title={name}
        description="Profile, relationship details, and recent CRM activity."
        breadcrumbs={trail.length ? trail : [{ label: "CRM" }, { label: "Contacts" }, { label: name }]}
        actions={
          <Button variant="outline" asChild>
            <Link to="/app/sales-crm/contacts">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <DataCard title="Profile" description="Contact at a glance">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 border border-border">
              <AvatarFallback className="bg-primary-soft text-lg font-semibold text-primary">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-3 text-base font-semibold">{name}</h2>
            <p className="text-sm text-muted-foreground">
              {[contact.jobTitle, contact.companyName].filter(Boolean).join(" · ") || "CRM contact"}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <StatusBadge tone="success" dot>{lifecycle}</StatusBadge>
              <StatusBadge tone={contact.identityStatus === "verified" ? "primary" : "warning"}>
                {contact.identityStatus.replace("_", " ")}
              </StatusBadge>
            </div>
          </div>

          <ul className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
            <ContactLine icon={Mail} value={contact.email} />
            <ContactLine icon={Phone} value={contact.phone} />
            <ContactLine icon={Building2} value={contact.companyName} />
            <ContactLine icon={MapPin} value={[contact.city, contact.country].filter(Boolean).join(", ")} />
            <ContactLine icon={Calendar} value={`Added ${formatDate(contact.createdAt)}`} />
            <ContactLine icon={Clock} value={`Updated ${formatRelative(contact.updatedAt)}`} />
          </ul>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
            <Button size="sm" variant="outline" className="gap-1.5"><Mail className="h-3.5 w-3.5" />Email</Button>
            <Button size="sm" variant="outline" className="gap-1.5"><Phone className="h-3.5 w-3.5" />Call</Button>
          </div>
        </DataCard>

        <DataCard className="lg:col-span-2" title="CRM details" description="Relationship and assignment context">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={name} />
            <Field label="First name" value={contact.firstName} />
            <Field label="Last name" value={contact.lastName} />
            <Field label="Second last name" value={contact.secondLastName} />
            <Field label="Preferred name" value={contact.preferredName} />
            <Field label="Email" value={contact.email} />
            <Field label="Secondary email" value={contact.secondaryEmail} />
            <Field label="Phone" value={contact.phone} />
            <Field label="Secondary phone" value={contact.secondaryPhone} />
            <Field label="Preferred channel" value={contact.preferredChannel} />
            <Field label="Preferred language" value={contact.preferredLanguage} />
            <Field label="Document type" value={contact.documentType} />
            <Field label="Document number" value={contact.documentNumber} mono />
            <Field label="Birth date" value={contact.birthDate ? formatDate(contact.birthDate) : null} />
            <Field label="Gender" value={contact.gender} />
            <Field label="Company" value={contact.companyName} />
            <Field label="Job title" value={contact.jobTitle} />
            <Field label="Department" value={contact.department} />
            <Field label="Address line 1" value={contact.addressLine1} />
            <Field label="Address line 2" value={contact.addressLine2} />
            <Field label="City" value={contact.city} />
            <Field label="State / province" value={contact.stateProvince} />
            <Field label="Postal code" value={contact.postalCode} />
            <Field label="Country" value={contact.country} />
            <Field label="Identity status" value={contact.identityStatus.replace("_", " ")} />
            <Field label="Contact ID" value={contact.id} mono />
            <Field label="Created" value={formatDate(contact.createdAt)} />
            <Field label="Updated" value={formatDate(contact.updatedAt)} />
          </dl>

          <div className="mt-4 rounded-md border border-border bg-card-muted/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Attributes</p>
            {Object.entries(contact.attributes).length ? (
              <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                {Object.entries(contact.attributes).map(([key, value]) => (
                  <Field key={key} label={key} value={formatAttributeValue(value)} />
                ))}
              </dl>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">No additional attributes.</p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
            <Button className="gap-1.5"><Plus className="h-3.5 w-3.5" />New task</Button>
            <Button variant="outline" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" />Add note</Button>
            <Button variant="outline">Edit contact</Button>
          </div>
        </DataCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DataCard title="Activity timeline" description="Recent relationship activity">
          {view.timeline.length ? (
            <ol className="relative ml-2 space-y-5 border-l border-border pl-5">
              {view.timeline.map((item) => (
                <li key={`${item.sourceType}:${item.sourceId}`} className="relative">
                  <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                  <p className="text-sm font-medium">{item.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(item.occurredAt)} · {item.type}
                  </p>
                </li>
              ))}
            </ol>
          ) : <EmptyState title="No recent activity" description="Activity will appear here as the relationship develops." />}
        </DataCard>

        <DataCard title="Related opportunities" description="Commercial context for this contact">
          {view.opportunities.length ? (
            <ul className="space-y-2">
              {view.opportunities.map((opportunity) => (
                <li key={opportunity.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card-muted/30 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-soft text-primary"><TrendingUp className="h-4 w-4" /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{opportunity.name}</p>
                      <p className="text-xs text-muted-foreground">{opportunity.stageKey} · {opportunity.amount ?? "—"} {opportunity.currency ?? ""}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">View</Button>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No opportunities" description="Related opportunities will appear here." />}
          <Button variant="outline" className="mt-4 w-full gap-1.5"><Plus className="h-3.5 w-3.5" />New opportunity</Button>
        </DataCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DataCard title="Open tasks" description="Follow-ups and next actions">
          {openTasks.length ? (
            <ul className="space-y-2">
              {openTasks.map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-card-muted/30 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <CheckSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.priority} priority · {task.dueAt ? formatDate(task.dueAt) : "No due date"}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">View</Button>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No open tasks" description="Follow-ups will appear here." />}
        </DataCard>

        <DataCard title="Related leads and notes" description="Additional authorized CRM context">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-md border border-border bg-card-muted/30 p-3">
              <div className="flex items-center gap-3"><Users className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">Related leads</span></div>
              <StatusBadge tone="info">{view.leads.length}</StatusBadge>
            </div>
            {view.notes.map((note) => (
              <div key={note.id} className="rounded-md border border-border bg-card-muted/30 p-3">
                <p className="text-sm">{note.body ?? "Note content is restricted."}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatRelative(note.updatedAt)} · {note.visibility}</p>
              </div>
            ))}
            {!view.notes.length && <p className="text-sm text-muted-foreground">No authorized notes.</p>}
          </div>
        </DataCard>
      </div>
    </PageContainer>
  );
}

function ContactLine({ icon: Icon, value }: { icon: typeof Mail; value: string | null }) {
  return (
    <li className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{value || "—"}</span>
    </li>
  );
}

function Field({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="rounded-md border border-border bg-card-muted/30 p-3">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 text-sm ${mono ? "font-mono" : ""}`}>{value || "—"}</dd>
    </div>
  );
}

function formatAttributeValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}
