import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "@/i18n";
import { ProductSkuManagerPage } from "@/loopdev/pages/erp/ProductSkuManagerPage";
import { ProductRecordPage } from "@/loopdev/pages/erp/ProductRecordPages";
import { localCatalogAdapter } from "@/loopdev/domains/catalog";
import {
  localCatalogItemsStore,
  localCatalogItemKeyCountersStore,
  localCatalogSkuCountersStore,
  localCatalogVariantsStore,
  localOrganizationCatalogsStore,
  localProductCostMutationsStore,
  localProductCostReferencesStore,
  localProductReferencesStore,
} from "@/loopdev/domains/catalog/data/localCatalog";

const organizationId = "local-development-organization";

vi.mock("@/hooks/use-tenant-context", () => ({
  useTenantContext: () => ({
    activeOrganization: { id: organizationId },
  }),
}));

describe("ERP product SKU manager", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localCatalogItemsStore.reset();
    localCatalogItemKeyCountersStore.reset();
    localCatalogSkuCountersStore.reset();
    localCatalogVariantsStore.reset();
    localOrganizationCatalogsStore.reset();
    localProductCostMutationsStore.reset();
    localProductCostReferencesStore.reset();
    localProductReferencesStore.reset();
    window.localStorage.setItem("rivera:ui:language", JSON.stringify("en"));
  });

  it("creates a product family in the product form and persists its color-size SKUs", async () => {
    let uuid = 0;
    Object.defineProperty(window.crypto, "randomUUID", {
      configurable: true,
      value: () => `flow-uuid-${++uuid}`,
    });
    const productForm = render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/app/erp/products/new"]}>
          <ProductRecordPage mode="create" itemId={null} />
        </MemoryRouter>
      </I18nProvider>,
    );

    fireEvent.click(within(screen.getByRole("group", { name: "What are you managing?" })).getByRole("button", { name: /product/i }));
    fireEvent.click(screen.getByRole("combobox", { name: "Product type" }));
    fireEvent.click(await screen.findByRole("option", { name: "Finished product" }));
    fireEvent.click(screen.getByRole("combobox", { name: "How it is sourced" }));
    fireEvent.click(await screen.findByRole("option", { name: "Purchased" }));
    fireEvent.change(screen.getByLabelText(/Product name/), { target: { value: "Mock variant product" } });
    fireEvent.click(screen.getByRole("button", { name: "Create product" }));

    const item = await waitFor(() => {
      const created = localCatalogItemsStore.list().find((catalogItem) => catalogItem.name === "Mock variant product");
      if (!created) throw new Error("Mock product was not created");
      return created;
    });
    expect(item).toMatchObject({
      sku: expect.stringMatching(/^\d+$/),
      type: "physical_product",
      metadata: { itemKind: "product", itemClass: "finished_product", sourcingMode: "buy" },
    });
    productForm.unmount();

    render(
      <I18nProvider>
        <MemoryRouter initialEntries={[`/app/erp/products/${item.id}/skus`]}>
          <ProductSkuManagerPage productId={item.id} />
        </MemoryRouter>
      </I18nProvider>,
    );
    fireEvent.change(await screen.findByLabelText("Colors"), { target: { value: "Navy, Sand" } });
    fireEvent.change(screen.getByLabelText("Sizes"), { target: { value: "XS, M" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate combinations" }));
    fireEvent.click(screen.getByRole("button", { name: "Save SKUs" }));

    await waitFor(() => {
      const itemVariants = localCatalogVariantsStore.list().filter((variant) => variant.catalogItemId === item.id);
      expect(itemVariants).toHaveLength(4);
      expect(itemVariants.every((variant) => /^\d+$/.test(variant.sku))).toBe(true);
      expect(new Set(itemVariants.map((variant) => variant.sku)).size).toBe(4);
    });
    expect(localCatalogItemsStore.get(item.id)?.sku).toBe("");
    expect(await screen.findByRole("status")).toHaveTextContent("SKUs saved.");
  });

  it("generates one persisted SKU for each color and size combination", async () => {
    let uuid = 0;
    Object.defineProperty(window.crypto, "randomUUID", {
      configurable: true,
      value: () => `test-uuid-${++uuid}`,
    });
    const category = await localCatalogAdapter.createProductReference({
      organizationId,
      kind: "category",
      key: "toys",
      name: "Toys",
      parentId: null,
    });
    const item = await localCatalogAdapter.createCatalogItem({
      organizationId,
      catalogId: "catalog_products",
      name: "Miau toy",
      type: "physical_product",
      categoryKey: category.key,
      status: "draft",
      metadata: { itemKind: "product", itemClass: "finished_product", canSell: true },
    });

    render(
      <I18nProvider>
        <MemoryRouter initialEntries={[`/app/erp/products/${item.id}/skus`]}>
          <ProductSkuManagerPage productId={item.id} />
        </MemoryRouter>
      </I18nProvider>,
    );

    fireEvent.change(await screen.findByLabelText("Colors"), { target: { value: "Black, Red" } });
    fireEvent.change(screen.getByLabelText("Sizes"), { target: { value: "S, M" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate combinations" }));

    expect(screen.getByLabelText("SKU Black / S")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("SKU Black / M")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("SKU Red / S")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("SKU Red / M")).toHaveAttribute("readonly");
    fireEvent.click(screen.getByRole("button", { name: "Save SKUs" }));

    const itemVariants = () => localCatalogVariantsStore.list().filter((variant) => variant.catalogItemId === item.id);
    await waitFor(() => expect(itemVariants()).toHaveLength(4));
    expect(itemVariants().every((variant) => /^\d+$/.test(variant.sku))).toBe(true);
    expect(new Set(itemVariants().map((variant) => variant.sku)).size).toBe(4);
    expect(itemVariants().find((variant) => variant.attributes.color === "Black" && variant.attributes.size === "S")).toMatchObject({
      attributes: { color: "Black", size: "S" },
      metadata: { categoryKey: "toys" },
    });
    expect(localCatalogItemsStore.get(item.id)?.sku).toBe("");
    expect(await screen.findByRole("status")).toHaveTextContent("SKUs saved.");
  });

  it("manages purchase costs independently for each SKU", async () => {
    let uuid = 0;
    Object.defineProperty(window.crypto, "randomUUID", {
      configurable: true,
      value: () => `sku-cost-${++uuid}`,
    });
    const item = await localCatalogAdapter.createCatalogItem({
      organizationId,
      catalogId: "catalog_products",
      name: "Costed product",
      type: "physical_product",
      status: "draft",
      metadata: { itemKind: "product", canPurchase: true },
    });

    render(
      <I18nProvider>
        <MemoryRouter initialEntries={[`/app/erp/products/${item.id}/skus`]}>
          <ProductSkuManagerPage productId={item.id} />
        </MemoryRouter>
      </I18nProvider>,
    );

    fireEvent.change(await screen.findByLabelText("Colors"), { target: { value: "Black, Red" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate combinations" }));
    fireEvent.change(screen.getByLabelText("Unit purchase cost Black"), { target: { value: "12.50" } });
    fireEvent.change(screen.getByLabelText("Unit purchase cost Red"), { target: { value: "18.75" } });
    fireEvent.click(screen.getByRole("button", { name: "Save SKUs" }));

    await waitFor(() => expect(localCatalogVariantsStore.list().filter((variant) => variant.catalogItemId === item.id)).toHaveLength(2));
    expect(localProductCostReferencesStore.list()).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Save cost for Black" }));
    await waitFor(() => expect(localProductCostReferencesStore.list()).toHaveLength(1));
    fireEvent.click(screen.getByRole("button", { name: "Save cost for Red" }));
    await waitFor(() => expect(localProductCostReferencesStore.list()).toHaveLength(2));
    const variants = localCatalogVariantsStore.list().filter((variant) => variant.catalogItemId === item.id);
    expect(localProductCostReferencesStore.list()).toEqual(expect.arrayContaining([
      expect.objectContaining({ variantId: variants.find((variant) => variant.attributes.color === "Black")?.id, amount: 12.5, currency: "EUR", version: 1 }),
      expect.objectContaining({ variantId: variants.find((variant) => variant.attributes.color === "Red")?.id, amount: 18.75, currency: "EUR", version: 1 }),
    ]));
  });

  it("saves SKUs even when a separate cost operation fails", async () => {
    let uuid = 0;
    Object.defineProperty(window.crypto, "randomUUID", {
      configurable: true,
      value: () => `sku-cost-failure-${++uuid}`,
    });
    const item = await localCatalogAdapter.createCatalogItem({
      organizationId,
      catalogId: "catalog_products",
      name: "SKU cost failure product",
      type: "physical_product",
      status: "draft",
      metadata: { itemKind: "product", canPurchase: true },
    });
    const costSave = vi.spyOn(localCatalogAdapter, "saveProductCostReference").mockRejectedValue(new Error("Cost service unavailable."));

    render(
      <I18nProvider>
        <MemoryRouter initialEntries={[`/app/erp/products/${item.id}/skus`]}>
          <ProductSkuManagerPage productId={item.id} />
        </MemoryRouter>
      </I18nProvider>,
    );

    fireEvent.change(await screen.findByLabelText("Colors"), { target: { value: "Black" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate combinations" }));
    fireEvent.change(screen.getByLabelText("Unit purchase cost Black"), { target: { value: "12.50" } });
    fireEvent.click(screen.getByRole("button", { name: "Save SKUs" }));
    await waitFor(() => expect(localCatalogVariantsStore.list().filter((variant) => variant.catalogItemId === item.id)).toHaveLength(1));
    expect(await screen.findByRole("status")).toHaveTextContent("SKUs saved.");
    expect(costSave).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Save cost for Black" }));
    expect(await screen.findByText("Cost service unavailable.")).toBeInTheDocument();
    expect(localCatalogVariantsStore.list().filter((variant) => variant.catalogItemId === item.id)).toHaveLength(1);
    expect(localProductCostReferencesStore.list()).toHaveLength(0);
  });
});
