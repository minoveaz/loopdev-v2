import type { SupplierP2PSetupInput } from "../../../../packages/contracts/src/suppliers";

export function supplierP2PValidationError(input: SupplierP2PSetupInput): string | null {
  const primaryContactRoles = input.contacts.filter((contact) => contact.isPrimary).map((contact) => contact.role);
  if (new Set(primaryContactRoles).size !== primaryContactRoles.length) {
    return "Only one primary contact is allowed for each role.";
  }

  const primaryAddressPurposes = input.addresses.filter((address) => address.isPrimary).map((address) => address.purpose);
  if (new Set(primaryAddressPurposes).size !== primaryAddressPurposes.length) {
    return "Only one primary address is allowed for each purpose.";
  }

  for (const contact of input.contacts) {
    if (!contact.name.trim()) return "Each supplier contact needs a name.";
    if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      return "Enter a valid email address for each supplier contact.";
    }
  }

  for (const address of input.addresses) {
    if (!address.label.trim() || !address.addressLines.some((line) => line.trim()) || !address.locality?.trim()) {
      return "Each supplier address needs a label, street address and locality.";
    }
    if (!/^[A-Za-z]{2}$/.test(address.countryCode)) {
      return "Each supplier address needs a valid two-letter country code.";
    }
  }

  if (input.purchaseDefaults.currency && !/^[A-Za-z]{3}$/.test(input.purchaseDefaults.currency)) {
    return "Purchase currency must be a three-letter ISO code.";
  }
  if (input.purchaseDefaults.financeReference && input.purchaseDefaults.financeReference.length > 120) {
    return "Finance reference must be 120 characters or fewer.";
  }
  if (input.purchaseDefaults.paymentTermCode && input.purchaseDefaults.paymentTermCode.length > 60) {
    return "Payment terms must be 60 characters or fewer.";
  }
  if (input.purchaseDefaults.deliveryTermCode && input.purchaseDefaults.deliveryTermCode.length > 60) {
    return "Delivery terms must be 60 characters or fewer.";
  }

  const addressIds = new Set(input.addresses.map((address) => address.id).filter((id): id is string => Boolean(id)));
  if (input.purchaseDefaults.deliveryAddressId && !addressIds.has(input.purchaseDefaults.deliveryAddressId)) {
    return "Default delivery address must belong to this supplier setup.";
  }
  return null;
}
