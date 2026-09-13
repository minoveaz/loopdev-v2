export type ContactFormSectionId = "identity" | "channels" | "organization" | "address";
export type ContactFormField =
  | "firstName" | "lastName" | "secondLastName" | "preferredName"
  | "documentType" | "documentNumber" | "birthDate" | "gender"
  | "email" | "secondaryEmail" | "phone" | "secondaryPhone"
  | "preferredChannel" | "preferredLanguage" | "companyName" | "jobTitle"
  | "department" | "addressLine1" | "addressLine2" | "city"
  | "stateProvince" | "postalCode" | "country";

export type ContactFormFieldType = "text" | "email" | "phone" | "date" | "select" | "combobox";
export type ContactFormIconKey = "user" | "contact" | "building" | "map-pin";
export type ContactSectionStatus = "error" | "complete" | "progress" | "neutral";

export interface ContactFormFieldDefinition {
  id: ContactFormField;
  label: string;
  type: ContactFormFieldType;
  required: boolean;
  /** Required fields can also be satisfied by another field in this group. */
  requiredGroup?: "email-or-phone";
}

export interface ContactFormSectionDefinition {
  id: ContactFormSectionId;
  label: string;
  eyebrow: string;
  description: string;
  iconKey: ContactFormIconKey;
  meta?: string;
  fields: readonly ContactFormFieldDefinition[];
}

const field = (id: ContactFormField, label: string, type: ContactFormFieldType = "text", required = false, requiredGroup?: ContactFormFieldDefinition["requiredGroup"]): ContactFormFieldDefinition =>
  ({ id, label, type, required, ...(requiredGroup ? { requiredGroup } : {}) });

export const contactFormSections: readonly ContactFormSectionDefinition[] = [
  {
    id: "identity", label: "Identity", eyebrow: "Profile",
    description: "How this person should be identified in CRM.", iconKey: "user", meta: "Core details",
    fields: [
      field("firstName", "First name", "text", true), field("lastName", "Last name"),
      field("secondLastName", "Second last name"), field("preferredName", "Preferred name"),
      field("documentType", "Document type", "select"), field("documentNumber", "Document number"),
      field("birthDate", "Birth date", "date"), field("gender", "Gender", "select"),
    ],
  },
  {
    id: "address", label: "Address", eyebrow: "Location",
    description: "Optional location information.", iconKey: "map-pin", meta: "Optional",
    fields: [
      field("country", "Country", "select"), field("city", "City", "combobox"),
      field("stateProvince", "State / province", "select"), field("postalCode", "Postal code"),
      field("addressLine1", "Address line 1"), field("addressLine2", "Address line 2"),
    ],
  },
  {
    id: "organization", label: "Organization", eyebrow: "Relationship",
    description: "Professional context for the relationship.", iconKey: "building",
    fields: [field("companyName", "Company"), field("jobTitle", "Job title"), field("department", "Department")],
  },
  {
    id: "channels", label: "Contact channels", eyebrow: "Communication",
    description: "At least an email address or phone number is required.", iconKey: "contact", meta: "At least one",
    fields: [
      field("email", "Primary email", "email", false, "email-or-phone"),
      field("secondaryEmail", "Secondary email", "email"), field("phone", "Primary phone", "phone", false, "email-or-phone"),
      field("secondaryPhone", "Secondary phone", "phone"), field("preferredChannel", "Preferred channel", "select"),
      field("preferredLanguage", "Preferred language", "select"),
    ],
  },
] as const;

export const contactFormFields = contactFormSections.flatMap((section) => section.fields);

export type ContactFormValues = {
  firstName: string; lastName: string; secondLastName: string; preferredName: string;
  documentType: string; documentNumber: string; birthDate: string; gender: string;
  email: string; secondaryEmail: string; phone: string; secondaryPhone: string;
  preferredChannel: "email" | "phone" | "whatsapp"; preferredLanguage: string;
  companyName: string; jobTitle: string; department: string;
  addressLine1: string; addressLine2: string; city: string; stateProvince: string;
  postalCode: string; country: string;
};

export const emptyContactFormValues: ContactFormValues = {
  firstName: "", lastName: "", secondLastName: "", preferredName: "", documentType: "",
  documentNumber: "", birthDate: "", gender: "", email: "", secondaryEmail: "", phone: "",
  secondaryPhone: "", preferredChannel: "email", preferredLanguage: "", companyName: "",
  jobTitle: "", department: "", addressLine1: "", addressLine2: "", city: "",
  stateProvince: "", postalCode: "", country: "",
};

export type ContactFormErrors = Record<string, string>;
export type ContactSectionStats = Record<ContactFormSectionId, {
  completed: number; total: number; errors: number; status: ContactSectionStatus;
}>;

export function validateContactForm(values: ContactFormValues): ContactFormErrors {
  const errors: ContactFormErrors = {};
  contactFormFields.filter((definition) => definition.required).forEach(({ id, label }) => {
    if (!values[id].trim()) errors[id] = `${label} is required.`;
  });
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Enter a valid email.";
  if (values.secondaryEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.secondaryEmail.trim())) errors.secondaryEmail = "Enter a valid email.";
  if (!values.email.trim() && !values.phone.trim()) {
    errors.email = "Email or phone is required.";
    errors.phone = "Email or phone is required.";
  }
  return errors;
}

export function getContactSectionStats(values: ContactFormValues, errors: ContactFormErrors): ContactSectionStats {
  const stats = {} as ContactSectionStats;
  contactFormSections.forEach((section) => {
    const completed = section.fields.filter(({ id }) => values[id].trim()).length;
    const errorCount = section.fields.filter(({ id }) => errors[id]).length;
    stats[section.id] = {
      completed, total: section.fields.length, errors: errorCount,
      status: errorCount ? "error" : completed === section.fields.length ? "complete" : completed ? "progress" : "neutral",
    };
  });
  return stats;
}
