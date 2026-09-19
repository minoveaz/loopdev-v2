import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import {
  contactFormSections,
  getContactSectionStats,
  type ContactFormFieldDefinition,
  type ContactFormSectionId,
} from "../../../packages/contracts/src/contact-form";
import { mobileReferenceDataAdapter } from "../adapters/reference-data";
import { useMobileForm } from "./forms/MobileFormEngine";
import {
  MobileComboboxField,
  MobileFormField,
  MobileFormTabs,
  MobileSelectField,
  type MobileOption,
} from "./forms/MobileFormPrimitives";
import { MobileConfirmDialog, MobileButton } from "./ui";
import { AddressTab } from "./contact-tabs/AddressTab";
import { ChannelsTab } from "./contact-tabs/ChannelsTab";
import { IdentityTab } from "./contact-tabs/IdentityTab";
import { OrganizationTab } from "./contact-tabs/OrganizationTab";
import { contactActions } from "../../../packages/contracts/src/contact-actions";
import type { ContactRecord } from "../../../packages/contracts/src/contact-port";
import { mobileContactAdapter } from "../adapters/contact";
import { mobileTenantContextAdapter } from "../adapters/auth";
import { mobileTheme } from "../theme/tokens";
import { useMobileI18n } from "../i18n";

export function MobileCreateContactScreen({
  onCancel,
  onCreated,
  editingContact,
  onUpdated,
}: {
  onCancel: () => void;
  onCreated?: (contact: ContactRecord) => void;
  editingContact?: ContactRecord | null;
  onUpdated?: (contact: ContactRecord) => void;
}) {
  const { lang } = useMobileI18n();
  const form = useMobileForm(
    editingContact
      ? {
          firstName: editingContact.firstName ?? "",
          lastName: editingContact.lastName ?? "",
          secondLastName: editingContact.secondLastName ?? "",
          preferredName: editingContact.preferredName ?? "",
          email: editingContact.email ?? "",
          secondaryEmail: editingContact.secondaryEmail ?? "",
          phone: editingContact.phone ?? "",
          secondaryPhone: editingContact.secondaryPhone ?? "",
          companyName: editingContact.companyName ?? "",
          jobTitle: editingContact.jobTitle ?? "",
          department: editingContact.department ?? "",
          preferredChannel: editingContact.preferredChannel ?? "email",
          preferredLanguage: editingContact.preferredLanguage ?? "",
          city: editingContact.city ?? "",
          stateProvince: editingContact.stateProvince ?? "",
          postalCode: editingContact.postalCode ?? "",
          addressLine1: editingContact.addressLine1 ?? "",
          addressLine2: editingContact.addressLine2 ?? "",
          country: editingContact.country ?? "",
          documentType: editingContact.documentType ?? "",
          documentNumber: editingContact.documentNumber ?? "",
          birthDate: editingContact.birthDate ?? "",
          gender: editingContact.gender ?? "",
        }
      : {}
  );
  const organizationId =
    mobileTenantContextAdapter.getTenantContext()?.activeOrganizationId ||
    "80fce911-57c5-4a83-809f-78df6a373f7";
  const countries = useReferenceOptions(() => mobileReferenceDataAdapter.listCountries(), [organizationId]);
  const subdivisions = useReferenceOptions(
    () => (form.values.country ? mobileReferenceDataAdapter.listSubdivisions(form.values.country) : Promise.resolve([])),
    [form.values.country, organizationId]
  );
  const cities = useReferenceOptions(
    () =>
      form.values.country
        ? mobileReferenceDataAdapter.searchCities({
            countryCode: form.values.country,
            subdivisionCode: form.values.stateProvince || null,
            query: "",
          })
        : Promise.resolve([]),
    [form.values.country, form.values.stateProvince, organizationId]
  );
  const documentTypes = useReferenceOptions(
    () => (form.values.country ? mobileReferenceDataAdapter.listDocumentTypes(form.values.country) : Promise.resolve([])),
    [form.values.country, organizationId]
  );
  const genders = useReferenceOptions(() => mobileReferenceDataAdapter.listGenderOptions(), [organizationId]);
  const languages = useReferenceOptions(() => mobileReferenceDataAdapter.listLanguages(), [organizationId]);
  const [activeSection, setActiveSection] = useState(contactFormSections[0].id);
  const activeIndex = contactFormSections.findIndex((section) => section.id === activeSection);
  const activeDefinition = contactFormSections[activeIndex] ?? contactFormSections[0];
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const hasChanges = Object.entries(form.values).some(
    ([id, value]) => id !== "preferredChannel" && typeof value === "string" && Boolean(value.trim())
  );
  const requestCancel = () => {
    if (hasChanges) setDiscardOpen(true);
    else onCancel();
  };
  async function save() {
    const errors = form.submit();
    if (Object.keys(errors).length) return;
    setSaving(true);
    setSaveError(null);
    const input = {
      organizationId,
      firstName: form.values.firstName,
      lastName: form.values.lastName || null,
      secondLastName: form.values.secondLastName || null,
      preferredName: form.values.preferredName || null,
      email: form.values.email || null,
      secondaryEmail: form.values.secondaryEmail || null,
      phone: form.values.phone || null,
      secondaryPhone: form.values.secondaryPhone || null,
      companyName: form.values.companyName || null,
      jobTitle: form.values.jobTitle || null,
      department: form.values.department || null,
      preferredChannel: form.values.preferredChannel,
      preferredLanguage: form.values.preferredLanguage || null,
      city: form.values.city || null,
      stateProvince: form.values.stateProvince || null,
      postalCode: form.values.postalCode || null,
      addressLine1: form.values.addressLine1 || null,
      addressLine2: form.values.addressLine2 || null,
      country: form.values.country || null,
      documentType: form.values.documentType || null,
      documentNumber: form.values.documentNumber || null,
      birthDate: form.values.birthDate || null,
      gender: form.values.gender || null,
    };
    const result = editingContact
      ? await mobileContactAdapter.updateContact(editingContact.id, input, editingContact.updatedAt)
      : await mobileContactAdapter.createContact(input);
    setSaving(false);
    if (result.status === "success") (editingContact ? onUpdated : onCreated)?.(result.contact);
    else
      setSaveError(
        `${result.status === "conflict" ? "Conflict: " : result.status === "forbidden" ? "Permission denied: " : ""}${result.message}`
      );
  }

  function useReferenceOptions(loader: () => Promise<readonly MobileOption[]>, dependencies: readonly unknown[]) {
    const [items, setItems] = useState<readonly MobileOption[]>([]);
    useEffect(() => {
      let active = true;
      void loader()
        .then((result) => {
          if (active) setItems(result.map((item) => ({ code: item.code, label: item.label })));
        })
        .catch((cause: unknown) => {
          if (active) {
            setItems([]);
            console.error(cause);
          }
        });
      return () => {
        active = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
    return items;
  }
  const stats = getContactSectionStats(form.values, form.errors);
  const selectSection = (id: ContactFormSectionId) => setActiveSection(id);
  const renderField = (definition: ContactFormFieldDefinition) =>
    definition.type === "select" || definition.type === "combobox" ? (
      <ReferenceMobileField
        key={definition.id}
        definition={definition}
        value={form.values[definition.id]}
        error={form.errors[definition.id]}
        onChange={(value) => {
          form.setValue(definition.id, value);
          if (definition.id === "country") {
            form.setValue("stateProvince", "");
            form.setValue("city", "");
            form.setValue("documentType", "");
          } else if (definition.id === "stateProvince") form.setValue("city", "");
        }}
        options={
          definition.id === "country"
            ? countries
            : definition.id === "stateProvince"
              ? subdivisions
              : definition.id === "city"
                ? cities
                : definition.id === "documentType"
                  ? documentTypes
                  : definition.id === "gender"
                    ? genders
                    : definition.id === "preferredLanguage"
                      ? languages
                      : [
                          { code: "email", label: lang === "es" ? "Correo electrónico" : "Email" },
                          { code: "phone", label: lang === "es" ? "Teléfono" : "Phone" },
                          { code: "whatsapp", label: "WhatsApp" },
                        ]
        }
      />
    ) : (
      <MobileFormField
        key={definition.id}
        label={definition.label}
        required={definition.required}
        type={definition.type}
        value={form.values[definition.id]}
        onChangeText={(value) => form.setValue(definition.id, value)}
        error={form.errors[definition.id]}
        keyboardType={
          definition.type === "email" ? "email-address" : definition.type === "phone" ? "phone-pad" : "default"
        }
      />
    );
  const completedSections = contactFormSections
    .filter((section) => stats[section.id].status === "complete")
    .map((section) => section.id);
  const Tab =
    activeDefinition.id === "identity"
      ? IdentityTab
      : activeDefinition.id === "address"
        ? AddressTab
        : activeDefinition.id === "organization"
          ? OrganizationTab
          : ChannelsTab;

  return (
    <View style={styles.screen}>
      <View style={styles.formHeader}>
        <View style={styles.headerRow}>
          <MobileButton
            variant="ghost"
            size="sm"
            label={lang === "es" ? "Cancelar" : "Cancel"}
            onPress={requestCancel}
          />
          <Text accessibilityRole="header" style={styles.headerTitle}>
            {editingContact
              ? (lang === "es" ? "Editar contacto" : "Edit contact")
              : (lang === "es" ? "Crear contacto" : "Create contact")}
          </Text>
          <MobileButton
            variant="primary"
            size="sm"
            label={saving ? (lang === "es" ? "Guardando…" : "Saving…") : (lang === "es" ? "Guardar" : "Save")}
            loading={saving}
            onPress={save}
          />
        </View>
        <MobileFormTabs
          sections={contactFormSections}
          activeId={activeSection}
          completedIds={completedSections}
          onSelect={selectSection}
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {saveError ? (
          <Text accessibilityRole="alert" style={styles.saveError}>
            {saveError}
          </Text>
        ) : null}
        <Tab definition={activeDefinition} stats={stats[activeDefinition.id]} renderField={renderField} />
        <View style={styles.sectionFooter}>
          <MobileButton
            variant="outline"
            size="sm"
            label={lang === "es" ? "Atrás" : "Back"}
            disabled={activeIndex === 0}
            onPress={() => setActiveSection(contactFormSections[activeIndex - 1].id)}
          />
          <Text style={styles.sectionCount}>
            {activeIndex + 1} {lang === "es" ? "de" : "of"} {contactFormSections.length}
          </Text>
          <MobileButton
            variant="outline"
            size="sm"
            label={lang === "es" ? "Siguiente" : "Next"}
            disabled={activeIndex === contactFormSections.length - 1}
            onPress={() => setActiveSection(contactFormSections[activeIndex + 1].id)}
          />
        </View>
      </ScrollView>
      <MobileConfirmDialog
        visible={discardOpen}
        variant="destructive"
        title={lang === "es" ? "¿Descartar cambios del contacto?" : "Discard contact changes?"}
        description={lang === "es" ? "Los datos no guardados del contacto se perderán." : "Unsaved contact changes will be lost."}
        cancelLabel={lang === "es" ? "Seguir editando" : "Keep editing"}
        confirmLabel={lang === "es" ? "Descartar" : "Discard"}
        onCancel={() => setDiscardOpen(false)}
        onConfirm={() => {
          setDiscardOpen(false);
          onCancel();
        }}
      />
    </View>
  );
}

function ReferenceMobileField({
  definition,
  value,
  options,
  error,
  onChange,
}: {
  definition: ContactFormFieldDefinition;
  value: string;
  options: readonly MobileOption[];
  error?: string;
  onChange: (value: string) => void;
}) {
  const props = { label: definition.label, required: definition.required, value, options, error, onChange };
  return definition.type === "combobox" ? (
    <MobileComboboxField {...props} />
  ) : (
    <MobileSelectField
      {...props}
      searchable={
        definition.id === "country" ||
        definition.id === "documentType" ||
        definition.id === "preferredLanguage"
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: mobileTheme.colors.background },
  formHeader: {
    backgroundColor: mobileTheme.colors.surface,
    borderBottomColor: mobileTheme.colors.border,
    borderBottomWidth: 1,
    paddingTop: 6,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 56,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: mobileTheme.colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },
  saveError: {
    backgroundColor: "#fff7ed",
    borderColor: "#fdba74",
    borderWidth: 1,
    borderRadius: mobileTheme.radii.input,
    color: "#9a3412",
    margin: 16,
    padding: 12,
    fontSize: 13,
  },
  content: {
    padding: 18,
    paddingBottom: 40,
  },
  sectionFooter: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 14,
  },
  sectionCount: {
    color: mobileTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
});
