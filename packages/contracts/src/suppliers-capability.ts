import {
  supplierAssortmentOperations,
  supplierOperations,
  supplierP2POperations,
  supplierStates,
} from "./suppliers";

export const supplierActions = [
  { id: "list_suppliers", label: "View suppliers", permission: "supplier.read" },
  { id: "search_suppliers", label: "Search suppliers", permission: "supplier.read" },
  { id: "view_supplier", label: "View supplier details", permission: "supplier.read" },
  { id: "create_supplier", label: "Create suppliers", permission: "supplier.manage" },
  { id: "update_supplier", label: "Update suppliers", permission: "supplier.manage" },
  { id: "deactivate_supplier", label: "Deactivate suppliers", permission: "supplier.manage" },
  { id: "reactivate_supplier", label: "Reactivate suppliers", permission: "supplier.manage" },
  { id: "list_supplier_items", label: "View supplier items", permission: "supplier.read" },
  { id: "add_supplier_item", label: "Add supplier items", permission: "supplier.manage" },
  { id: "link_supplier_item_to_product", label: "Link supplier items to products", permission: "supplier.manage" },
  { id: "start_product_creation_from_supplier_item", label: "Start product creation", permission: "supplier.manage" },
  { id: "update_supplier_item", label: "Update supplier items", permission: "supplier.manage" },
  { id: "update_supplier_item_terms", label: "Update supplier item terms", permission: "supplier.manage" },
  { id: "deactivate_supplier_item", label: "Deactivate supplier items", permission: "supplier.manage" },
  { id: "manage_supplier_contacts_addresses", label: "Manage supplier contacts and addresses", permission: "supplier.manage" },
  { id: "manage_supplier_purchase_defaults", label: "Manage purchasing defaults", permission: "supplier.manage" },
  { id: "manage_supplier_tax_profile", label: "Manage supplier tax profile", permission: "supplier.manage" },
  { id: "manage_supplier_payee_instructions", label: "Manage supplier payee instructions", permission: "supplier.manage" },
  { id: "verify_supplier_payee_account", label: "Verify supplier payee account", permission: "supplier.manage" },
] as const;

export const supplierCapabilityContract = {
  id: "erp.suppliers",
  version: "1.0.0",
  owner: "ERP Suppliers",
  states: supplierStates,
  actions: supplierActions,
  labels: supplierActions.map(({ id, label }) => ({ id, label })),
  operations: supplierOperations,
  p2pOperations: supplierP2POperations,
  assortmentOperations: supplierAssortmentOperations,
  p2p: {
    taxValuesExposed: false,
    payeeValuesExposed: false,
    sensitiveValuesMayBeQueuedOffline: false,
    sensitiveValuesMayBeLogged: false,
    verificationRequiresDifferentOwnerOrAdmin: true,
    materialPayeeChangeRevokesVerification: true,
  },
  assortment: {
    productCreation: "catalog-owner-handoff",
    canonicalProductMutatedBySupplierItemOperations: false,
    draftOffersOrderEligible: false,
  },
  validation: {
    legalNameRequired: true,
    countryCodeFormat: "ISO_3166_1_ALPHA_2",
    offerMustLinkExactlyOneProductOrVariantBeforePurchase: true,
    offerRequiresPositiveUnitsPerStockUnit: true,
    productCreationUsesProductsOwnerFlow: true,
    taxPolicyDelegatedToJurisdiction: true,
  },
  permissions: {
    read: "supplier.read",
    manage: "supplier.manage",
  },
  navigation: {
    directory: "/app/erp/suppliers",
  },
  platforms: {
    desktop_web: { required: true },
    mobile_web: { required: true },
    ios: { required: false },
    android: { required: false },
  },
} as const;
