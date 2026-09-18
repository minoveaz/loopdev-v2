import { localCatalogAdapter } from "./local";
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
  resolveReference(params: CatalogReferenceResolutionParams): Promise<ResolvedCatalogReference | null>;
}

export const catalogAdapter: CatalogAdapter = localCatalogAdapter;
export { localCatalogAdapter };

export { CatalogAdapterError } from "../types";

export type { CatalogCreateInput, CatalogItemCreateInput, CatalogItem, CatalogListParams, CatalogReference, CatalogReferenceResolutionParams, CatalogScopeParams, CatalogVariant, Offer, OrganizationCatalog, PriceBook, PriceEntry, ProductPartyRole, CatalogAvailability, CatalogEligibility, ResolvedCatalogReference, CatalogOfferCreateInput, CatalogVariantCreateInput, CatalogPriceBookCreateInput, CatalogPriceEntryCreateInput };
