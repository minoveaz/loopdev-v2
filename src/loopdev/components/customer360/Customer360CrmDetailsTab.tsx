import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/common";
import { useT } from "@/i18n";
import type { CRMContact } from "@/loopdev/domains/crm/adapter";
import { useLanguages } from "@/loopdev/domains/reference-data";
import { formatDate } from "@/lib/formatters";
import { Customer360Field, formatCustomerAttribute } from "./Customer360Field";

export function Customer360CrmDetailsTab({ contact }: { contact: CRMContact }) {
  const t = useT();
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
        <span className="font-medium">{missingFields.length ? t("crm.customer360.completeness.incomplete") : t("crm.customer360.completeness.complete")}</span>
        {missingFields.length ? <StatusBadge tone="warning">{t("crm.customer360.completeness.missing", { fields: missingFields.join(", ") })}</StatusBadge> : <StatusBadge tone="success">{t("crm.customer360.completeness.ready")}</StatusBadge>}
      </div>
      <Tabs defaultValue="identity">
        <TabsList className="flex w-full justify-start gap-1 overflow-x-auto bg-card-muted p-1">
          <TabsTrigger value="identity" className="shrink-0">{t("crm.customer360.subtabs.identity")}</TabsTrigger>
          <TabsTrigger value="address" className="shrink-0">{t("crm.customer360.subtabs.address")}</TabsTrigger>
          <TabsTrigger value="organization" className="shrink-0">{t("crm.customer360.subtabs.organization")}</TabsTrigger>
          <TabsTrigger value="channels" className="shrink-0">{t("crm.customer360.subtabs.channels")}</TabsTrigger>
        </TabsList>
        <TabsContent value="identity"><dl className="grid gap-4 pt-5 sm:grid-cols-2"><Customer360Field label={t("crm.customer360.fields.firstName")} value={contact.firstName} /><Customer360Field label={t("crm.customer360.fields.lastName")} value={contact.lastName} /><Customer360Field label={t("crm.customer360.fields.secondLastName")} value={contact.secondLastName} /><Customer360Field label={t("crm.customer360.fields.preferredName")} value={contact.preferredName} /><Customer360Field label={t("crm.customer360.fields.docType")} value={contact.documentType} /><Customer360Field label={t("crm.customer360.fields.docNumber")} value={contact.documentNumber} mono /><Customer360Field label={t("crm.customer360.fields.birthDate")} value={contact.birthDate ? formatDate(contact.birthDate) : null} /><Customer360Field label={t("crm.customer360.fields.gender")} value={contact.gender} /></dl></TabsContent>
        <TabsContent value="address"><dl className="grid gap-4 pt-5 sm:grid-cols-2"><Customer360Field label={t("crm.customer360.fields.country")} value={contact.country} /><Customer360Field label={t("crm.customer360.fields.city")} value={contact.city} /><Customer360Field label={t("crm.customer360.fields.state")} value={contact.stateProvince} /><Customer360Field label={t("crm.customer360.fields.postalCode")} value={contact.postalCode} /><Customer360Field label={t("crm.customer360.fields.addressLine1")} value={contact.addressLine1} /><Customer360Field label={t("crm.customer360.fields.addressLine2")} value={contact.addressLine2} /></dl></TabsContent>
        <TabsContent value="organization"><dl className="grid gap-4 pt-5 sm:grid-cols-2"><Customer360Field label={t("crm.customer360.fields.company")} value={contact.companyName} /><Customer360Field label={t("crm.customer360.fields.jobTitle")} value={contact.jobTitle} /><Customer360Field label={t("crm.customer360.fields.department")} value={contact.department} /><Customer360Field label={t("crm.customer360.fields.identityStatus")} value={contact.identityStatus?.replace("_", " ")} copyable={false} /><Customer360Field label={t("crm.customer360.fields.contactId")} value={contact.id} mono /><Customer360Field label={t("crm.customer360.fields.createdAt")} value={formatDate(contact.createdAt)} copyable={false} /><Customer360Field label={t("crm.customer360.fields.updatedAt")} value={formatDate(contact.updatedAt)} copyable={false} />{Object.entries(contact.attributes || {}).map(([key, value]) => <Customer360Field key={key} label={`Custom · ${key}`} value={formatCustomerAttribute(value)} />)}</dl></TabsContent>
        <TabsContent value="channels"><dl className="grid gap-4 pt-5 sm:grid-cols-2"><Customer360Field label={t("crm.customer360.fields.email")} value={contact.email} /><Customer360Field label={t("crm.customer360.fields.secondaryEmail")} value={contact.secondaryEmail} /><Customer360Field label={t("crm.customer360.fields.phone")} value={contact.phone} /><Customer360Field label={t("crm.customer360.fields.secondaryPhone")} value={contact.secondaryPhone} /><Customer360Field label={t("crm.customer360.fields.preferredChannel")} value={contact.preferredChannel} copyable={false} /><Customer360Field label={t("crm.customer360.fields.preferredLanguage")} value={preferredLanguage ?? null} copyable={false} /></dl></TabsContent>
      </Tabs>
    </div>
  );
}
