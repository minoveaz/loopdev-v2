import type { Entity } from "@/types";
import type { EntityScope, EntityRef } from "../platform";

export const CATALOG_ITEM_TYPES = [
  "physical_product",
  "service",
  "subscription",
  "coverage",
  "package",
  "digital_product",
  "fee",
] as const;

export type CatalogItemType = (typeof CATALOG_ITEM_TYPES)[number];
export type CatalogRecordStatus = "draft" | "active" | "archived";
export type CatalogBillingModel = "one_time" | "recurring" | "usage";

export interface CatalogVisibility extends EntityScope {
  channels?: readonly string[];
}

export interface CatalogItem extends Entity {
  organizationId: string;
  workspaceId: string | null;
  key: string;
  sku: string;
  type: CatalogItemType;
  name: string;
  description: string | null;
  categoryKey: string | null;
  status: CatalogRecordStatus;
  visibility: CatalogVisibility;
  metadata: Record<string, unknown>;
}

export interface Offer extends Entity {
  organizationId: string;
  workspaceId: string | null;
  catalogItemId: string;
  key: string;
  name: string;
  status: CatalogRecordStatus;
  billingModel: CatalogBillingModel;
  currency: string;
  unit: string;
  validFrom: string | null;
  validTo: string | null;
  metadata: Record<string, unknown>;
}

export interface CatalogVariant extends Entity {
  organizationId: string;
  workspaceId: string | null;
  catalogItemId: string;
  key: string;
  sku: string;
  name: string;
  status: CatalogRecordStatus;
  attributes: Record<string, string>;
  metadata: Record<string, unknown>;
}

export interface PriceBook extends Entity {
  organizationId: string;
  workspaceId: string | null;
  key: string;
  name: string;
  currency: string;
  status: CatalogRecordStatus;
  validFrom: string | null;
  validTo: string | null;
  visibility: CatalogVisibility;
}

export interface PriceEntry extends Entity {
  organizationId: string;
  workspaceId: string | null;
  priceBookId: string;
  catalogItemId: string | null;
  offerId: string | null;
  variantId: string | null;
  amount: number;
  currency: string;
  unit: string;
  status: CatalogRecordStatus;
  minQuantity: number | null;
  maxQuantity: number | null;
  validFrom: string | null;
  validTo: string | null;
}

export interface CatalogScopeParams {
  organizationId: string;
  workspaceId?: string | null;
}

export interface CatalogListParams extends CatalogScopeParams {
  status?: CatalogRecordStatus[];
  includeArchived?: boolean;
}

export interface CatalogReference {
  catalogItemId?: string | null;
  offerId?: string | null;
  variantId?: string | null;
  productKey?: string | null;
}

export interface ResolvedCatalogReference {
  item: CatalogItem;
  offer: Offer | null;
  variant: CatalogVariant | null;
  reference: EntityRef<"catalog_item">;
}

export interface CatalogReferenceResolutionParams extends CatalogScopeParams {
  reference: CatalogReference;
}
