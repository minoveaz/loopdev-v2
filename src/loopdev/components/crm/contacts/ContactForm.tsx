import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm, type Control } from "react-hook-form";
import { z } from "zod";
import type { CRMContact, CRMContactMutationResult } from "@/loopdev/domains/crm/adapter";
import {
  useCities,
  useCountries,
  useDocumentTypes,
  useGenderOptions,
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
  return normalized === "dni" || normalized === "nie" || normalized === "passport"
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
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: valuesFromContact(contact),
  });
  const { formState } = form;
  const countryValue = form.watch("country");
  const { items: countries } = useCountries();
  const country = countries.find((item) => item.code === countryValue || item.label === countryValue);
  const countryCode = country?.code ?? null;
  const { items: subdivisions } = useSubdivisions(countryCode);
  const { items: cities } = useCities(countryCode, form.watch("stateProvince") || null, "");
  const { items: documentTypes } = useDocumentTypes(countryCode);
  const { items: genderOptions } = useGenderOptions();

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
      <form onSubmit={form.handleSubmit(submit)} className="mt-6 space-y-7">
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Identity</h3>
            <p className="text-xs text-muted-foreground">How this person should be identified in CRM.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="firstName" label="First name" required />
            <TextField control={form.control} name="lastName" label="Last name" />
            <TextField control={form.control} name="secondLastName" label="Second last name" />
            <TextField control={form.control} name="preferredName" label="Preferred name" />
            <FormField control={form.control} name="documentType" render={({ field }) => (
              <FormItem>
                <FormLabel>Document type</FormLabel>
                <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select document type" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Not provided</SelectItem>
                    {field.value && !documentTypes.some((item) => item.code === field.value) && (
                      <SelectItem value={field.value}>{field.value}</SelectItem>
                    )}
                    {documentTypes.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <TextField control={form.control} name="documentNumber" label="Document number" />
            <TextField control={form.control} name="birthDate" label="Birth date" type="date" />
            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Not provided</SelectItem>
                    {genderOptions.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </section>

        <section className="space-y-4 border-t border-border pt-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Contact channels</h3>
            <p className="text-xs text-muted-foreground">At least an email address or phone number is required.</p>
          </div>
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
            <TextField control={form.control} name="preferredLanguage" label="Preferred language" />
          </div>
        </section>

        <section className="space-y-4 border-t border-border pt-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Organization</h3>
            <p className="text-xs text-muted-foreground">Professional context for the relationship.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={form.control} name="companyName" label="Company" />
            <TextField control={form.control} name="jobTitle" label="Job title" />
            <TextField control={form.control} name="department" label="Department" />
          </div>
        </section>

        <section className="space-y-4 border-t border-border pt-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Address</h3>
            <p className="text-xs text-muted-foreground">Optional location information.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><TextField control={form.control} name="addressLine1" label="Address line 1" /></div>
            <div className="sm:col-span-2"><TextField control={form.control} name="addressLine2" label="Address line 2" /></div>
            <CityField control={form.control} cities={cities.map((city) => city.label)} />
            <FormField control={form.control} name="stateProvince" render={({ field }) => (
              <FormItem>
                <FormLabel>State / province</FormLabel>
                <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value)}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select state / province" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Not provided</SelectItem>
                    {subdivisions.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}
                    {field.value && !subdivisions.some((item) => item.code === field.value) && (
                      <SelectItem value={field.value}>{field.value}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <TextField control={form.control} name="postalCode" label="Postal code" />
            <FormField control={form.control} name="country" render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <Select value={field.value || "none"} onValueChange={(value) => {
                  field.onChange(value === "none" ? "" : value);
                  form.setValue("stateProvince", "");
                  form.setValue("city", "");
                  form.setValue("documentType", "");
                }}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="none">Not provided</SelectItem>
                    {countries.map((item) => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}
                    {field.value && !countries.some((item) => item.code === field.value) && <SelectItem value={field.value}>{field.value}</SelectItem>}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </section>

        {formState.errors.root?.server && (() => {
          const message = formState.errors.root.server.message ?? "";
          const conflict = message.startsWith("Conflict:");
          const permission = message.startsWith("Permission denied:");
          return (
            <p
              role="alert"
              className={`rounded-md border px-3 py-2 text-sm ${
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

        <div className="flex justify-end gap-2 border-t border-border pt-5">
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

function CityField({
  control,
  cities,
}: {
  control: Control<ContactFormValues>;
  cities: string[];
}) {
  return (
    <FormField control={control} name="city" render={({ field }) => (
      <FormItem>
        <FormLabel>City</FormLabel>
        <FormControl>
          <Input {...field} list="contact-city-options" value={field.value ?? ""} />
        </FormControl>
        <datalist id="contact-city-options">
          {cities.map((city) => <option key={city} value={city} />)}
        </datalist>
        <FormMessage />
      </FormItem>
    )} />
  );
}
