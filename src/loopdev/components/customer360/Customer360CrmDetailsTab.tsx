import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/common";
import type { CRMContact } from "@/loopdev/domains/crm/adapter";
import { useLanguages } from "@/loopdev/domains/reference-data";
import { formatDate } from "@/lib/formatters";
import { Customer360Field, formatCustomerAttribute } from "./Customer360Field";

export function Customer360CrmDetailsTab({ contact }: { contact: CRMContact }) {
  const { items: languages } = useLanguages(contact.organizationId);
  const preferredLanguage = languages.find((language) => language.code === contact.preferredLanguage)?.label ?? contact.preferredLanguage;
  const missingFields = [
    !contact.email && "email",
    !contact.phone && "phone",
    !contact.country && "country",
  ].filter((field): field is string => Boolean(field));
  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm ${missingFields.length ? "border-warning/30 bg-warning/10" : "border-success/30 bg-success/10"}`}>
        {missingFields.length ? <AlertTriangle className="h-4 w-4 shrink-0 text-warning" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />}
        <span className="font-medium">{missingFields.length ? "Contact information incomplete" : "Contact information complete"}</span>
        {missingFields.length ? <StatusBadge tone="warning">{missingFields.join(", ")} missing</StatusBadge> : <StatusBadge tone="success">Ready for CRM use</StatusBadge>}
      </div>
      <Tabs defaultValue="identity">
        <TabsList className="flex w-full justify-start gap-1 overflow-x-auto bg-card-muted p-1">
          <TabsTrigger value="identity" className="shrink-0">Identity</TabsTrigger>
          <TabsTrigger value="address" className="shrink-0">Address</TabsTrigger>
          <TabsTrigger value="organization" className="shrink-0">Organization</TabsTrigger>
          <TabsTrigger value="channels" className="shrink-0">Contact channels</TabsTrigger>
        </TabsList>
        <TabsContent value="identity"><dl className="grid gap-4 pt-5 sm:grid-cols-2"><Customer360Field label="First name" value={contact.firstName} /><Customer360Field label="Last name" value={contact.lastName} /><Customer360Field label="Second last name" value={contact.secondLastName} /><Customer360Field label="Preferred name" value={contact.preferredName} /><Customer360Field label="Document type" value={contact.documentType} /><Customer360Field label="Document number" value={contact.documentNumber} mono /><Customer360Field label="Birth date" value={contact.birthDate ? formatDate(contact.birthDate) : null} /><Customer360Field label="Gender" value={contact.gender} /></dl></TabsContent>
        <TabsContent value="channels"><dl className="grid gap-4 pt-5 sm:grid-cols-2"><Customer360Field label="Email" value={contact.email} /><Customer360Field label="Secondary email" value={contact.secondaryEmail} /><Customer360Field label="Phone" value={contact.phone} /><Customer360Field label="Secondary phone" value={contact.secondaryPhone} /><Customer360Field label="Preferred channel" value={contact.preferredChannel} copyable={false} /><Customer360Field label="Preferred language" value={preferredLanguage ?? null} copyable={false} /></dl></TabsContent>
        <TabsContent value="organization"><dl className="grid gap-4 pt-5 sm:grid-cols-2"><Customer360Field label="Company" value={contact.companyName} /><Customer360Field label="Job title" value={contact.jobTitle} /><Customer360Field label="Department" value={contact.department} /><Customer360Field label="Identity status" value={contact.identityStatus.replace("_", " ")} copyable={false} /><Customer360Field label="Contact ID" value={contact.id} mono /><Customer360Field label="Created" value={formatDate(contact.createdAt)} copyable={false} /><Customer360Field label="Updated" value={formatDate(contact.updatedAt)} copyable={false} />{Object.entries(contact.attributes).map(([key, value]) => <Customer360Field key={key} label={`Custom · ${key}`} value={formatCustomerAttribute(value)} />)}</dl></TabsContent>
        <TabsContent value="address"><dl className="grid gap-4 pt-5 sm:grid-cols-2"><Customer360Field label="Country" value={contact.country} /><Customer360Field label="City" value={contact.city} /><Customer360Field label="State / province" value={contact.stateProvince} /><Customer360Field label="Postal code" value={contact.postalCode} /><Customer360Field label="Address line 1" value={contact.addressLine1} /><Customer360Field label="Address line 2" value={contact.addressLine2} /></dl></TabsContent>
      </Tabs>
    </div>
  );
}
