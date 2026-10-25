import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { I18nProvider } from "@/i18n";
import { ProductRecordPage } from "@/loopdev/pages/erp/ProductRecordPages";
import {
  localCatalogItemsStore,
  localCatalogItemKeyCountersStore,
  localCatalogSkuCountersStore,
  localOrganizationCatalogsStore,
  localProductCostReferencesStore,
  localProductReferencesStore,
  localCatalogVariantsStore,
} from "@/loopdev/domains/catalog/data/localCatalog";

vi.mock("@/hooks/use-tenant-context", () => ({
  useTenantContext: () => ({
    activeOrganization: { id: "local-development-organization" },
  }),
}));

function CurrentLocation() {
  const location = useLocation();
  return <output data-testid="current-location">{location.pathname}{location.search}</output>;
}

describe("Supplier product creation handoff", () => {
  beforeEach(() => {
    localCatalogItemsStore.reset();
    localCatalogItemKeyCountersStore.reset();
    localCatalogSkuCountersStore.reset();
    localOrganizationCatalogsStore.reset();
    localProductCostReferencesStore.reset();
    localProductReferencesStore.reset();
    localCatalogVariantsStore.reset();
    window.localStorage.setItem("rivera:ui:language", JSON.stringify("en"));
  });

  it("prefills the Products owner form and returns the created product for linking", async () => {
    const handoff = {
      organizationId: "local-development-organization",
      supplierId: "supplier_iberica",
      supplierItemId: "supplier_item_handoff_test",
      version: 2,
      name: "Supplier-provided component",
      supplierItemCode: "COMP-100",
      purchaseUnit: "case",
    };
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={[{
          pathname: "/app/erp/products/new",
          state: { supplierProductHandoff: handoff },
        }]}>
          <Routes>
            <Route path="/app/erp/products/new" element={<ProductRecordPage mode="create" itemId={null} />} />
            <Route path="/app/erp/suppliers" element={<CurrentLocation />} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );

    fireEvent.click(within(screen.getByRole("group", { name: "What are you managing?" })).getByRole("button", { name: /product/i }));
    fireEvent.click(screen.getByRole("combobox", { name: "Product type" }));
    fireEvent.click(await screen.findByRole("option", { name: "Raw material" }));
    await waitFor(() => expect(screen.getByLabelText(/Product name/)).toHaveValue(handoff.name));
    expect(screen.getByRole("checkbox", { name: /Can be purchased/ })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Create product" }));

    await waitFor(() => expect(screen.getByTestId("current-location").textContent).toContain(
      "supplier=supplier_iberica&linkSupplierItem=supplier_item_handoff_test&linkProduct=",
    ));
    expect(screen.getByTestId("current-location").textContent).toContain("linkVersion=2");
  });
});
