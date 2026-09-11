import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Building2, Contact, MapPin, UserRound } from "lucide-react";
import { useForm, type Control, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import type { CRMContact, CRMContactMutationResult } from "@/loopdev/domains/crm/adapter";
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
import { FormSectionHeader } from "@/components/common";

const contactFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string(),
  secondLastName: z.string(),
  preferredName: z.string(),
  documentType: z.string(),
  documentNumber: z.string(),
  birthDate: z.string(),
  gender: z.string(),
  email: z.string().email("Enter a valid email.").or(z.literal("")),
  secondaryEmail: z.string().email("Enter a valid email.").or(z.literal("")),
  phone: z.string(),
  secondaryPhone: z.string(),
  preferredChannel: z.enum(["email", "phone", "whatsapp"]),
  preferredLanguage: z.string(),
  companyName: z.string(),
  jobTitle: z.string(),
  department: z.string(),
  addressLine1: z.string(),
  addressLine2: z.string(),
  city: z.string(),
  stateProvince: z.string(),
  postalCode: z.string(),
  country: z.string(),
}).superRefine((values, context) => {
  if (!values.email.trim() && !values.phone.trim()) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["email"], message: "Email or phone is required." });
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Email or phone is required." });
  }
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

const emptyValues: ContactFormValues = {
  firstName: "",
  lastName: "",
  secondLastName: "",
  preferredName: "",
  documentType: "",
  documentNumber: "",
  birthDate: "",
  gender: "",
  email: "",
  secondaryEmail: "",
  phone: "",
  secondaryPhone: "",
  preferredChannel: "email",
  preferredLanguage: "",
  companyName: "",
  jobTitle: "",
  department: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  country: "",
};

function sectionStatsFor(
  fields: (keyof ContactFormValues)[],
  values: ContactFormValues,
  errors: FieldErrors<ContactFormValues>,
) {
  const completed = fields.filter((field) => String(values[field] ?? "").trim().length > 0).length;
  const errorsCount = fields.filter((field) => Boolean(errors[field])).length;
  return {
    completed,
    total: fields.length,
    errors: errorsCount,
    status: errorsCount > 0 ? "error" as const : completed === fields.length ? "complete" as const : completed > 0 ? "progress" as const : "neutral" as const,
  };
}

function valuesFromContact(contact: CRMContact | null | undefined): ContactFormValues {
  if (!contact) return emptyValues;
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
}

export function ContactForm({ contact, onCancel, onSubmit, onSuccess, onDirtyChange }: ContactFormProps) {
  const organizationId = "local-development-organization";
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: valuesFromContact(contact),
  });
  const { formState } = form;
  const values = form.watch();
  const sectionStats = {
    identity: sectionStatsFor(["firstName", "lastName", "documentType", "documentNumber", "birthDate", "gender"], values, formState.errors),
    channels: sectionStatsFor(["email", "secondaryEmail", "phone", "secondaryPhone", "preferredChannel", "preferredLanguage"], values, formState.errors),
    organization: sectionStatsFor(["companyName", "jobTitle", "department"], values, formState.errors),
    address: sectionStatsFor(["addressLine1", "addressLine2", "city", "stateProvince", "postalCode", "country"], values, formState.errors),
  };
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="loopdev-form mt-6 flex flex-col gap-7">
        <section id="contact-form-identity" className="order-1 scroll-mt-14 loopdev-form-section space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs">
          <FormSectionHeader eyebrow="Profile" title="Identity" description="How this person should be identified in CRM." icon={<UserRound className="h-4 w-4" />} completed={sectionStats.identity.completed} total={sectionStats.identity.total} errorCount={sectionStats.identity.errors} status={sectionStats.identity.status} mode="expanded" responsive="auto" meta={<span>Core details</span>} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="firstName" label="First name" required />
            <TextField control={form.control} name="lastName" label="Last name" />
            <TextField control={form.control} name="secondLastName" label="Second last name" />
            <TextField control={form.control} name="preferredName" label="Preferred name" />
            <FormField control={form.control} name="documentType" render={({ field }) => (
              <FormItem>
                <FormLabel>Document type</FormLabel>
                <ReferenceSelect
                  items={documentTypes}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select document type"
                  aria-label="Document type"
                />
                <FormMessage />
              </FormItem>
            )} />
            <TextField control={form.control} name="documentNumber" label="Document number" />
            <TextField control={form.control} name="birthDate" label="Birth date" type="date" />
            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <ReferenceSelect
                  items={genderOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select gender"
                  aria-label="Gender"
                />
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </section>

        <section id="contact-form-channels" className="order-4 scroll-mt-14 loopdev-form-section space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs">
          <FormSectionHeader eyebrow="Communication" title="Contact channels" description="At least an email address or phone number is required." icon={<Contact className="h-4 w-4" />} completed={sectionStats.channels.completed} total={sectionStats.channels.total} errorCount={sectionStats.channels.errors} status={sectionStats.channels.status} mode="expanded" responsive="auto" meta={<span>At least one</span>} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="email" label="Primary email" type="email" />
            <TextField control={form.control} name="secondaryEmail" label="Secondary email" type="email" />
            <TextField control={form.control} name="phone" label="Primary phone" />
            <TextField control={form.control} name="secondaryPhone" label="Secondary phone" />
            <FormField control={form.control} name="preferredChannel" render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred channel</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="preferredLanguage" render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred language</FormLabel>
                <ReferenceSelect
                  items={languages}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select preferred language"
                  aria-label="Preferred language"
                />
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </section>

        <section id="contact-form-organization" className="order-3 scroll-mt-14 loopdev-form-section space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs">
          <FormSectionHeader eyebrow="Relationship" title="Organization" description="Professional context for the relationship." icon={<Building2 className="h-4 w-4" />} completed={sectionStats.organization.completed} total={sectionStats.organization.total} errorCount={sectionStats.organization.errors} status={sectionStats.organization.status} mode="expanded" responsive="auto" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="companyName" label="Company" />
            <TextField control={form.control} name="jobTitle" label="Job title" />
            <TextField control={form.control} name="department" label="Department" />
          </div>
        </section>

        <section id="contact-form-address" className="order-2 scroll-mt-14 loopdev-form-section space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs">
          <FormSectionHeader eyebrow="Location" title="Address" description="Optional location information." icon={<MapPin className="h-4 w-4" />} completed={sectionStats.address.completed} total={sectionStats.address.total} errorCount={sectionStats.address.errors} status={sectionStats.address.status} mode="expanded" responsive="auto" meta={<span>Optional</span>} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="country" render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <ReferenceSelect
                  items={countries}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("stateProvince", "");
                    form.setValue("city", "");
                    form.setValue("documentType", "");
                  }}
                  placeholder="Select country"
                  aria-label="Country"
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="city" render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <CityCombobox
                  items={cities}
                  value={field.value}
                  onValueChange={field.onChange}
                  aria-label="City"
                />
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="stateProvince" render={({ field }) => (
              <FormItem>
                <FormLabel>State / province</FormLabel>
                <ReferenceSelect
                  items={subdivisions}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue("city", "");
                  }}
                  placeholder="Select state / province"
                  aria-label="State / province"
                />
                <FormMessage />
              </FormItem>
            )} />
            <TextField control={form.control} name="postalCode" label="Postal code" />
            <div className="sm:col-span-2"><TextField control={form.control} name="addressLine1" label="Address line 1" /></div>
            <div className="sm:col-span-2"><TextField control={form.control} name="addressLine2" label="Address line 2" /></div>
          </div>
        </section>

        {formState.errors.root?.server && (() => {
          const message = formState.errors.root.server.message ?? "";
          const conflict = message.startsWith("Conflict:");
          const permission = message.startsWith("Permission denied:");
          return (
            <p
              role="alert"
              className={`order-5 rounded-md border px-3 py-2 text-sm ${
                conflict
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
                  : permission
                    ? "border-slate-400/40 bg-slate-500/10 text-slate-700"
                    : "border-destructive/30 bg-destructive-soft text-destructive"
              }`}
            >
              {message}
            </p>
          );
        })()}

        <div className="order-6 flex justify-end gap-2 border-t border-border pt-5">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={formState.isSubmitting}>Cancel</Button>
          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Saving..." : contact ? "Save changes" : "Create contact"}
          </Button>
        </div>
      </form>
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
