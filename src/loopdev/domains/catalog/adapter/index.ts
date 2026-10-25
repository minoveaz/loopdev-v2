import { localCatalogAdapter } from "./local";
import { supabaseCatalogAdapter } from "./supabase";
import { CatalogAdapterError } from "../types";
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
  updateCatalogItem(id: string, params: CatalogScopeParams, patch: Partial<Pick<CatalogItem, "name" | "type" | "description" | "categoryKey" | "status" | "metadata">>): Promise<CatalogItem>;
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
  updateVariant(id: string, params: CatalogScopeParams, patch: Partial<Omit<CatalogVariant, "id" | "key" | "sku" | "createdAt" | "updatedAt">>): Promise<CatalogVariant>;
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

function configuredCatalogAdapter(): CatalogAdapter {
  const mode: string | undefined = import.meta.env?.VITE_CATALOG_ADAPTER_MODE;
  if (mode === "local_demo") return localCatalogAdapter;
  if (mode === "supabase") return supabaseCatalogAdapter;
  throw new CatalogAdapterError(
    "Catalog adapter mode must be explicitly configured as local_demo or supabase.",
    "server-error",
  );
}

// Configuration is resolved on each operation so missing or invalid runtime
// configuration fails as a rejected adapter operation, never as fixture fallback.
export const catalogAdapter: CatalogAdapter = new Proxy({} as CatalogAdapter, {
  get(_target, property) {
    if (property === "then" || typeof property !== "string") return undefined;
    return (...args: unknown[]) => {
      try {
        const adapter = configuredCatalogAdapter();
        const method = Reflect.get(adapter, property);
        if (typeof method !== "function") {
          throw new CatalogAdapterError("The requested catalog operation is unavailable.", "server-error");
        }
        return method.apply(adapter, args);
      } catch (error) {
        return Promise.reject(error);
      }
    };
  },
});
export { localCatalogAdapter };
export { supabaseCatalogAdapter };

export { CatalogAdapterError };

export type { CatalogCreateInput, CatalogItemCreateInput, CatalogItem, CatalogListParams, CatalogReference, CatalogReferenceResolutionParams, CatalogScopeParams, CatalogVariant, Offer, OrganizationCatalog, PriceBook, PriceEntry, ProductPartyRole, CatalogAvailability, CatalogEligibility, ProductCostReference, ProductCostReferenceInput, ProductReference, ProductReferenceCreateInput, ProductReferenceKind, ResolvedCatalogReference, CatalogOfferCreateInput, CatalogVariantCreateInput, CatalogPriceBookCreateInput, CatalogPriceEntryCreateInput };
