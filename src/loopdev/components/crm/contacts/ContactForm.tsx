import { useEffect, useState } from "react";
import { Building2, Contact, FileText, MapPin, UserRound } from "lucide-react";
import { useForm, type Control, type Resolver } from "react-hook-form";
import { contactFormSections, emptyContactFormValues, getContactSectionStats, validateContactForm, type ContactFormValues } from "../../../../../packages/contracts/src/contact-form";
import type { CRMContact, CRMContactMutationResult } from "@/loopdev/domains/crm/adapter";
import { DocumentExtractionDrawer } from "@/loopdev/components/document-intelligence/DocumentExtractionDrawer";
import type { IdentityDocumentFields } from "@/loopdev/domains/document-intelligence";
import {
  CityCombobox,
  ReferenceSelect,
  useCities,
  useCountries,
  useDocumentTypes,
  useGenderOptions,
  useLanguages,
  useSubdivisions,
} from "@/loopdev/domains/reference-data";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/common";

export type { ContactFormValues };
const contactFormResolver: Resolver<ContactFormValues> = async (values) => {
  const errors = validateContactForm(values);
  return {
    values: Object.keys(errors).length ? {} as ContactFormValues : values,
    errors: Object.fromEntries(Object.entries(errors).map(([name, message]) => [name, { type: "validate", message }])) as any,
  };
};

function valuesFromContact(contact: CRMContact | null | undefined): ContactFormValues {
  if (!contact) return emptyContactFormValues;
  return {
    firstName: contact.firstName,
    lastName: contact.lastName ?? "",
    secondLastName: contact.secondLastName ?? "",
    preferredName: contact.preferredName ?? "",
    documentType: normalizeDocumentType(contact.documentType),
    documentNumber: contact.documentNumber ?? "",
    birthDate: contact.birthDate ?? "",
    gender: normalizeGender(contact.gender),
    email: contact.email ?? "",
    secondaryEmail: contact.secondaryEmail ?? "",
    phone: contact.phone ?? "",
    secondaryPhone: contact.secondaryPhone ?? "",
    preferredChannel: contact.preferredChannel ?? "email",
    preferredLanguage: contact.preferredLanguage ?? "",
    companyName: contact.companyName ?? "",
    jobTitle: contact.jobTitle ?? "",
    department: contact.department ?? "",
    addressLine1: contact.addressLine1 ?? "",
    addressLine2: contact.addressLine2 ?? "",
    city: contact.city ?? "",
    stateProvince: contact.stateProvince ?? "",
    postalCode: contact.postalCode ?? "",
    country: normalizeCountry(contact.country),
  };
}

function normalizeDocumentType(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase();
  return normalized === "dni" || normalized === "nie" || normalized === "passport" ||
    normalized === "cedula" || normalized === "drivers-license" || normalized === "ssn"
    ? normalized
    : value ?? "";
}

function normalizeGender(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase().replace(/ /g, "_");
  return normalized === "female" || normalized === "male" || normalized === "non_binary" ||
    normalized === "unspecified" || normalized === "prefer_not_to_say"
    ? normalized
    : value ?? "";
}

function normalizeCountry(value: string | null | undefined): string {
  const normalized = value?.trim().toLowerCase();
  const countryCodes: Record<string, string> = {
    colombia: "CO",
    co: "CO",
    espana: "ES",
    spain: "ES",
    es: "ES",
    estados_unidos: "US",
    "united states": "US",
    usa: "US",
    us: "US",
  };
  return countryCodes[normalized ?? ""] ?? value ?? "";
}

function optionalValue(value: string): string | null {
  return value.trim() || null;
}

interface ContactFormProps {
  contact?: CRMContact | null;
  onCancel: () => void;
  onSubmit: (values: ContactFormValues) => Promise<CRMContactMutationResult>;
  onSuccess: (contact: CRMContact) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSectionStatsChange?: (stats: Record<string, ContactSectionStats>) => void;
}

export type ContactSectionStats = { completed: number; total: number; errors: number; status: "error" | "complete" | "progress" | "neutral" };

export function ContactForm({ contact, onCancel, onSubmit, onSuccess, onDirtyChange, onSectionStatsChange }: ContactFormProps) {
  const organizationId = "local-development-organization";
  const form = useForm<ContactFormValues>({
    resolver: contactFormResolver,
    defaultValues: valuesFromContact(contact),
  });
  const { formState } = form;
  const values = form.watch();
  const sectionStats = getContactSectionStats(values, formState.errors as Record<string, string>) as Record<string, ContactSectionStats>;
  const sectionStatsSignature = contactFormSections.map((section) => {
    const stats = sectionStats[section.id];
    return `${section.id}:${stats.completed}:${stats.errors}:${stats.status}`;
  }).join("|");
  const countryValue = form.watch("country");
  const { items: countries } = useCountries(organizationId);
  const country = countries.find((item) => item.code === countryValue || item.label === countryValue);
  const countryCode = country?.code ?? null;
  const { items: subdivisions } = useSubdivisions(countryCode, organizationId);
  const { items: cities } = useCities(countryCode, form.watch("stateProvince") || null, "", organizationId);
  const { items: documentTypes } = useDocumentTypes(countryCode, organizationId);
  const { items: genderOptions } = useGenderOptions(organizationId);
  const { items: languages } = useLanguages(organizationId);

  useEffect(() => {
    form.reset(valuesFromContact(contact));
  }, [contact, form]);

  useEffect(() => {
    onDirtyChange?.(formState.isDirty);
  }, [formState.isDirty, onDirtyChange]);

  useEffect(() => {
    onSectionStatsChange?.(sectionStats);
  }, [onSectionStatsChange, sectionStatsSignature]);

  const submit = async (values: ContactFormValues) => {
    const result = await onSubmit({
      ...values,
      lastName: optionalValue(values.lastName) ?? "",
      secondLastName: optionalValue(values.secondLastName) ?? "",
      preferredName: optionalValue(values.preferredName) ?? "",
      documentType: optionalValue(values.documentType) ?? "",
      documentNumber: optionalValue(values.documentNumber) ?? "",
      birthDate: optionalValue(values.birthDate) ?? "",
      gender: optionalValue(values.gender) ?? "",
      email: values.email.trim(),
      secondaryEmail: optionalValue(values.secondaryEmail) ?? "",
      phone: values.phone.trim(),
      secondaryPhone: optionalValue(values.secondaryPhone) ?? "",
      preferredLanguage: optionalValue(values.preferredLanguage) ?? "",
      companyName: optionalValue(values.companyName) ?? "",
      jobTitle: optionalValue(values.jobTitle) ?? "",
      department: optionalValue(values.department) ?? "",
      addressLine1: optionalValue(values.addressLine1) ?? "",
      addressLine2: optionalValue(values.addressLine2) ?? "",
      city: optionalValue(values.city) ?? "",
      stateProvince: optionalValue(values.stateProvince) ?? "",
      postalCode: optionalValue(values.postalCode) ?? "",
      country: optionalValue(values.country) ?? "",
    });

    if (result.status === "success") {
      onDirtyChange?.(false);
      onSuccess(result.contact);
      return;
    }
    if (result.status === "validation-error") {
      Object.entries(result.fieldErrors).forEach(([field, message]) => {
        form.setError(field as keyof ContactFormValues, { message });
      });
      return;
    }
    const prefix = result.status === "forbidden"
      ? "Permission denied: "
      : result.status === "conflict"
        ? "Conflict: "
        : "Server error: ";
    form.setError("root.server", { message: `${prefix}${result.message}` });
  };

  const [extractionDrawerOpen, setExtractionDrawerOpen] = useState(false);

  const handleApplyExtractedDocument = (fields: IdentityDocumentFields) => {
    if (fields.givenNames) form.setValue("firstName", fields.givenNames, { shouldDirty: true });
    if (fields.firstSurname) form.setValue("lastName", fields.firstSurname, { shouldDirty: true });
    if (fields.secondSurname) form.setValue("secondLastName", fields.secondSurname, { shouldDirty: true });
    if (fields.documentNumber) form.setValue("documentNumber", fields.documentNumber, { shouldDirty: true });
    if (fields.birthDate) form.setValue("birthDate", fields.birthDate, { shouldDirty: true });
    if (fields.address) form.setValue("addressLine1", fields.address, { shouldDirty: true });
    if (fields.nationality && fields.nationality === "ESP") form.setValue("country", "ES", { shouldDirty: true });
    if (fields.sex) {
      const genderMap: Record<string, string> = { M: "male", F: "female" };
      if (genderMap[fields.sex]) form.setValue("gender", genderMap[fields.sex], { shouldDirty: true });
    }
    if (fields.documentType) {
      const docTypeMap: Record<string, string> = {
        "spanish-dni": "dni",
        "spanish-nie": "nie",
        passport: "passport",
      };
      if (docTypeMap[fields.documentType]) {
        form.setValue("documentType", docTypeMap[fields.documentType], { shouldDirty: true });
      }
    }
  };

  const iconByKey = { user: UserRound, contact: Contact, building: Building2, "map-pin": MapPin } as const;
  const renderField = (id: keyof ContactFormValues) => {
    const definition = contactFormSections.flatMap((section) => section.fields).find((item) => item.id === id)!;
    if (id === "documentType") return <FormField key={id} control={form.control} name={id} render={({ field }) => <FormItem><FormLabel>{definition.label}</FormLabel><ReferenceSelect items={documentTypes} value={field.value} onValueChange={field.onChange} placeholder="Select document type" aria-label={definition.label} /><FormMessage /></FormItem>} />;
    if (id === "gender") return <FormField key={id} control={form.control} name={id} render={({ field }) => <FormItem><FormLabel>{definition.label}</FormLabel><ReferenceSelect items={genderOptions} value={field.value} onValueChange={field.onChange} placeholder="Select gender" aria-label={definition.label} /><FormMessage /></FormItem>} />;
    if (id === "preferredLanguage") return <FormField key={id} control={form.control} name={id} render={({ field }) => <FormItem><FormLabel>{definition.label}</FormLabel><ReferenceSelect items={languages} value={field.value} onValueChange={field.onChange} placeholder="Select preferred language" aria-label={definition.label} /><FormMessage /></FormItem>} />;
    if (id === "preferredChannel") return <FormField key={id} control={form.control} name={id} render={({ field }) => <FormItem><FormLabel>{definition.label}</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="email">Email</SelectItem><SelectItem value="phone">Phone</SelectItem><SelectItem value="whatsapp">WhatsApp</SelectItem></SelectContent></Select><FormMessage /></FormItem>} />;
    if (id === "country") return <FormField key={id} control={form.control} name={id} render={({ field }) => <FormItem><FormLabel>{definition.label}</FormLabel><ReferenceSelect items={countries} value={field.value} onValueChange={(value) => { field.onChange(value); form.setValue("stateProvince", ""); form.setValue("city", ""); form.setValue("documentType", ""); }} placeholder="Select country" aria-label={definition.label} /><FormMessage /></FormItem>} />;
    if (id === "stateProvince") return <FormField key={id} control={form.control} name={id} render={({ field }) => <FormItem><FormLabel>{definition.label}</FormLabel><ReferenceSelect items={subdivisions} value={field.value} onValueChange={(value) => { field.onChange(value); form.setValue("city", ""); }} placeholder="Select state / province" aria-label={definition.label} /><FormMessage /></FormItem>} />;
    if (id === "city") return <FormField key={id} control={form.control} name={id} render={({ field }) => <FormItem><FormLabel>{definition.label}</FormLabel><CityCombobox items={cities} value={field.value} onValueChange={field.onChange} aria-label={definition.label} /><FormMessage /></FormItem>} />;
    return <TextField key={id} control={form.control} name={id} label={definition.label} type={definition.type === "date" ? "date" : definition.type === "email" ? "email" : "text"} required={definition.required} />;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="loopdev-form mt-6 flex flex-col gap-7">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs shrink-0"
            onClick={() => setExtractionDrawerOpen(true)}
          >
            <FileText className="h-3.5 w-3.5 text-primary" />
            Escanear DNI / Pasaporte
          </Button>
        </div>
        {contactFormSections.map((section) => {
          const Icon = iconByKey[section.iconKey];
          const stats = sectionStats[section.id];
          return <FormSection key={section.id} id={`contact-form-${section.id}`} className="scroll-mt-14 loopdev-form-section" eyebrow={section.eyebrow} title={section.label} description={section.description} icon={<Icon className="h-4 w-4" />} completed={stats.completed} total={stats.total} errorCount={stats.errors} status={stats.status} mode="expanded" responsive="auto" meta={section.meta ? <span>{section.meta}</span> : undefined}>
            <div className="grid gap-4 sm:grid-cols-2">{section.fields.map((field) => <div key={field.id} className={field.id === "addressLine1" || field.id === "addressLine2" ? "sm:col-span-2" : undefined}>{renderField(field.id)}</div>)}</div>
          </FormSection>;
        })}
        {formState.errors.root?.server && (() => { const message = formState.errors.root.server.message ?? ""; const conflict = message.startsWith("Conflict:"); const permission = message.startsWith("Permission denied:"); return <p role="alert" className={`rounded-md border px-3 py-2 text-sm ${conflict ? "border-amber-500/30 bg-amber-500/10 text-amber-700" : permission ? "border-slate-400/40 bg-slate-500/10 text-slate-700" : "border-destructive/30 bg-destructive-soft text-destructive"}`}>{message}</p>; })()}
        <div className="flex justify-end gap-2 border-t border-border pt-5"><Button type="button" variant="ghost" onClick={onCancel} disabled={formState.isSubmitting}>Cancel</Button><Button type="submit" disabled={formState.isSubmitting}>{formState.isSubmitting ? "Saving..." : contact ? "Save changes" : "Create contact"}</Button></div>
      </form>

      <DocumentExtractionDrawer
        open={extractionDrawerOpen}
        onOpenChange={setExtractionDrawerOpen}
        sourceSuite="crm"
        onApplyExtractedData={handleApplyExtractedDocument}
      />
    </Form>
  );
}

function TextField({
  control,
  name,
  label,
  type = "text",
  required = false,
}: {
  control: Control<ContactFormValues>;
  name: keyof ContactFormValues;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <FormField control={control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}{required ? " *" : ""}</FormLabel>
        <FormControl><Input {...field} type={type} value={field.value ?? ""} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
}
