import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Archive, ArrowLeft, Boxes, Copy, Edit, Package, Plus, RefreshCw, RotateCcw, SlidersHorizontal, Trash2, Wrench, X } from "lucide-react";
import { AppDrawer } from "@/components/platform";
import { ConfirmDialog, DataCard, DataTable, EmptyState, FormSectionHeader, LoadingState, PageContainer, PageHeader, SearchInput, StatusBadge, type DataTableColumn } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { localCatalogAdapter } from "@/loopdev/domains/catalog/adapter";
import { LOCAL_CATALOG_ORGANIZATION_ID } from "@/loopdev/domains/catalog/data/localCatalog";
import type { CatalogAvailability, CatalogEligibility, CatalogItem, CatalogItemCreateInput, CatalogVariant, Offer, OrganizationCatalog, PriceBook, PriceEntry, ProductPartyRole } from "@/loopdev/domains/catalog";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";

const itemTypeLabels: Record<CatalogItem["type"], string> = {
  physical_product: "Physical product", service: "Service", subscription: "Subscription",
  coverage: "Coverage", package: "Package", digital_product: "Digital product", fee: "Fee",
};
const serviceItemTypes: CatalogItem["type"][] = ["service", "subscription", "coverage", "package", "fee"];
const productItemTypes: CatalogItem["type"][] = ["physical_product", "digital_product", "package", "fee"];
const serviceChannels = ["Online", "Direct sales", "Partner / broker", "Branch / office", "Contact center"];
const productChannels = ["Ecommerce", "Retail", "Marketplace", "Wholesale", "Direct sales", "Partner"];
const catalogChannels = ["Online", "Direct sales", "Partner / broker", "Branch / office", "Contact center"];
const currencies = ["EUR", "USD", "GBP"];
const units = ["Unit", "Hour", "Month", "Year", "Treatment", "Policy"];

type CatalogForm = { name: string; key: string; kind: OrganizationCatalog["kind"]; description: string; currency: string; locale: string; channels: string[] };
type ItemForm = { name: string; key: string; sku: string; type: CatalogItem["type"]; categoryKey: string; brand: string; description: string; shortDescription: string; provider: string; performer: string; manufacturer: string; barcode: string; material: string; color: string; size: string; weight: string; dimensions: string; currency: string; unit: string; duration: string; price: string; pricingModel: "fixed_reference" | "from_price" | "quote_required" | "calculated_at_checkout"; billingPeriod: "one_time" | "monthly" | "quarterly" | "annual"; priceNote: string; billingModel: "one_time" | "recurring" | "usage"; status: CatalogItem["status"]; channels: string[]; markets: string; eligibility: string; validFrom: string; validTo: string; tags: string };

const emptyCatalogForm = (): CatalogForm => ({ name: "", key: "", kind: "products", description: "", currency: "EUR", locale: "es-ES", channels: ["Online", "Direct sales"] });
const emptyItemForm = (): ItemForm => ({ name: "", key: "", sku: "", type: "physical_product", categoryKey: "", brand: "", description: "", shortDescription: "", provider: "", performer: "", manufacturer: "", barcode: "", material: "", color: "", size: "", weight: "", dimensions: "", currency: "EUR", unit: "Unit", duration: "", price: "", pricingModel: "fixed_reference", billingPeriod: "one_time", priceNote: "", billingModel: "one_time", status: "draft", channels: ["Online", "Direct sales"], markets: "Spain", eligibility: "", validFrom: "", validTo: "", tags: "" });
const slugify = (value: string) => value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function ProductCatalog() {
  const { trail } = useBreadcrumbs();
  const navigate = useNavigate();
  const { catalogId } = useParams<{ catalogId: string }>();
  const [catalogs, setCatalogs] = useState<OrganizationCatalog[]>([]);
  const [selectedCatalog, setSelectedCatalog] = useState<OrganizationCatalog | null>(null);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | CatalogItem["status"]>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | CatalogItem["type"]>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [catalogDrawerOpen, setCatalogDrawerOpen] = useState(false);
  const [catalogForm, setCatalogForm] = useState<CatalogForm>(emptyCatalogForm);
  const [catalogKeyEdited, setCatalogKeyEdited] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyItemForm);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
  const [detailItem, setDetailItem] = useState<CatalogItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [catalogsError, setCatalogsError] = useState<string | null>(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const reloadCatalogs = () => {
    setCatalogsLoading(true);
    setCatalogsError(null);
    void localCatalogAdapter.listCatalogs({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID }).then((loadedCatalogs) => {
      setCatalogs(loadedCatalogs);
      setSelectedCatalog(catalogId ? loadedCatalogs.find((catalog) => catalog.id === catalogId) ?? null : null);
    }).catch((cause) => setCatalogsError(cause instanceof Error ? cause.message : "Unable to load catalogs.")).finally(() => setCatalogsLoading(false));
  };
  useEffect(reloadCatalogs, [catalogId]);
  useEffect(() => {
    if (!selectedCatalog) return;
    setItemsLoading(true);
    setItemsError(null);
    void localCatalogAdapter.listCatalogItems({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID, catalogId: selectedCatalog.id, includeArchived: true }).then(setItems).catch((cause) => setItemsError(cause instanceof Error ? cause.message : "Unable to load catalog items.")).finally(() => setItemsLoading(false));
  }, [selectedCatalog]);
  const visibleItems = useMemo(() => items.filter((item) => {
    const matchesQuery = !query.trim() || `${item.name} ${item.sku} ${item.key}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (status === "all" || item.status === status) && (typeFilter === "all" || item.type === typeFilter) && (categoryFilter === "all" || item.categoryKey === categoryFilter);
  }), [items, query, status, typeFilter, categoryFilter]);
  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.categoryKey).filter((value): value is string => Boolean(value)))).sort(), [items]);
  const availableTypes = selectedCatalog?.kind === "services" ? serviceItemTypes : productItemTypes;
  const hasActiveFilters = Boolean(query.trim()) || status !== "all" || typeFilter !== "all" || categoryFilter !== "all";
  const clearFilters = () => {
    setQuery("");
    setStatus("all");
    setTypeFilter("all");
    setCategoryFilter("all");
  };
  const columns: DataTableColumn<CatalogItem>[] = [
    { key: "name", header: selectedCatalog?.kind === "services" ? "Service" : "Product", sortable: true, cell: (item) => <div><p className="font-medium text-foreground">{item.name}</p><p className="font-mono text-xs text-muted-foreground">{item.sku || item.key}</p></div> },
    { key: "type", header: "Type", sortable: true, cell: (item) => itemTypeLabels[item.type] },
    { key: "categoryKey", header: "Category", cell: (item) => item.categoryKey ?? "Uncategorized" },
    { key: "status", header: "Status", sortable: true, cell: (item) => <StatusBadge tone={item.status === "active" ? "success" : item.status === "draft" ? "warning" : "neutral"} dot>{item.status}</StatusBadge> },
  ];
  const toggleChannel = (target: "catalog" | "item", channel: string) => {
    if (target === "catalog") setCatalogForm((current) => ({ ...current, channels: current.channels.includes(channel) ? current.channels.filter((value) => value !== channel) : [...current.channels, channel] }));
    else setForm((current) => ({ ...current, channels: current.channels.includes(channel) ? current.channels.filter((value) => value !== channel) : [...current.channels, channel] }));
  };
  const createCatalog = async () => {
    if (!catalogForm.name.trim()) return;
    await localCatalogAdapter.createCatalog({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID, key: catalogForm.key || catalogForm.name, name: catalogForm.name, kind: catalogForm.kind, description: catalogForm.description, metadata: { currency: catalogForm.currency, locale: catalogForm.locale, channels: catalogForm.channels } });
    setCatalogForm(emptyCatalogForm()); setCatalogKeyEdited(false); setCatalogDrawerOpen(false); reloadCatalogs();
  };
  const createItem = async () => {
    if (!form.name.trim() || !selectedCatalog) return;
    setItemError(null);
    try {
      const serviceKey = form.key.trim() || slugify(form.name);
      const input: CatalogItemCreateInput = {
        organizationId: LOCAL_CATALOG_ORGANIZATION_ID, catalogId: selectedCatalog.id, key: selectedCatalog.kind === "services" ? serviceKey : (form.key || form.name), sku: selectedCatalog.kind === "services" ? "" : form.sku, name: form.name,
        type: form.type, status: form.status,
        description: form.description, categoryKey: form.categoryKey,
        metadata: { shortDescription: form.shortDescription, brand: form.brand, provider: form.provider, performer: form.performer, manufacturer: form.manufacturer, barcode: form.barcode, material: form.material, color: form.color, size: form.size, weight: form.weight || null, dimensions: form.dimensions, currency: form.currency, unit: form.unit, duration: form.duration || null, price: form.price ? Number(form.price) : null, pricingModel: form.pricingModel, billingPeriod: form.billingPeriod, priceNote: form.priceNote, billingModel: form.billingModel, status: form.status, channels: form.channels, markets: form.markets, eligibility: form.eligibility, validFrom: form.validFrom || null, validTo: form.validTo || null, tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) },
      };
      if (editingItem) await localCatalogAdapter.updateCatalogItem(editingItem.id, { organizationId: LOCAL_CATALOG_ORGANIZATION_ID }, input);
      else await localCatalogAdapter.createCatalogItem(input);
      setForm(emptyItemForm()); setEditingItem(null); setDrawerOpen(false);
      void localCatalogAdapter.listCatalogItems({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID, catalogId: selectedCatalog.id, includeArchived: true }).then(setItems);
    } catch (cause) {
      setItemError(cause instanceof Error ? cause.message : "Unable to save the service.");
    }
  };
  const openItemEditor = (item: CatalogItem) => {
    const metadata = item.metadata;
    setActionError(null);
    setEditingItem(item);
    setForm({
      ...emptyItemForm(),
      name: item.name,
      key: item.key,
      sku: item.sku,
      type: item.type,
      categoryKey: item.categoryKey ?? "",
      description: item.description ?? "",
      shortDescription: typeof metadata.shortDescription === "string" ? metadata.shortDescription : "",
      brand: typeof metadata.brand === "string" ? metadata.brand : "",
      provider: typeof metadata.provider === "string" ? metadata.provider : "",
      performer: typeof metadata.performer === "string" ? metadata.performer : "",
      manufacturer: typeof metadata.manufacturer === "string" ? metadata.manufacturer : "",
      barcode: typeof metadata.barcode === "string" ? metadata.barcode : "",
      material: typeof metadata.material === "string" ? metadata.material : "",
      color: typeof metadata.color === "string" ? metadata.color : "",
      size: typeof metadata.size === "string" ? metadata.size : "",
      weight: typeof metadata.weight === "string" ? metadata.weight : "",
      dimensions: typeof metadata.dimensions === "string" ? metadata.dimensions : "",
      currency: typeof metadata.currency === "string" ? metadata.currency : "EUR",
      unit: typeof metadata.unit === "string" ? metadata.unit : "Unit",
      duration: typeof metadata.duration === "string" ? metadata.duration : "",
      price: typeof metadata.price === "number" ? String(metadata.price) : "",
      pricingModel: metadata.pricingModel === "from_price" || metadata.pricingModel === "quote_required" || metadata.pricingModel === "calculated_at_checkout" ? metadata.pricingModel : "fixed_reference",
      billingPeriod: metadata.billingPeriod === "monthly" || metadata.billingPeriod === "quarterly" || metadata.billingPeriod === "annual" ? metadata.billingPeriod : "one_time",
      priceNote: typeof metadata.priceNote === "string" ? metadata.priceNote : "",
      billingModel: metadata.billingModel === "recurring" || metadata.billingModel === "usage" ? metadata.billingModel : "one_time",
      status: item.status,
      channels: Array.isArray(metadata.channels) ? metadata.channels.filter((value): value is string => typeof value === "string") : [],
      markets: typeof metadata.markets === "string" ? metadata.markets : "",
      eligibility: typeof metadata.eligibility === "string" ? metadata.eligibility : "",
      validFrom: typeof metadata.validFrom === "string" ? metadata.validFrom : "",
      validTo: typeof metadata.validTo === "string" ? metadata.validTo : "",
      tags: Array.isArray(metadata.tags) ? metadata.tags.filter((value): value is string => typeof value === "string").join(", ") : "",
    });
    setDrawerOpen(true);
  };
  const duplicateItem = (item: CatalogItem) => {
    openItemEditor(item);
    setEditingItem(null);
    setForm((current) => ({ ...current, name: `${current.name} copy`, key: `${current.key}-copy`, sku: current.sku ? `${current.sku}-COPY` : "" }));
  };
  const archiveItem = async (item: CatalogItem) => {
    try {
      await localCatalogAdapter.updateCatalogItem(item.id, { organizationId: LOCAL_CATALOG_ORGANIZATION_ID }, { status: item.status === "archived" ? "draft" : "archived" });
      if (selectedCatalog) void localCatalogAdapter.listCatalogItems({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID, catalogId: selectedCatalog.id, includeArchived: true }).then(setItems);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to update catalog item.");
    }
  };
  const deleteItem = async () => {
    if (!deleteTarget) return;
    try {
      await localCatalogAdapter.deleteCatalogItem(deleteTarget.id, { organizationId: LOCAL_CATALOG_ORGANIZATION_ID });
      setDeleteTarget(null);
      if (selectedCatalog) void localCatalogAdapter.listCatalogItems({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID, catalogId: selectedCatalog.id, includeArchived: true }).then(setItems);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to delete catalog item.");
    }
  };
  const openItemDrawer = () => {
    const isServiceCatalog = selectedCatalog?.kind === "services";
    setForm({ ...emptyItemForm(), type: isServiceCatalog ? "service" : "physical_product", channels: isServiceCatalog ? ["Online", "Direct sales"] : ["Ecommerce", "Direct sales"] });
    setDrawerOpen(true);
  };

  if (catalogsLoading) return <PageContainer width="wide"><LoadingState label="Loading product catalogs…" /></PageContainer>;
  if (catalogsError) return <PageContainer width="narrow"><EmptyState icon={AlertTriangle} title="Unable to load product catalogs" description={catalogsError} action={<Button onClick={reloadCatalogs}><RefreshCw className="me-1.5 h-3.5 w-3.5" />Try again</Button>} /></PageContainer>;
  if (catalogId && !selectedCatalog) return <PageContainer width="narrow"><EmptyState icon={AlertTriangle} title="Catalog not found" description="This catalog does not exist, is archived, or is not available in the active organization." action={<Button asChild><Link to="/app/erp/product-catalog">Back to catalogs</Link></Button>} /></PageContainer>;
  if (!selectedCatalog) return (
    <PageContainer width="wide">
      <PageHeader title="Product Catalog" description="Create and manage the company catalogs that organize products and services." breadcrumbs={trail.length ? trail : [{ label: "ERP" }, { label: "Product Catalog" }]} />
      <div className="mb-6 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{catalogs.length} catalogs available in this organization.</p><Button onClick={() => setCatalogDrawerOpen(true)}><Plus className="me-2 h-4 w-4" />Create catalog</Button></div>
      {catalogs.length ? <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">{catalogs.map((catalog) => { const isProducts = catalog.kind === "products"; const Icon = isProducts ? Package : Wrench; const metadataCurrency = typeof catalog.metadata.currency === "string" ? catalog.metadata.currency : "EUR"; const channelCount = Array.isArray(catalog.metadata.channels) ? catalog.metadata.channels.length : 0; return <article key={catalog.id} className="group flex min-h-[280px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg"><button type="button" onClick={() => navigate(`/app/erp/product-catalog/${catalog.id}`)} className={`relative flex h-32 items-center justify-between overflow-hidden px-5 text-left ${isProducts ? "bg-gradient-to-br from-primary-soft via-info-soft to-accent-soft" : "bg-gradient-to-br from-accent-soft via-primary-soft to-warning-soft"}`}><div className="absolute -right-8 -top-12 h-40 w-40 rounded-full border-[18px] border-white/20" /><div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/60 bg-white/70 text-primary shadow-sm"><Icon className="h-6 w-6" /></div><span className="relative rounded-full border border-white/70 bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground/70">{catalog.kind}</span></button><div className="flex flex-1 flex-col p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{catalog.key}</p><h2 className="mt-1 font-display text-lg font-semibold text-foreground">{catalog.name}</h2></div><StatusBadge tone={catalog.status === "active" ? "success" : catalog.status === "draft" ? "warning" : "neutral"} dot>{catalog.status}</StatusBadge></div><p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted-foreground">{catalog.description || "No description provided."}</p><div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 text-xs"><div><span className="block text-muted-foreground">Currency</span><span className="mt-0.5 block font-medium text-foreground">{metadataCurrency}</span></div><div><span className="block text-muted-foreground">Sales channels</span><span className="mt-0.5 block font-medium text-foreground">{channelCount || "Not set"}</span></div></div><button type="button" onClick={() => navigate(`/app/erp/product-catalog/${catalog.id}`)} className="mt-4 inline-flex items-center text-xs font-semibold text-primary transition group-hover:gap-1.5">Open catalog <span aria-hidden="true" className="ml-1">→</span></button></div></article>; })}</div> : <EmptyState icon={Boxes} title="No company catalogs" description="Create a products or services catalog to begin organizing your commercial master data." />}
      <CatalogDrawer open={catalogDrawerOpen} form={catalogForm} setForm={setCatalogForm} keyEdited={catalogKeyEdited} onKeyEdited={() => setCatalogKeyEdited(true)} toggleChannel={(channel) => toggleChannel("catalog", channel)} onOpenChange={(open) => { setCatalogDrawerOpen(open); if (!open) setCatalogKeyEdited(false); }} onCreate={() => void createCatalog()} />
    </PageContainer>
  );
  return (
    <PageContainer width="wide">
      <PageHeader title={selectedCatalog.name} description={selectedCatalog.description ?? `Manage ${selectedCatalog.kind === "services" ? "services" : "products"}, variants and commercial offers.`} breadcrumbs={trail.length ? [...trail, { label: selectedCatalog.name }] : [{ label: "ERP" }, { label: "Product Catalog" }, { label: selectedCatalog.name }]} actions={<Button onClick={openItemDrawer}><Plus className="me-2 h-4 w-4" />New {selectedCatalog.kind === "services" ? "service" : "product"}</Button>} />
      <div className="mb-4 flex min-w-0 flex-row flex-nowrap items-center gap-2 overflow-x-auto pb-1"><Button variant="ghost" className="shrink-0" onClick={() => { setSelectedCatalog(null); navigate("/app/erp/product-catalog"); }}><ArrowLeft className="me-2 h-4 w-4" />All catalogs</Button><div className="min-w-[240px] flex-1"><SearchInput value={query} onValueChange={setQuery} placeholder={`Search ${selectedCatalog.kind === "services" ? "services" : "products"}`} /></div><div className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground"><SlidersHorizontal className="h-3.5 w-3.5" /><span>Filters</span></div><Select value={status} onValueChange={(value) => setStatus(value as typeof status)}><SelectTrigger aria-label="Filter by status" className="w-36 shrink-0"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select><Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as typeof typeFilter)}><SelectTrigger aria-label={`Filter ${selectedCatalog.kind === "services" ? "services" : "products"} by type`} className="w-40 shrink-0"><SelectValue placeholder="Type" /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem>{availableTypes.map((value) => <SelectItem key={value} value={value}>{itemTypeLabels[value]}</SelectItem>)}</SelectContent></Select><Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger aria-label="Filter by category" className="w-40 shrink-0"><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select>{hasActiveFilters && <Button type="button" variant="ghost" size="sm" className="shrink-0 text-muted-foreground" onClick={clearFilters}><X className="me-1 h-3.5 w-3.5" />Clear</Button>}</div>
      {itemsError ? <div role="alert" className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive flex items-center justify-between">{itemsError}<Button size="sm" variant="outline" onClick={() => { setSelectedCatalog({ ...selectedCatalog }); }}>Retry</Button></div> : itemsLoading ? <LoadingState label="Loading catalog items…" /> : <DataCard title={`${visibleItems.length} ${selectedCatalog.kind === "services" ? "services" : "products"}`} description={`Use variants, offers and party roles to enrich each ${selectedCatalog.kind === "services" ? "service" : "product"}.`} flush><DataTable<CatalogItem> data={visibleItems} columns={columns} onRowClick={setDetailItem} rowActions={[{ label: "Edit", icon: Edit, onClick: openItemEditor }, { label: "Duplicate", icon: Copy, onClick: duplicateItem }, { label: "Archive", icon: Archive, hidden: (item) => item.status === "archived", onClick: (item) => void archiveItem(item) }, { label: "Restore", icon: RotateCcw, hidden: (item) => item.status !== "archived", onClick: (item) => void archiveItem(item) }, { label: "Delete", icon: Trash2, destructive: true, separator: true, onClick: (item) => setDeleteTarget(item) }]} initialSort={{ key: "name", dir: "asc" }} emptyTitle={`No ${selectedCatalog.kind === "services" ? "services" : "products"} found`} emptyDescription="Create an entry or adjust the current search and filters." /></DataCard>}
      <ItemDrawer open={drawerOpen} editingItem={editingItem} form={form} setForm={setForm} error={itemError} selectedCatalog={selectedCatalog} toggleChannel={(channel) => toggleChannel("item", channel)} onOpenChange={(open) => { setDrawerOpen(open); if (!open) { setItemError(null); setEditingItem(null); } }} onCreate={() => void createItem()} />
      <CatalogItemDetailDrawer item={detailItem} onOpenChange={(open) => { if (!open) setDetailItem(null); }} />
      {actionError && <p role="alert" className="mt-3 rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">{actionError}</p>}
      <ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }} title="Delete catalog item?" description={deleteTarget ? `${deleteTarget.name} will be permanently removed from this local catalog.` : undefined} confirmLabel="Delete" tone="destructive" onConfirm={() => void deleteItem()} />
    </PageContainer>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return <label className="space-y-1.5 text-sm font-medium">{label}{required && <span className="ml-1 text-destructive">*</span>}{children}</label>;
}
function ChannelList({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (channel: string) => void }) {
  return <div className="grid gap-2 sm:grid-cols-3">{options.map((channel) => <label key={channel} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-normal"><Checkbox checked={selected.includes(channel)} onCheckedChange={() => onToggle(channel)} />{channel}</label>)}</div>;
}
function DrawerShell({ children, ...props }: React.ComponentProps<typeof AppDrawer>) {
  return <AppDrawer {...props} size="lg" layoutMode="expanded" responsive="auto" confirmOnClose>{children}</AppDrawer>;
}
function CatalogItemDetailDrawer({ item, onOpenChange }: { item: CatalogItem | null; onOpenChange: (open: boolean) => void }) {
  const [managementOpen, setManagementOpen] = useState(false);
  const [roles, setRoles] = useState<ProductPartyRole[]>([]);
  const [availability, setAvailability] = useState<CatalogAvailability[]>([]);
  const [eligibility, setEligibility] = useState<CatalogEligibility[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [prices, setPrices] = useState<PriceEntry[]>([]);
  useEffect(() => {
    if (!item) return;
    void Promise.all([
      localCatalogAdapter.listProductPartyRoles({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID, catalogItemId: item.id }),
      localCatalogAdapter.listAvailabilities({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID, catalogItemId: item.id }),
      localCatalogAdapter.listEligibilities({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID, catalogItemId: item.id }),
      localCatalogAdapter.listOffers({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID, catalogItemId: item.id }),
      localCatalogAdapter.listVariants({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID, catalogItemId: item.id }),
      localCatalogAdapter.listPriceEntries({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID }),
    ]).then(([nextRoles, nextAvailability, nextEligibility, nextOffers, nextVariants, nextPrices]) => {
      setRoles(nextRoles);
      setAvailability(nextAvailability);
      setEligibility(nextEligibility);
      setOffers(nextOffers);
      setVariants(nextVariants);
      setPrices(nextPrices.filter((price) => price.catalogItemId === item.id || nextOffers.some((offer) => offer.id === price.offerId)));
    });
  }, [item]);
  if (!item) return null;
  return <DrawerShell open={Boolean(item)} onOpenChange={onOpenChange} title={item.name} eyebrow="Catalog detail" mode="Editing" headerMeta={<StatusBadge tone={item.status === "active" ? "success" : item.status === "draft" ? "warning" : "neutral"} dot>{item.status}</StatusBadge>} description={item.description ?? "Catalog item details and commercial context."} dirty={false} footer={<div className="flex justify-end"><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button></div>}>
    <div className="space-y-6">
      <section className="rounded-xl border border-border-strong/70 bg-card/70 p-4"><FormSectionHeader eyebrow="Identity" title="Catalog identity" description="Stable references used by downstream ERP and CRM consumers." mode="expanded" responsive="auto" /><dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm"><div><dt className="text-muted-foreground">Key</dt><dd className="mt-1 font-mono">{item.key}</dd></div><div><dt className="text-muted-foreground">SKU</dt><dd className="mt-1 font-mono">{item.sku || "Not applicable"}</dd></div><div><dt className="text-muted-foreground">Type</dt><dd className="mt-1">{itemTypeLabels[item.type]}</dd></div><div><dt className="text-muted-foreground">Category</dt><dd className="mt-1">{item.categoryKey ?? "Uncategorized"}</dd></div></dl></section>
      <section className="rounded-xl border border-border-strong/70 bg-card/70 p-4"><FormSectionHeader eyebrow="Commercial context" title="Participants and eligibility" description="Normalized service context available to consumers without reading metadata directly." mode="expanded" responsive="auto" /><div className="mt-4 space-y-3 text-sm">{roles.length ? roles.map((role) => <div key={role.id} className="flex items-center justify-between border-b border-border pb-2"><span className="capitalize text-muted-foreground">{role.role}</span><span className="font-medium">{role.partyName}</span></div>) : <p className="text-muted-foreground">No party roles configured.</p>}{eligibility.map((rule) => <div key={rule.id} className="rounded-md bg-card-muted px-3 py-2"><p className="font-medium">{rule.ruleKey}</p><p className="mt-1 text-muted-foreground">{rule.description}</p></div>)}</div></section>
      <section className="rounded-xl border border-border-strong/70 bg-card/70 p-4"><div className="flex items-start justify-between gap-3"><FormSectionHeader eyebrow="Commercial context" title="Offers, variants and prices" description="Commercial configurations remain separate from the stable catalog item." mode="expanded" responsive="auto" /><Button size="sm" variant="outline" onClick={() => setManagementOpen(true)}><Edit className="me-1.5 h-3.5 w-3.5" />Manage</Button></div><div className="mt-4 space-y-3 text-sm">{offers.length ? offers.map((offer) => <div key={offer.id} className="flex items-center justify-between border-b border-border pb-2"><span><span className="block font-medium">{offer.name}</span><span className="text-xs text-muted-foreground">{offer.billingModel} · {offer.currency}</span></span><span className="text-xs text-muted-foreground">{prices.find((price) => price.offerId === offer.id)?.amount ?? "Quote"}</span></div>) : <p className="text-muted-foreground">No offers configured.</p>}{variants.length > 0 && <p className="text-muted-foreground">{variants.length} variant{variants.length === 1 ? "" : "s"} configured.</p>}</div></section>
      <section className="rounded-xl border border-border-strong/70 bg-card/70 p-4"><FormSectionHeader eyebrow="Participants and eligibility" title="Roles and eligibility" description="Normalized service context available to consumers without reading metadata directly." mode="expanded" responsive="auto" /><div className="mt-4 space-y-3 text-sm">{roles.length ? roles.map((role) => <div key={role.id} className="flex items-center justify-between border-b border-border pb-2"><span className="capitalize text-muted-foreground">{role.role}</span><span className="font-medium">{role.partyName}</span></div>) : <p className="text-muted-foreground">No party roles configured.</p>}{eligibility.map((rule) => <div key={rule.id} className="rounded-md bg-card-muted px-3 py-2"><p className="font-medium">{rule.ruleKey}</p><p className="mt-1 text-muted-foreground">{rule.description}</p></div>)}</div></section>
      <section className="rounded-xl border border-border-strong/70 bg-card/70 p-4"><FormSectionHeader eyebrow="Availability" title="Commercial availability" description="Channels and markets where this item can currently be offered." mode="expanded" responsive="auto" />{availability.length ? <div className="mt-4 space-y-3 text-sm">{availability.map((entry) => <div key={entry.id}><div className="flex flex-wrap gap-2">{entry.channels.map((channel) => <span key={channel} className="rounded-full bg-primary-soft px-2.5 py-1 text-xs">{channel}</span>)}</div><p className="mt-2 text-muted-foreground">Markets: {entry.markets.join(", ") || "Not specified"}</p></div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">No availability rules configured.</p>}</section>
    </div>
    <CatalogCommercialManager item={item} open={managementOpen} onOpenChange={setManagementOpen} />;
  </DrawerShell>;
}

function CatalogCommercialManager({ item, open, onOpenChange }: { item: CatalogItem; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [section, setSection] = useState<"offers" | "variants" | "priceBooks">("offers");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [priceBooks, setPriceBooks] = useState<PriceBook[]>([]);
  const [priceEntries, setPriceEntries] = useState<PriceEntry[]>([]);
  const [selectedPriceBookId, setSelectedPriceBookId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [status, setStatus] = useState<CatalogItem["status"]>("draft");
  const [billingModel, setBillingModel] = useState<Offer["billingModel"]>("one_time");
  const [unit, setUnit] = useState("Unit");
  const [sku, setSku] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryUnit, setEntryUnit] = useState("Unit");
  const [entryEditingId, setEntryEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "offer" | "variant" | "priceBook" | "priceEntry"; id: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = () => {
    void Promise.all([
      localCatalogAdapter.listOffers({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID, catalogItemId: item.id, includeArchived: true }),
      localCatalogAdapter.listVariants({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID, catalogItemId: item.id, includeArchived: true }),
      localCatalogAdapter.listPriceBooks({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID, includeArchived: true }),
    ]).then(([nextOffers, nextVariants, nextPriceBooks]) => { setOffers(nextOffers); setVariants(nextVariants); setPriceBooks(nextPriceBooks); if (!selectedPriceBookId && nextPriceBooks[0]) setSelectedPriceBookId(nextPriceBooks[0].id); });
  };
  useEffect(() => { if (open) reload(); }, [open, item.id]);
  useEffect(() => {
    if (!selectedPriceBookId) { setPriceEntries([]); return; }
    void localCatalogAdapter.listPriceEntries({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID, priceBookId: selectedPriceBookId, includeArchived: true }).then((entries) => setPriceEntries(entries.filter((entry) => entry.catalogItemId === item.id)));
  }, [selectedPriceBookId, item.id]);
  const reset = () => { setEditingId(null); setName(""); setKey(""); setCurrency("EUR"); setStatus("draft"); setBillingModel("one_time"); setUnit("Unit"); setSku(""); setEntryAmount(""); setEntryUnit("Unit"); setEntryEditingId(null); setError(null); };
  const save = async () => {
    if (!name.trim() || !key.trim()) { setError("Name and technical key are required."); return; }
    setError(null);
    try {
      if (section === "offers") {
        const patch = { organizationId: LOCAL_CATALOG_ORGANIZATION_ID, workspaceId: null, catalogItemId: item.id, key, name, status, billingModel, currency, unit, validFrom: null, validTo: null, metadata: {} };
        if (editingId) await localCatalogAdapter.updateOffer(editingId, { organizationId: LOCAL_CATALOG_ORGANIZATION_ID }, patch);
        else await localCatalogAdapter.createOffer(patch);
      } else if (section === "variants") {
        const patch = { organizationId: LOCAL_CATALOG_ORGANIZATION_ID, workspaceId: null, catalogItemId: item.id, key, sku, name, status, attributes: {}, metadata: {} };
        if (editingId) await localCatalogAdapter.updateVariant(editingId, { organizationId: LOCAL_CATALOG_ORGANIZATION_ID }, patch);
        else await localCatalogAdapter.createVariant(patch);
      } else {
        const patch = { organizationId: LOCAL_CATALOG_ORGANIZATION_ID, workspaceId: null, key, name, currency, status, validFrom: null, validTo: null, visibility: { organizationId: LOCAL_CATALOG_ORGANIZATION_ID, workspaceId: null } };
        if (editingId) await localCatalogAdapter.updatePriceBook(editingId, { organizationId: LOCAL_CATALOG_ORGANIZATION_ID }, patch);
        else await localCatalogAdapter.createPriceBook(patch);
      }
      reset(); reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save commercial configuration."); }
  };
  const edit = (record: Offer | CatalogVariant | PriceBook) => {
    setEditingId(record.id); setName(record.name); setKey(record.key); setStatus(record.status); setCurrency("currency" in record ? record.currency : "EUR"); setBillingModel("billingModel" in record ? record.billingModel : "one_time"); setUnit("unit" in record ? record.unit : "Unit"); setSku("sku" in record ? record.sku : ""); setError(null);
  };
  const remove = async (id: string, kind = section === "offers" ? "offer" : section === "variants" ? "variant" : "priceBook") => {
    try {
      if (kind === "offer") await localCatalogAdapter.deleteOffer(id, { organizationId: LOCAL_CATALOG_ORGANIZATION_ID });
      else if (kind === "variant") await localCatalogAdapter.deleteVariant(id, { organizationId: LOCAL_CATALOG_ORGANIZATION_ID });
      else if (kind === "priceBook") await localCatalogAdapter.deletePriceBook(id, { organizationId: LOCAL_CATALOG_ORGANIZATION_ID });
      else await localCatalogAdapter.deletePriceEntry(id, { organizationId: LOCAL_CATALOG_ORGANIZATION_ID });
      reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to delete commercial configuration."); }
  };
  const saveEntry = async () => {
    const amount = Number(entryAmount);
    if (!selectedPriceBookId || !Number.isFinite(amount) || amount < 0) { setError("Select a price book and enter a valid amount."); return; }
    const input = { organizationId: LOCAL_CATALOG_ORGANIZATION_ID, workspaceId: null, priceBookId: selectedPriceBookId, catalogItemId: item.id, offerId: null, variantId: null, amount, currency, unit: entryUnit, status, minQuantity: null, maxQuantity: null, validFrom: null, validTo: null };
    try {
      if (entryEditingId) await localCatalogAdapter.updatePriceEntry(entryEditingId, { organizationId: LOCAL_CATALOG_ORGANIZATION_ID }, input);
      else await localCatalogAdapter.createPriceEntry(input);
      setEntryAmount(""); setEntryEditingId(null); setError(null);
      const entries = await localCatalogAdapter.listPriceEntries({ organizationId: LOCAL_CATALOG_ORGANIZATION_ID, priceBookId: selectedPriceBookId, includeArchived: true });
      setPriceEntries(entries.filter((entry) => entry.catalogItemId === item.id));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save price entry."); }
  };
  const records = section === "offers" ? offers : section === "variants" ? variants : priceBooks;
  return <DrawerShell open={open} onOpenChange={onOpenChange} title={`Manage ${item.name}`} eyebrow="ERP / Commercial configuration" mode="Editing" description="Create, edit, duplicate or remove the commercial records associated with this catalog item." dirty={false} footer={<div className="flex justify-end"><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button></div>}>
    <div className="space-y-5">
      <div className="flex gap-1 rounded-md bg-muted p-1">{(["offers", "variants", "priceBooks"] as const).map((value) => <button key={value} type="button" onClick={() => { setSection(value); reset(); }} className={`flex-1 rounded px-3 py-2 text-sm ${section === value ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}>{value === "priceBooks" ? "Price books" : value[0].toUpperCase() + value.slice(1)}</button>)}</div>
      {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
      <div className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"><Field label="Name" required><Input value={name} onChange={(event) => setName(event.target.value)} /></Field><Field label="Technical key" required><Input value={key} onChange={(event) => setKey(event.target.value)} /></Field>{section !== "variants" && <Field label="Currency"><Input value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} /></Field>}{section === "offers" && <><Field label="Billing model"><Select value={billingModel} onValueChange={(value) => setBillingModel(value as Offer["billingModel"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="one_time">One time</SelectItem><SelectItem value="recurring">Recurring</SelectItem><SelectItem value="usage">Usage</SelectItem></SelectContent></Select></Field><Field label="Unit"><Input value={unit} onChange={(event) => setUnit(event.target.value)} /></Field></>}{section === "variants" && <Field label="SKU"><Input value={sku} onChange={(event) => setSku(event.target.value)} /></Field>}<Field label="Status"><Select value={status} onValueChange={(value) => setStatus(value as CatalogItem["status"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></Field><div className="flex items-end gap-2 sm:col-span-2"><Button onClick={() => void save()}>{editingId ? "Save changes" : `Create ${section === "priceBooks" ? "price book" : section.slice(0, -1)}`}</Button>{editingId && <Button variant="ghost" onClick={reset}>Cancel edit</Button>}</div></div>
      <div className="space-y-2">{records.length ? records.map((record) => <div key={record.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"><div><p className="font-medium">{record.name}</p><p className="font-mono text-xs text-muted-foreground">{record.key} · {record.status}</p></div><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => edit(record)}>Edit</Button><Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget({ kind: section === "offers" ? "offer" : section === "variants" ? "variant" : "priceBook", id: record.id, name: record.name })}>Delete</Button></div></div>) : <p className="text-sm text-muted-foreground">No records configured.</p>}</div>
      {section === "priceBooks" && <section className="space-y-3 rounded-lg border border-border p-4"><div className="flex items-center justify-between gap-2"><div><p className="font-medium">Price entries</p><p className="text-xs text-muted-foreground">Define the amount for this catalog item in the selected price book.</p></div><select aria-label="Price book for entries" value={selectedPriceBookId} onChange={(event) => setSelectedPriceBookId(event.target.value)} className="h-8 max-w-[48%] rounded-md border border-input bg-background px-2 text-xs"><option value="">Select price book</option>{priceBooks.map((book) => <option key={book.id} value={book.id}>{book.name}</option>)}</select></div><div className="grid gap-3 sm:grid-cols-3"><Field label="Amount"><Input type="number" min="0" step="0.01" value={entryAmount} onChange={(event) => setEntryAmount(event.target.value)} /></Field><Field label="Unit"><Input value={entryUnit} onChange={(event) => setEntryUnit(event.target.value)} /></Field><div className="flex items-end"><Button onClick={() => void saveEntry()} disabled={!selectedPriceBookId}>{entryEditingId ? "Save entry" : "Add entry"}</Button></div></div><div className="space-y-2">{priceEntries.map((entry) => <div key={entry.id} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"><span>{entry.amount} {entry.currency} · {entry.unit}</span><span className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => { setEntryEditingId(entry.id); setEntryAmount(String(entry.amount)); setEntryUnit(entry.unit); setCurrency(entry.currency); }}>Edit</Button><Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget({ kind: "priceEntry", id: entry.id, name: `${entry.amount} ${entry.currency}` })}>Delete</Button></span></div>)}</div></section>}
    </div>
    <ConfirmDialog open={Boolean(deleteTarget)} onOpenChange={(nextOpen) => { if (!nextOpen) setDeleteTarget(null); }} title="Delete commercial configuration?" description={deleteTarget ? `${deleteTarget.name} will be permanently removed from this local catalog.` : undefined} confirmLabel="Delete" tone="destructive" onConfirm={() => { if (!deleteTarget) return; void remove(deleteTarget.id, deleteTarget.kind).then(() => setDeleteTarget(null)); }} />
  </DrawerShell>;
}
function CatalogDrawer({ open, form, setForm, keyEdited, onKeyEdited, toggleChannel, onOpenChange, onCreate }: { open: boolean; form: CatalogForm; setForm: React.Dispatch<React.SetStateAction<CatalogForm>>; keyEdited: boolean; onKeyEdited: () => void; toggleChannel: (channel: string) => void; onOpenChange: (open: boolean) => void; onCreate: () => void }) {
  return <DrawerShell open={open} onOpenChange={onOpenChange} title="Create company catalog" eyebrow="ERP / Catalog" mode="New" headerMeta={<span>Catalog setup</span>} description="Set the commercial scope and governance for a reusable company catalog." dirty={() => Boolean(form.name || form.description || form.key)} confirmTitle="Discard catalog changes?" confirmDescription="Your unsaved catalog details will be lost." onDiscard={() => setForm(emptyCatalogForm())} footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={onCreate} disabled={!form.name.trim()}>Create catalog</Button></div>}>
    <form className="loopdev-form space-y-6" onSubmit={(event) => { event.preventDefault(); onCreate(); }}>
      <section className="space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs"><FormSectionHeader eyebrow="Identity" title="Catalog details" description="Define how this catalog is identified and used." mode="expanded" responsive="auto" meta={<span>Required</span>} /><div className="grid gap-4 sm:grid-cols-2"><Field label="Catalog name" required><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, key: keyEdited ? current.key : slugify(event.target.value) }))} placeholder="e.g. Health insurance products" /></Field><Field label="Technical key" required><Input value={form.key} onChange={(event) => { onKeyEdited(); setForm((current) => ({ ...current, key: slugify(event.target.value) })); }} placeholder="health-insurance-products" /><p className="text-xs font-normal text-muted-foreground">{keyEdited ? "Custom key — it will not be overwritten." : "Generated from the catalog name. You can edit it if needed."}</p></Field><Field label="Catalog type" required><Select value={form.kind} onValueChange={(value) => setForm((current) => ({ ...current, kind: value as CatalogForm["kind"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="products">Products</SelectItem><SelectItem value="services">Services</SelectItem></SelectContent></Select></Field><Field label="Default currency"><Select value={form.currency} onValueChange={(value) => setForm((current) => ({ ...current, currency: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{currencies.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></Field><Field label="Locale"><Select value={form.locale} onValueChange={(value) => setForm((current) => ({ ...current, locale: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="es-ES">Spanish / Spain</SelectItem><SelectItem value="en-GB">English / UK</SelectItem><SelectItem value="en-US">English / US</SelectItem></SelectContent></Select></Field></div><Field label="Description"><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="What does this catalog contain and who should use it?" /></Field></section>
      <section className="space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs"><FormSectionHeader eyebrow="Distribution" title="Sales channels and governance" description="Choose the commercial channels where entries from this catalog may be offered." mode="expanded" responsive="auto" /><ChannelList options={catalogChannels} selected={form.channels} onToggle={toggleChannel} /></section>
    </form>
  </DrawerShell>;
}

function ItemDrawer({ open, editingItem, form, setForm, error, selectedCatalog, toggleChannel, onOpenChange, onCreate }: { open: boolean; editingItem: CatalogItem | null; form: ItemForm; setForm: React.Dispatch<React.SetStateAction<ItemForm>>; error: string | null; selectedCatalog: OrganizationCatalog; toggleChannel: (channel: string) => void; onOpenChange: (open: boolean) => void; onCreate: () => void }) {
  const isService = selectedCatalog.kind === "services";
  const [serviceKeyEdited, setServiceKeyEdited] = useState(false);
  const allowedTypes = isService ? serviceItemTypes : productItemTypes;
  useEffect(() => {
    if (!open) {
      setServiceKeyEdited(false);
      return;
    }
    if (isService && !serviceKeyEdited) {
      setForm((current) => ({ ...current, key: slugify(current.name) }));
    }
  }, [form.name, isService, open, serviceKeyEdited, setForm]);
  return <DrawerShell open={open} onOpenChange={onOpenChange} title={editingItem ? `Edit ${isService ? "service" : "product"}` : `New ${isService ? "service" : "product"}`} eyebrow="ERP / Product catalog" mode={editingItem ? "Editing" : "New"} headerMeta={<span>{selectedCatalog.name}</span>} description={isService ? "Define a service offering with its provider, delivery model, eligibility and commercial validity." : "Create a reusable commercial product master record."} dirty={() => Boolean(form.name || form.key || form.sku || form.description || form.price)} confirmTitle={`Discard ${isService ? "service" : "product"} changes?`} confirmDescription="Your unsaved details will be lost." onDiscard={() => { setServiceKeyEdited(false); setForm(emptyItemForm()); }} footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={onCreate} disabled={!form.name.trim() || (!isService && !form.sku.trim())}>{editingItem ? `Save ${isService ? "service" : "product"}` : `Create ${isService ? "service" : "product"}`}</Button></div>}>
    <form className="loopdev-form space-y-6" onSubmit={(event) => { event.preventDefault(); onCreate(); }}>
      <section className="space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs"><FormSectionHeader eyebrow="Identity" title={isService ? "Service identity" : "Product identity"} description={isService ? "Identify the service without physical-product fields such as SKU or manufacturer." : "The stable definition shared across CRM, Communications and future ERP modules."} mode="expanded" responsive="auto" meta={<span>Required</span>} /><div className="grid gap-4 sm:grid-cols-2"><Field label={isService ? "Service name" : "Product name"} required><Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder={isService ? "e.g. Family dental consultation" : "e.g. Enterprise plan"} /></Field><Field label={isService ? "Service key" : "SKU / key"} required><Input value={isService ? form.key : form.sku} onChange={(event) => { if (isService) setServiceKeyEdited(true); setForm((current) => ({ ...current, ...(isService ? { key: slugify(event.target.value) } : { sku: event.target.value }) })); }} placeholder={isService ? "family-dental-consultation" : "PLAN-ENTERPRISE-001"} /><p className="text-xs font-normal text-muted-foreground">{isService && !serviceKeyEdited ? "Generated automatically from the service name." : isService ? "Custom service key." : "Stable product identifier."}</p></Field><Field label={isService ? "Service type" : "Product type"} required><Select value={form.type} onValueChange={(value) => setForm((current) => ({ ...current, type: value as CatalogItem["type"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{allowedTypes.map((value) => <SelectItem key={value} value={value}>{itemTypeLabels[value]}</SelectItem>)}</SelectContent></Select></Field><Field label="Category"><Input value={form.categoryKey} onChange={(event) => setForm((current) => ({ ...current, categoryKey: event.target.value }))} placeholder={isService ? "health.dental" : "software"} /></Field>{!isService && <Field label="Brand"><Input value={form.brand} onChange={(event) => setForm((current) => ({ ...current, brand: event.target.value }))} placeholder="Brand or commercial line" /></Field>}<Field label="Tags"><Input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} placeholder={isService ? "dental, preventive, family" : "enterprise, annual" } /></Field></div><Field label="Short description"><Input value={form.shortDescription} onChange={(event) => setForm((current) => ({ ...current, shortDescription: event.target.value }))} placeholder="One-line description for cards and search results" /></Field><Field label="Long description"><Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder={isService ? "Scope, deliverables and customer-facing conditions" : "Detailed product description and conditions"} /></Field></section>
      {isService && <section className="space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs"><FormSectionHeader eyebrow="Delivery" title="Service delivery model" description="Describe how the service is delivered and who performs it." mode="expanded" responsive="auto" /><div className="grid gap-4 sm:grid-cols-2"><Field label="Provider / insurer"><Input value={form.provider} onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))} placeholder="e.g. Sanitas, ASISA or clinic" /></Field><Field label="Performer"><Input value={form.performer} onChange={(event) => setForm((current) => ({ ...current, performer: event.target.value }))} placeholder="Professional, team or service unit" /></Field><Field label="Duration"><Input type="number" min="0" value={form.duration} onChange={(event) => setForm((current) => ({ ...current, duration: event.target.value }))} placeholder="60" /></Field><Field label="Duration unit"><Select value={form.unit} onValueChange={(value) => setForm((current) => ({ ...current, unit: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Minute", "Hour", "Day", "Month", "Year", "Session", "Treatment"].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></Field></div></section>}
      <section className="space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs"><FormSectionHeader eyebrow="Commercial" title={isService ? "Indicative pricing" : "Pricing and billing"} description={isService ? "Store a reference price without treating it as the final price of a quote, application or policy." : "Set the default commercial values; detailed price books can be added later."} mode="expanded" responsive="auto" /><div className="grid gap-4 sm:grid-cols-2"><Field label={isService ? "Estimated starting price" : "Base price"}><Input type="number" min="0" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} placeholder="0.00" /></Field><Field label="Currency"><Select value={form.currency} onValueChange={(value) => setForm((current) => ({ ...current, currency: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{currencies.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></Field>{isService && <Field label="Pricing model"><Select value={form.pricingModel} onValueChange={(value) => setForm((current) => ({ ...current, pricingModel: value as ItemForm["pricingModel"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="fixed_reference">Fixed reference</SelectItem><SelectItem value="from_price">From price</SelectItem><SelectItem value="quote_required">Quote required</SelectItem><SelectItem value="calculated_at_checkout">Calculated at checkout</SelectItem></SelectContent></Select></Field>}{isService && <Field label="Billing period"><Select value={form.billingPeriod} onValueChange={(value) => setForm((current) => ({ ...current, billingPeriod: value as ItemForm["billingPeriod"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="one_time">One time</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="annual">Annual</SelectItem></SelectContent></Select></Field>}<Field label="Billing model"><Select value={form.billingModel} onValueChange={(value) => setForm((current) => ({ ...current, billingModel: value as ItemForm["billingModel"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="one_time">One time</SelectItem><SelectItem value="recurring">Recurring</SelectItem><SelectItem value="usage">Usage based</SelectItem></SelectContent></Select></Field>{!isService && <Field label="Unit"><Select value={form.unit} onValueChange={(value) => setForm((current) => ({ ...current, unit: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{units.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></Field>}</div>{isService && <><Field label="Price note"><Textarea value={form.priceNote} onChange={(event) => setForm((current) => ({ ...current, priceNote: event.target.value }))} placeholder="Indicative price subject to underwriting and final eligibility." /><p className="text-xs text-muted-foreground">The final amount is defined later by the quote, application or policy process.</p></Field></>}</section>
      {!isService && <section className="space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs"><FormSectionHeader eyebrow="Participants" title="Product participants" description="Use neutral roles for brands, suppliers and manufacturers." mode="expanded" responsive="auto" /><div className="grid gap-4 sm:grid-cols-2"><Field label="Provider"><Input value={form.provider} onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value }))} placeholder="Provider or supplier" /></Field><Field label="Manufacturer"><Input value={form.manufacturer} onChange={(event) => setForm((current) => ({ ...current, manufacturer: event.target.value }))} placeholder="Optional manufacturer" /></Field></div></section>}
      {!isService && <section className="space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs"><FormSectionHeader eyebrow="Physical attributes" title="Product specifications" description="Capture identifiers and descriptive attributes without mixing inventory or warehouse data into the catalog." mode="expanded" responsive="auto" /><div className="grid gap-4 sm:grid-cols-2"><Field label="Barcode / GTIN"><Input value={form.barcode} onChange={(event) => setForm((current) => ({ ...current, barcode: event.target.value }))} placeholder="EAN, UPC or GTIN" /></Field><Field label="Material"><Input value={form.material} onChange={(event) => setForm((current) => ({ ...current, material: event.target.value }))} placeholder="e.g. Cotton, steel, ceramic" /></Field><Field label="Color"><Input value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} placeholder="e.g. Black" /></Field><Field label="Size / format"><Input value={form.size} onChange={(event) => setForm((current) => ({ ...current, size: event.target.value }))} placeholder="e.g. M, 500 ml, 42" /></Field><Field label="Weight"><Input value={form.weight} onChange={(event) => setForm((current) => ({ ...current, weight: event.target.value }))} placeholder="e.g. 1.25 kg" /></Field><Field label="Dimensions"><Input value={form.dimensions} onChange={(event) => setForm((current) => ({ ...current, dimensions: event.target.value }))} placeholder="e.g. 20 x 10 x 5 cm" /></Field></div></section>}
      <section className="space-y-4 rounded-xl border border-border-strong/70 bg-card/70 p-4 shadow-xs"><FormSectionHeader eyebrow="Availability" title={isService ? "Service availability" : "Publication and availability"} description={isService ? "Control where, when and for whom the service can be offered." : "Control status, markets, channels and commercial validity."} mode="expanded" responsive="auto" /><div className="grid gap-4 sm:grid-cols-2"><Field label="Status"><Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as ItemForm["status"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></Field><Field label={isService ? "Coverage / markets" : "Markets"}><Input value={form.markets} onChange={(event) => setForm((current) => ({ ...current, markets: event.target.value }))} placeholder={isService ? "Spain · Madrid · Online" : "Spain, Portugal"} /></Field>{isService && <Field label="Eligibility"><Input value={form.eligibility} onChange={(event) => setForm((current) => ({ ...current, eligibility: event.target.value }))} placeholder="Members, age range, referral required..." /></Field>}<Field label="Valid from"><Input type="date" value={form.validFrom} onChange={(event) => setForm((current) => ({ ...current, validFrom: event.target.value }))} /></Field><Field label="Valid to"><Input type="date" value={form.validTo} onChange={(event) => setForm((current) => ({ ...current, validTo: event.target.value }))} /></Field></div><ChannelList options={isService ? serviceChannels : productChannels} selected={form.channels} onToggle={toggleChannel} />{error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive">{error}</p>}</section>
    </form>
  </DrawerShell>;
}
