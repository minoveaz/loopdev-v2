import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nProvider } from "@/i18n";
import ProductCatalog from "@/loopdev/pages/erp/ProductCatalog";
import {
  localCatalogItemsStore,
  localCatalogItemKeyCountersStore,
  localCatalogSkuCountersStore,
  localCatalogVariantsStore,
} from "@/loopdev/domains/catalog/data/localCatalog";

vi.mock("@/hooks/use-tenant-context", () => ({
  useTenantContext: () => ({
    activeOrganization: { id: "local-development-organization" },
  }),
}));

describe("ERP Products table", () => {
  beforeEach(() => {
    localCatalogItemsStore.reset();
    localCatalogItemKeyCountersStore.reset();
    localCatalogSkuCountersStore.reset();
    localCatalogVariantsStore.reset();
    window.localStorage.setItem("rivera:ui:language", JSON.stringify("en"));
  });

  it("uses CRM-style table headers, filter controls, and sortable columns", async () => {
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/app/erp/products"]}>
          <ProductCatalog productsOnly />
        </MemoryRouter>
      </I18nProvider>,
    );

    await waitFor(() => expect(screen.getByRole("columnheader", { name: /Product/ })).toBeInTheDocument());

    for (const label of ["Type", "Category", "Status"]) {
      expect(screen.getByRole("columnheader", { name: new RegExp(label) })).toBeInTheDocument();
    }
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /all statuses/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /all types/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /all categories/i })).toBeInTheDocument();

    const productSort = screen.getByRole("button", { name: "Product" });
    expect(productSort).toHaveAttribute("aria-sort", "ascending");
    fireEvent.click(productSort);
    expect(productSort).toHaveAttribute("aria-sort", "descending");

    const statusFilter = screen.getByRole("button", { name: /all statuses/i });
    fireEvent.pointerDown(statusFilter);
    fireEvent.click(statusFilter);
    fireEvent.click(await screen.findByRole("menuitemradio", { name: /draft/i }));
    await waitFor(() => expect(screen.getByText("Advisory package")).toBeInTheDocument());
    expect(screen.queryByText("Enterprise plan")).not.toBeInTheDocument();
  });

  it("opens the full create and configuration pages from the product list", async () => {
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/app/erp/products"]}>
          <Routes>
            <Route path="/app/erp/products" element={<ProductCatalog productsOnly />} />
            <Route path="/app/erp/products/new" element={<ProductCatalog productsOnly />} />
            <Route path="/app/erp/products/configuration" element={<ProductCatalog productsOnly />} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: /newProduct|new product/i }));
    expect(await screen.findByRole("heading", { name: "Create product or service" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /cancel/i }));
    fireEvent.click(await screen.findByRole("button", { name: "Configuration" }));
    expect(await screen.findByRole("heading", { name: "Product configuration" })).toBeInTheDocument();
  });

  it("finds product families by a child SKU", async () => {
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/app/erp/products"]}>
          <ProductCatalog productsOnly />
        </MemoryRouter>
      </I18nProvider>,
    );

    fireEvent.change(await screen.findByRole("searchbox"), { target: { value: "10000000005" } });
    expect(await screen.findByText("Enterprise plan")).toBeInTheDocument();
    expect(screen.queryByText("Advisory package")).not.toBeInTheDocument();
  });

  it("keeps identifiers read-only in the legacy company-catalog form", async () => {
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/app/erp/product-catalog/catalog_products"]}>
          <Routes>
            <Route path="/app/erp/product-catalog/:catalogId" element={<ProductCatalog />} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "New product" }));
    expect(await screen.findByLabelText("Internal key")).toHaveAttribute("readonly");
    expect(screen.getAllByRole("textbox").filter((field) => field.hasAttribute("readonly"))).toHaveLength(2);
  });

  it("renders product headers, categories, and statuses in Spanish", async () => {
    window.localStorage.setItem("rivera:ui:language", JSON.stringify("es"));
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/app/erp/products"]}>
          <ProductCatalog productsOnly />
        </MemoryRouter>
      </I18nProvider>,
    );

    expect(await screen.findByRole("columnheader", { name: "Producto" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Tipo" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Categoría" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Estado" })).toBeInTheDocument();
    expect(screen.getByText("Borrador")).toBeInTheDocument();
  });
});
