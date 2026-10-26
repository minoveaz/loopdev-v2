import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Archive, ArrowLeft, Check, Plus, RotateCcw, Save } from "lucide-react";
import { AppDrawer } from "@/components/platform";
import { FormSectionHeader, LoadingState, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { catalogAdapter } from "@/loopdev/domains/catalog/adapter";
import type { CatalogItem, CatalogItemClass, CatalogItemKind, CatalogSourcingMode, CatalogVariant, ProductReference, ProductReferenceKind } from "@/loopdev/domains/catalog";
import { ProductMediaSection } from "./ProductMediaSection";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { useT } from "@/i18n";

type ProductPageMode = "create" | "edit" | "view";
type CatalogItemKindSelection = CatalogItemKind | "";
type ProductForm = {
  name: string;
  sku: string;
  itemKind: CatalogItemKindSelection;
  itemClass: CatalogItemClass | "";
  sourcingMode: CatalogSourcingMode | "";
  canPurchase: boolean;
  canSell: boolean;
  trackInventory: boolean;
  categoryKey: string;
  brandKey: string;
  tags: string[];
  shortDescription: string;
  description: string;
  barcode: string;
  manufacturer: string;
  material: string;
  color: string;
  size: string;
  weightValue: string;
  weightUnit: string;
  length: string;
  width: string;
  height: string;
  dimensionUnit: string;
  price: string;
  priceCurrency: string;
  cost: string;
  costCurrency: string;
  costVersion: number;
  status: CatalogItem["status"];
};

const emptyForm = (): ProductForm => ({
  name: "",
  sku: "",
  itemKind: "",
  itemClass: "",
  sourcingMode: "",
  canPurchase: false,
  canSell: false,
  trackInventory: false,
  categoryKey: "",
  brandKey: "",
  tags: [],
  shortDescription: "",
  description: "",
  barcode: "",
  manufacturer: "",
  material: "",
  color: "",
  size: "",
  weightValue: "",
  weightUnit: "kg",
  length: "",
  width: "",
  height: "",
  dimensionUnit: "cm",
  price: "",
  priceCurrency: "EUR",
  cost: "",
  costCurrency: "EUR",
  costVersion: 0,
  status: "draft",
});

const slugify = (value: string) => value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const stringValue = (value: unknown) => typeof value === "string" ? value : "";
const numberValue = (value: unknown) => typeof value === "number" ? String(value) : "";
const itemTypeTranslationKeys: Record<CatalogItem["type"], string> = {
  physical_product: "physicalProduct",
  digital_product: "digitalProduct",
  service: "service",
  subscription: "subscription",
  coverage: "coverage",
  package: "package",
  fee: "fee",
};
const productClasses: CatalogItemClass[] = ["finished_product", "raw_material", "component"];
const isCatalogItemClass = (value: unknown): value is CatalogItemClass =>
  value === "finished_product" || value === "raw_material" || value === "component" || value === "service";
const isSourcingMode = (value: unknown): value is CatalogSourcingMode =>
  value === "buy" || value === "make" || value === "both";

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return <label className="block space-y-1.5 text-sm font-medium">{label}{required && <span aria-hidden="true" className="ms-1 text-destructive">*</span>}{children}</label>;
}

function ReferenceQuickDrawer({
  kind,
  organizationId,
  references,
  onClose,
  onCreated,
}: {
  kind: ProductReferenceKind | null;
  organizationId: string;
  references: ProductReference[];
  onClose: () => void;
  onCreated: (reference: ProductReference) => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setName("");
    setParentId("");
    setError(null);
  }, [kind]);
  if (!kind) return null;

  const labels: Record<ProductReferenceKind, string> = {
    category: t("common.erpForm.item.category").toLocaleLowerCase(),
    brand: t("common.erpForm.item.brand").toLocaleLowerCase(),
    tag: t("common.erpProductRecord.tag").toLocaleLowerCase(),
  };
  const save = async () => {
    if (!name.trim()) {
      setError(t("common.erpProductRecord.enterName"));
      return;
    }
    try {
      const created = await catalogAdapter.createProductReference({
        organizationId,
        kind,
        key: slugify(name),
        name: name.trim(),
        parentId: kind === "category" ? parentId || null : null,
      });
      onCreated(created);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.erpProductRecord.referenceCreateError"));
    }
  };

  return <AppDrawer
    open
    onOpenChange={(open) => { if (!open) onClose(); }}
    size="sm"
    title={t("common.erpProductRecord.createReferenceTitle", { kind: labels[kind] })}
    eyebrow={t("common.erpProductRecord.configurationEyebrow")}
    mode={t("common.erpProductRecord.newMode")}
    description={t("common.erpProductRecord.newReferenceDescription", { kind: labels[kind] })}
    dirty={() => Boolean(name.trim())}
    confirmOnClose
    confirmTitle={t("common.erpProductRecord.discardReferenceTitle")}
    confirmDescription={t("common.erpProductRecord.discardReferenceDescription")}
    confirmLabel={t("common.erpProductRecord.discard")}
    cancelLabel={t("common.cancel")}
    footer={<div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button><Button onClick={() => void save()} disabled={!name.trim()}>{t("common.erpProductRecord.create")}</Button></div>}
  >
    <div className="space-y-4">
      <Field label={t("common.erpProductRecord.referenceName", { kind: labels[kind] })} required>
        <Input autoFocus value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      {kind === "category" && references.some((reference) => reference.kind === "category" && reference.status === "active") && (
        <Field label={t("common.erpProductRecord.parentCategory")}>
          <Select value={parentId || "__none"} onValueChange={(value) => setParentId(value === "__none" ? "" : value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">{t("common.erpProductRecord.noParent")}</SelectItem>
              {references.filter((reference) => reference.kind === "category" && reference.status === "active").map((reference) =>
                <SelectItem key={reference.id} value={reference.id}>{reference.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      )}
      {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
    </div>
  </AppDrawer>;
}

export function ProductRecordPage({ mode, itemId }: { mode: ProductPageMode; itemId: string | null }) {
  const t = useT();
  const navigate = useNavigate();
  const { activeOrganization } = useTenantContext();
  const organizationId = activeOrganization?.id ?? "";
  const previousItemId = useRef(itemId);
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [variants, setVariants] = useState<CatalogVariant[]>([]);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [references, setReferences] = useState<ProductReference[]>([]);
  const [isLoading, setIsLoading] = useState(mode !== "create");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [quickCreateKind, setQuickCreateKind] = useState<ProductReferenceKind | null>(null);
  const [costReadable, setCostReadable] = useState(true);
  const costMutationRef = useRef<{ fingerprint: string; idempotencyKey: string } | null>(null);

  useEffect(() => {
    if (!itemId && previousItemId.current) {
      setForm(emptyForm());
      setVariants([]);
    }
    previousItemId.current = itemId;
  }, [itemId]);

  useEffect(() => {
    let active = true;
    setIsLoading(mode !== "create");
    setLoadError(null);
    if (!organizationId) {
      setLoadError(t("common.erpProductRecord.noOrganization"));
      setIsLoading(false);
      return () => { active = false; };
    }
    const load = async () => {
      try {
        const nextReferences = await catalogAdapter.listProductReferences({ organizationId });
        if (!active) return;
        setReferences(nextReferences);
        if (!itemId) {
          setItem(null);
          setIsLoading(false);
          return;
        }
        const loadedItem = await catalogAdapter.getCatalogItem(itemId, { organizationId });
        if (!active) return;
        if (!loadedItem) {
          setLoadError(t("common.erpProductRecord.productNotFound"));
          setIsLoading(false);
          return;
        }
        setItem(loadedItem);
        const loadedVariants = await catalogAdapter.listVariants({ organizationId, catalogItemId: loadedItem.id, includeArchived: true });
        if (!active) return;
        setVariants(loadedVariants);
        const metadata = loadedItem.metadata;
        const storedClass = isCatalogItemClass(metadata.itemClass) ? metadata.itemClass : "";
        const storedKind = metadata.itemKind === "product" || metadata.itemKind === "service"
          ? metadata.itemKind
          : storedClass === "service" ? "service" : storedClass ? "product" : loadedItem.type === "service" ? "service" : "";
        const dimensions = metadata.dimensionsValue && typeof metadata.dimensionsValue === "object"
          ? metadata.dimensionsValue as Record<string, unknown>
          : {};
        setForm({
          ...emptyForm(),
          name: loadedItem.name,
          sku: loadedItem.sku,
          itemKind: storedKind,
          itemClass: storedClass,
          sourcingMode: isSourcingMode(metadata.sourcingMode) ? metadata.sourcingMode : "",
          canPurchase: metadata.canPurchase === true,
          canSell: metadata.canSell === true,
          trackInventory: metadata.trackInventory === true,
          categoryKey: loadedItem.categoryKey ?? "",
          brandKey: stringValue(metadata.brandKey),
          tags: Array.isArray(metadata.tags) ? metadata.tags.filter((value): value is string => typeof value === "string") : [],
          shortDescription: stringValue(metadata.shortDescription),
          description: loadedItem.description ?? "",
          barcode: stringValue(metadata.barcode),
          manufacturer: stringValue(metadata.manufacturer),
          material: stringValue(metadata.material),
          color: stringValue(metadata.color),
          size: stringValue(metadata.size),
          weightValue: numberValue(metadata.weightValue) || stringValue(metadata.weight).split(" ")[0],
          weightUnit: stringValue(metadata.weightUnit) || stringValue(metadata.weight).split(" ")[1] || "kg",
          length: numberValue(dimensions.length),
          width: numberValue(dimensions.width),
          height: numberValue(dimensions.height),
          dimensionUnit: stringValue(dimensions.unit) || "cm",
          price: numberValue(metadata.price),
          priceCurrency: stringValue(metadata.currency) || "EUR",
          status: loadedItem.status,
        });
        if (!loadedVariants.some((variant) => variant.status !== "archived")) {
          try {
            const cost = await catalogAdapter.getProductCostReference({ organizationId, catalogItemId: loadedItem.id });
            if (active) {
              setForm((current) => ({
                ...current,
                cost: cost?.amount == null ? "" : String(cost.amount),
                costCurrency: cost?.currency ?? "EUR",
                costVersion: cost?.version ?? 0,
              }));
            }
          } catch (cause) {
            if (active) setCostReadable(false);
            if (cause instanceof Error && !/permission|forbidden/i.test(cause.message)) throw cause;
          }
        }
        if (active) setIsLoading(false);
      } catch (cause) {
        if (!active) return;
        setLoadError(cause instanceof Error ? cause.message : t("common.erpProductRecord.loadError"));
        setIsLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [itemId, mode, organizationId]);

  const categoryName = useMemo(() => references.find((reference) => reference.kind === "category" && reference.key === item?.categoryKey)?.name ?? item?.categoryKey ?? t("common.erpProductRecord.uncategorized"), [item, references, t]);
  const brandName = useMemo(() => references.find((reference) => reference.kind === "brand" && reference.key === item?.metadata.brandKey)?.name ?? stringValue(item?.metadata.brand), [item, references]);
  const setField = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const setItemKind = (kind: CatalogItemKindSelection) => setForm((current) => ({
    ...current,
    itemKind: kind,
    itemClass: kind === "service" ? "service" : current.itemClass === "service" ? "" : current.itemClass,
    sourcingMode: kind === "service" ? "" : current.sourcingMode,
    canPurchase: kind === "service" ? false : current.canPurchase,
    trackInventory: kind === "service" ? false : current.trackInventory,
  }));

  const onReferenceCreated = (reference: ProductReference) => {
    setReferences((current) => [reference, ...current]);
    if (reference.kind === "category") setField("categoryKey", reference.key);
    if (reference.kind === "brand") setField("brandKey", reference.key);
    if (reference.kind === "tag") setField("tags", [...form.tags, reference.key]);
    setQuickCreateKind(null);
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organizationId || !form.name.trim()) {
      setSaveError(t("common.erpProductRecord.requiredFields"));
      return;
    }
    if (!form.itemKind || (form.itemKind === "product" && !form.itemClass)) {
      setSaveError(t("common.erpProductRecord.itemClassRequired"));
      return;
    }
    if (form.itemClass === "finished_product" && !form.sourcingMode) {
      setSaveError(t("common.erpProductRecord.sourcingRequired"));
      return;
    }
    if (form.status === "active" && !form.categoryKey) {
      setSaveError(t("common.erpProductRecord.activeCategoryRequired"));
      return;
    }
    if (form.cost.trim() && (
      !Number.isFinite(Number(form.cost))
      || Number(form.cost) < 0
      || Math.round(Number(form.cost) * 100) !== Number(form.cost) * 100
    )) {
      setSaveError(t("common.erpProductRecord.invalidCost"));
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const brand = references.find((reference) => reference.kind === "brand" && reference.key === form.brandKey);
      const dimensionsValue = {
        length: form.length ? Number(form.length) : null,
        width: form.width ? Number(form.width) : null,
        height: form.height ? Number(form.height) : null,
        unit: form.dimensionUnit,
      };
      const metadata: CatalogItem["metadata"] = {
        ...(item?.metadata ?? {}),
        itemKind: form.itemKind || undefined,
        itemClass: form.itemKind === "service" ? "service" : form.itemClass || undefined,
        sourcingMode: form.itemKind !== "product"
          ? null
          : form.itemClass === "finished_product" ? form.sourcingMode || null : "buy",
        canPurchase: form.itemKind === "product" && form.canPurchase,
        canSell: form.canSell,
        trackInventory: form.itemKind === "product" && form.trackInventory,
        shortDescription: form.shortDescription,
        brand: brand?.name ?? "",
        brandKey: form.brandKey,
        tags: form.tags,
        barcode: form.barcode,
        manufacturer: form.manufacturer,
        material: form.material,
        color: form.color,
        size: form.size,
        weight: form.weightValue ? `${form.weightValue} ${form.weightUnit}` : "",
        weightValue: form.weightValue ? Number(form.weightValue) : null,
        weightUnit: form.weightUnit,
        dimensions: [form.length, form.width, form.height].some(Boolean)
          ? `${form.length || "—"} × ${form.width || "—"} × ${form.height || "—"} ${form.dimensionUnit}`
          : "",
        dimensionsValue,
        price: form.price ? Number(form.price) : null,
        currency: form.priceCurrency,
      };
      const catalogs = await catalogAdapter.listCatalogs({ organizationId });
      const targetCatalog = catalogs.find((catalog) => catalog.kind === "products" && catalog.status === "active")
        ?? await catalogAdapter.createCatalog({
          organizationId,
          key: "products",
          name: "Products",
          kind: "products",
          metadata: {},
        });
      const savedItem = item
        ? await catalogAdapter.updateCatalogItem(item.id, { organizationId }, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          type: form.itemKind === "service" ? "service" : "physical_product",
          categoryKey: form.categoryKey || null,
          status: form.status,
          metadata,
        })
        : await catalogAdapter.createCatalogItem({
          organizationId,
          catalogId: targetCatalog.id,
          name: form.name.trim(),
          description: form.description.trim() || null,
          type: form.itemKind === "service" ? "service" : "physical_product",
          categoryKey: form.categoryKey || null,
          status: form.status,
          metadata,
        });
      setItem(savedItem);
      const managesCostAtProduct = !variants.some((variant) => variant.status !== "archived");
      if (form.itemKind === "product" && managesCostAtProduct && costReadable && (form.canPurchase || form.costVersion > 0)) {
        const fingerprint = JSON.stringify([savedItem.id, form.cost, form.costCurrency, form.costVersion, form.canPurchase]);
        if (costMutationRef.current?.fingerprint !== fingerprint) {
          const idempotencyKey = window.crypto?.randomUUID?.();
          if (!idempotencyKey) throw new Error(t("common.erpProductRecord.costMutationUnavailable"));
          costMutationRef.current = { fingerprint, idempotencyKey };
        }
        await catalogAdapter.saveProductCostReference({
          organizationId,
          catalogItemId: savedItem.id,
          variantId: null,
          amount: form.canPurchase && form.cost.trim() ? Number(form.cost) : null,
          currency: form.costCurrency,
          expectedVersion: form.costVersion,
          idempotencyKey: costMutationRef.current.idempotencyKey,
        });
        costMutationRef.current = null;
      }
      navigate(`/app/erp/products/${savedItem.id}`);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : t("common.erpProductRecord.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <PageContainer width="wide"><LoadingState label={t("common.erpProductRecord.loadingProduct")} /></PageContainer>;
  if (loadError) return <PageContainer width="narrow"><div className="rounded-lg border border-destructive/30 p-5"><p role="alert" className="text-sm text-destructive">{loadError}</p><Button className="mt-4" variant="outline" onClick={() => navigate("/app/erp/products")}><ArrowLeft className="me-2 h-4 w-4" />{t("common.erpProductRecord.backToProducts")}</Button></div></PageContainer>;

  if (mode === "view" && item) {
    const metadata = item.metadata;
    const tags = Array.isArray(metadata.tags) ? metadata.tags.filter((value): value is string => typeof value === "string") : [];
    const storedItemKind = metadata.itemKind === "product" || metadata.itemKind === "service"
      ? metadata.itemKind
      : item.type === "service" ? "service" : "";
    const physicalType = storedItemKind === "product" || (!storedItemKind && (item.type === "physical_product" || item.type === "digital_product" || item.type === "package"));
    const storedItemClass = isCatalogItemClass(metadata.itemClass) ? metadata.itemClass : null;
    const displayedItemClass = storedItemClass
      ? t(`common.erpProductRecord.itemClasses.${storedItemClass}`)
      : storedItemKind === "product"
        ? t("common.erpProductRecord.itemKinds.product")
        : storedItemKind === "service"
        ? t("common.erpProductRecord.itemKinds.service")
          : t(`common.erpForm.item.${itemTypeTranslationKeys[item.type]}`);
    const canShowCost = physicalType && metadata.canPurchase !== false && !variants.some((variant) => variant.status !== "archived");
    return <PageContainer width="wide">
      <PageHeader
        title={item.name}
        description={stringValue(metadata.shortDescription) || item.description || t(storedItemKind === "service" ? "common.erpProductRecord.serviceDetails" : "common.erpProductRecord.productDetails")}
        breadcrumbs={[{ label: "ERP" }, { label: t("common.erpProductRecord.products") }, { label: item.name }]}
        actions={<div className="flex gap-2"><Button variant="outline" onClick={() => navigate("/app/erp/products")}><ArrowLeft className="me-2 h-4 w-4" />{t("common.erpProductRecord.products")}</Button>{physicalType && <Button variant="outline" onClick={() => navigate(`/app/erp/products/${item.id}/skus`)}>{t("common.erpProductRecord.manageSkusAction")}</Button>}<Button onClick={() => navigate(`/app/erp/products/${item.id}/edit`)}>{t(storedItemKind === "service" ? "common.erpProductRecord.editServiceAction" : "common.erpProductRecord.editProductAction")}</Button></div>}
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-5">
            <FormSectionHeader eyebrow={t(storedItemKind === "service" ? "common.erpProductRecord.itemKinds.service" : "common.erpProductRecord.productEyebrow")} title={t("common.erpProductRecord.identityClassification")} description={t(storedItemKind === "service" ? "common.erpProductRecord.serviceIdentityRecordDescription" : "common.erpProductRecord.identityRecordDescription")} mode="expanded" responsive="auto" />
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <RecordValue label="SKU" value={item.sku || (variants.length ? t("common.erpProductRecord.skusManagedSeparately") : "—")} technical />
              <RecordValue label={t("common.erpProductRecord.internalKey")} value={item.key} technical />
              <RecordValue label={t("common.erpProductRecord.type")} value={displayedItemClass} />
              {metadata.sourcingMode === "buy" || metadata.sourcingMode === "make" || metadata.sourcingMode === "both"
                ? <RecordValue label={t("common.erpProductRecord.sourcingMode")} value={t(`common.erpProductRecord.sourcingModes.${metadata.sourcingMode}`)} />
                : null}
              {storedItemKind && <RecordValue label={t("common.erpProductRecord.operations")} value={[
                metadata.canPurchase === true ? t("common.erpProductRecord.canPurchase") : null,
                metadata.canSell === true ? t("common.erpProductRecord.canSell") : null,
                metadata.trackInventory === true ? t("common.erpProductRecord.trackInventory") : null,
              ].filter(Boolean).join(", ") || t("common.erpProductRecord.noOperations")} />}
              <RecordValue label={t("common.erpForm.item.category")} value={categoryName} />
              <RecordValue label={t("common.erpForm.item.brand")} value={brandName || "—"} />
              <RecordValue label={t("common.erpForm.item.status")} value={<StatusBadge tone={item.status === "active" ? "success" : item.status === "draft" ? "warning" : "neutral"} dot>{t(`common.erpForm.item.${item.status}`)}</StatusBadge>} />
              <RecordValue label={t("common.erpProductRecord.description")} value={item.description || "—"} wide />
              <RecordValue label={t("common.erpForm.item.tags")} value={tags.length ? <div className="flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className="rounded-full bg-muted px-2.5 py-1 text-xs">{references.find((reference) => reference.kind === "tag" && reference.key === tag)?.name ?? tag}</span>)}</div> : "—"} wide />
            </dl>
          </section>
          {physicalType && <section className="rounded-xl border border-border bg-card p-5">
            <FormSectionHeader eyebrow={t("common.erpProductRecord.specifications")} title={t("common.erpProductRecord.physicalAttributes")} description={t("common.erpProductRecord.physicalRecordDescription")} mode="expanded" responsive="auto" />
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <RecordValue label={t("common.erpProductRecord.barcode")} value={stringValue(metadata.barcode) || "—"} />
              <RecordValue label={t("common.erpProductRecord.manufacturer")} value={stringValue(metadata.manufacturer) || "—"} />
              <RecordValue label={t("common.erpProductRecord.material")} value={stringValue(metadata.material) || "—"} />
              <RecordValue label={t("common.erpProductRecord.color")} value={stringValue(metadata.color) || "—"} />
              <RecordValue label={t("common.erpProductRecord.sizeFormat")} value={stringValue(metadata.size) || "—"} />
              <RecordValue label={t("common.erpProductRecord.weight")} value={stringValue(metadata.weight) || "—"} />
              <RecordValue label={t("common.erpProductRecord.dimensions")} value={stringValue(metadata.dimensions) || "—"} />
            </dl>
          </section>}
          {physicalType && <section className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <FormSectionHeader eyebrow={t("common.erpProductRecord.variants")} title={t("common.erpProductRecord.skus")} description={t("common.erpProductRecord.skusDescription")} mode="expanded" responsive="auto" />
              <Button variant="outline" onClick={() => navigate(`/app/erp/products/${item.id}/skus`)}>{t("common.erpProductRecord.manageSkusAction")}</Button>
            </div>
            {variants.length ? <div className="mt-4 divide-y divide-border">{variants.map((variant) => {
              const categoryKey = typeof variant.metadata.categoryKey === "string" ? variant.metadata.categoryKey : "";
              const category = references.find((reference) => reference.kind === "category" && reference.key === categoryKey)?.name ?? categoryKey;
              return <div key={variant.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span><span className="block font-medium">{variant.name}</span><span className="font-mono text-xs text-muted-foreground">{variant.sku}</span></span>
                <span className="flex items-center gap-3 text-muted-foreground"><span>{category || t("common.erpProductRecord.uncategorized")}</span><StatusBadge tone={variant.status === "active" ? "success" : variant.status === "draft" ? "warning" : "neutral"} dot>{t(`common.erpForm.item.${variant.status}`)}</StatusBadge></span>
              </div>;
            })}</div> : <p className="mt-4 text-sm text-muted-foreground">{t("common.erpProductRecord.noSkus")}</p>}
          </section>}
        </div>
        <aside className="space-y-5">
          {metadata.canSell !== false && <section className="rounded-xl border border-border bg-card p-5">
            <FormSectionHeader eyebrow={t("common.erpProductRecord.sales")} title={t("common.erpProductRecord.referencePrice")} description={t("common.erpProductRecord.referencePriceDescription")} mode="expanded" responsive="auto" />
            <p className="mt-5 text-2xl font-semibold">{numberValue(metadata.price) ? `${metadata.price} ${stringValue(metadata.currency) || "EUR"}` : t("common.erpProductRecord.notSet")}</p>
          </section>}
          {canShowCost && <ProductCostCard itemId={item.id} organizationId={organizationId} />}
          <ProductMediaSection item={item} organizationId={organizationId} />
        </aside>
      </div>
    </PageContainer>;
  }

  const isProduct = form.itemKind === "product";
  const isPhysical = isProduct;
  const isFinishedProduct = form.itemClass === "finished_product";
  const managesCostAtProduct = !variants.some((variant) => variant.status !== "archived");
  const pageTitle = mode === "create"
    ? t(form.itemKind === "service" ? "common.erpProductRecord.createService" : form.itemKind === "product" ? "common.erpProductRecord.createProduct" : "common.erpProductRecord.createItem")
    : form.itemKind === "service"
      ? t("common.erpProductRecord.editService", { name: item?.name ?? t("common.erpProductRecord.itemKinds.service") })
      : t("common.erpProductRecord.editProduct", { name: item?.name ?? t("common.erpProductRecord.product") });
  const categoryReferences = references.filter((reference) => reference.kind === "category");
  const brandReferences = references.filter((reference) => reference.kind === "brand");
  const tagReferences = references.filter((reference) => reference.kind === "tag");

  return <PageContainer width="wide">
    <PageHeader
      title={pageTitle}
      description={t(form.itemKind === "service" ? "common.erpProductRecord.serviceFormDescription" : "common.erpProductRecord.formDescription")}
      breadcrumbs={[{ label: "ERP" }, { label: t("common.erpProductRecord.products") }, { label: mode === "create" ? pageTitle : item?.name ?? t("common.erpProductRecord.editProductBreadcrumb") }]}
      actions={<Button variant="outline" asChild><Link to="/app/erp/products"><ArrowLeft className="me-2 h-4 w-4" />{t("common.cancel")}</Link></Button>}
    />
    <form onSubmit={(event) => void save(event)} className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-5">
            <FormSectionHeader eyebrow={t("common.erpProductRecord.itemKindEyebrow")} title={t("common.erpProductRecord.itemKindTitle")} description={t("common.erpProductRecord.itemKindDescription")} mode="expanded" responsive="auto" />
            <div role="group" aria-label={t("common.erpProductRecord.itemKindTitle")} className="mt-5 grid gap-3 sm:grid-cols-2">
              {(["product", "service"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={form.itemKind === kind}
                  disabled={Boolean(item && variants.length && kind === "service")}
                  onClick={() => setItemKind(kind)}
                  className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${form.itemKind === kind ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                >
                  <span aria-hidden="true" className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${form.itemKind === kind ? "border-primary" : "border-muted-foreground/50"}`}>
                    {form.itemKind === kind && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{t(`common.erpProductRecord.itemKinds.${kind}`)}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{t(`common.erpProductRecord.itemKinds.${kind}Description`)}</span>
                  </span>
                </button>
              ))}
            </div>
            {isProduct && <div className="mt-5 max-w-xl">
              <Field label={t("common.erpProductRecord.productClass")} required>
                <Select value={form.itemClass || "__none"} onValueChange={(value) => setField("itemClass", value === "__none" ? "" : value as CatalogItemClass)}>
                  <SelectTrigger><SelectValue placeholder={t("common.erpProductRecord.selectProductClass")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">{t("common.erpProductRecord.selectProductClass")}</SelectItem>
                    {productClasses.map((itemClass) => <SelectItem key={itemClass} value={itemClass}>{t(`common.erpProductRecord.itemClasses.${itemClass}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>}
          </section>
          {form.itemKind && (form.itemKind === "service" || form.itemClass) && <>
          <section className="rounded-xl border border-border bg-card p-5">
            <FormSectionHeader eyebrow={t("common.erpProductRecord.identityEyebrow")} title={t(form.itemKind === "service" ? "common.erpProductRecord.serviceIdentityTitle" : "common.erpProductRecord.identityTitle")} description={t(form.itemKind === "service" ? "common.erpProductRecord.serviceIdentityDescription" : "common.erpProductRecord.identityDescription")} mode="expanded" responsive="auto" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label={t(form.itemKind === "service" ? "common.erpProductRecord.serviceName" : "common.erpForm.item.productName")} required><Input required autoFocus value={form.name} onChange={(event) => setField("name", event.target.value)} /></Field>
              <Field label={form.itemKind === "service" ? t("common.erpProductRecord.sku") : t("common.erpProductRecord.baseSku")}><Input value={form.sku} readOnly placeholder={t("common.erpProductRecord.generatedKey")} /><p className="text-xs font-normal text-muted-foreground">{form.itemKind === "product" ? t("common.erpProductRecord.productSkuHelp") : t("common.erpProductRecord.stableIdentifier")}</p></Field>
              <Field label={t("common.erpForm.item.category")}>
                <div className="flex gap-2">
                  <Select value={form.categoryKey || "__none"} onValueChange={(value) => setField("categoryKey", value === "__none" ? "" : value)}>
                    <SelectTrigger className="min-w-0 flex-1"><SelectValue placeholder={t("common.erpProductRecord.selectCategory")} /></SelectTrigger><SelectContent>
                      <SelectItem value="__none">{t("common.erpProductRecord.uncategorized")}</SelectItem>
                      {categoryReferences.map((reference) => <SelectItem key={reference.id} value={reference.key}>{reference.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" aria-label={t("common.erpProductRecord.createReference", { kind: t("common.erpForm.item.category").toLocaleLowerCase() })} onClick={() => setQuickCreateKind("category")}><Plus className="h-4 w-4" /></Button>
                </div>
              </Field>
              <Field label={t("common.erpForm.item.brand")}>
                <div className="flex gap-2">
                  <Select value={form.brandKey || "__none"} onValueChange={(value) => setField("brandKey", value === "__none" ? "" : value)}>
                    <SelectTrigger className="min-w-0 flex-1"><SelectValue placeholder={t("common.erpProductRecord.selectBrand")} /></SelectTrigger><SelectContent>
                      <SelectItem value="__none">{t("common.erpProductRecord.noBrand")}</SelectItem>
                      {brandReferences.map((reference) => <SelectItem key={reference.id} value={reference.key}>{reference.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" aria-label={t("common.erpProductRecord.createReference", { kind: t("common.erpForm.item.brand").toLocaleLowerCase() })} onClick={() => setQuickCreateKind("brand")}><Plus className="h-4 w-4" /></Button>
                </div>
              </Field>
            </div>
            <div className="mt-4 grid gap-4">
              <Field label={t("common.erpForm.item.shortDescription")}><Input value={form.shortDescription} onChange={(event) => setField("shortDescription", event.target.value)} /></Field>
              <Field label={t("common.erpForm.item.longDescription")}><Textarea rows={5} value={form.description} onChange={(event) => setField("description", event.target.value)} /></Field>
            </div>
          </section>
          <section className="rounded-xl border border-border bg-card p-5">
            <FormSectionHeader eyebrow={t("common.erpProductRecord.operationsEyebrow")} title={t("common.erpProductRecord.operations")} description={t(form.itemKind === "service" ? "common.erpProductRecord.serviceOperationsDescription" : "common.erpProductRecord.operationsDescription")} mode="expanded" responsive="auto" />
            {isProduct && isFinishedProduct && <div className="mt-5 max-w-xl">
              <Field label={t("common.erpProductRecord.sourcingMode")} required>
                <Select value={form.sourcingMode || "__none"} onValueChange={(value) => setField("sourcingMode", value === "__none" ? "" : value as CatalogSourcingMode)}>
                  <SelectTrigger><SelectValue placeholder={t("common.erpProductRecord.selectSourcingMode")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">{t("common.erpProductRecord.selectSourcingMode")}</SelectItem>
                    <SelectItem value="buy">{t("common.erpProductRecord.sourcingModes.buy")}</SelectItem>
                    <SelectItem value="make">{t("common.erpProductRecord.sourcingModes.make")}</SelectItem>
                    <SelectItem value="both">{t("common.erpProductRecord.sourcingModes.both")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>}
            {isProduct && (form.itemClass === "raw_material" || form.itemClass === "component") && <p className="mt-5 rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">{t("common.erpProductRecord.buyOnlySourcing")}</p>}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {isProduct && <label className="flex items-start gap-3 rounded-md border border-border p-3">
                <Checkbox checked={form.canPurchase} onCheckedChange={(checked) => setField("canPurchase", checked === true)} />
                <span><span className="block text-sm font-medium">{t("common.erpProductRecord.canPurchase")}</span><span className="mt-1 block text-xs text-muted-foreground">{t("common.erpProductRecord.canPurchaseDescription")}</span></span>
              </label>}
              <label className="flex items-start gap-3 rounded-md border border-border p-3">
                <Checkbox checked={form.canSell} onCheckedChange={(checked) => setField("canSell", checked === true)} />
                <span><span className="block text-sm font-medium">{t("common.erpProductRecord.canSell")}</span><span className="mt-1 block text-xs text-muted-foreground">{t("common.erpProductRecord.canSellDescription")}</span></span>
              </label>
              {isProduct && <label className="flex items-start gap-3 rounded-md border border-border p-3">
                <Checkbox checked={form.trackInventory} onCheckedChange={(checked) => setField("trackInventory", checked === true)} />
                <span><span className="block text-sm font-medium">{t("common.erpProductRecord.trackInventory")}</span><span className="mt-1 block text-xs text-muted-foreground">{t("common.erpProductRecord.trackInventoryDescription")}</span></span>
              </label>}
            </div>
          </section>
          {isPhysical && <section className="rounded-xl border border-border bg-card p-5">
            <FormSectionHeader eyebrow={t("common.erpProductRecord.specificationsEyebrow")} title={t("common.erpProductRecord.physicalInformation")} description={t("common.erpProductRecord.physicalDescription")} mode="expanded" responsive="auto" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label={t("common.erpProductRecord.barcode")}><Input value={form.barcode} onChange={(event) => setField("barcode", event.target.value)} /></Field>
              <Field label={t("common.erpProductRecord.manufacturer")}><Input value={form.manufacturer} onChange={(event) => setField("manufacturer", event.target.value)} /></Field>
              <Field label={t("common.erpProductRecord.material")}><Input value={form.material} onChange={(event) => setField("material", event.target.value)} /></Field>
              <Field label={t("common.erpProductRecord.color")}><Input value={form.color} onChange={(event) => setField("color", event.target.value)} /></Field>
              <Field label={t("common.erpProductRecord.sizeFormat")}><Input value={form.size} onChange={(event) => setField("size", event.target.value)} /></Field>
              <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
                <Field label={t("common.erpProductRecord.weight")}><Input type="number" min="0" step="0.001" value={form.weightValue} onChange={(event) => setField("weightValue", event.target.value)} /></Field>
                <Field label={t("common.erpForm.item.unit")}><Select value={form.weightUnit} onValueChange={(value) => setField("weightUnit", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="g">g</SelectItem><SelectItem value="kg">kg</SelectItem><SelectItem value="oz">oz</SelectItem><SelectItem value="lb">lb</SelectItem></SelectContent></Select></Field>
              </div>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">{t("common.erpProductRecord.dimensions")}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label={t("common.erpProductRecord.length")}><Input type="number" min="0" step="0.1" value={form.length} onChange={(event) => setField("length", event.target.value)} /></Field>
                <Field label={t("common.erpProductRecord.width")}><Input type="number" min="0" step="0.1" value={form.width} onChange={(event) => setField("width", event.target.value)} /></Field>
                <Field label={t("common.erpProductRecord.height")}><Input type="number" min="0" step="0.1" value={form.height} onChange={(event) => setField("height", event.target.value)} /></Field>
                <Field label={t("common.erpForm.item.unit")}><Select value={form.dimensionUnit} onValueChange={(value) => setField("dimensionUnit", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="mm">mm</SelectItem><SelectItem value="cm">cm</SelectItem><SelectItem value="m">m</SelectItem><SelectItem value="in">in</SelectItem></SelectContent></Select></Field>
              </div>
            </div>
          </section>}
          {(form.canSell || (isPhysical && form.canPurchase)) && <section className="rounded-xl border border-border bg-card p-5">
            <FormSectionHeader eyebrow={t("common.erpProductRecord.commercialEyebrow")} title={t("common.erpProductRecord.pricesAndCost")} description={t("common.erpProductRecord.commercialDescription")} mode="expanded" responsive="auto" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {form.canSell && <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
                <Field label={t("common.erpProductRecord.referenceSalesPrice")}><Input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setField("price", event.target.value)} /></Field>
                <Field label={t("common.erpForm.item.currency")}><Select value={form.priceCurrency} onValueChange={(value) => setField("priceCurrency", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["EUR", "USD", "GBP"].map((currency) => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}</SelectContent></Select></Field>
              </div>}
              {isPhysical && form.canPurchase && managesCostAtProduct && <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
                <Field label={t("common.erpProductRecord.purchaseCost")}><Input type="number" min="0" step="0.01" value={form.cost} onChange={(event) => setField("cost", event.target.value)} disabled={!costReadable} /></Field>
                <Field label={t("common.erpForm.item.currency")}><Select value={form.costCurrency} onValueChange={(value) => setField("costCurrency", value)} disabled={!costReadable}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["EUR", "USD", "GBP"].map((currency) => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}</SelectContent></Select></Field>
              </div>}
            </div>
            {isPhysical && form.canPurchase && <p className="mt-3 text-xs text-muted-foreground">{t(managesCostAtProduct ? "common.erpProductRecord.costNote" : "common.erpProductRecord.skuCostNote")}</p>}
          </section>}
          <section className="rounded-xl border border-border bg-card p-5">
            <FormSectionHeader eyebrow={t("common.erpProductRecord.organizationEyebrow")} title={t("common.erpProductRecord.tagsAvailability")} description={t("common.erpProductRecord.tagsDescription")} mode="expanded" responsive="auto" />
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{t("common.erpForm.item.tags")}</p>
              <Button type="button" size="sm" variant="outline" onClick={() => setQuickCreateKind("tag")}><Plus className="me-1.5 h-3.5 w-3.5" />{t("common.erpProductRecord.newTag")}</Button>
            </div>
            {tagReferences.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{tagReferences.map((reference) => <label key={reference.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"><Checkbox checked={form.tags.includes(reference.key)} onCheckedChange={(checked) => setField("tags", checked ? [...form.tags, reference.key] : form.tags.filter((tag) => tag !== reference.key))} />{reference.name}</label>)}</div> : <p className="mt-3 text-sm text-muted-foreground">{t("common.erpProductRecord.noTags")}</p>}
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label={t("common.erpForm.item.status")}><Select value={form.status} onValueChange={(value) => setField("status", value as CatalogItem["status"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">{t("common.erpForm.item.draft")}</SelectItem><SelectItem value="active">{t("common.erpForm.item.active")}</SelectItem><SelectItem value="archived">{t("common.erpForm.item.archived")}</SelectItem></SelectContent></Select></Field>
            </div>
          </section>
          </>}
        </div>
        <aside className="space-y-4">
          <section className="sticky top-5 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">{t("common.erpProductRecord.recordSummary")}</p>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{item?.key ?? t("common.erpProductRecord.generatedKey")}</p>
            <div className="mt-4 space-y-2 text-sm"><p><span className="text-muted-foreground">{t("common.erpProductRecord.type")}:</span> {form.itemKind ? t(`common.erpProductRecord.itemKinds.${form.itemKind}`) : t("common.erpProductRecord.notSet")}</p><p><span className="text-muted-foreground">SKU:</span> {form.sku || t("common.erpProductRecord.notSet")}</p><p><span className="text-muted-foreground">{t("common.erpForm.item.category")}:</span> {categoryReferences.find((reference) => reference.key === form.categoryKey)?.name ?? t("common.erpProductRecord.uncategorized")}</p><p><span className="text-muted-foreground">{t("common.erpForm.item.status")}:</span> {t(`common.erpForm.item.${form.status}`)}</p></div>
            <Button className="mt-5 w-full" type="submit" disabled={saving || !form.itemKind || (isProduct && !form.itemClass) || (isFinishedProduct && !form.sourcingMode) || (isPhysical && form.canPurchase && !costReadable)}><Save className="me-2 h-4 w-4" />{saving ? t("common.erpProductRecord.saving") : mode === "create" ? pageTitle : t("common.erpProductRecord.saveChanges")}</Button>
            {saveError && <p role="alert" className="mt-3 text-sm text-destructive">{saveError}</p>}
            {isPhysical && form.canPurchase && !costReadable && <p role="status" className="mt-3 text-xs text-muted-foreground">{t("common.erpProductRecord.costRestricted")}</p>}
          </section>
        </aside>
      </div>
    </form>
    <ReferenceQuickDrawer kind={quickCreateKind} organizationId={organizationId} references={references} onClose={() => setQuickCreateKind(null)} onCreated={onReferenceCreated} />
  </PageContainer>;
}

export function ProductConfigurationPage() {
  const t = useT();
  const navigate = useNavigate();
  const { activeOrganization } = useTenantContext();
  const organizationId = activeOrganization?.id ?? "";
  const [references, setReferences] = useState<ProductReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickCreateKind, setQuickCreateKind] = useState<ProductReferenceKind | null>(null);

  const reload = async () => {
    if (!organizationId) {
      setError(t("common.erpProductRecord.noOrganization"));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setReferences(await catalogAdapter.listProductReferences({ organizationId, includeArchived: true }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.erpProductRecord.configurationLoadError"));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void reload(); }, [organizationId]);

  const groups: { kind: ProductReferenceKind; title: string; description: string }[] = [
    { kind: "category", title: t("common.erpProductRecord.categories"), description: t("common.erpProductRecord.categoriesDescription") },
    { kind: "brand", title: t("common.erpProductRecord.brands"), description: t("common.erpProductRecord.brandsDescription") },
    { kind: "tag", title: t("common.erpForm.item.tags"), description: t("common.erpProductRecord.tagsGroupDescription") },
  ];

  return <PageContainer width="wide">
    <PageHeader
      title={t("common.erpProductRecord.configurationTitle")}
      description={t("common.erpProductRecord.configurationDescription")}
      breadcrumbs={[{ label: "ERP" }, { label: t("common.erpProductRecord.products") }, { label: t("common.erpProductRecord.configurationTitle") }]}
      actions={<Button variant="outline" onClick={() => navigate("/app/erp/products")}><ArrowLeft className="me-2 h-4 w-4" />{t("common.erpProductRecord.products")}</Button>}
    />
    {loading ? <LoadingState label={t("common.erpProductRecord.loadingConfiguration")} /> : error ? <div className="rounded-lg border border-destructive/30 p-5"><p role="alert" className="text-sm text-destructive">{error}</p><Button className="mt-3" variant="outline" onClick={() => void reload()}>{t("common.retry")}</Button></div> : (
      <div className="grid gap-5 lg:grid-cols-3">
        {groups.map((group) => {
          const groupReferences = references.filter((reference) => reference.kind === group.kind);
          return <section key={group.kind} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div><h2 className="font-semibold">{group.title}</h2><p className="mt-1 text-sm text-muted-foreground">{group.description}</p></div>
              <Button size="icon" variant="outline" aria-label={t("common.erpProductRecord.createReference", { kind: (group.kind === "category" ? t("common.erpForm.item.category") : group.kind === "brand" ? t("common.erpForm.item.brand") : t("common.erpProductRecord.tag")).toLocaleLowerCase() })} onClick={() => setQuickCreateKind(group.kind)}><Plus className="h-4 w-4" /></Button>
            </div>
            {group.kind === "category" ? (
              <CategoryTreeManager
                categories={groupReferences}
                organizationId={organizationId}
                onUpdated={(updated) => setReferences((current) => current.map((reference) => reference.id === updated.id ? updated : reference))}
              />
            ) : <div className="mt-4 divide-y divide-border">
              {groupReferences.filter((reference) => reference.status !== "archived").length ? groupReferences.filter((reference) => reference.status !== "archived").map((reference) => <div key={reference.id} className="py-3 text-sm">
                <p className="font-medium">{reference.name}</p>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{reference.key}</p>
              </div>) : <p className="py-4 text-sm text-muted-foreground">{t("common.erpProductRecord.noReferences", { group: group.title.toLocaleLowerCase() })}</p>}
            </div>}
          </section>;
        })}
      </div>
    )}
    <ReferenceQuickDrawer
      kind={quickCreateKind}
      organizationId={organizationId}
      references={references}
      onClose={() => setQuickCreateKind(null)}
      onCreated={(reference) => { setReferences((current) => [reference, ...current]); setQuickCreateKind(null); }}
    />
  </PageContainer>;
}

function CategoryTreeManager({
  categories,
  organizationId,
  onUpdated,
}: {
  categories: ProductReference[];
  organizationId: string;
  onUpdated: (category: ProductReference) => void;
}) {
  const t = useT();
  const [nameDrafts, setNameDrafts] = useState<Record<string, string>>({});
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeCategories = categories.filter((category) => category.status === "active");

  const descendantsOf = (categoryId: string) => {
    const descendants = new Set<string>();
    const pending = [categoryId];
    while (pending.length) {
      const parentId = pending.pop();
      for (const child of categories) {
        if (child.parentId === parentId && !descendants.has(child.id)) {
          descendants.add(child.id);
          pending.push(child.id);
        }
      }
    }
    return descendants;
  };

  const orderedCategories = (() => {
    const children = new Map<string | null, ProductReference[]>();
    categories.forEach((category) => {
      const key = category.parentId && categories.some((candidate) => candidate.id === category.parentId)
        ? category.parentId
        : null;
      children.set(key, [...(children.get(key) ?? []), category]);
    });
    children.forEach((siblings) => siblings.sort((left, right) => left.name.localeCompare(right.name)));
    const ordered: Array<{ category: ProductReference; depth: number }> = [];
    const visited = new Set<string>();
    const visit = (parentId: string | null, depth: number) => {
      for (const category of children.get(parentId) ?? []) {
        if (visited.has(category.id)) continue;
        visited.add(category.id);
        ordered.push({ category, depth });
        visit(category.id, depth + 1);
      }
    };
    visit(null, 0);
    categories.filter((category) => !visited.has(category.id)).forEach((category) => ordered.push({ category, depth: 0 }));
    return ordered;
  })();

  const update = async (category: ProductReference, patch: Partial<Pick<ProductReference, "name" | "parentId" | "status">>) => {
    setWorkingId(category.id);
    setError(null);
    try {
      const updated = await catalogAdapter.updateProductReference(category.id, { organizationId }, {
        expectedVersion: category.version,
        patch,
      });
      onUpdated(updated);
      setNameDrafts((current) => ({ ...current, [category.id]: updated.name }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("common.erpProductRecord.categorySaveError"));
    } finally {
      setWorkingId(null);
    }
  };

  if (!categories.length) return <p className="mt-4 py-4 text-sm text-muted-foreground">{t("common.erpProductRecord.noReferences", { group: t("common.erpProductRecord.categories").toLocaleLowerCase() })}</p>;

  return <div className="mt-4">
    {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
    <div className="divide-y divide-border">
      {orderedCategories.map(({ category, depth }) => {
        const name = nameDrafts[category.id] ?? category.name;
        const blockedParents = descendantsOf(category.id);
        const busy = workingId === category.id;
        return <div key={category.id} className="grid gap-2 py-3 sm:grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_auto] sm:items-center" style={{ paddingInlineStart: `${depth * 1.25}rem` }}>
          <div className="min-w-0">
            <Input
              aria-label={t("common.erpProductRecord.categoryName", { name: category.name })}
              value={name}
              disabled={busy || category.status === "archived"}
              onChange={(event) => setNameDrafts((current) => ({ ...current, [category.id]: event.target.value }))}
            />
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{category.key} · {t(`common.erpForm.item.${category.status}`)}</p>
          </div>
          <Select
            value={category.parentId ?? "__root"}
            disabled={busy || category.status === "archived"}
            onValueChange={(value) => void update(category, { parentId: value === "__root" ? null : value })}
          >
            <SelectTrigger aria-label={t("common.erpProductRecord.categoryParentLabel", { name: category.name })}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__root">{t("common.erpProductRecord.rootCategory")}</SelectItem>
              {activeCategories.filter((candidate) => candidate.id !== category.id && !blockedParents.has(candidate.id)).map((candidate) => (
                <SelectItem key={candidate.id} value={candidate.id}>{candidate.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            {category.status === "active" ? <>
              <Button type="button" size="icon" variant="ghost" aria-label={t("common.erpProductRecord.saveCategoryName", { name: category.name })} disabled={busy || !name.trim() || name.trim() === category.name} onClick={() => void update(category, { name })}>
                {busy ? <Save className="h-4 w-4 animate-pulse" /> : <Check className="h-4 w-4" />}
              </Button>
              <Button type="button" size="icon" variant="ghost" aria-label={t("common.erpProductRecord.archiveCategory", { name: category.name })} disabled={busy} onClick={() => void update(category, { status: "archived" })}>
                <Archive className="h-4 w-4" />
              </Button>
            </> : <Button type="button" size="icon" variant="ghost" aria-label={t("common.erpProductRecord.restoreCategory", { name: category.name })} disabled={busy} onClick={() => void update(category, { status: "active" })}>
              <RotateCcw className="h-4 w-4" />
            </Button>}
          </div>
        </div>;
      })}
    </div>
  </div>;
}

function RecordValue({ label, value, technical = false, wide = false }: { label: string; value: React.ReactNode; technical?: boolean; wide?: boolean }) {
  return <div className={wide ? "sm:col-span-2" : ""}><dt className="text-xs text-muted-foreground">{label}</dt><dd className={`mt-1 text-sm ${technical ? "font-mono" : ""}`}>{value}</dd></div>;
}

function ProductCostCard({ itemId, organizationId }: { itemId: string; organizationId: string }) {
  const t = useT();
  const [amount, setAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState("EUR");
  const [restricted, setRestricted] = useState(false);
  useEffect(() => {
    let active = true;
    void catalogAdapter.getProductCostReference({ organizationId, catalogItemId: itemId }).then((cost) => {
      if (!active) return;
      setAmount(cost?.amount ?? null);
      setCurrency(cost?.currency ?? "EUR");
    }).catch((cause) => {
      if (active && cause instanceof Error && /permission|forbidden/i.test(cause.message)) setRestricted(true);
    });
    return () => { active = false; };
  }, [itemId, organizationId]);
  return <section className="rounded-xl border border-border bg-card p-5">
    <FormSectionHeader eyebrow={t("common.erpProductRecord.internal")} title={t("common.erpProductRecord.purchaseCost")} description={t("common.erpProductRecord.costReferenceDescription")} mode="expanded" responsive="auto" />
    <p className="mt-5 text-2xl font-semibold">{restricted ? t("common.erpProductRecord.restricted") : amount == null ? t("common.erpProductRecord.notSet") : `${amount} ${currency}`}</p>
  </section>;
}
