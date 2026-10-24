import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { I18nProvider } from "@/i18n";
import ProductCatalog from "@/loopdev/pages/erp/ProductCatalog";
import { localCatalogItemsStore } from "@/loopdev/domains/catalog/data/localCatalog";

vi.mock("@/hooks/use-tenant-context", () => ({
  useTenantContext: () => ({
    activeOrganization: { id: "local-development-organization" },
  }),
}));

describe("ERP Products table", () => {
  beforeEach(() => {
    localCatalogItemsStore.reset();
    window.localStorage.setItem("rivera:ui:language", JSON.stringify("en"));
  });

  it("uses CRM-style table headers, filter controls, and sortable columns", async () => {
    render(
      <MemoryRouter initialEntries={["/app/erp/products"]}>
        <ProductCatalog productsOnly />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByRole("columnheader", { name: /Product/ })).toBeInTheDocument());

    for (const label of ["Type", "Category", "Status"]) {
      expect(screen.getByRole("columnheader", { name: new RegExp(label) })).toBeInTheDocument();
    }
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /allStatuses/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /allTypes/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /allCategories/ })).toBeInTheDocument();

    const productSort = screen.getByRole("button", { name: "Product" });
    expect(productSort).toHaveAttribute("aria-sort", "ascending");
    fireEvent.click(productSort);
    expect(productSort).toHaveAttribute("aria-sort", "descending");

    const statusFilter = screen.getByRole("button", { name: /allStatuses/ });
    fireEvent.pointerDown(statusFilter);
    fireEvent.click(statusFilter);
    fireEvent.click(await screen.findByRole("menuitemradio", { name: /draft/ }));
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
});
