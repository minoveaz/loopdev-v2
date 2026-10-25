import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Eye, Plus, RotateCcw, UserRound } from "lucide-react";
import type { DataTableColumn, DataTableAction } from "@/components/common/DataTable";
import { DataTable } from "@/components/common/DataTable";
import { EmptyState, LoadingState, PageContainer, PageHeader, SearchInput, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supplierAdapter, supplierItemAdapter } from "@/loopdev/domains/suppliers/adapter";
import { isSupplierItemPurchasable } from "../../../../packages/contracts/src/suppliers";
import { catalogAdapter } from "@/loopdev/domains/catalog/adapter";
import type { CatalogItem, CatalogVariant } from "@/loopdev/domains/catalog";
import { SupplierAdapterError } from "@/loopdev/domains/suppliers";
import type { SupplierItemRecord, SupplierKind, SupplierRecord, SupplierStatus } from "@/loopdev/domains/suppliers";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useTenantContext } from "@/hooks/use-tenant-context";

type SupplierForm = {
  kind: SupplierKind;
  legalName: string;
  countryCode: string;
};

type SupplierItemForm = {
  supplierItemCode: string;
  name: string;
  purchaseUnit: string;
  unitsPerStockUnit: string;
  unitPrice: string;
  currency: string;
  minimumQuantity: string;
  leadTimeDays: string;
};

const emptyForm = (): SupplierForm => ({ kind: "organization", legalName: "", countryCode: "ES" });
const emptyItemForm = (): SupplierItemForm => ({
  supplierItemCode: "",
  name: "",
  purchaseUnit: "",
  unitsPerStockUnit: "1",
  unitPrice: "",
  currency: "EUR",
  minimumQuantity: "",
  leadTimeDays: "",
});
const statusLabels: Record<SupplierStatus, string> = {
  active: "Active",
  on_hold: "On hold",
  inactive: "Inactive",
};

export default function Suppliers() {
  const { trail } = useBreadcrumbs();
  const { activeOrganization } = useTenantContext();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<SupplierRecord | null>(null);
  const [supplierItems, setSupplierItems] = useState<SupplierItemRecord[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogItem[]>([]);
  const [catalogVariants, setCatalogVariants] = useState<CatalogVariant[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [itemActionError, setItemActionError] = useState<string | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemForm, setItemForm] = useState<SupplierItemForm>(emptyItemForm);
  const [editingItem, setEditingItem] = useState<SupplierItemRecord | null>(null);
  const [itemSaving, setItemSaving] = useState(false);
  const [linkingItem, setLinkingItem] = useState<SupplierItemRecord | null>(null);
  const [selectedCatalogReference, setSelectedCatalogReference] = useState("");
  const [linkSaving, setLinkSaving] = useState(false);

  const reload = useCallback(async () => {
    if (!activeOrganization?.id) {
      setSuppliers([]);
      setLoadError("Select an organization to view suppliers.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      setSuppliers(await supplierAdapter.listSuppliers({
        organizationId: activeOrganization.id,
        includeInactive: true,
      }));
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : "Unable to load suppliers.");
    } finally {
      setLoading(false);
    }
  }, [activeOrganization?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const reloadSupplierItems = useCallback(async (supplierId: string) => {
    if (!activeOrganization?.id) return;
    setItemsLoading(true);
    setItemsError(null);
    try {
      const [items, products, variants] = await Promise.all([
        supplierItemAdapter.listSupplierItems(supplierId, {
          organizationId: activeOrganization.id,
          includeInactive: true,
        }),
        catalogAdapter.listCatalogItems({ organizationId: activeOrganization.id, includeArchived: true }),
        catalogAdapter.listVariants({ organizationId: activeOrganization.id, includeArchived: true }),
      ]);
      setSupplierItems(items);
      setCatalogProducts(products);
      setCatalogVariants(variants);
    } catch (cause) {
      setItemsError(cause instanceof Error ? cause.message : "Unable to load supplier items.");
    } finally {
      setItemsLoading(false);
    }
  }, [activeOrganization?.id]);

  useEffect(() => {
    if (!selected || !activeOrganization?.id) {
      setSupplierItems([]);
      setCatalogProducts([]);
      setCatalogVariants([]);
      return;
    }
    void reloadSupplierItems(selected.id);
  }, [activeOrganization?.id, reloadSupplierItems, selected?.id]);

  const handledLinkRef = useRef("");
  useEffect(() => {
    const supplierItemId = searchParams.get("linkSupplierItem");
    const productId = searchParams.get("linkProduct");
    const supplierId = searchParams.get("supplier");
    const expectedVersion = Number(searchParams.get("linkVersion"));
    if (!supplierItemId || !productId || !supplierId || !activeOrganization?.id || !suppliers.length) return;

    const requestKey = `${supplierItemId}:${productId}:${expectedVersion}`;
    if (handledLinkRef.current === requestKey) return;
    handledLinkRef.current = requestKey;
    const supplier = suppliers.find((item) => item.id === supplierId);
    if (!supplier) {
      setItemActionError("The supplier item could not be linked because its supplier is unavailable.");
      setSearchParams(new URLSearchParams(), { replace: true });
      return;
    }
    setSelected(supplier);
    void (async () => {
      try {
        const currentItems = await supplierItemAdapter.listSupplierItems(supplierId, {
          organizationId: activeOrganization.id,
          includeInactive: true,
        });
        const current = currentItems.find((item) => item.id === supplierItemId);
        if (!current) throw new Error("The supplier item no longer exists.");
        if (current.productId !== productId) {
          await supplierItemAdapter.linkSupplierItemToProduct(supplierItemId, {
            organizationId: activeOrganization.id,
          }, {
            productId,
            expectedVersion: Number.isFinite(expectedVersion) ? expectedVersion : current.version,
          });
        }
        setItemActionError(null);
        await reloadSupplierItems(supplierId);
      } catch (cause) {
        setItemActionError(cause instanceof Error
          ? `Product created, but the supplier item was not linked: ${cause.message}`
          : "Product created, but the supplier item was not linked.");
      } finally {
        setSearchParams(new URLSearchParams(), { replace: true });
      }
    })();
  }, [activeOrganization?.id, reloadSupplierItems, searchParams, setSearchParams, suppliers]);

  const visibleSuppliers = useMemo(() => {
    const value = query.trim().toLocaleLowerCase();
    if (!value) return suppliers;
    return suppliers.filter((supplier) =>
      `${supplier.legalName} ${supplier.countryCode} ${supplier.kind} ${statusLabels[supplier.status]}`
        .toLocaleLowerCase()
        .includes(value));
  }, [query, suppliers]);

  const saveSupplier = async () => {
    if (!activeOrganization?.id) return;
    if (!form.legalName.trim()) {
      setFormError("Enter the supplier's legal name.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await supplierAdapter.createSupplier({
        organizationId: activeOrganization.id,
        kind: form.kind,
        legalName: form.legalName,
        countryCode: form.countryCode,
      });
      setFormOpen(false);
      setForm(emptyForm());
      await reload();
    } catch (cause) {
      setFormError(cause instanceof SupplierAdapterError && cause.code === "forbidden"
        ? "You do not have permission to create suppliers."
        : cause instanceof Error ? cause.message : "Unable to create supplier.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (supplier: SupplierRecord) => {
    if (!activeOrganization?.id) return;
    setActionError(null);
    try {
      await supplierAdapter.updateSupplier(supplier.id, { organizationId: activeOrganization.id }, {
        status: supplier.status === "active" ? "on_hold" : "active",
        expectedVersion: supplier.version,
      });
      await reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to update supplier.");
    }
  };

  const deactivate = async (supplier: SupplierRecord) => {
    if (!activeOrganization?.id) return;
    setActionError(null);
    try {
      await supplierAdapter.deactivateSupplier(supplier.id, { organizationId: activeOrganization.id }, supplier.version);
      await reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to deactivate supplier.");
    }
  };

  const reactivate = async (supplier: SupplierRecord) => {
    if (!activeOrganization?.id) return;
    setActionError(null);
    try {
      await supplierAdapter.reactivateSupplier(supplier.id, { organizationId: activeOrganization.id }, supplier.version);
      await reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to reactivate supplier.");
    }
  };

  const openSupplierItemForm = (item?: SupplierItemRecord) => {
    setEditingItem(item ?? null);
    setItemActionError(null);
    setItemForm(item ? {
      supplierItemCode: item.supplierItemCode ?? "",
      name: item.name,
      purchaseUnit: item.purchaseUnit,
      unitsPerStockUnit: String(item.unitsPerStockUnit),
      unitPrice: item.unitPrice === null ? "" : String(item.unitPrice),
      currency: item.currency,
      minimumQuantity: item.minimumQuantity === null ? "" : String(item.minimumQuantity),
      leadTimeDays: item.leadTimeDays === null ? "" : String(item.leadTimeDays),
    } : emptyItemForm());
    setItemDialogOpen(true);
  };

  const saveSupplierItem = async () => {
    if (!activeOrganization?.id || !selected) return;
    const unitsPerStockUnit = Number(itemForm.unitsPerStockUnit);
    const unitPrice = itemForm.unitPrice.trim() ? Number(itemForm.unitPrice) : null;
    const minimumQuantity = itemForm.minimumQuantity.trim() ? Number(itemForm.minimumQuantity) : null;
    const leadTimeDays = itemForm.leadTimeDays.trim() ? Number(itemForm.leadTimeDays) : null;
    setItemSaving(true);
    setItemActionError(null);
    try {
      if (editingItem) {
        const updated = await supplierItemAdapter.updateSupplierItem(editingItem.id, {
          organizationId: activeOrganization.id,
        }, {
          name: itemForm.name,
          supplierItemCode: itemForm.supplierItemCode || null,
          expectedVersion: editingItem.version,
        });
        await supplierItemAdapter.updateSupplierItemTerms(editingItem.id, {
          organizationId: activeOrganization.id,
        }, {
          purchaseUnit: itemForm.purchaseUnit,
          unitsPerStockUnit,
          unitPrice,
          currency: itemForm.currency,
          minimumQuantity,
          leadTimeDays,
          expectedVersion: updated.version,
        });
      } else {
        await supplierItemAdapter.addSupplierItem({
          organizationId: activeOrganization.id,
          supplierId: selected.id,
          supplierItemCode: itemForm.supplierItemCode || null,
          name: itemForm.name,
          purchaseUnit: itemForm.purchaseUnit,
          unitsPerStockUnit,
          unitPrice,
          currency: itemForm.currency,
          minimumQuantity,
          leadTimeDays,
        });
      }
      setItemDialogOpen(false);
      await reloadSupplierItems(selected.id);
    } catch (cause) {
      setItemActionError(cause instanceof Error ? cause.message : "Unable to save supplier item.");
      if (selected) await reloadSupplierItems(selected.id);
    } finally {
      setItemSaving(false);
    }
  };

  const linkSupplierItem = async () => {
    if (!activeOrganization?.id || !linkingItem || !selectedCatalogReference) return;
    const [kind, id] = selectedCatalogReference.split(":", 2);
    setLinkSaving(true);
    setItemActionError(null);
    try {
      await supplierItemAdapter.linkSupplierItemToProduct(linkingItem.id, {
        organizationId: activeOrganization.id,
      }, {
        ...(kind === "variant" ? { variantId: id } : { productId: id }),
        expectedVersion: linkingItem.version,
      });
      setLinkingItem(null);
      setSelectedCatalogReference("");
      await reloadSupplierItems(linkingItem.supplierId);
    } catch (cause) {
      setItemActionError(cause instanceof Error ? cause.message : "Unable to link supplier item.");
    } finally {
      setLinkSaving(false);
    }
  };

  const changeSupplierItemStatus = async (item: SupplierItemRecord, nextStatus: SupplierItemRecord["status"]) => {
    if (!activeOrganization?.id) return;
    setItemActionError(null);
    try {
      await supplierItemAdapter.updateSupplierItem(item.id, { organizationId: activeOrganization.id }, {
        status: nextStatus,
        expectedVersion: item.version,
      });
      await reloadSupplierItems(item.supplierId);
    } catch (cause) {
      setItemActionError(cause instanceof Error ? cause.message : "Unable to update supplier item.");
    }
  };

  const startProductCreation = async (item: SupplierItemRecord) => {
    if (!activeOrganization?.id) return;
    try {
      const handoff = await supplierItemAdapter.startProductCreationFromSupplierItem(item.id, {
        organizationId: activeOrganization.id,
      });
      setSelected(null);
      navigate("/app/erp/products/new", {
        state: { supplierProductHandoff: handoff },
      });
    } catch (cause) {
      setItemActionError(cause instanceof Error ? cause.message : "Unable to start product creation.");
    }
  };

  const columns: DataTableColumn<SupplierRecord>[] = [
    {
      key: "legalName",
      header: "Supplier",
      sortable: true,
      cell: (supplier) => (
        <button type="button" className="font-medium text-primary hover:underline" onClick={() => setSelected(supplier)}>
          {supplier.legalName}
        </button>
      ),
    },
    { key: "kind", header: "Type", cell: (supplier) => supplier.kind === "organization" ? "Organization" : "Individual" },
    { key: "countryCode", header: "Country", cell: (supplier) => supplier.countryCode },
    {
      key: "status",
      header: "Status",
      cell: (supplier) => <StatusBadge tone={supplier.status === "active" ? "success" : supplier.status === "on_hold" ? "warning" : "neutral"}>{statusLabels[supplier.status]}</StatusBadge>,
    },
  ];
  const rowActions: DataTableAction<SupplierRecord>[] = [
    { label: "View details", icon: Eye, onClick: setSelected },
    { label: "Put on hold / resume", onClick: (supplier) => void changeStatus(supplier), hidden: (supplier) => supplier.status === "inactive" },
    { label: "Deactivate", onClick: (supplier) => void deactivate(supplier), destructive: true, hidden: (supplier) => supplier.status === "inactive" },
    { label: "Reactivate", icon: RotateCcw, onClick: (supplier) => void reactivate(supplier), hidden: (supplier) => supplier.status !== "inactive" },
  ];

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Suppliers"
        description="Manage commercial suppliers separately from CRM contacts and the product catalog."
        breadcrumbs={trail.length ? trail : [{ label: "ERP" }, { label: "Suppliers" }]}
        actions={<Button onClick={() => { setForm(emptyForm()); setFormError(null); setFormOpen(true); }}><Plus className="me-2 h-4 w-4" />New supplier</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={query} onValueChange={setQuery} placeholder="Search suppliers" size="sm" containerClassName="w-full sm:w-72" />
        <p className="text-sm text-muted-foreground">{visibleSuppliers.length} suppliers</p>
      </div>

      {actionError && <p role="alert" className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{actionError}</p>}
      {loading ? (
        <LoadingState label="Loading suppliers" />
      ) : loadError ? (
        <EmptyState title="Unable to load suppliers" description={loadError} action={<Button variant="outline" onClick={() => void reload()}>Retry</Button>} />
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable
              data={visibleSuppliers}
              columns={columns}
              rowActions={rowActions}
              initialSort={{ key: "legalName", dir: "asc" }}
              emptyTitle="No suppliers yet"
              emptyDescription="Add a supplier to start building your purchasing directory."
            />
          </div>
          <div className="grid gap-3 md:hidden">
            {visibleSuppliers.length ? visibleSuppliers.map((supplier) => (
              <article key={supplier.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <button type="button" className="text-left font-semibold text-foreground" onClick={() => setSelected(supplier)}>{supplier.legalName}</button>
                  <StatusBadge tone={supplier.status === "active" ? "success" : supplier.status === "on_hold" ? "warning" : "neutral"}>{statusLabels[supplier.status]}</StatusBadge>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  {supplier.kind === "organization" ? <Building2 className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                  {supplier.kind === "organization" ? "Organization" : "Individual"} · {supplier.countryCode}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {supplier.status === "inactive" ? (
                    <Button size="sm" variant="outline" onClick={() => void reactivate(supplier)}>Reactivate</Button>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => void changeStatus(supplier)}>{supplier.status === "active" ? "Put on hold" : "Resume"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => void deactivate(supplier)}>Deactivate</Button>
                    </>
                  )}
                </div>
              </article>
            )) : <EmptyState title="No suppliers found" description={query ? "Try a different search." : "Add a supplier to start building your purchasing directory."} />}
          </div>
        </>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New supplier</DialogTitle>
            <DialogDescription>Tax profile fields will be added after the country rules are validated.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-legal-name">Legal name</Label>
              <Input id="supplier-legal-name" autoComplete="organization" value={form.legalName} onChange={(event) => setForm((current) => ({ ...current, legalName: event.target.value }))} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplier-kind">Supplier type</Label>
                <Select value={form.kind} onValueChange={(value: SupplierKind) => setForm((current) => ({ ...current, kind: value }))}>
                  <SelectTrigger id="supplier-kind"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organization">Organization</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-country">Country</Label>
                <Select value={form.countryCode} onValueChange={(value) => setForm((current) => ({ ...current, countryCode: value }))}>
                  <SelectTrigger id="supplier-country"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ES">Spain</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CO">Colombia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={() => void saveSupplier()} disabled={saving}>{saving ? "Saving…" : "Create supplier"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={selected !== null && !itemDialogOpen && linkingItem === null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selected?.legalName}</DialogTitle>
            <DialogDescription>Supplier record and purchasing assortment</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div><dt className="text-muted-foreground">Type</dt><dd className="mt-1 font-medium">{selected.kind === "organization" ? "Organization" : "Individual"}</dd></div>
                <div><dt className="text-muted-foreground">Country</dt><dd className="mt-1 font-medium">{selected.countryCode}</dd></div>
                <div><dt className="text-muted-foreground">Status</dt><dd className="mt-1 font-medium">{statusLabels[selected.status]}</dd></div>
                <div><dt className="text-muted-foreground">Record version</dt><dd className="mt-1 font-medium">{selected.version}</dd></div>
              </dl>

              <section aria-labelledby="supplier-items-heading" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                  <div>
                    <h3 id="supplier-items-heading" className="font-semibold">Supplier items</h3>
                    <p className="text-sm text-muted-foreground">Offers from this supplier linked to your product catalog.</p>
                  </div>
                  <Button size="sm" onClick={() => openSupplierItemForm()}><Plus className="me-2 h-4 w-4" />Add item</Button>
                </div>
                {itemActionError && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{itemActionError}</p>}
                {itemsLoading ? <LoadingState label="Loading supplier items" /> : itemsError ? (
                  <EmptyState title="Unable to load supplier items" description={itemsError} action={<Button size="sm" variant="outline" onClick={() => void reloadSupplierItems(selected.id)}>Retry</Button>} />
                ) : supplierItems.length ? (
                  <div className="space-y-3">
                    {supplierItems.map((item) => {
                      const linkedProduct = item.productId
                        ? catalogProducts.find((product) => product.id === item.productId)
                        : item.variantId
                          ? catalogProducts.find((product) => product.id === catalogVariants.find((variant) => variant.id === item.variantId)?.catalogItemId)
                          : null;
                      const linkedVariant = item.variantId ? catalogVariants.find((variant) => variant.id === item.variantId) : null;
                      const linkedOrganizationId = item.productId
                        ? linkedProduct?.organizationId ?? null
                        : linkedVariant?.organizationId ?? null;
                      const purchasable = isSupplierItemPurchasable(item, linkedOrganizationId);
                      return (
                        <article key={item.id} className="rounded-lg border border-border p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-medium">{item.name}</h4>
                                <StatusBadge tone={item.status === "active" ? "success" : item.status === "draft" ? "warning" : "neutral"}>{item.status}</StatusBadge>
                                {purchasable
                                  ? <StatusBadge tone="success">Order eligible</StatusBadge>
                                  : <StatusBadge tone="neutral">Not order eligible</StatusBadge>}
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {item.supplierItemCode ? `Code ${item.supplierItemCode} · ` : ""}
                                {item.purchaseUnit} = {item.unitsPerStockUnit} stock units
                                {item.unitPrice !== null ? ` · ${item.unitPrice.toFixed(2)} ${item.currency}` : ""}
                                {item.minimumQuantity !== null ? ` · Min. ${item.minimumQuantity}` : ""}
                                {item.leadTimeDays !== null ? ` · ${item.leadTimeDays} day lead time` : ""}
                              </p>
                              <p className="mt-1 text-sm">
                                {linkedProduct
                                  ? <>Catalog product: <span className="font-medium">{linkedProduct.name}{linkedVariant ? ` / ${linkedVariant.name}` : ""}</span></>
                                  : <span className="text-muted-foreground">Not linked to a catalog product</span>}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="outline" onClick={() => openSupplierItemForm(item)}>Edit</Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setLinkingItem(item);
                                setSelectedCatalogReference(item.productId ? `product:${item.productId}` : item.variantId ? `variant:${item.variantId}` : "");
                              }}>{item.productId || item.variantId ? "Change link" : "Link product"}</Button>
                              {!item.productId && !item.variantId && (
                                <Button size="sm" variant="outline" onClick={() => void startProductCreation(item)}>Create product</Button>
                              )}
                              {item.status === "active" ? (
                                <Button size="sm" variant="ghost" onClick={() => void changeSupplierItemStatus(item, "inactive")}>Deactivate</Button>
                              ) : item.status === "inactive" ? (
                                <Button size="sm" variant="ghost" disabled={!item.productId && !item.variantId} onClick={() => void changeSupplierItemStatus(item, "active")}>Reactivate</Button>
                              ) : (
                                <Button size="sm" variant="ghost" disabled={!item.productId && !item.variantId} onClick={() => void changeSupplierItemStatus(item, "active")}>Activate</Button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState title="No supplier items yet" description="Add a supplier item to capture its purchase terms, then link it to a catalog product." />
                )}
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit supplier item" : "Add supplier item"}</DialogTitle>
            <DialogDescription>Unlinked items stay as drafts and cannot be used for purchasing.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="supplier-item-name">Item name</Label>
              <Input id="supplier-item-name" autoComplete="off" value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-item-code">Supplier item code</Label>
              <Input id="supplier-item-code" autoComplete="off" value={itemForm.supplierItemCode} onChange={(event) => setItemForm((current) => ({ ...current, supplierItemCode: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-item-unit">Purchase unit</Label>
              <Input id="supplier-item-unit" value={itemForm.purchaseUnit} onChange={(event) => setItemForm((current) => ({ ...current, purchaseUnit: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-item-conversion">Units per stock unit</Label>
              <Input id="supplier-item-conversion" type="number" min="0.000001" step="any" value={itemForm.unitsPerStockUnit} onChange={(event) => setItemForm((current) => ({ ...current, unitsPerStockUnit: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-item-price">Unit price</Label>
              <Input id="supplier-item-price" type="number" min="0" step="0.01" value={itemForm.unitPrice} onChange={(event) => setItemForm((current) => ({ ...current, unitPrice: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-item-currency">Currency</Label>
              <Select value={itemForm.currency} onValueChange={(value) => setItemForm((current) => ({ ...current, currency: value }))}>
                <SelectTrigger id="supplier-item-currency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-item-minimum">Minimum quantity</Label>
              <Input id="supplier-item-minimum" type="number" min="0.001" step="any" value={itemForm.minimumQuantity} onChange={(event) => setItemForm((current) => ({ ...current, minimumQuantity: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-item-lead-time">Lead time (days)</Label>
              <Input id="supplier-item-lead-time" type="number" min="0" step="1" value={itemForm.leadTimeDays} onChange={(event) => setItemForm((current) => ({ ...current, leadTimeDays: event.target.value }))} />
            </div>
            {itemActionError && <p role="alert" className="text-sm text-destructive sm:col-span-2">{itemActionError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void saveSupplierItem()} disabled={itemSaving || !itemForm.name.trim() || !itemForm.purchaseUnit.trim()}>{itemSaving ? "Saving…" : editingItem ? "Save item" : "Add item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkingItem !== null} onOpenChange={(open) => { if (!open) setLinkingItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link supplier item</DialogTitle>
            <DialogDescription>Select a Product or variant from this organization. Product data remains owned by the catalog.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="supplier-item-product">Catalog product or variant</Label>
            <Select value={selectedCatalogReference} onValueChange={setSelectedCatalogReference}>
              <SelectTrigger id="supplier-item-product"><SelectValue placeholder="Choose a product or variant" /></SelectTrigger>
              <SelectContent>
                {catalogProducts.filter((product) => product.status !== "archived").map((product) => (
                  <SelectItem key={`product:${product.id}`} value={`product:${product.id}`}>{product.name}</SelectItem>
                ))}
                {catalogVariants.filter((variant) => variant.status !== "archived").map((variant) => {
                  const product = catalogProducts.find((item) => item.id === variant.catalogItemId);
                  return product ? <SelectItem key={`variant:${variant.id}`} value={`variant:${variant.id}`}>{product.name} / {variant.name}</SelectItem> : null;
                })}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkingItem(null)}>Cancel</Button>
            <Button onClick={() => void linkSupplierItem()} disabled={linkSaving || !selectedCatalogReference}>{linkSaving ? "Linking…" : "Save link"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
