import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, WandSparkles } from "lucide-react";
import { FormSectionHeader, LoadingState, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { catalogAdapter, CatalogAdapterError } from "@/loopdev/domains/catalog/adapter";
import type { CatalogItem, CatalogRecordStatus, CatalogVariant, ProductReference } from "@/loopdev/domains/catalog";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { useT } from "@/i18n";

type SkuDraft = {
  localId: string;
  variantId: string | null;
  name: string;
  sku: string;
  color: string;
  size: string;
  categoryKey: string;
  status: CatalogRecordStatus;
  metadata: Record<string, unknown>;
  costAmount: string;
  costCurrency: string;
  costVersion: number;
  costMutationKey: string | null;
};

const splitValues = (value: string) => Array.from(new Map(
  value.split(/[,\n]/).map((entry) => entry.trim()).filter(Boolean).map((entry) => [entry.toLocaleLowerCase(), entry]),
).values());
const combinationKey = (color: string, size: string) => `${color.trim().toLocaleLowerCase()}|${size.trim().toLocaleLowerCase()}`;
const toDraft = (variant: CatalogVariant): SkuDraft => ({
  localId: variant.id,
  variantId: variant.id,
  name: variant.name,
  sku: variant.sku,
  color: variant.attributes.color ?? "",
  size: variant.attributes.size ?? "",
  categoryKey: typeof variant.metadata.categoryKey === "string" ? variant.metadata.categoryKey : "",
  status: variant.status,
  metadata: variant.metadata,
  costAmount: "",
  costCurrency: "EUR",
  costVersion: 0,
  costMutationKey: null,
});

export function ProductSkuManagerPage({ productId }: { productId: string }) {
  const t = useT();
  const navigate = useNavigate();
  const { activeOrganization } = useTenantContext();
  const organizationId = activeOrganization?.id ?? "";
  const translateRef = useRef(t);
  translateRef.current = t;
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [references, setReferences] = useState<ProductReference[]>([]);
  const [rows, setRows] = useState<SkuDraft[]>([]);
  const [colors, setColors] = useState("");
  const [sizes, setSizes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [costManagementAvailable, setCostManagementAvailable] = useState(true);

  useEffect(() => {
    let active = true;
    if (!organizationId) {
      setError(translateRef.current("common.erpProductRecord.noOrganization"));
      setLoading(false);
      return () => { active = false; };
    }
    void Promise.all([
      catalogAdapter.getCatalogItem(productId, { organizationId }),
      catalogAdapter.listProductReferences({ organizationId, kind: "category" }),
      catalogAdapter.listVariants({ organizationId, catalogItemId: productId, includeArchived: true }),
    ]).then(async ([loadedItem, loadedReferences, loadedVariants]) => {
      if (!active) return;
      if (!loadedItem) {
        setError(translateRef.current("common.erpProductRecord.productNotFound"));
        return;
      }
      if (loadedItem.type === "service" || loadedItem.metadata.itemKind === "service") {
        setError(translateRef.current("common.erpProductRecord.skusProductOnly"));
        return;
      }
      setItem(loadedItem);
      setReferences(loadedReferences);
      let costsByVariant = new Map<string, Awaited<ReturnType<typeof catalogAdapter.getProductCostReference>>>();
      if (loadedItem.metadata.canPurchase === true) {
        try {
          const costs = await Promise.all(loadedVariants.map((variant) =>
            catalogAdapter.getProductCostReference({ organizationId, catalogItemId: loadedItem.id, variantId: variant.id })));
          costsByVariant = new Map(loadedVariants.map((variant, index) => [variant.id, costs[index]]));
        } catch (cause) {
          if (cause instanceof CatalogAdapterError && cause.code === "forbidden") {
            setCostManagementAvailable(false);
          } else {
            throw cause;
          }
        }
      } else {
        setCostManagementAvailable(false);
      }
      if (!active) return;
      setRows(loadedVariants.map((variant) => {
        const draft = toDraft(variant);
        const cost = costsByVariant.get(variant.id);
        return {
          ...draft,
          costAmount: cost?.amount == null ? "" : String(cost.amount),
          costCurrency: cost?.currency ?? "EUR",
          costVersion: cost?.version ?? 0,
          costMutationKey: null,
        };
      }));
      const colorValues = Array.from(new Set(loadedVariants.map((variant) => variant.attributes.color).filter(Boolean)));
      const sizeValues = Array.from(new Set(loadedVariants.map((variant) => variant.attributes.size).filter(Boolean)));
      setColors(colorValues.join(", "));
      setSizes(sizeValues.join(", "));
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : translateRef.current("common.erpProductRecord.loadError"));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [organizationId, productId]);

  const categoryOptions = useMemo(() => references.filter((reference) => reference.kind === "category"), [references]);
  const updateRow = (localId: string, patch: Partial<SkuDraft>) => {
    setRows((current) => current.map((row) => row.localId === localId
      ? {
        ...row,
        ...patch,
        ...(patch.costAmount !== undefined || patch.costCurrency !== undefined ? { costMutationKey: null } : {}),
      }
      : row));
    setError(null);
    setSuccess(false);
  };

  const generateCombinations = () => {
    const colorValues = splitValues(colors);
    const sizeValues = splitValues(sizes);
    if (!colorValues.length && !sizeValues.length) {
      setError(t("common.erpProductRecord.variantOptionsRequired"));
      return;
    }
    if (!window.crypto?.randomUUID) {
      setError(t("common.erpProductRecord.variantGenerationError"));
      return;
    }
    const combinations = colorValues.length && sizeValues.length
      ? colorValues.flatMap((color) => sizeValues.map((size) => ({ color, size })))
      : colorValues.length
        ? colorValues.map((color) => ({ color, size: "" }))
        : sizeValues.map((size) => ({ color: "", size }));
    const additions = combinations.map(({ color, size }): SkuDraft => {
      const name = [color, size].filter(Boolean).join(" / ");
      return {
        localId: window.crypto.randomUUID(),
        variantId: null,
        name,
        sku: "",
        color,
        size,
        categoryKey: item?.categoryKey ?? "",
        status: "draft",
        metadata: {},
        costAmount: "",
        costCurrency: "EUR",
        costVersion: 0,
        costMutationKey: null,
      };
    });
    setRows((current) => {
      const existingKeys = new Set(current.map((row) => combinationKey(row.color, row.size)));
      return [
        ...current,
        ...additions.filter((row) => !existingKeys.has(combinationKey(row.color, row.size))),
      ];
    });
    setError(null);
    setSuccess(false);
  };

  const save = async () => {
    if (!item || !organizationId) return;
    if (rows.some((row) => !row.name.trim())) {
      setError(t("common.erpProductRecord.variantNameRequired"));
      return;
    }
    if (rows.some((row) => row.status === "active" && !row.categoryKey)) {
      setError(t("common.erpProductRecord.activeCategoryRequired"));
      return;
    }
    if (rows.some((row) => row.status === "active" && item.status !== "active")) {
      setError(t("common.erpProductRecord.activateProductFirst"));
      return;
    }
    if (rows.some((row) => row.costAmount.trim() && (
      !Number.isFinite(Number(row.costAmount))
      || Number(row.costAmount) < 0
      || Math.round(Number(row.costAmount) * 100) !== Number(row.costAmount) * 100
    ))) {
      setError(t("common.erpProductRecord.invalidCost"));
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      for (const row of rows) {
        const attributes = Object.fromEntries(
          [["color", row.color], ["size", row.size]].filter(([, value]) => Boolean(value.trim())),
        ) as Record<string, string>;
        const input = {
          organizationId,
          workspaceId: null,
          catalogItemId: item.id,
          name: row.name.trim(),
          status: row.status,
          attributes,
          metadata: { ...row.metadata, categoryKey: row.categoryKey || null },
        };
        const saved = row.variantId
          ? await catalogAdapter.updateVariant(row.variantId, { organizationId }, input)
          : await catalogAdapter.createVariant(input);
        setRows((current) => current.map((currentRow) => currentRow.localId === row.localId
          ? { ...currentRow, variantId: saved.id, sku: saved.sku, name: saved.name, metadata: saved.metadata }
          : currentRow));
        let costVersion = row.costVersion;
        if (item.metadata.canPurchase === true && costManagementAvailable && (row.costAmount.trim() || row.costVersion > 0)) {
          const idempotencyKey = row.costMutationKey ?? window.crypto?.randomUUID?.();
          if (!idempotencyKey) throw new Error(t("common.erpProductRecord.costMutationUnavailable"));
          setRows((current) => current.map((currentRow) => currentRow.localId === row.localId
            ? { ...currentRow, costMutationKey: idempotencyKey }
            : currentRow));
          const cost = await catalogAdapter.saveProductCostReference({
            organizationId,
            catalogItemId: item.id,
            variantId: saved.id,
            amount: row.costAmount.trim() ? Number(row.costAmount) : null,
            currency: row.costCurrency,
            expectedVersion: row.costVersion,
            idempotencyKey,
          });
          costVersion = cost.version;
          setRows((current) => current.map((currentRow) => currentRow.localId === row.localId
            ? { ...currentRow, costMutationKey: null }
            : currentRow));
        }
        setRows((current) => current.map((currentRow) => currentRow.localId === row.localId
          ? { ...currentRow, variantId: saved.id, sku: saved.sku, name: saved.name, metadata: saved.metadata, costVersion }
          : currentRow));
      }
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof CatalogAdapterError && cause.code === "conflict" && /SKU|already exists/i.test(cause.message)
        ? t("common.erpProductRecord.duplicateVariantSku")
        : cause instanceof Error ? cause.message : t("common.erpProductRecord.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageContainer width="wide"><LoadingState label={t("common.erpProductRecord.loadingProduct")} /></PageContainer>;
  if (error && !item) return <PageContainer width="narrow"><div className="rounded-lg border border-destructive/30 p-5"><p role="alert" className="text-sm text-destructive">{error}</p><Button className="mt-4" variant="outline" onClick={() => navigate("/app/erp/products")}><ArrowLeft className="me-2 h-4 w-4" />{t("common.erpProductRecord.backToProducts")}</Button></div></PageContainer>;
  if (!item) return null;

  return <PageContainer width="wide">
    <PageHeader
      title={t("common.erpProductRecord.manageSkus", { name: item.name })}
      description={t("common.erpProductRecord.manageSkusDescription")}
      breadcrumbs={[{ label: "ERP" }, { label: t("common.erpProductRecord.products") }, { label: item.name }, { label: t("common.erpProductRecord.skus") }]}
      actions={<Button variant="outline" asChild><Link to={`/app/erp/products/${item.id}`}><ArrowLeft className="me-2 h-4 w-4" />{t("common.erpProductRecord.productDetails")}</Link></Button>}
    />
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-5">
        <FormSectionHeader eyebrow={t("common.erpProductRecord.variants")} title={t("common.erpProductRecord.generateSkusTitle")} description={t("common.erpProductRecord.generateSkusDescription")} mode="expanded" responsive="auto" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm font-medium">{t("common.erpProductRecord.colors")}<Input value={colors} onChange={(event) => setColors(event.target.value)} placeholder={t("common.erpProductRecord.colorsPlaceholder")} /></label>
          <label className="block space-y-1.5 text-sm font-medium">{t("common.erpProductRecord.sizes")}<Input value={sizes} onChange={(event) => setSizes(event.target.value)} placeholder={t("common.erpProductRecord.sizesPlaceholder")} /></label>
        </div>
        <Button className="mt-4" variant="outline" onClick={generateCombinations}><WandSparkles className="me-2 h-4 w-4" />{t("common.erpProductRecord.generateCombinations")}</Button>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <FormSectionHeader eyebrow={t("common.erpProductRecord.variants")} title={t("common.erpProductRecord.skus")} description={t("common.erpProductRecord.skusDescription")} mode="expanded" responsive="auto" />
          <Button variant="outline" onClick={() => {
            if (!window.crypto?.randomUUID) {
              setError(t("common.erpProductRecord.variantGenerationError"));
              return;
            }
            setRows((current) => [...current, {
              localId: window.crypto.randomUUID(),
              variantId: null,
              name: "",
              sku: "",
              color: "",
              size: "",
              categoryKey: item.categoryKey ?? "",
              status: "draft",
              metadata: {},
              costAmount: "",
              costCurrency: "EUR",
              costVersion: 0,
              costMutationKey: null,
            }]);
          }}><Plus className="me-2 h-4 w-4" />{t("common.erpProductRecord.addSku")}</Button>
        </div>
        {error && <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
        {success && <p role="status" className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">{t("common.erpProductRecord.skusSaved")}</p>}
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t("common.erpProductRecord.color")}</TableHead>
              <TableHead>{t("common.erpProductRecord.size")}</TableHead>
              <TableHead>{t("common.erpProductRecord.sku")}</TableHead>
              <TableHead>{t("common.erpForm.item.category")}</TableHead>
              <TableHead>{t("common.erpForm.item.status")}</TableHead>
              {item.metadata.canPurchase === true && costManagementAvailable && <>
                <TableHead>{t("common.erpProductRecord.purchaseCost")}</TableHead>
                <TableHead>{t("common.erpForm.item.currency")}</TableHead>
              </>}
            </TableRow></TableHeader>
            <TableBody>{rows.map((row) => <TableRow key={row.localId}>
              <TableCell><Input aria-label={`${t("common.erpProductRecord.color")} ${row.name || row.sku}`} value={row.color} onChange={(event) => updateRow(row.localId, { color: event.target.value, name: [event.target.value, row.size].filter(Boolean).join(" / ") })} /></TableCell>
              <TableCell><Input aria-label={`${t("common.erpProductRecord.size")} ${row.name || row.sku}`} value={row.size} onChange={(event) => updateRow(row.localId, { size: event.target.value, name: [row.color, event.target.value].filter(Boolean).join(" / ") })} /></TableCell>
              <TableCell><Input aria-label={`${t("common.erpProductRecord.sku")} ${row.name || row.sku}`} value={row.sku} placeholder={t("common.erpProductRecord.generatedKey")} readOnly /></TableCell>
              <TableCell><Select value={row.categoryKey || "__none"} onValueChange={(value) => updateRow(row.localId, { categoryKey: value === "__none" ? "" : value })}>
                <SelectTrigger aria-label={`${t("common.erpForm.item.category")} ${row.name || row.sku}`}><SelectValue placeholder={t("common.erpProductRecord.selectCategory")} /></SelectTrigger>
                <SelectContent><SelectItem value="__none">{t("common.erpProductRecord.uncategorized")}</SelectItem>{categoryOptions.map((category) => <SelectItem key={category.id} value={category.key}>{category.name}</SelectItem>)}</SelectContent>
              </Select></TableCell>
              <TableCell><Select value={row.status} onValueChange={(value) => updateRow(row.localId, { status: value as CatalogRecordStatus })}>
                <SelectTrigger aria-label={`${t("common.erpForm.item.status")} ${row.name || row.sku}`}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="draft">{t("common.erpForm.item.draft")}</SelectItem><SelectItem value="active">{t("common.erpForm.item.active")}</SelectItem><SelectItem value="archived">{t("common.erpForm.item.archived")}</SelectItem></SelectContent>
              </Select></TableCell>
              {item.metadata.canPurchase === true && costManagementAvailable && <>
                <TableCell><Input aria-label={`${t("common.erpProductRecord.purchaseCost")} ${row.name || row.sku}`} type="number" min="0" step="0.01" value={row.costAmount} onChange={(event) => updateRow(row.localId, { costAmount: event.target.value })} /></TableCell>
                <TableCell><Select value={row.costCurrency} onValueChange={(value) => updateRow(row.localId, { costCurrency: value })}>
                  <SelectTrigger aria-label={`${t("common.erpForm.item.currency")} ${row.name || row.sku}`}><SelectValue /></SelectTrigger>
                  <SelectContent>{["EUR", "USD", "GBP"].map((currency) => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}</SelectContent>
                </Select></TableCell>
              </>}
            </TableRow>)}</TableBody>
          </Table>
        </div>
        {!rows.length && <p className="mt-4 text-sm text-muted-foreground">{t("common.erpProductRecord.noSkus")}</p>}
        <div className="mt-5 flex justify-end"><Button onClick={() => void save()} disabled={saving || !rows.length}>{saving ? t("common.erpProductRecord.savingSkus") : t("common.erpProductRecord.saveSkus")}</Button></div>
      </section>
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><StatusBadge tone={item.status === "active" ? "success" : "warning"} dot>{t(`common.erpForm.item.${item.status}`)}</StatusBadge>{t("common.erpProductRecord.sourcingInherited")}</div>
    </div>
  </PageContainer>;
}
