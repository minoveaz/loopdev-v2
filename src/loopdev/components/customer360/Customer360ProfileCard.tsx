import { Building2, Calendar, Clock, Mail, MapPin, Phone } from "lucide-react";
import { DataCard, StatusBadge } from "@/components/common";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { CRMContact } from "@/loopdev/domains/crm/adapter";
import { contactName } from "@/loopdev/domains/crm/adapter";
import { formatDate, formatRelative, getInitials } from "@/lib/formatters";

export function Customer360ProfileCard({ contact }: { contact: CRMContact }) {
  const name = contactName(contact);
  const lifecycle = String(contact.attributes.localTier ?? "contact");

  return (
    <DataCard title="Profile" description="Contact at a glance">
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-20 w-20 border border-border">
          <AvatarFallback className="bg-primary-soft text-lg font-semibold text-primary">{getInitials(name)}</AvatarFallback>
        </Avatar>
        <h2 className="mt-3 text-base font-semibold">{name}</h2>
        <p className="text-sm text-muted-foreground">{[contact.jobTitle, contact.companyName].filter(Boolean).join(" · ") || "CRM contact"}</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <StatusBadge tone="success" dot>{lifecycle}</StatusBadge>
          <StatusBadge tone={contact.identityStatus === "verified" ? "primary" : "warning"}>{contact.identityStatus.replace("_", " ")}</StatusBadge>
          {contact.archivedAt && <StatusBadge tone="destructive">Archived</StatusBadge>}
        </div>
      </div>
      {contact.archivedAt && (
        <div role="status" className="mt-4 rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">
          This contact is archived and is read-only in the local workspace. Archived on {formatDate(contact.archivedAt)}.
        </div>
      )}
      <ul className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
        <ContactLine icon={Mail} value={contact.email} />
        <ContactLine icon={Phone} value={contact.phone} />
        <ContactLine icon={Building2} value={contact.companyName} />
        <ContactLine icon={MapPin} value={[contact.city, contact.country].filter(Boolean).join(", ")} />
        <ContactLine icon={Calendar} value={`Added ${formatDate(contact.createdAt)}`} />
        <ContactLine icon={Clock} value={`Updated ${formatRelative(contact.updatedAt)}`} />
      </ul>
      <div className="mt-5 flex gap-2 border-t border-border pt-4">
        <Button size="sm" variant="outline"><Mail className="mr-1.5 h-3.5 w-3.5" />Email</Button>
        <Button size="sm" variant="outline"><Phone className="mr-1.5 h-3.5 w-3.5" />Call</Button>
      </div>
    </DataCard>
  );
}

function ContactLine({ icon: Icon, value }: { icon: typeof Mail; value: string | null }) {
  return <li className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /><span className="truncate">{value || "—"}</span></li>;
}
