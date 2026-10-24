import { localCatalogAdapter } from "./local";
import { supabaseCatalogAdapter } from "./supabase";
import type {
  CatalogItem,
  CatalogCreateInput,
  CatalogItemCreateInput,
  CatalogListParams,
  CatalogReference,
  CatalogReferenceResolutionParams,
  CatalogScopeParams,
  OrganizationCatalog,
  CatalogVariant,
  Offer,
  PriceBook,
  PriceEntry,
  ProductPartyRole,
  CatalogAvailability,
  CatalogEligibility,
  ResolvedCatalogReference,
  CatalogOfferCreateInput,
  CatalogVariantCreateInput,
  CatalogPriceBookCreateInput,
  CatalogPriceEntryCreateInput,
  ProductCostReference,
  ProductCostReferenceInput,
  ProductReference,
  ProductReferenceCreateInput,
  ProductReferenceKind,
} from "../types";

export interface CatalogAdapter {
  listCatalogs(params: CatalogScopeParams): Promise<OrganizationCatalog[]>;
  createCatalog(input: CatalogCreateInput): Promise<OrganizationCatalog>;
createCatalogItem(input: CatalogItemCreateInput): Promise<CatalogItem>;
updateCatalogItem(id: string, params: CatalogScopeParams, patch: Partial<Pick<CatalogItem, "name" | "key" | "sku" | "type" | "description" | "categoryKey" | "status" | "metadata">>): Promise<CatalogItem>;
deleteCatalogItem(id: string, params: CatalogScopeParams): Promise<void>;
  listCatalogItems(params: CatalogListParams): Promise<CatalogItem[]>;
  getCatalogItem(id: string, params: CatalogScopeParams): Promise<CatalogItem | null>;
  findCatalogItemByKey(key: string, params: CatalogScopeParams): Promise<CatalogItem | null>;
  listOffers(params: CatalogListParams & { catalogItemId?: string }): Promise<Offer[]>;
  createOffer(input: CatalogOfferCreateInput): Promise<Offer>;
  updateOffer(id: string, params: CatalogScopeParams, patch: Partial<Omit<Offer, "id" | "createdAt" | "updatedAt">>): Promise<Offer>;
  deleteOffer(id: string, params: CatalogScopeParams): Promise<void>;
  listVariants(params: CatalogListParams & { catalogItemId?: string }): Promise<CatalogVariant[]>;
  createVariant(input: CatalogVariantCreateInput): Promise<CatalogVariant>;
  updateVariant(id: string, params: CatalogScopeParams, patch: Partial<Omit<CatalogVariant, "id" | "createdAt" | "updatedAt">>): Promise<CatalogVariant>;
  deleteVariant(id: string, params: CatalogScopeParams): Promise<void>;
  listPriceBooks(params: CatalogListParams): Promise<PriceBook[]>;
  createPriceBook(input: CatalogPriceBookCreateInput): Promise<PriceBook>;
  updatePriceBook(id: string, params: CatalogScopeParams, patch: Partial<Omit<PriceBook, "id" | "createdAt" | "updatedAt">>): Promise<PriceBook>;
  deletePriceBook(id: string, params: CatalogScopeParams): Promise<void>;
  listPriceEntries(params: CatalogListParams & { priceBookId?: string }): Promise<PriceEntry[]>;
  createPriceEntry(input: CatalogPriceEntryCreateInput): Promise<PriceEntry>;
  updatePriceEntry(id: string, params: CatalogScopeParams, patch: Partial<Omit<PriceEntry, "id" | "createdAt" | "updatedAt">>): Promise<PriceEntry>;
  deletePriceEntry(id: string, params: CatalogScopeParams): Promise<void>;
  listProductPartyRoles(params: CatalogListParams & { catalogItemId?: string; role?: ProductPartyRole["role"] }): Promise<ProductPartyRole[]>;
  listAvailabilities(params: CatalogListParams & { catalogItemId?: string }): Promise<CatalogAvailability[]>;
  listEligibilities(params: CatalogListParams & { catalogItemId?: string }): Promise<CatalogEligibility[]>;
  listProductReferences(params: CatalogScopeParams & { kind?: ProductReferenceKind }): Promise<ProductReference[]>;
  createProductReference(input: ProductReferenceCreateInput): Promise<ProductReference>;
  getProductCostReference(params: CatalogScopeParams & { catalogItemId: string; variantId?: string | null }): Promise<ProductCostReference | null>;
  saveProductCostReference(input: ProductCostReferenceInput): Promise<ProductCostReference>;
  resolveReference(params: CatalogReferenceResolutionParams): Promise<ResolvedCatalogReference | null>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value: unknown): value is string => typeof value === "string" && UUID_PATTERN.test(value);

// Keep local fixtures available for unauthenticated/demo consumers while all
// real organization UUIDs use the tenant-scoped Supabase adapter.
export const catalogAdapter: CatalogAdapter = new Proxy(supabaseCatalogAdapter, {
  get(target, property, receiver) {
    const value = Reflect.get(target, property, receiver);
    if (typeof value !== "function") return value;
    return (...args: unknown[]) => {
      const scope = args.find((arg): arg is { organizationId?: unknown } => Boolean(arg) && typeof arg === "object" && "organizationId" in arg);
      if (scope && scope.organizationId && !isUuid(scope.organizationId)) {
        const localValue = Reflect.get(localCatalogAdapter, property);
        if (typeof localValue === "function") return localValue.apply(localCatalogAdapter, args);
      }
      return value.apply(target, args);
    };
  },
});
export { localCatalogAdapter };
export { supabaseCatalogAdapter };

export { CatalogAdapterError } from "../types";

export type { CatalogCreateInput, CatalogItemCreateInput, CatalogItem, CatalogListParams, CatalogReference, CatalogReferenceResolutionParams, CatalogScopeParams, CatalogVariant, Offer, OrganizationCatalog, PriceBook, PriceEntry, ProductPartyRole, CatalogAvailability, CatalogEligibility, ProductCostReference, ProductCostReferenceInput, ProductReference, ProductReferenceCreateInput, ProductReferenceKind, ResolvedCatalogReference, CatalogOfferCreateInput, CatalogVariantCreateInput, CatalogPriceBookCreateInput, CatalogPriceEntryCreateInput };
