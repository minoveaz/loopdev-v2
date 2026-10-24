import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "@/i18n";
import { ProductConfigurationPage, ProductRecordPage } from "@/loopdev/pages/erp/ProductRecordPages";
import {
  localCatalogItemsStore,
  localOrganizationCatalogsStore,
  localProductCostReferencesStore,
  localProductReferencesStore,
} from "@/loopdev/domains/catalog/data/localCatalog";

vi.mock("@/hooks/use-tenant-context", () => ({
  useTenantContext: () => ({
    activeOrganization: { id: "local-development-organization" },
  }),
}));

describe("ERP product record pages", () => {
  beforeEach(() => {
    localCatalogItemsStore.reset();
    localOrganizationCatalogsStore.reset();
    localProductCostReferencesStore.reset();
    localProductReferencesStore.reset();
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
    fireEvent.change(screen.getByLabelText(/SKU/), { target: { value: "MIAU-TOY-01" } });
    fireEvent.change(screen.getByLabelText(/Unit purchase cost/), { target: { value: "4.50" } });
    fireEvent.click(screen.getByRole("button", { name: "Create product" }));

    await waitFor(() => expect(localCatalogItemsStore.list()).toContainEqual(
      expect.objectContaining({
        name: "MiauCraft Toy",
        sku: "MIAU-TOY-01",
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
