import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { AppDrawer } from "@/components/platform";
import { EmptyState, FormSectionHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import type { CRMOpportunity } from "@/loopdev/domains/crm/adapter";
import type { CRMCustomerProduct, CRMLead } from "@/loopdev/domains/crm/adapter";
import { loopdevAdapter } from "@/loopdev/domains/crm/adapter";
import { platformAdapter } from "@/loopdev/domains/platform";
import { localCatalogAdapter } from "@/loopdev/domains/catalog";
import type { CatalogItem, CatalogAvailability, CatalogVariant, Offer, ProductPartyRole } from "@/loopdev/domains/catalog";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/formatters";
import { Input } from "@/components/ui/input";

export function Customer360ProductsTab({ contactId, opportunities, leads, selectorOpen, onSelectorOpenChange }: { contactId: string; opportunities: CRMOpportunity[]; leads: CRMLead[]; selectorOpen: boolean; onSelectorOpenChange: (open: boolean) => void }) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [catalogOptions, setCatalogOptions] = useState<CatalogItem[]>([]);
  const [customerProducts, setCustomerProducts] = useState<CRMCustomerProduct[]>([]);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [selectorQuery, setSelectorQuery] = useState("");
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState("");
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [selectorQuantity, setSelectorQuantity] = useState("1");
  const [selectorUnitAmount, setSelectorUnitAmount] = useState("");
  const [selectorStatus, setSelectorStatus] = useState<CRMCustomerProduct["status"]>("interested");
  const [selectorOffers, setSelectorOffers] = useState<Offer[]>([]);
  const [selectorVariants, setSelectorVariants] = useState<CatalogVariant[]>([]);
  const [savingAssociation, setSavingAssociation] = useState(false);
  const [selectorError, setSelectorError] = useState<string | null>(null);
  const [itemContext, setItemContext] = useState<{ offers: Offer[]; variants: CatalogVariant[]; roles: ProductPartyRole[]; availability: CatalogAvailability[] }>({ offers: [], variants: [], roles: [], availability: [] });
  useEffect(() => {
    void localCatalogAdapter.listCatalogItems({ organizationId: platformAdapter.getScope().organizationId, includeArchived: false }).then(setCatalogOptions).catch(() => setCatalogOptions([]));
  }, []);
  useEffect(() => {
    void loopdevAdapter.crm.listCustomerProducts(contactId).then(setCustomerProducts).catch(() => setCustomerProducts([]));
  }, [contactId]);
  useEffect(() => {
    const references = opportunities.filter((opportunity) => opportunity.catalogItemId || opportunity.productKey);
    const associationIds = new Set(customerProducts.map((association) => association.catalogItemId));
    if (!references.length && !associationIds.size) {
      setItems([]);
      return;
    }
    void localCatalogAdapter.listCatalogItems({ organizationId: platformAdapter.getScope().organizationId, includeArchived: true }).then((catalogItems) => {
      setItems(catalogItems.filter((item) => associationIds.has(item.id) || references.some((opportunity) => opportunity.catalogItemId === item.id || opportunity.productKey === item.key)));
    });
  }, [opportunities, customerProducts]);
  useEffect(() => {
    if (!selectedCatalogItemId) {
      setSelectorOffers([]);
      setSelectorVariants([]);
      return;
    }
    void Promise.all([
      localCatalogAdapter.listOffers({ organizationId: platformAdapter.getScope().organizationId, catalogItemId: selectedCatalogItemId }),
      localCatalogAdapter.listVariants({ organizationId: platformAdapter.getScope().organizationId, catalogItemId: selectedCatalogItemId }),
    ]).then(([offers, variants]) => {
      setSelectorOffers(offers);
      setSelectorVariants(variants);
    });
  }, [selectedCatalogItemId]);
  const associationFor = (item: CatalogItem) => customerProducts.filter((association) => association.catalogItemId === item.id);
  const visibleItems = catalogOptions.filter((item) => !selectorQuery.trim() || `${item.name} ${item.key} ${item.description ?? ""}`.toLocaleLowerCase().includes(selectorQuery.trim().toLocaleLowerCase()));
  const submitAssociation = async () => {
    setSelectorError(null);
    const quantity = Number(selectorQuantity);
    const unitAmount = selectorUnitAmount.trim() ? Number(selectorUnitAmount) : null;
    if (!selectedCatalogItemId || !Number.isFinite(quantity) || quantity <= 0 || (unitAmount !== null && (!Number.isFinite(unitAmount) || unitAmount < 0))) {
      setSelectorError("Select a catalog item and enter a valid quantity and unit amount.");
      return;
    }
    const source = opportunities.find((opportunity) => opportunity.catalogItemId === selectedCatalogItemId);
    setSavingAssociation(true);
    try {
      const created = await loopdevAdapter.crm.createCustomerProduct({
        organizationId: platformAdapter.getScope().organizationId,
        contactId,
        catalogItemId: selectedCatalogItemId,
        offerId: selectedOfferId || null,
        variantId: selectedVariantId || null,
        quantity,
        unitAmount,
        totalAmount: unitAmount === null ? null : unitAmount * quantity,
        currency: source?.currency ?? "EUR",
        sourceOpportunityId: source?.id ?? null,
        sourceLeadId: source?.leadId ?? null,
        status: selectorStatus,
      });
      setCustomerProducts((current) => [created, ...current]);
      onSelectorOpenChange(false);
      setSelectedCatalogItemId("");
      setSelectedOfferId("");
      setSelectedVariantId("");
      setSelectorQuery("");
    } catch (cause) {
      setSelectorError(cause instanceof Error ? cause.message : "Unable to associate the catalog item.");
    } finally {
      setSavingAssociation(false);
    }
  };
  useEffect(() => {
    if (!selectedItem) return;
    void Promise.all([
      localCatalogAdapter.listOffers({ organizationId: platformAdapter.getScope().organizationId, catalogItemId: selectedItem.id }),
      localCatalogAdapter.listVariants({ organizationId: platformAdapter.getScope().organizationId, catalogItemId: selectedItem.id }),
      localCatalogAdapter.listProductPartyRoles({ organizationId: platformAdapter.getScope().organizationId, catalogItemId: selectedItem.id }),
      localCatalogAdapter.listAvailabilities({ organizationId: platformAdapter.getScope().organizationId, catalogItemId: selectedItem.id }),
    ]).then(([offers, variants, roles, availability]) => setItemContext({ offers, variants, roles, availability }));
  }, [selectedItem]);
  if (!items.length) return <><EmptyState icon={Package} title="No associated products" description="Products, subscriptions, and services associated with this customer will appear here." /><AssociationDrawer /></>;
  const recordsFor = (item: CatalogItem) => opportunities.filter((opportunity) => opportunity.catalogItemId === item.id || opportunity.productKey === item.key);
  const linesFor = (item: CatalogItem) => opportunities.flatMap((opportunity) => opportunity.lines.filter((line) => line.catalogItemId === item.id || line.productKey === item.key));
  const quantityFor = (item: CatalogItem) => {
    const associations = associationFor(item);
    if (associations.length) return associations.reduce((total, association) => total + association.quantity, 0);
    const lines = linesFor(item);
    return lines.length ? lines.reduce((total, line) => total + line.quantity, 0) : "Not specified";
  };
  const amountFor = (item: CatalogItem) => {
    const associations = associationFor(item);
    if (associations.length) return { amount: associations.reduce((total, association) => total + (association.totalAmount ?? 0), 0), currency: associations[0].currency };
    const lines = linesFor(item);
    if (lines.length) return { amount: lines.reduce((total, line) => total + (line.totalAmount ?? 0), 0), currency: lines[0].currency };
    const primary = recordsFor(item)[0];
    return { amount: primary?.amount ?? null, currency: primary?.currency ?? null };
  };
  const formatAmount = (amount: number | null, currency: string | null) => amount === null ? "Quote required" : new Intl.NumberFormat(undefined, { style: "currency", currency: currency ?? "EUR", maximumFractionDigits: 0 }).format(amount);
  function AssociationDrawer() {
    return <AppDrawer open={selectorOpen} onOpenChange={onSelectorOpenChange} size="lg" layoutMode="expanded" responsive="auto" title="Associate product or service" eyebrow="Customer 360 / Catalog relationship" mode="New" description="Create a customer-specific association without changing the global catalog definition." dirty={false} footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onSelectorOpenChange(false)}>Cancel</Button><Button onClick={() => void submitAssociation()} loading={savingAssociation} disabled={savingAssociation}>Associate product</Button></div>}>
      <div className="space-y-4">
        {selectorError && <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{selectorError}</p>}
        <div><label className="text-sm font-medium" htmlFor="customer-product-search">Product or service</label><Input id="customer-product-search" value={selectorQuery} onChange={(event) => setSelectorQuery(event.target.value)} placeholder="Search catalog..." className="mt-1" /></div>
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-1">
          {visibleItems.map((item) => <button key={item.id} type="button" onClick={() => setSelectedCatalogItemId(item.id)} className={`w-full rounded-md px-3 py-2 text-left text-sm ${selectedCatalogItemId === item.id ? "bg-primary-soft text-primary" : "hover:bg-muted"}`}><span className="block font-medium">{item.name}</span><span className="font-mono text-xs text-muted-foreground">{item.key} · {item.type}</span></button>)}
          {!visibleItems.length && <p className="p-3 text-sm text-muted-foreground">No catalog items match the search.</p>}
        </div>
        {selectedCatalogItemId && <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="text-sm font-medium" htmlFor="customer-product-offer">Offer</label><select id="customer-product-offer" value={selectedOfferId} onChange={(event) => setSelectedOfferId(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"><option value="">No specific offer</option>{selectorOffers.map((offer) => <option key={offer.id} value={offer.id}>{offer.name}</option>)}</select></div>
          <div><label className="text-sm font-medium" htmlFor="customer-product-variant">Variant</label><select id="customer-product-variant" value={selectedVariantId} onChange={(event) => setSelectedVariantId(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"><option value="">No specific variant</option>{selectorVariants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}</select></div>
          <div><label className="text-sm font-medium" htmlFor="customer-product-quantity">Quantity</label><Input id="customer-product-quantity" type="number" min="1" value={selectorQuantity} onChange={(event) => setSelectorQuantity(event.target.value)} className="mt-1" /></div>
          <div><label className="text-sm font-medium" htmlFor="customer-product-unit-amount">Unit amount</label><Input id="customer-product-unit-amount" type="number" min="0" step="0.01" value={selectorUnitAmount} onChange={(event) => setSelectorUnitAmount(event.target.value)} placeholder="Optional" className="mt-1" /></div>
          <div><label className="text-sm font-medium" htmlFor="customer-product-status">Relationship status</label><select id="customer-product-status" value={selectorStatus} onChange={(event) => setSelectorStatus(event.target.value as CRMCustomerProduct["status"])} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm"><option value="interested">Interested</option><option value="quoted">Quoted</option><option value="active">Active</option><option value="ended">Ended</option></select></div>
        </div>}
      </div>
    </AppDrawer>;
  }
  return <><div className="space-y-3">{items.map((item) => { const records = recordsFor(item); const primary = records[0]; const amount = amountFor(item); const linkedLead = primary?.leadId ? leads.find((lead) => lead.id === primary.leadId) : undefined; return <button key={item.id} type="button" onClick={() => setSelectedItem(item)} className="w-full rounded-lg border border-border p-3 text-left transition hover:border-primary/40 hover:bg-card-muted/40"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{item.name}</p><p className="mt-0.5 font-mono text-xs text-muted-foreground">{item.key}</p></div><StatusBadge tone={item.status === "active" ? "success" : item.status === "draft" ? "warning" : "neutral"}>{item.status}</StatusBadge></div><div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs sm:grid-cols-4"><div><span className="block text-muted-foreground">Amount</span><span className="mt-0.5 block font-medium">{formatAmount(amount.amount, amount.currency)}</span></div><div><span className="block text-muted-foreground">Quantity</span><span className="mt-0.5 block font-medium">{quantityFor(item)}</span></div><div><span className="block text-muted-foreground">Associated</span><span className="mt-0.5 block font-medium">{associationFor(item)[0] ? formatDate(associationFor(item)[0].associatedAt) : primary ? formatDate(primary.createdAt) : "—"}</span></div><div><span className="block text-muted-foreground">Opportunity</span><span className="mt-0.5 block truncate font-medium">{primary?.name ?? "—"}</span></div></div>{linkedLead && <p className="mt-3 text-xs text-muted-foreground">Lead: <span className="font-medium text-foreground">{linkedLead.interest || linkedLead.id}</span></p>}</button>; })}</div><AssociationDrawer /><AppDrawer open={Boolean(selectedItem)} onOpenChange={(open) => { if (!open) setSelectedItem(null); }} size="lg" layoutMode="expanded" responsive="auto" title={selectedItem?.name ?? "Product detail"} eyebrow="Customer 360 / Associated catalog item" mode="Editing" headerMeta={selectedItem ? <StatusBadge tone={selectedItem.status === "active" ? "success" : selectedItem.status === "draft" ? "warning" : "neutral"} dot>{selectedItem.status}</StatusBadge> : undefined} description="Review the customer association and catalog context without leaving the customer workspace." dirty={false} footer={<div className="flex justify-between"><Button variant="outline" asChild><Link to={selectedItem ? `/app/erp/product-catalog/${selectedItem.catalogId ?? "catalog_products"}` : "/app/erp/product-catalog"}>Open catalog</Link></Button><Button variant="outline" onClick={() => setSelectedItem(null)}>Close</Button></div>}><div className="space-y-6">{selectedItem && <><section className="rounded-xl border border-border-strong/70 bg-card/70 p-4"><FormSectionHeader eyebrow="Customer association" title="Commercial relationship" description="The product or service context linked to this customer." mode="expanded" responsive="auto" /><dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm"><div><dt className="text-muted-foreground">Amount</dt><dd className="mt-1 font-medium">{formatAmount(amountFor(selectedItem).amount, amountFor(selectedItem).currency)}</dd></div><div><dt className="text-muted-foreground">Quantity</dt><dd className="mt-1 font-medium">{quantityFor(selectedItem)}</dd></div><div><dt className="text-muted-foreground">Associated date</dt><dd className="mt-1">{associationFor(selectedItem)[0] ? formatDate(associationFor(selectedItem)[0].associatedAt) : recordsFor(selectedItem)[0] ? formatDate(recordsFor(selectedItem)[0].createdAt) : "—"}</dd></div><div><dt className="text-muted-foreground">Expected close</dt><dd className="mt-1">{recordsFor(selectedItem)[0]?.expectedCloseAt ? formatDate(recordsFor(selectedItem)[0].expectedCloseAt as string) : "—"}</dd></div></dl><div className="mt-4 space-y-2">{recordsFor(selectedItem).map((record) => <div key={record.id} className="rounded-md bg-card-muted px-3 py-2 text-sm"><p className="font-medium">{record.name}</p><p className="mt-1 text-xs text-muted-foreground">Stage: {record.stageKey} · Opportunity: {record.id}{record.leadId ? ` · Lead: ${record.leadId}` : ""}</p></div>)}</div></section><section className="rounded-xl border border-border-strong/70 bg-card/70 p-4"><FormSectionHeader eyebrow="Catalog context" title="Product or service definition" description="Reference information from the global catalog." mode="expanded" responsive="auto" /><dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm"><div><dt className="text-muted-foreground">Key</dt><dd className="mt-1 font-mono">{selectedItem.key}</dd></div><div><dt className="text-muted-foreground">Type</dt><dd className="mt-1">{selectedItem.type}</dd></div><div><dt className="text-muted-foreground">Category</dt><dd className="mt-1">{selectedItem.categoryKey ?? "Uncategorized"}</dd></div><div><dt className="text-muted-foreground">SKU</dt><dd className="mt-1 font-mono">{selectedItem.sku || "Not applicable"}</dd></div></dl><p className="mt-4 text-sm text-muted-foreground">{selectedItem.description ?? "No description available."}</p></section><section className="rounded-xl border border-border-strong/70 bg-card/70 p-4"><FormSectionHeader eyebrow="Commercial context" title="Associated characteristics" description="Current catalog references available for this relationship." mode="expanded" responsive="auto" /><dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm"><div><dt className="text-muted-foreground">Provider / brand</dt><dd className="mt-1">{String(selectedItem.metadata.provider ?? selectedItem.metadata.brand ?? "Not specified")}</dd></div><div><dt className="text-muted-foreground">Reference price</dt><dd className="mt-1">{selectedItem.metadata.price ? `${String(selectedItem.metadata.price)} ${String(selectedItem.metadata.currency ?? "")}` : "Quote required"}</dd></div><div><dt className="text-muted-foreground">Offers</dt><dd className="mt-1">{itemContext.offers.length || "None configured"}</dd></div><div><dt className="text-muted-foreground">Variants</dt><dd className="mt-1">{itemContext.variants.length || "None configured"}</dd></div><div><dt className="text-muted-foreground">Availability</dt><dd className="mt-1">{itemContext.availability[0]?.markets.join(", ") || "Not specified"}</dd></div><div><dt className="text-muted-foreground">Participants</dt><dd className="mt-1">{itemContext.roles.map((role) => role.partyName).join(", ") || "None configured"}</dd></div></dl></section></>}</div></AppDrawer></>;
}
