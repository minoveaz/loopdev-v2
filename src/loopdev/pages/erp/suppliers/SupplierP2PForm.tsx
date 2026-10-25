import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Building2, CreditCard, MapPin, Plus, Trash2, UserRound } from "lucide-react";
import {
  ConfirmDialog,
  EmptyState,
  FormSection,
  FormSectionNav,
  LoadingState,
  PageHeader,
  StatusBadge,
  useFormLifecycle,
} from "@/components/common";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { supplierAdapter, supplierP2PAdapter } from "@/loopdev/domains/suppliers/adapter";
import { SupplierAdapterError } from "@/loopdev/domains/suppliers";
import { supplierP2PValidationError } from "@/loopdev/domains/suppliers/rules";
import type {
  SupplierAddressInput,
  SupplierAddressPurpose,
  SupplierContactInput,
  SupplierContactRole,
  SupplierKind,
  SupplierPayeeInstruction,
  SupplierP2PSetup,
  SupplierRecord,
} from "@/loopdev/domains/suppliers";

type ContactDraft = SupplierContactInput & { draftKey: string };
type AddressDraft = SupplierAddressInput & { draftKey: string };
type PayeeDraft = {
  id?: string;
  expectedVersion?: number;
  beneficiaryName: string;
  bankCountryCode: string;
  bankName: string;
  accountIdentifier: string;
  currency: string;
};

const countryOptions = [
  { value: "ES", label: "Spain" },
  { value: "US", label: "United States" },
  { value: "CO", label: "Colombia" },
];

const contactRoles: Array<{ value: SupplierContactRole; label: string }> = [
  { value: "purchasing", label: "Purchasing" },
  { value: "receiving", label: "Receiving" },
  { value: "ap_invoices", label: "Accounts payable" },
  { value: "remittance", label: "Remittance" },
];

const addressPurposes: Array<{ value: SupplierAddressPurpose; label: string }> = [
  { value: "legal", label: "Legal" },
  { value: "billing", label: "Billing" },
  { value: "order", label: "Order" },
  { value: "ship_from", label: "Ship from" },
  { value: "remit_to", label: "Remit to" },
  { value: "returns", label: "Returns" },
];

const emptySetup = (): SupplierP2PSetup => ({
  version: 0,
  contacts: [],
  addresses: [],
  purchaseDefaults: {
    currency: null,
    paymentTermCode: null,
    deliveryTermCode: null,
    deliveryAddressId: null,
    financeReference: null,
  },
  payeeInstructions: [],
});

function createRecordId(): string {
  if (!globalThis.crypto?.randomUUID) {
    throw new SupplierAdapterError("Secure identifier generation is unavailable in this browser.", "server-error");
  }
  return globalThis.crypto.randomUUID();
}

function errorMessage(cause: unknown, fallback: string): string {
  if (cause instanceof SupplierAdapterError) {
    if (cause.code === "conflict") return `${cause.message} Reload the saved setup before trying again.`;
    if (cause.code === "offline") return "Supplier setup cannot be changed while offline.";
    if (cause.code === "forbidden") return "You do not have permission to manage this supplier setup.";
  }
  return cause instanceof Error ? cause.message : fallback;
}

function contactDraft(contact: SupplierP2PSetup["contacts"][number]): ContactDraft {
  return {
    id: contact.id,
    expectedVersion: contact.version,
    draftKey: contact.id,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    role: contact.role ?? "purchasing",
    isPrimary: contact.isPrimary,
  };
}

function addressDraft(address: SupplierP2PSetup["addresses"][number]): AddressDraft {
  return {
    id: address.id,
    expectedVersion: address.version,
    draftKey: address.id,
    label: address.label,
    purpose: address.purpose,
    countryCode: address.countryCode,
    region: address.region,
    locality: address.locality,
    postalCode: address.postalCode,
    addressLines: address.addressLines,
    isPrimary: address.isPrimary,
  };
}

function emptyPayeeDraft(bankCountryCode: string): PayeeDraft {
  return {
    beneficiaryName: "",
    bankCountryCode,
    bankName: "",
    accountIdentifier: "",
    currency: "",
  };
}

function Field({ label, htmlFor, children, hint }: { label: string; htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SupplierP2PForm({
  organizationId,
  supplier,
  onExit,
  onSaved,
}: {
  organizationId: string;
  supplier?: SupplierRecord | null;
  onExit: (supplier?: SupplierRecord) => void;
  onSaved: (supplier: SupplierRecord) => void;
}) {
  const { authSession, session } = useAuth();
  const currentUserId = authSession?.user.id ?? session?.userId ?? null;
  const remoteMode = import.meta.env.VITE_CATALOG_ADAPTER_MODE === "supabase";
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const lifecycle = useFormLifecycle();
  const [currentSupplier, setCurrentSupplier] = useState<SupplierRecord | null>(supplier ?? null);
  const [kind, setKind] = useState<SupplierKind>(supplier?.kind ?? "organization");
  const [legalName, setLegalName] = useState(supplier?.legalName ?? "");
  const [countryCode, setCountryCode] = useState(supplier?.countryCode ?? "ES");
  const [setup, setSetup] = useState<SupplierP2PSetup>(emptySetup);
  const [contacts, setContacts] = useState<ContactDraft[]>([]);
  const [addresses, setAddresses] = useState<AddressDraft[]>([]);
  const [currency, setCurrency] = useState("");
  const [paymentTermCode, setPaymentTermCode] = useState("");
  const [deliveryTermCode, setDeliveryTermCode] = useState("");
  const [deliveryAddressId, setDeliveryAddressId] = useState("");
  const [financeReference, setFinanceReference] = useState("");
  const [loading, setLoading] = useState(Boolean(supplier));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [payeeDraft, setPayeeDraft] = useState<PayeeDraft>(() => emptyPayeeDraft(supplier?.countryCode ?? "ES"));
  const [payeeSaving, setPayeeSaving] = useState(false);
  const [payeeError, setPayeeError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [canReviewPayee, setCanReviewPayee] = useState(false);
  const [payeeNeedsRefresh, setPayeeNeedsRefresh] = useState(false);
  const [reviewReasons, setReviewReasons] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState("identity");
  const [confirmExit, setConfirmExit] = useState(false);

  const applySetup = useCallback((next: SupplierP2PSetup) => {
    setSetup(next);
    setContacts(next.contacts.map(contactDraft));
    setAddresses(next.addresses.map(addressDraft));
    setCurrency(next.purchaseDefaults.currency ?? "");
    setPaymentTermCode(next.purchaseDefaults.paymentTermCode ?? "");
    setDeliveryTermCode(next.purchaseDefaults.deliveryTermCode ?? "");
    setDeliveryAddressId(next.purchaseDefaults.deliveryAddressId ?? "");
    setFinanceReference(next.purchaseDefaults.financeReference ?? "");
    setPayeeDraft(emptyPayeeDraft(currentSupplier?.countryCode ?? supplier?.countryCode ?? countryCode));
    lifecycle.markClean();
  }, [countryCode, currentSupplier?.countryCode, lifecycle.markClean, supplier?.countryCode]);

  const loadSetup = useCallback(async () => {
    if (!currentSupplier) {
      applySetup(emptySetup());
      setLoading(false);
      setLoadError(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const next = await supplierP2PAdapter.getSetup(currentSupplier.id, { organizationId });
      applySetup(typeof navigator === "undefined" || navigator.onLine
        ? next
        : { ...next, payeeInstructions: [] });
      setPayeeNeedsRefresh(false);
      if (remoteMode) {
        try {
          setCanReviewPayee(await supplierP2PAdapter.canReviewPayee({ organizationId }));
          setReviewError(null);
        } catch (cause) {
          setCanReviewPayee(false);
          setReviewError(errorMessage(cause, "Payee review permissions could not be checked."));
        }
      } else {
        setCanReviewPayee(false);
      }
    } catch (cause) {
      setLoadError(errorMessage(cause, "Unable to load supplier setup."));
    } finally {
      setLoading(false);
    }
  }, [applySetup, currentSupplier, organizationId, remoteMode]);

  const refreshPayeeInstructions = useCallback(async () => {
    if (!currentSupplier || !remoteMode || (typeof navigator !== "undefined" && !navigator.onLine)) return;
    try {
      const refreshed = await supplierP2PAdapter.getSetup(currentSupplier.id, { organizationId });
      setSetup((current) => ({ ...current, payeeInstructions: refreshed.payeeInstructions }));
      setCanReviewPayee(await supplierP2PAdapter.canReviewPayee({ organizationId }));
      setReviewError(null);
      setPayeeNeedsRefresh(false);
    } catch (cause) {
      setCanReviewPayee(false);
      setPayeeError(errorMessage(cause, "Payment instructions could not be refreshed."));
    }
  }, [currentSupplier, organizationId, remoteMode]);

  useEffect(() => {
    if (supplier) {
      setCurrentSupplier(supplier);
      setKind(supplier.kind);
      setLegalName(supplier.legalName);
      setCountryCode(supplier.countryCode);
    }
  }, [supplier]);

  useEffect(() => {
    void loadSetup();
  }, [loadSetup]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setPayeeNeedsRefresh(true);
      if (currentSupplier) void refreshPayeeInstructions();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setCanReviewPayee(false);
      setSetup((current) => ({ ...current, payeeInstructions: [] }));
      setPayeeDraft(emptyPayeeDraft(currentSupplier?.countryCode ?? countryCode));
      setPayeeNeedsRefresh(true);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [countryCode, currentSupplier, refreshPayeeInstructions]);

  const sectionItems = useMemo(() => [
    { id: "identity", label: "Identity", icon: <Building2 className="h-3.5 w-3.5" /> },
    { id: "tax", label: "Tax profile" },
    { id: "contacts", label: "Contacts" },
    { id: "addresses", label: "Addresses", icon: <MapPin className="h-3.5 w-3.5" /> },
    { id: "purchasing", label: "Purchasing" },
    { id: "payment", label: "Payment instructions", icon: <CreditCard className="h-3.5 w-3.5" /> },
  ], []);

  const markDirty = () => {
    lifecycle.markDirty();
    setSaveError(null);
    setSaveSuccess(null);
  };

  const requestExit = () => {
    if (lifecycle.dirty) setConfirmExit(true);
    else onExit(currentSupplier ?? undefined);
  };

  const discardAndExit = () => {
    setConfirmExit(false);
    onExit(currentSupplier ?? undefined);
  };

  const saveSetup = async () => {
    if (!legalName.trim()) {
      setSaveError("Enter the supplier's legal name.");
      setActiveSection("identity");
      return;
    }
    const inputAddresses = addresses.map((address) => ({
      ...address,
      id: address.id ?? createRecordId(),
    }));
    const validDeliveryAddressId = inputAddresses.some((address) => address.id === deliveryAddressId)
      ? deliveryAddressId
      : null;
    const setupInput = {
      expectedVersion: setup.version,
      contacts: contacts.map((contact) => ({
        id: contact.id ?? createRecordId(),
        ...(contact.expectedVersion !== undefined ? { expectedVersion: contact.expectedVersion } : {}),
        name: contact.name,
        email: contact.email?.trim() || null,
        phone: contact.phone?.trim() || null,
        role: contact.role,
        isPrimary: contact.isPrimary,
      })),
      addresses: inputAddresses.map((address) => ({
        ...address,
        expectedVersion: address.expectedVersion,
      })),
      purchaseDefaults: {
        currency: currency.trim() || null,
        paymentTermCode: paymentTermCode.trim() || null,
        deliveryTermCode: deliveryTermCode.trim() || null,
        deliveryAddressId: validDeliveryAddressId,
        financeReference: financeReference.trim() || null,
      },
    };
    const validationError = supplierP2PValidationError(setupInput);
    if (validationError) {
      setSaveError(validationError);
      setActiveSection(validationError.startsWith("Default delivery address")
        || validationError.includes("currency")
        || validationError.includes("terms")
        || validationError.includes("Finance reference")
        ? "purchasing"
        : validationError.includes("address")
          ? "addresses"
          : "contacts");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      let savedSupplier = currentSupplier;
      if (!savedSupplier) {
        savedSupplier = await supplierAdapter.createSupplier({
          organizationId,
          kind,
          legalName: legalName.trim(),
          countryCode,
        });
        setCurrentSupplier(savedSupplier);
      } else if (
        savedSupplier.kind !== kind
        || savedSupplier.legalName !== legalName.trim()
        || savedSupplier.countryCode !== countryCode
      ) {
        savedSupplier = await supplierAdapter.updateSupplier(savedSupplier.id, { organizationId }, {
          kind,
          legalName: legalName.trim(),
          countryCode,
          expectedVersion: savedSupplier.version,
        });
        setCurrentSupplier(savedSupplier);
      }

      setAddresses(inputAddresses);
      const savedSetup = await supplierP2PAdapter.saveSetup(savedSupplier.id, { organizationId }, setupInput);
      applySetup(savedSetup);
      lifecycle.markClean();
      setSaveSuccess("Supplier setup saved.");
      onSaved(savedSupplier);
    } catch (cause) {
      setSaveError(errorMessage(cause, "Unable to save supplier setup."));
    } finally {
      setSaving(false);
    }
  };

  const savePayeeInstruction = async () => {
    if (!isOnline) {
      setPayeeError("Reconnect to the protected service before changing payment instructions.");
      return;
    }
    if (!currentSupplier) {
      setPayeeError("Save the supplier setup before adding payment instructions.");
      return;
    }
    setPayeeSaving(true);
    setPayeeError(null);
    try {
      const input = {
        beneficiaryName: payeeDraft.beneficiaryName,
        bankCountryCode: payeeDraft.bankCountryCode,
        bankName: payeeDraft.bankName.trim() || null,
        accountIdentifier: payeeDraft.accountIdentifier,
        currency: payeeDraft.currency,
        ...(payeeDraft.expectedVersion !== undefined ? { expectedVersion: payeeDraft.expectedVersion } : {}),
      };
      if (payeeDraft.id) {
        await supplierP2PAdapter.updatePayeeInstruction(payeeDraft.id, currentSupplier.id, { organizationId }, input);
      } else {
        await supplierP2PAdapter.createPayeeInstruction(currentSupplier.id, { organizationId }, input);
      }
      const refreshed = await supplierP2PAdapter.getSetup(currentSupplier.id, { organizationId });
      setSetup((current) => ({ ...current, payeeInstructions: refreshed.payeeInstructions }));
      setPayeeDraft(emptyPayeeDraft(currentSupplier.countryCode));
      setPayeeError(null);
    } catch (cause) {
      setPayeeError(errorMessage(cause, "Unable to save payment instructions."));
    } finally {
      setPayeeSaving(false);
    }
  };

  const editPayeeInstruction = (instruction: SupplierPayeeInstruction) => {
    setPayeeDraft({
      id: instruction.id,
      expectedVersion: instruction.version,
      beneficiaryName: instruction.beneficiaryName,
      bankCountryCode: instruction.bankCountryCode,
      bankName: instruction.bankName ?? "",
      accountIdentifier: instruction.accountIdentifier,
      currency: instruction.currency,
    });
    setPayeeError(null);
    setActiveSection("payment");
  };

  const reviewPayeeInstruction = async (instruction: SupplierPayeeInstruction, decision: "verified" | "rejected") => {
    if (!currentSupplier) return;
    if (!isOnline) {
      setReviewError("Reconnect to the protected service before reviewing payment instructions.");
      return;
    }
    setReviewError(null);
    try {
      if (decision === "verified") {
        await supplierP2PAdapter.verifyPayeeInstruction(instruction.id, { organizationId }, instruction.version);
      } else {
        const reason = reviewReasons[instruction.id]?.trim();
        if (!reason) {
          setReviewError("Enter a reason before rejecting a payment instruction.");
          return;
        }
        await supplierP2PAdapter.rejectPayeeInstruction(instruction.id, { organizationId }, instruction.version, reason);
      }
      const refreshed = await supplierP2PAdapter.getSetup(currentSupplier.id, { organizationId });
      setSetup((current) => ({ ...current, payeeInstructions: refreshed.payeeInstructions }));
      setReviewReasons((current) => ({ ...current, [instruction.id]: "" }));
    } catch (cause) {
      setReviewError(errorMessage(cause, "Unable to review payment instructions."));
    }
  };

  const updateContact = (draftKey: string, patch: Partial<ContactDraft>) => {
    markDirty();
    setContacts((current) => {
      const target = current.find((contact) => contact.draftKey === draftKey);
      if (!target) return current;
      const updated = { ...target, ...patch };
      return current.map((contact) => contact.draftKey === draftKey
        ? updated
        : updated.isPrimary && contact.role === updated.role
          ? { ...contact, isPrimary: false }
          : contact);
    });
  };

  const updateAddress = (draftKey: string, patch: Partial<AddressDraft>) => {
    markDirty();
    setAddresses((current) => {
      const target = current.find((address) => address.draftKey === draftKey);
      if (!target) return current;
      const updated = { ...target, ...patch };
      return current.map((address) => address.draftKey === draftKey
        ? updated
        : updated.isPrimary && address.purpose === updated.purpose
          ? { ...address, isPrimary: false }
          : address);
    });
  };

  const activeDeliveryAddressId = addresses.some((address) => address.id === deliveryAddressId)
    ? deliveryAddressId
    : "";
  const reviewable = (instruction: SupplierPayeeInstruction) =>
    canReviewPayee
    && Boolean(currentUserId)
    && currentUserId !== instruction.updatedBy
    && instruction.status === "pending_review";

  return (
    <div className="space-y-5">
      <PageHeader
        title={currentSupplier ? `Edit ${currentSupplier.legalName}` : "New supplier"}
        description="Complete the supplier master record for purchasing, receiving and supplier payment."
        actions={<Button type="button" variant="outline" onClick={requestExit}><ArrowLeft className="me-2 h-4 w-4" />Cancel</Button>}
      />

      {loading ? <LoadingState label="Loading supplier setup" /> : loadError ? (
        <EmptyState
          title="Unable to load supplier setup"
          description={loadError}
          action={<div className="flex gap-2"><Button variant="outline" onClick={() => void loadSetup()}>Retry</Button><Button variant="ghost" onClick={requestExit}>Cancel</Button></div>}
        />
      ) : (
        <>
          <FormSectionNav
            items={sectionItems}
            activeId={activeSection}
            onSelect={(id) => {
              setActiveSection(id);
              document.getElementById(`supplier-form-${id}`)?.scrollIntoView?.({ behavior: "smooth", block: "start" });
            }}
          />

          <div className="space-y-4">
            <FormSection
              id="supplier-form-identity"
              title="Identity"
              description="Legal identity and supplier classification."
              icon={<Building2 className="h-5 w-5" />}
              status={saveError ? "error" : "neutral"}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Legal name" htmlFor="supplier-legal-name">
                  <Input id="supplier-legal-name" autoComplete="organization" value={legalName} onChange={(event) => { setLegalName(event.target.value); markDirty(); }} />
                </Field>
                <Field label="Supplier type" htmlFor="supplier-kind">
                  <Select value={kind} onValueChange={(value: SupplierKind) => { setKind(value); markDirty(); }}>
                    <SelectTrigger id="supplier-kind"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="organization">Organization</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Country or jurisdiction" htmlFor="supplier-country">
                  <Select value={countryCode} onValueChange={(value) => { setCountryCode(value); markDirty(); }}>
                    <SelectTrigger id="supplier-country"><SelectValue /></SelectTrigger>
                    <SelectContent>{countryOptions.map((country) => <SelectItem key={country.value} value={country.value}>{country.label}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
            </FormSection>

            <FormSection
              id="supplier-form-tax"
              title="Tax profile"
              description="Tax identifiers and jurisdiction-specific requirements."
              status="neutral"
            >
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                <p className="font-medium">Tax profile pending Finance/Legal validation</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Country-specific fields for Spain, the United States and Colombia are not editable until their required identifiers and validation rules are approved.
                </p>
              </div>
            </FormSection>

            <FormSection
              id="supplier-form-contacts"
              title="Contacts"
              description="Role-based contacts for purchasing, receiving, accounts payable and remittance."
              icon={<UserRound className="h-5 w-5" />}
              completed={contacts.filter((contact) => contact.name.trim()).length}
              total={contacts.length}
              status={contacts.some((contact) => !contact.name.trim()) ? "progress" : contacts.length ? "complete" : "neutral"}
              meta={<Button type="button" size="sm" variant="outline" onClick={() => {
                markDirty();
                setContacts((current) => [...current, {
                  id: createRecordId(),
                  draftKey: createRecordId(),
                  name: "",
                  email: null,
                  phone: null,
                  role: "purchasing",
                  isPrimary: false,
                }]);
              }}><Plus className="me-2 h-4 w-4" />Add contact</Button>}
            >
              {contacts.length ? (
                <div className="space-y-3">
                  {contacts.map((contact, index) => (
                    <article key={contact.draftKey} className="space-y-4 rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-medium">Contact {index + 1}</h3>
                        <Button type="button" variant="ghost" size="sm" aria-label={`Remove contact ${index + 1}`} onClick={() => {
                          markDirty();
                          setContacts((current) => current.filter((item) => item.draftKey !== contact.draftKey));
                        }}><Trash2 className="me-2 h-4 w-4" />Remove</Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Contact name" htmlFor={`supplier-contact-name-${contact.draftKey}`}>
                          <Input id={`supplier-contact-name-${contact.draftKey}`} autoComplete="name" value={contact.name} onChange={(event) => updateContact(contact.draftKey, { name: event.target.value })} />
                        </Field>
                        <Field label="Contact role" htmlFor={`supplier-contact-role-${contact.draftKey}`}>
                          <Select value={contact.role} onValueChange={(value: SupplierContactRole) => updateContact(contact.draftKey, { role: value })}>
                            <SelectTrigger id={`supplier-contact-role-${contact.draftKey}`}><SelectValue /></SelectTrigger>
                            <SelectContent>{contactRoles.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </Field>
                        <Field label="Email" htmlFor={`supplier-contact-email-${contact.draftKey}`}>
                          <Input id={`supplier-contact-email-${contact.draftKey}`} type="email" autoComplete="email" value={contact.email ?? ""} onChange={(event) => updateContact(contact.draftKey, { email: event.target.value || null })} />
                        </Field>
                        <Field label="Phone" htmlFor={`supplier-contact-phone-${contact.draftKey}`}>
                          <Input id={`supplier-contact-phone-${contact.draftKey}`} type="tel" autoComplete="tel" value={contact.phone ?? ""} onChange={(event) => updateContact(contact.draftKey, { phone: event.target.value || null })} />
                        </Field>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id={`supplier-contact-primary-${contact.draftKey}`} checked={contact.isPrimary} onCheckedChange={(checked) => updateContact(contact.draftKey, { isPrimary: checked === true })} />
                        <Label htmlFor={`supplier-contact-primary-${contact.draftKey}`}>Primary contact for this role</Label>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No contacts added. Add role-based contacts when available.</p>}
            </FormSection>

            <FormSection
              id="supplier-form-addresses"
              title="Addresses"
              description="Legal, billing, order, ship-from, remittance and returns addresses."
              icon={<MapPin className="h-5 w-5" />}
              completed={addresses.filter((address) => address.label.trim() && address.locality?.trim() && address.addressLines.some((line) => line.trim())).length}
              total={addresses.length}
              status={addresses.some((address) => !address.label.trim() || !address.locality?.trim() || !address.addressLines.some((line) => line.trim())) ? "progress" : addresses.length ? "complete" : "neutral"}
              meta={<Button type="button" size="sm" variant="outline" onClick={() => {
                markDirty();
                setAddresses((current) => [...current, {
                  id: createRecordId(),
                  draftKey: createRecordId(),
                  label: "",
                  purpose: "order",
                  countryCode,
                  region: null,
                  locality: null,
                  postalCode: null,
                  addressLines: [],
                  isPrimary: false,
                }]);
              }}><Plus className="me-2 h-4 w-4" />Add address</Button>}
            >
              {addresses.length ? (
                <div className="space-y-3">
                  {addresses.map((address, index) => (
                    <article key={address.draftKey} className="space-y-4 rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-medium">Address {index + 1}</h3>
                        <Button type="button" variant="ghost" size="sm" aria-label={`Remove address ${index + 1}`} onClick={() => {
                          markDirty();
                          setAddresses((current) => current.filter((item) => item.draftKey !== address.draftKey));
                          if (deliveryAddressId === address.id) setDeliveryAddressId("");
                        }}><Trash2 className="me-2 h-4 w-4" />Remove</Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <Field label="Address label" htmlFor={`supplier-address-label-${address.draftKey}`}>
                          <Input id={`supplier-address-label-${address.draftKey}`} value={address.label} onChange={(event) => updateAddress(address.draftKey, { label: event.target.value })} />
                        </Field>
                        <Field label="Address purpose" htmlFor={`supplier-address-purpose-${address.draftKey}`}>
                          <Select value={address.purpose} onValueChange={(value: SupplierAddressPurpose) => updateAddress(address.draftKey, { purpose: value })}>
                            <SelectTrigger id={`supplier-address-purpose-${address.draftKey}`}><SelectValue /></SelectTrigger>
                            <SelectContent>{addressPurposes.map((purpose) => <SelectItem key={purpose.value} value={purpose.value}>{purpose.label}</SelectItem>)}</SelectContent>
                          </Select>
                        </Field>
                        <Field label="Country code" htmlFor={`supplier-address-country-${address.draftKey}`}>
                          <Input id={`supplier-address-country-${address.draftKey}`} maxLength={2} autoCapitalize="characters" value={address.countryCode} onChange={(event) => updateAddress(address.draftKey, { countryCode: event.target.value.toUpperCase() })} />
                        </Field>
                        <Field label="City / locality" htmlFor={`supplier-address-locality-${address.draftKey}`}>
                          <Input id={`supplier-address-locality-${address.draftKey}`} autoComplete="address-level2" value={address.locality ?? ""} onChange={(event) => updateAddress(address.draftKey, { locality: event.target.value || null })} />
                        </Field>
                        <Field label="State / region" htmlFor={`supplier-address-region-${address.draftKey}`}>
                          <Input id={`supplier-address-region-${address.draftKey}`} autoComplete="address-level1" value={address.region ?? ""} onChange={(event) => updateAddress(address.draftKey, { region: event.target.value || null })} />
                        </Field>
                        <Field label="Postal code" htmlFor={`supplier-address-postal-${address.draftKey}`}>
                          <Input id={`supplier-address-postal-${address.draftKey}`} autoComplete="postal-code" value={address.postalCode ?? ""} onChange={(event) => updateAddress(address.draftKey, { postalCode: event.target.value || null })} />
                        </Field>
                        <div className="md:col-span-2">
                          <Field label="Street address" htmlFor={`supplier-address-lines-${address.draftKey}`}>
                            <Textarea id={`supplier-address-lines-${address.draftKey}`} autoComplete="street-address" value={address.addressLines.join("\n")} onChange={(event) => updateAddress(address.draftKey, { addressLines: event.target.value.split("\n") })} rows={2} />
                          </Field>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox id={`supplier-address-primary-${address.draftKey}`} checked={address.isPrimary} onCheckedChange={(checked) => updateAddress(address.draftKey, { isPrimary: checked === true })} />
                        <Label htmlFor={`supplier-address-primary-${address.draftKey}`}>Primary address for this purpose</Label>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No addresses added. Add addresses for legal, billing, delivery or remittance use.</p>}
            </FormSection>

            <FormSection
              id="supplier-form-purchasing"
              title="Purchasing defaults"
              description="Defaults are copied into future purchasing transactions; they do not store order history."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Default currency" htmlFor="supplier-currency" hint="Three-letter ISO currency code.">
                  <Input id="supplier-currency" maxLength={3} autoComplete="off" value={currency} onChange={(event) => { setCurrency(event.target.value.toUpperCase()); markDirty(); }} />
                </Field>
                <Field label="Payment terms" htmlFor="supplier-payment-terms">
                  <Input id="supplier-payment-terms" maxLength={60} placeholder="e.g. NET30" value={paymentTermCode} onChange={(event) => { setPaymentTermCode(event.target.value); markDirty(); }} />
                </Field>
                <Field label="Delivery terms" htmlFor="supplier-delivery-terms">
                  <Input id="supplier-delivery-terms" maxLength={60} placeholder="e.g. DAP" value={deliveryTermCode} onChange={(event) => { setDeliveryTermCode(event.target.value); markDirty(); }} />
                </Field>
                <Field label="Default delivery address" htmlFor="supplier-delivery-address">
                  <Select value={activeDeliveryAddressId || "none"} onValueChange={(value) => { setDeliveryAddressId(value === "none" ? "" : value); markDirty(); }}>
                    <SelectTrigger id="supplier-delivery-address"><SelectValue placeholder="No default address" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No default address</SelectItem>
                      {addresses.map((address) => <SelectItem key={address.id} value={address.id ?? address.draftKey}>{address.label || "New address"} · {address.purpose.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="md:col-span-2">
                  <Field label="Finance reference" htmlFor="supplier-finance-reference" hint="Company-specific reference, up to 120 characters.">
                    <Input id="supplier-finance-reference" maxLength={120} value={financeReference} onChange={(event) => { setFinanceReference(event.target.value); markDirty(); }} />
                  </Field>
                </div>
              </div>
            </FormSection>

            <FormSection
              id="supplier-form-payment"
              title="Payment instructions"
              description="Protected bank details are server-authoritative and never stored or queued in local demo mode."
              icon={<CreditCard className="h-5 w-5" />}
            >
              {!remoteMode ? (
                <div className="rounded-lg border border-border bg-muted/40 p-4">
                  <p className="font-medium">Secure payment setup unavailable in local demo mode</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Connect to the protected Supabase environment to enter or review bank details. This screen will not save bank information offline.
                  </p>
                </div>
              ) : !isOnline ? (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                  <p className="font-medium">Payment instructions are unavailable offline</p>
                  <p className="mt-1 text-sm text-muted-foreground">Reconnect to the protected service to view, edit or review bank details. Sensitive values are not cached or queued.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {!currentSupplier && <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">Save the supplier setup first; protected payment instructions can then be added without leaving this page.</p>}
                  {payeeNeedsRefresh && currentSupplier && (
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm text-muted-foreground">Reload protected payment instructions after reconnecting.</p>
                      <Button type="button" size="sm" variant="outline" onClick={() => void refreshPayeeInstructions()}>Reload payment instructions</Button>
                    </div>
                  )}
                  {setup.payeeInstructions.map((instruction) => (
                    <article key={instruction.id} className="space-y-3 rounded-lg border border-border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium">{instruction.beneficiaryName}</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {instruction.bankName ? `${instruction.bankName} · ` : ""}
                            {instruction.bankCountryCode} · {instruction.currency} · {instruction.accountIdentifier}
                          </p>
                          {instruction.rejectionReason && <p className="mt-2 text-sm text-destructive">Rejection reason: {instruction.rejectionReason}</p>}
                        </div>
                        <StatusBadge tone={instruction.status === "verified" ? "success" : instruction.status === "pending_review" ? "warning" : "neutral"}>
                          {instruction.status.replace("_", " ")}
                        </StatusBadge>
                      </div>
                      <div className="flex flex-wrap items-end gap-2">
                        {instruction.status !== "inactive" && <Button type="button" size="sm" variant="outline" disabled={!currentSupplier} onClick={() => editPayeeInstruction(instruction)}>Edit details</Button>}
                        {reviewable(instruction) && (
                          <>
                            <Button type="button" size="sm" onClick={() => void reviewPayeeInstruction(instruction, "verified")}>Verify</Button>
                            <div className="min-w-48 flex-1">
                              <Label htmlFor={`supplier-rejection-${instruction.id}`}>Rejection reason</Label>
                              <Input id={`supplier-rejection-${instruction.id}`} value={reviewReasons[instruction.id] ?? ""} onChange={(event) => setReviewReasons((current) => ({ ...current, [instruction.id]: event.target.value }))} />
                            </div>
                            <Button type="button" size="sm" variant="outline" disabled={!reviewReasons[instruction.id]?.trim()} onClick={() => void reviewPayeeInstruction(instruction, "rejected")}>Reject</Button>
                          </>
                        )}
                        {canReviewPayee && currentUserId === instruction.updatedBy && instruction.status === "pending_review" && (
                          <p className="text-sm text-muted-foreground">The editor cannot verify or reject their own instruction.</p>
                        )}
                      </div>
                    </article>
                  ))}

                  {setup.payeeInstructions.length === 0 && <p className="text-sm text-muted-foreground">No payment instructions have been added.</p>}
                  {reviewError && <p role="alert" className="text-sm text-destructive">{reviewError}</p>}
                  {!canReviewPayee && reviewError && <p className="text-xs text-muted-foreground">Review controls stay hidden until owner/admin permission can be confirmed.</p>}

                  <div className="space-y-4 rounded-lg border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{payeeDraft.id ? "Edit payment instruction" : "Add payment instruction"}</h3>
                        <p className="text-sm text-muted-foreground">Changes to bank details require independent verification again.</p>
                      </div>
                      {payeeDraft.id && <Button type="button" size="sm" variant="ghost" onClick={() => setPayeeDraft(emptyPayeeDraft(currentSupplier?.countryCode ?? "ES"))}>Cancel edit</Button>}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Beneficiary name" htmlFor="supplier-payee-beneficiary">
                        <Input id="supplier-payee-beneficiary" autoComplete="off" disabled={!currentSupplier} value={payeeDraft.beneficiaryName} onChange={(event) => { setPayeeDraft((current) => ({ ...current, beneficiaryName: event.target.value })); markDirty(); }} />
                      </Field>
                      <Field label="Bank country code" htmlFor="supplier-payee-country">
                            <Input id="supplier-payee-country" maxLength={2} autoCapitalize="characters" disabled={!currentSupplier} value={payeeDraft.bankCountryCode} onChange={(event) => { setPayeeDraft((current) => ({ ...current, bankCountryCode: event.target.value.toUpperCase() })); markDirty(); }} />
                      </Field>
                      <Field label="Bank name" htmlFor="supplier-payee-bank">
                        <Input id="supplier-payee-bank" autoComplete="off" disabled={!currentSupplier} value={payeeDraft.bankName} onChange={(event) => { setPayeeDraft((current) => ({ ...current, bankName: event.target.value })); markDirty(); }} />
                      </Field>
                      <Field label="Account identifier" htmlFor="supplier-payee-account">
                        <Input id="supplier-payee-account" autoComplete="off" disabled={!currentSupplier} value={payeeDraft.accountIdentifier} onChange={(event) => { setPayeeDraft((current) => ({ ...current, accountIdentifier: event.target.value })); markDirty(); }} />
                      </Field>
                      <Field label="Payment currency" htmlFor="supplier-payee-currency">
                        <Input id="supplier-payee-currency" autoComplete="off" maxLength={3} disabled={!currentSupplier} value={payeeDraft.currency} onChange={(event) => { setPayeeDraft((current) => ({ ...current, currency: event.target.value.toUpperCase() })); markDirty(); }} />
                      </Field>
                    </div>
                    {payeeError && <p role="alert" className="text-sm text-destructive">{payeeError}</p>}
                    <Button type="button" onClick={() => void savePayeeInstruction()} disabled={payeeSaving || !currentSupplier}>
                      {payeeSaving ? "Saving…" : payeeDraft.id ? "Save payment details" : "Add payment instruction"}
                    </Button>
                  </div>
                </div>
              )}
            </FormSection>
          </div>

          {saveError && (
            <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {saveError}
              {saveError && currentSupplier && <Button type="button" size="sm" variant="outline" className="ms-3" onClick={() => void loadSetup()}>Reload saved setup</Button>}
            </div>
          )}
          {saveSuccess && <p role="status" className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">{saveSuccess}</p>}
          <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
            <p className="text-xs text-muted-foreground">{currentSupplier ? `Supplier setup version ${setup.version}` : "New supplier"}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={requestExit}>Cancel</Button>
              {currentSupplier && <Button type="button" variant="ghost" onClick={() => onExit(currentSupplier)}>Done</Button>}
              <Button type="button" onClick={() => void saveSetup()} disabled={saving || loading}>{saving ? "Saving…" : currentSupplier ? "Save changes" : "Create supplier"}</Button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmExit}
        onOpenChange={setConfirmExit}
        title="Discard unsaved changes?"
        description="Your supplier setup changes have not been saved."
        confirmLabel="Discard changes"
        tone="destructive"
        onConfirm={discardAndExit}
      />
    </div>
  );
}
