import { localCatalogAdapter } from "./local";
import type {
  CatalogItem,
  CatalogListParams,
  CatalogReference,
  CatalogReferenceResolutionParams,
  CatalogScopeParams,
  CatalogVariant,
  Offer,
  PriceBook,
  PriceEntry,
  ResolvedCatalogReference,
} from "../types";

export interface CatalogAdapter {
  listCatalogItems(params: CatalogListParams): Promise<CatalogItem[]>;
  getCatalogItem(id: string, params: CatalogScopeParams): Promise<CatalogItem | null>;
  findCatalogItemByKey(key: string, params: CatalogScopeParams): Promise<CatalogItem | null>;
  listOffers(params: CatalogListParams & { catalogItemId?: string }): Promise<Offer[]>;
  listVariants(params: CatalogListParams & { catalogItemId?: string }): Promise<CatalogVariant[]>;
  listPriceBooks(params: CatalogListParams): Promise<PriceBook[]>;
  listPriceEntries(params: CatalogListParams & { priceBookId?: string }): Promise<PriceEntry[]>;
  resolveReference(params: CatalogReferenceResolutionParams): Promise<ResolvedCatalogReference | null>;
}

export const catalogAdapter: CatalogAdapter = localCatalogAdapter;

export class CatalogAdapterError extends Error {
  constructor(
    message: string,
    public readonly code: "forbidden" | "server-error",
  ) {
    super(message);
    this.name = "CatalogAdapterError";
  }
}

export type { CatalogItem, CatalogListParams, CatalogReference, CatalogReferenceResolutionParams, CatalogScopeParams, CatalogVariant, Offer, PriceBook, PriceEntry, ResolvedCatalogReference };
