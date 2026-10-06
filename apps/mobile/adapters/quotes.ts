import type { CreateQuoteInput, QuoteLine, QuoteRecord } from "../../../packages/contracts/src/quotes";
import { mobileSupabaseClient } from "./supabase";

function mapQuote(row: any, lines: any[]): QuoteRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    opportunityId: row.opportunity_id,
    status: row.status,
    currency: row.currency,
    subtotal: Number(row.subtotal ?? 0),
    total: Number(row.total ?? 0),
    version: Number(row.version ?? 1),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines: lines.map((line): QuoteLine => ({ id: line.id, quoteId: line.quote_id, catalogItemId: line.catalog_item_id ?? null, productKey: line.product_key ?? null, label: line.label, quantity: Number(line.quantity), unitAmount: Number(line.unit_amount), totalAmount: Number(line.total_amount), currency: line.currency })),
  };
}

export async function createMobileQuote(input: CreateQuoteInput): Promise<QuoteRecord> {
  if (!input.lines.length || input.lines.some((line) => line.quantity <= 0 || line.unitAmount < 0)) throw new Error("A quote requires valid priced lines.");
  const subtotal = input.lines.reduce((sum, line) => sum + line.quantity * line.unitAmount, 0);
  const quote = await mobileSupabaseClient.from("crm_quotes").insert({ organization_id: input.organizationId, opportunity_id: input.opportunityId, currency: input.currency, subtotal, total: subtotal }).select().single();
  if (quote.error || !quote.data) throw new Error(quote.error?.message ?? "Unable to create quote.");
  const lines = await mobileSupabaseClient.from("crm_quote_lines").insert(input.lines.map((line) => ({ quote_id: quote.data.id, organization_id: input.organizationId, catalog_item_id: line.catalogItemId, product_key: line.productKey, label: line.label, quantity: line.quantity, unit_amount: line.unitAmount, currency: input.currency }))).select();
  if (lines.error) {
    await mobileSupabaseClient.from("crm_quotes").delete().eq("id", quote.data.id).eq("organization_id", input.organizationId);
    throw new Error(lines.error.message);
  }
  return mapQuote(quote.data, lines.data ?? []);
}