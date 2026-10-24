export const erpProductStates = [
  "loading",
  "empty",
  "error",
  "forbidden",
  "conflict",
  "offline",
  "pending",
  "success",
] as const;

export const erpProductOperations = [
  "catalog.list",
  "catalog.manage",
  "catalog.variants.list",
  "catalog.variants.manage",
  "catalog.offers.list",
  "catalog.offers.manage",
  "catalog.price-books.list",
  "catalog.price-books.manage",
  "catalog.price-entries.list",
  "catalog.price-entries.manage",
  "catalog.categories.list",
  "catalog.categories.manage",
] as const;

export type ErpProductOperation = (typeof erpProductOperations)[number];

export const erpProductActions = [
  { id: "catalog.list", label: "View products", permission: "catalog.read" },
  { id: "catalog.manage", label: "Manage products", permission: "catalog.write" },
  { id: "catalog.variants.list", label: "View variants", permission: "catalog.read" },
  { id: "catalog.variants.manage", label: "Manage variants", permission: "catalog.write" },
  { id: "catalog.offers.list", label: "View offers", permission: "catalog.read" },
  { id: "catalog.offers.manage", label: "Manage offers", permission: "catalog.write" },
  { id: "catalog.price-books.list", label: "View price books", permission: "catalog.read" },
  { id: "catalog.price-books.manage", label: "Manage price books", permission: "catalog.write" },
  { id: "catalog.price-entries.list", label: "View price entries", permission: "catalog.read" },
  { id: "catalog.price-entries.manage", label: "Manage price entries", permission: "catalog.write" },
  { id: "catalog.categories.list", label: "View categories", permission: "catalog.read" },
  { id: "catalog.categories.manage", label: "Manage categories", permission: "catalog.write" },
] as const satisfies readonly {
  id: ErpProductOperation;
  label: string;
  permission: "catalog.read" | "catalog.write";
}[];

export const erpProductsCapabilityContract = {
  id: "erp.products-module",
  version: "1.0.0",
  owner: "ERP Products",
  states: erpProductStates,
  actions: erpProductActions,
  labels: erpProductActions.map(({ id, label }) => ({ id, label })),
  permissions: ["catalog.read", "catalog.write"],
  legacyPermissions: ["catalog.manage"],
  capabilities: [
    {
      id: "erp.products",
      operations: [
        "catalog.list",
        "catalog.manage",
        "catalog.variants.list",
        "catalog.variants.manage",
        "catalog.offers.list",
        "catalog.offers.manage",
        "catalog.price-books.list",
        "catalog.price-books.manage",
        "catalog.price-entries.list",
        "catalog.price-entries.manage",
      ],
    },
    {
      id: "erp.product-categories",
      operations: ["catalog.categories.list", "catalog.categories.manage"],
    },
  ],
  lifecycle: {
    restoreProduct: "draft",
    restoreVariant: "draft",
    permanentDeletion: false,
  },
  categories: {
    scope: "organization",
    productCategoryAssignment: "independent",
    variantCategoryAssignment: "independent",
    preventCycles: true,
  },
  validation: {
    productCategoryRequiredBeforeActivation: true,
    variantCategoryRequiredBeforeActivation: true,
    archivedProductsAndVariantsRestoreTo: "draft",
    categoryParentMustBeActive: true,
    categoryMoveMustNotCreateCycles: true,
  },
  navigation: {
    products: "/app/erp/products",
    legacyCatalog: "/app/erp/product-catalog/:catalogId",
  },
  platforms: {
    desktop_web: { required: true },
    mobile_web: { required: true },
    ios: { required: false },
    android: { required: false },
  },
} as const;
