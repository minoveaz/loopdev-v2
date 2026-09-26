export type QuoteStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface QuoteLine {
  id: string;
  quoteId: string;
  catalogItemId: string | null;
  productKey: string | null;
  label: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  currency: string;
}

export interface QuoteRecord {
  id: string;
  organizationId: string;
  opportunityId: string;
  status: QuoteStatus;
  currency: string;
  subtotal: number;
  total: number;
  version: number;
  lines: QuoteLine[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteInput {
  organizationId: string;
  opportunityId: string;
  currency: string;
  lines: Array<Pick<QuoteLine, "catalogItemId" | "productKey" | "label" | "quantity" | "unitAmount">>;
}