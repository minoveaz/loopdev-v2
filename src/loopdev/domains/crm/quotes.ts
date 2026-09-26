import type { CreateQuoteInput, QuoteLine, QuoteRecord } from "../../../../packages/contracts/src/quotes";
import { defaultWebAuthAdapter } from "../platform/adapter/auth-supabase";

function getClient() {
  return defaultWebAuthAdapter.getClient();
}

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
    lines: lines.map((line): QuoteLine => ({
      id: line.id,
      quoteId: line.quote_id,
      catalogItemId: line.catalog_item_id ?? null,
      productKey: line.product_key ?? null,
      label: line.label,
      quantity: Number(line.quantity),
      unitAmount: Number(line.unit_amount),
      totalAmount: Number(line.total_amount),
      currency: line.currency,
    })),
  };
}

export async function createQuote(input: CreateQuoteInput): Promise<QuoteRecord> {
  if (!input.organizationId || !input.opportunityId || !input.lines.length) {
    throw new Error("A quote requires an organization, opportunity and at least one line.");
  }
  if (input.lines.some((line) => line.quantity <= 0 || line.unitAmount < 0)) {
    throw new Error("Quote quantities must be positive and amounts cannot be negative.");
  }
  const client = getClient();
  if (!client) throw new Error("Supabase is not configured.");
  const subtotal = input.lines.reduce((sum, line) => sum + line.quantity * line.unitAmount, 0);
  const quoteResponse = await client.from("crm_quotes").insert({
    organization_id: input.organizationId,
    opportunity_id: input.opportunityId,
    currency: input.currency,
    subtotal,
    total: subtotal,
  }).select().single();
  if (quoteResponse.error || !quoteResponse.data) throw new Error(quoteResponse.error?.message ?? "Unable to create quote.");
  const linesResponse = await client.from("crm_quote_lines").insert(input.lines.map((line) => ({
    quote_id: quoteResponse.data.id,
    organization_id: input.organizationId,
    catalog_item_id: line.catalogItemId,
    product_key: line.productKey,
    label: line.label,
    quantity: line.quantity,
    unit_amount: line.unitAmount,
    currency: input.currency,
  }))).select();
  if (linesResponse.error) {
    await client.from("crm_quotes").delete().eq("id", quoteResponse.data.id).eq("organization_id", input.organizationId);
    throw new Error(linesResponse.error.message);
  }
  return mapQuote(quoteResponse.data, linesResponse.data ?? []);
}

export async function listQuotes(opportunityId: string, organizationId: string): Promise<QuoteRecord[]> {
  const client = getClient();
  if (!client) throw new Error("Supabase is not configured.");
  const quotes = await client.from("crm_quotes").select("*").eq("opportunity_id", opportunityId).eq("organization_id", organizationId).order("created_at", { ascending: false });
  if (quotes.error) throw new Error(quotes.error.message);
  const records: QuoteRecord[] = [];
  for (const quote of quotes.data ?? []) {
    const lines = await client.from("crm_quote_lines").select("*").eq("quote_id", quote.id).eq("organization_id", organizationId);
    if (lines.error) throw new Error(lines.error.message);
    records.push(mapQuote(quote, lines.data ?? []));
  }
  return records;
}