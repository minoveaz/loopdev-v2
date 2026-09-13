import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { contactFormSections, getContactSectionStats, type ContactFormFieldDefinition, type ContactFormSectionId } from "../../../packages/contracts/src/contact-form";
import { referenceDataAdapter } from "../../../src/loopdev/domains/reference-data/adapter";
import { useMobileForm } from "./forms/MobileFormEngine";
import { MobileComboboxField, MobileFormField, MobileFormTabs, MobileSelectField, type MobileOption } from "./forms/MobileFormPrimitives";
import { MobileConfirmDialog } from "./MobileModal";
import { AddressTab } from "./contact-tabs/AddressTab";
import { ChannelsTab } from "./contact-tabs/ChannelsTab";
import { IdentityTab } from "./contact-tabs/IdentityTab";
import { OrganizationTab } from "./contact-tabs/OrganizationTab";

export function MobileCreateContactScreen({ onCancel, onCreated }: { onCancel: () => void; onCreated: (contact: { id: string; firstName: string; lastName: string; companyName: string; jobTitle: string; preferredChannel: "email" | "phone" | "whatsapp"; identityStatus: string; city: string; stateProvince: string; country: string; email: string; phone: string; updatedAt: string }) => void }) {
  const form = useMobileForm();
  const organizationId = "local-development-organization";
  const countries = useReferenceOptions(() => referenceDataAdapter.listCountries(organizationId), [organizationId]);
  const subdivisions = useReferenceOptions(() => form.values.country ? referenceDataAdapter.listSubdivisions(form.values.country, organizationId) : Promise.resolve([]), [form.values.country, organizationId]);
  const cities = useReferenceOptions(() => form.values.country ? referenceDataAdapter.searchCities({ countryCode: form.values.country, subdivisionCode: form.values.stateProvince || null, query: "", organizationId }) : Promise.resolve([]), [form.values.country, form.values.stateProvince, organizationId]);
  const documentTypes = useReferenceOptions(() => form.values.country ? referenceDataAdapter.listDocumentTypes(form.values.country, organizationId) : Promise.resolve([]), [form.values.country, organizationId]);
  const genders = useReferenceOptions(() => referenceDataAdapter.listGenderOptions(organizationId), [organizationId]);
  const languages = useReferenceOptions(() => referenceDataAdapter.listLanguages(organizationId), [organizationId]);
  const [activeSection, setActiveSection] = useState(contactFormSections[0].id);
  const activeIndex = contactFormSections.findIndex((section) => section.id === activeSection);
  const activeDefinition = contactFormSections[activeIndex] ?? contactFormSections[0];
  const [discardOpen, setDiscardOpen] = useState(false);
  const hasChanges = Object.entries(form.values).some(([id, value]) => id !== "preferredChannel" && typeof value === "string" && Boolean(value.trim()));
  const requestCancel = () => { if (hasChanges) setDiscardOpen(true); else onCancel(); };
  function save() {
    const errors = form.submit();
    if (Object.keys(errors).length) return;
    // The mobile shell currently has no API bridge; keep this adapter local until the shared CRM transport is available.
    onCreated({
      id: `mobile-${Date.now()}`,
      firstName: form.values.firstName,
      lastName: form.values.lastName,
      companyName: form.values.companyName,
      jobTitle: form.values.jobTitle,
      preferredChannel: form.values.preferredChannel,
      identityStatus: "pending_identity_review",
      city: form.values.city,
      stateProvince: form.values.stateProvince,
      country: form.values.country,
      email: form.values.email,
      phone: form.values.phone,
      updatedAt: new Date().toISOString().slice(0, 10),
    });
  }

  function useReferenceOptions(loader: () => Promise<readonly MobileOption[]>, dependencies: readonly unknown[]) {
    const [items, setItems] = useState<readonly MobileOption[]>([]);
    useEffect(() => {
      let active = true;
      void loader().then((result) => {
        if (active) setItems(result.map((item) => ({ code: item.code, label: item.label })));
      }).catch((cause: unknown) => {
        if (active) {
          setItems([]);
          console.error(cause);
        }
      });
      return () => { active = false; };
    // The loader identity is derived from the explicit request dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies);
    return items;
  }
  const stats = getContactSectionStats(form.values, form.errors);
  const selectSection = (id: ContactFormSectionId) => setActiveSection(id);
  const renderField = (definition: ContactFormFieldDefinition) => (
    definition.type === "select" || definition.type === "combobox"
      ? <ReferenceMobileField key={definition.id} definition={definition} value={form.values[definition.id]} error={form.errors[definition.id]} onChange={(value) => {
        form.setValue(definition.id, value);
        if (definition.id === "country") {
          form.setValue("stateProvince", ""); form.setValue("city", ""); form.setValue("documentType", "");
        } else if (definition.id === "stateProvince") form.setValue("city", "");
      }} options={definition.id === "country" ? countries : definition.id === "stateProvince" ? subdivisions : definition.id === "city" ? cities : definition.id === "documentType" ? documentTypes : definition.id === "gender" ? genders : definition.id === "preferredLanguage" ? languages : [{ code: "email", label: "Email" }, { code: "phone", label: "Phone" }, { code: "whatsapp", label: "WhatsApp" }]} />
      : <MobileFormField key={definition.id} label={definition.label} required={definition.required} type={definition.type} value={form.values[definition.id]} onChangeText={(value) => form.setValue(definition.id, value)} error={form.errors[definition.id]} keyboardType={definition.type === "email" ? "email-address" : definition.type === "phone" ? "phone-pad" : "default"} />
  );
  const completedSections = contactFormSections.filter((section) => stats[section.id].status === "complete").map((section) => section.id);
  const Tab = activeDefinition.id === "identity" ? IdentityTab : activeDefinition.id === "address" ? AddressTab : activeDefinition.id === "organization" ? OrganizationTab : ChannelsTab;
  return <View style={styles.screen}><View style={styles.formHeader}><View style={styles.headerRow}><Pressable accessibilityLabel="Cancel create contact" accessibilityRole="button" onPress={requestCancel} style={[styles.headerAction, styles.cancelAction]}><Text style={styles.cancelText}>Cancel</Text></Pressable><Text accessibilityRole="header" style={styles.headerTitle}>Create contact</Text><Pressable accessibilityLabel="Save contact" accessibilityRole="button" onPress={save} style={[styles.headerAction, styles.saveAction]}><Text style={styles.saveText}>Save</Text></Pressable></View><MobileFormTabs sections={contactFormSections} activeId={activeSection} completedIds={completedSections} onSelect={selectSection} /></View><ScrollView contentContainerStyle={styles.content}>
    <Tab definition={activeDefinition} stats={stats[activeDefinition.id]} renderField={renderField} />
    <View style={styles.sectionFooter}><Pressable accessibilityLabel="Previous form section" accessibilityRole="button" disabled={activeIndex === 0} onPress={() => setActiveSection(contactFormSections[activeIndex - 1].id)} style={[styles.sectionButton, activeIndex === 0 && styles.disabledButton]}><Text style={styles.sectionButtonText}>Back</Text></Pressable><Text style={styles.sectionCount}>{activeIndex + 1} of {contactFormSections.length}</Text><Pressable accessibilityLabel="Next form section" accessibilityRole="button" disabled={activeIndex === contactFormSections.length - 1} onPress={() => setActiveSection(contactFormSections[activeIndex + 1].id)} style={[styles.sectionButton, activeIndex === contactFormSections.length - 1 && styles.disabledButton]}><Text style={styles.sectionButtonText}>Next</Text></Pressable></View>
  </ScrollView><MobileConfirmDialog visible={discardOpen} title="Discard contact changes?" description="Your unsaved contact details will be lost." cancelLabel="Keep editing" confirmLabel="Discard" destructive onCancel={() => setDiscardOpen(false)} onConfirm={() => { setDiscardOpen(false); onCancel(); }} /></View>;
}

function ReferenceMobileField({ definition, value, options, error, onChange }: { definition: ContactFormFieldDefinition; value: string; options: readonly MobileOption[]; error?: string; onChange: (value: string) => void }) {
  const props = { label: definition.label, required: definition.required, value, options, error, onChange };
  return definition.type === "combobox" ? <MobileComboboxField {...props} /> : <MobileSelectField {...props} searchable={definition.id === "country" || definition.id === "documentType" || definition.id === "preferredLanguage"} />;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, formHeader: { backgroundColor: "#fff", borderBottomColor: "#e2e8f0", borderBottomWidth: 1, paddingTop: 10 }, headerRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", minHeight: 66, paddingHorizontal: 20 }, headerAction: { alignItems: "center", borderRadius: 9, justifyContent: "center", minWidth: 94, paddingHorizontal: 16, paddingVertical: 12 }, cancelAction: { backgroundColor: "#e2e8f0" }, saveAction: { backgroundColor: "#135bec" }, headerTitle: { color: "#111827", fontSize: 18, fontWeight: "800" }, cancelText: { color: "#334155", fontSize: 15, fontWeight: "700" }, saveText: { color: "#fff", fontSize: 15, fontWeight: "800" }, content: { padding: 22 }, sectionFooter: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12, marginTop: 4 }, sectionButton: { backgroundColor: "#e2e8f0", borderRadius: 9, minWidth: 82, paddingHorizontal: 14, paddingVertical: 11 }, disabledButton: { opacity: 0.45 }, sectionButtonText: { color: "#334155", fontSize: 14, fontWeight: "800", textAlign: "center" }, sectionCount: { color: "#64748b", fontSize: 12, fontWeight: "700" } });
