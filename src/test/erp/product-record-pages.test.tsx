import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "@/i18n";
import { ProductConfigurationPage, ProductRecordPage } from "@/loopdev/pages/erp/ProductRecordPages";
import {
  localCatalogItemsStore,
  localCatalogItemKeyCountersStore,
  localCatalogSkuCountersStore,
  localOrganizationCatalogsStore,
  localProductCostMutationsStore,
  localProductCostReferencesStore,
  localProductReferencesStore,
  localCatalogVariantsStore,
} from "@/loopdev/domains/catalog/data/localCatalog";
import { localCatalogAdapter } from "@/loopdev/domains/catalog";

vi.mock("@/hooks/use-tenant-context", () => ({
  useTenantContext: () => ({
    activeOrganization: { id: "local-development-organization" },
  }),
}));

describe("ERP product record pages", () => {
  beforeEach(() => {
    localCatalogItemsStore.reset();
    localCatalogItemKeyCountersStore.reset();
    localCatalogSkuCountersStore.reset();
    localOrganizationCatalogsStore.reset();
    localProductCostMutationsStore.reset();
    localProductCostReferencesStore.reset();
    localProductReferencesStore.reset();
    localCatalogVariantsStore.reset();
    window.localStorage.setItem("rivera:ui:language", JSON.stringify("en"));
  });

  it("creates a product with a separate purchase-cost reference", async () => {
    render(
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
    fireEvent.click(screen.getByRole("checkbox", { name: /Can be purchased/ }));
    fireEvent.change(screen.getByLabelText(/Product name/), { target: { value: "MiauCraft Toy" } });
    expect(screen.getByLabelText(/SKU/)).toHaveAttribute("readonly");
    fireEvent.change(screen.getByLabelText(/Unit purchase cost/), { target: { value: "4.50" } });
    fireEvent.click(screen.getByRole("button", { name: "Create product" }));

    await waitFor(() => expect(localCatalogItemsStore.list()).toContainEqual(
      expect.objectContaining({
        name: "MiauCraft Toy",
        sku: expect.stringMatching(/^\d+$/),
        type: "physical_product",
        metadata: expect.objectContaining({
          itemKind: "product",
          itemClass: "finished_product",
          sourcingMode: "buy",
          canPurchase: true,
          canSell: false,
          trackInventory: false,
        }),
      }),
    ));
    await waitFor(() => expect(localProductCostReferencesStore.list()).toContainEqual(
      expect.objectContaining({ amount: 4.5, currency: "EUR" }),
    ));
  });

  it("creates and displays a fully populated product with a numeric key and test SKU", async () => {
    const organizationId = "local-development-organization";
    const category = await localCatalogAdapter.createProductReference({
      organizationId, kind: "category", key: "toys", name: "Toys", parentId: null,
    });
    const brand = await localCatalogAdapter.createProductReference({
      organizationId, kind: "brand", key: "miaucraft", name: "MiauCraft", parentId: null,
    });
    const tag = await localCatalogAdapter.createProductReference({
      organizationId, kind: "tag", key: "new-arrival", name: "New arrival", parentId: null,
    });
    const form = render(
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
    expect(screen.getByText("Assigned when saved")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Product name/), { target: { value: "MiauCraft Cotton Toy" } });
    expect(screen.getByLabelText(/Product SKU/)).toHaveAttribute("readonly");
    fireEvent.click(screen.getByRole("combobox", { name: "Category" }));
    fireEvent.click(await screen.findByRole("option", { name: "Toys" }));
    fireEvent.click(screen.getByRole("combobox", { name: "Brand" }));
    fireEvent.click(await screen.findByRole("option", { name: "MiauCraft" }));
    fireEvent.change(screen.getByLabelText("Short description"), { target: { value: "Soft cotton toy for cats." } });
    fireEvent.change(screen.getByLabelText("Long description"), { target: { value: "A durable, hand-finished cotton toy designed for indoor play." } });
    fireEvent.click(screen.getByRole("checkbox", { name: /Can be purchased/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Can be sold/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Track inventory/ }));
    fireEvent.change(screen.getByLabelText(/Barcode/), { target: { value: "8437012345678" } });
    fireEvent.change(screen.getByLabelText("Manufacturer"), { target: { value: "MiauCraft Studio" } });
    fireEvent.change(screen.getByLabelText("Material"), { target: { value: "Organic cotton" } });
    fireEvent.change(screen.getByLabelText("Color"), { target: { value: "Teal" } });
    fireEvent.change(screen.getByLabelText(/Size/), { target: { value: "18 cm" } });
    fireEvent.change(screen.getByLabelText("Weight"), { target: { value: "0.45" } });
    fireEvent.change(screen.getByLabelText("Length"), { target: { value: "18" } });
    fireEvent.change(screen.getByLabelText("Width"), { target: { value: "12" } });
    fireEvent.change(screen.getByLabelText("Height"), { target: { value: "5.5" } });
    fireEvent.change(screen.getByLabelText("Reference sales price"), { target: { value: "39.90" } });
    fireEvent.change(screen.getByLabelText("Unit purchase cost"), { target: { value: "11.25" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "New arrival" }));
    fireEvent.click(screen.getByRole("combobox", { name: "Status" }));
    fireEvent.click(await screen.findByRole("option", { name: "Active" }));
    fireEvent.click(screen.getByRole("button", { name: "Create product" }));

    const item = await waitFor(() => {
      const created = localCatalogItemsStore.list().find((catalogItem) => catalogItem.name === "MiauCraft Cotton Toy");
      if (!created) throw new Error("Complete mock product was not created");
      return created;
    });
    expect(item.key).toMatch(/^\d+$/);
    expect(item).toMatchObject({
      sku: expect.stringMatching(/^\d+$/),
      categoryKey: category.key,
      status: "active",
      description: "A durable, hand-finished cotton toy designed for indoor play.",
      metadata: {
        itemKind: "product",
        itemClass: "finished_product",
        sourcingMode: "buy",
        canPurchase: true,
        canSell: true,
        trackInventory: true,
        brandKey: brand.key,
        tags: [tag.key],
        shortDescription: "Soft cotton toy for cats.",
        barcode: "8437012345678",
        manufacturer: "MiauCraft Studio",
        material: "Organic cotton",
        color: "Teal",
        size: "18 cm",
        weight: "0.45 kg",
        dimensions: "18 × 12 × 5.5 cm",
        price: 39.9,
        currency: "EUR",
      },
    });
    await waitFor(() => expect(localProductCostReferencesStore.list()).toContainEqual(expect.objectContaining({
      catalogItemId: item.id,
      amount: 11.25,
      currency: "EUR",
    })));
    form.unmount();

    render(
      <I18nProvider>
        <MemoryRouter initialEntries={[`/app/erp/products/${item.id}`]}>
          <ProductRecordPage mode="view" itemId={item.id} />
        </MemoryRouter>
      </I18nProvider>,
    );

    expect(await screen.findByRole("heading", { name: "MiauCraft Cotton Toy" })).toBeInTheDocument();
    expect(within(screen.getByRole("complementary")).getByRole("heading", { name: "Product images" })).toBeInTheDocument();
    expect(screen.getByText(item.key)).toBeInTheDocument();
    expect(screen.getByText(item.sku)).toBeInTheDocument();
    expect(screen.getByText("MiauCraft")).toBeInTheDocument();
    expect(screen.getByText("Toys")).toBeInTheDocument();
    expect(screen.getByText("Soft cotton toy for cats.")).toBeInTheDocument();
    expect(screen.getByText("A durable, hand-finished cotton toy designed for indoor play.")).toBeInTheDocument();
    expect(screen.getByText("8437012345678")).toBeInTheDocument();
    expect(screen.getByText("MiauCraft Studio")).toBeInTheDocument();
    expect(screen.getByText("Organic cotton")).toBeInTheDocument();
    expect(screen.getByText("Teal")).toBeInTheDocument();
    expect(screen.getByText("18 cm")).toBeInTheDocument();
    expect(screen.getByText("0.45 kg")).toBeInTheDocument();
    expect(screen.getByText("18 × 12 × 5.5 cm")).toBeInTheDocument();
    expect(screen.getByText("39.9 EUR")).toBeInTheDocument();
    expect(await screen.findByText("11.25 EUR")).toBeInTheDocument();
    expect(screen.getByText("New arrival")).toBeInTheDocument();
    expect(screen.getByText("Purchased")).toBeInTheDocument();
    expect(screen.getByText("Can be purchased, Can be sold, Track inventory")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("creates every product class and a service with the expected domain metadata", async () => {
    for (const productClass of [
      { value: "finished_product", label: "Finished product", name: "Mock finished product", sourcing: "Purchased" },
      { value: "raw_material", label: "Raw material", name: "Mock raw material" },
      { value: "component", label: "Component", name: "Mock component" },
    ]) {
      const form = render(
        <I18nProvider>
          <MemoryRouter initialEntries={["/app/erp/products/new"]}>
            <ProductRecordPage mode="create" itemId={null} />
          </MemoryRouter>
        </I18nProvider>,
      );

      fireEvent.click(within(screen.getByRole("group", { name: "What are you managing?" })).getByRole("button", { name: /product/i }));
      fireEvent.click(screen.getByRole("combobox", { name: "Product type" }));
      fireEvent.click(await screen.findByRole("option", { name: productClass.label }));
      if ("sourcing" in productClass) {
        fireEvent.click(screen.getByRole("combobox", { name: "How it is sourced" }));
        fireEvent.click(await screen.findByRole("option", { name: productClass.sourcing }));
      }
      fireEvent.change(screen.getByLabelText(/Product name/), { target: { value: productClass.name } });
      fireEvent.click(screen.getByRole("button", { name: "Create product" }));

      await waitFor(() => expect(localCatalogItemsStore.list()).toContainEqual(
        expect.objectContaining({
          name: productClass.name,
          type: "physical_product",
          metadata: expect.objectContaining({
            itemKind: "product",
            itemClass: productClass.value,
            sourcingMode: "buy",
          }),
        }),
      ));
      form.unmount();
    }

    render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/app/erp/products/new"]}>
          <ProductRecordPage mode="create" itemId={null} />
        </MemoryRouter>
      </I18nProvider>,
    );
    fireEvent.click(within(screen.getByRole("group", { name: "What are you managing?" })).getByRole("button", { name: /service/i }));
    fireEvent.change(screen.getByLabelText(/Service name/), { target: { value: "Mock service" } });
    expect(screen.getByLabelText(/SKU/)).toHaveAttribute("readonly");
    fireEvent.click(screen.getByRole("button", { name: "Create service" }));

    await waitFor(() => expect(localCatalogItemsStore.list()).toContainEqual(
      expect.objectContaining({
        name: "Mock service",
        sku: expect.stringMatching(/^\d+$/),
        type: "service",
        metadata: expect.objectContaining({ itemKind: "service", itemClass: "service", sourcingMode: null }),
      }),
    ));
  });

  it("allows a draft product family to be created without a base SKU", async () => {
    render(
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
    fireEvent.change(screen.getByLabelText(/Product name/), { target: { value: "MiauCraft Variant Family" } });
    fireEvent.click(screen.getByRole("button", { name: "Create product" }));

    await waitFor(() => expect(localCatalogItemsStore.list()).toContainEqual(
      expect.objectContaining({ name: "MiauCraft Variant Family", sku: expect.stringMatching(/^\d+$/), status: "draft" }),
    ));
  });

  it("creates and lists shared product references in configuration", async () => {
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/app/erp/products/configuration"]}>
          <ProductConfigurationPage />
        </MemoryRouter>
      </I18nProvider>,
    );

    await screen.findByText("Categories");
    fireEvent.click(screen.getByRole("button", { name: "Create brand" }));
    fireEvent.change(await screen.findByLabelText(/Name of brand/), { target: { value: "MiauCraft" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("MiauCraft")).toBeInTheDocument();
  });

  it("manages category names, parent placement, archive and restore", async () => {
    const parent = await localCatalogAdapter.createProductReference({
      organizationId: "local-development-organization",
      kind: "category",
      key: "pet-care",
      name: "Pet care",
      parentId: null,
    });
    const child = await localCatalogAdapter.createProductReference({
      organizationId: "local-development-organization",
      kind: "category",
      key: "cat-toys",
      name: "Cat toys",
      parentId: parent.id,
    });

    render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/app/erp/products/configuration"]}>
          <ProductConfigurationPage />
        </MemoryRouter>
      </I18nProvider>,
    );

    await screen.findByRole("textbox", { name: "Category name: Pet care" });
    fireEvent.click(screen.getByRole("button", { name: "Archive Pet care" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Move active child categories and assignments");

    fireEvent.change(screen.getByRole("textbox", { name: "Category name: Cat toys" }), { target: { value: "Feline toys" } });
    fireEvent.click(screen.getByRole("button", { name: "Save name for Cat toys" }));
    await waitFor(() => expect(localProductReferencesStore.list().find((reference) => reference.id === child.id)?.name).toBe("Feline toys"));

    fireEvent.click(screen.getByRole("combobox", { name: "Parent category for Feline toys" }));
    fireEvent.click(await screen.findByRole("option", { name: "No parent (root)" }));
    await waitFor(() => expect(localProductReferencesStore.get(child.id)?.parentId).toBeNull());

    fireEvent.click(screen.getByRole("button", { name: "Archive Feline toys" }));
    await waitFor(() => expect(localProductReferencesStore.get(child.id)?.status).toBe("archived"));
    fireEvent.click(screen.getByRole("button", { name: "Restore Feline toys" }));
    await waitFor(() => expect(localProductReferencesStore.get(child.id)?.status).toBe("active"));
  });

  it("shows the complete product form in the selected Spanish language", async () => {
    window.localStorage.setItem("rivera:ui:language", JSON.stringify("es"));
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/app/erp/products/new"]}>
          <ProductRecordPage mode="create" itemId={null} />
        </MemoryRouter>
      </I18nProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Crear producto o servicio" })).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole("group", { name: "¿Qué vas a gestionar?" })).getByRole("button", { name: /producto/i }));
    fireEvent.click(screen.getByRole("combobox", { name: "Tipo de producto" }));
    fireEvent.click(await screen.findByRole("option", { name: "Producto terminado" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Se puede vender/ }));
    expect(screen.getByLabelText(/Nombre del producto/)).toBeInTheDocument();
    expect(screen.getByText("Información física")).toBeInTheDocument();
    expect(screen.getByText("Precios y coste de compra")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear producto" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Crear categoría" }));
    expect(await screen.findByLabelText(/Nombre de categoría/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear" })).toBeInTheDocument();
  });

  it("shows a service form without physical, purchase-cost or inventory fields", async () => {
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/app/erp/products/new"]}>
          <ProductRecordPage mode="create" itemId={null} />
        </MemoryRouter>
      </I18nProvider>,
    );

    fireEvent.click(within(screen.getByRole("group", { name: "What are you managing?" })).getByRole("button", { name: /service/i }));

    expect(await screen.findByRole("heading", { name: "Create service" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Service name/)).toBeInTheDocument();
    expect(screen.queryByText("Physical information")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Unit purchase cost/)).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Can be purchased/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Track inventory/ })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /Can be sold/ })).toBeInTheDocument();
  });
});
