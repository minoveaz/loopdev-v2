import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "@/i18n";
import Suppliers from "@/loopdev/pages/erp/Suppliers";
import {
  localCatalogItemsStore,
  localCatalogVariantsStore,
} from "@/loopdev/domains/catalog/data/localCatalog";
import { localSupplierItemsStore } from "@/loopdev/domains/suppliers/data/localSupplierItems";
import { localSuppliersStore } from "@/loopdev/domains/suppliers/data/localSuppliers";

vi.mock("@/hooks/use-tenant-context", () => ({
  useTenantContext: () => ({
    activeOrganization: { id: "local-development-organization" },
  }),
}));

describe("Supplier directory page", () => {
  beforeEach(() => {
    localSuppliersStore.reset();
    localSupplierItemsStore.reset();
    localCatalogItemsStore.reset();
    localCatalogVariantsStore.reset();
    window.localStorage.setItem("rivera:ui:language", JSON.stringify("en"));
  });

  it("adds an unlinked supplier item and links it to a catalog product", async () => {
    const product = localCatalogItemsStore.create({
      organizationId: "local-development-organization",
      workspaceId: null,
      catalogId: "catalog_products",
      key: `supplier-test-${Date.now()}`,
      sku: "",
      type: "physical_product",
      name: "Supplier-test product",
      description: null,
      categoryKey: null,
      status: "active",
      visibility: { organizationId: "local-development-organization", workspaceId: null },
      metadata: {},
    });
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/app/erp/suppliers"]}>
          <Suppliers />
        </MemoryRouter>
      </I18nProvider>,
    );

    fireEvent.click((await screen.findAllByRole("button", { name: "Suministros Ibéricos Demo" }))[0]);
    const supplierDialog = await screen.findByRole("dialog", { name: /Suministros Ibéricos Demo/ });
    fireEvent.click(within(supplierDialog).getByRole("button", { name: "Add item" }));
    const itemDialog = await screen.findByRole("dialog", { name: "Add supplier item" });
    fireEvent.change(within(itemDialog).getByLabelText("Item name"), { target: { value: "Demo linked material" } });
    fireEvent.change(within(itemDialog).getByLabelText("Purchase unit"), { target: { value: "carton" } });
    fireEvent.click(within(itemDialog).getByRole("button", { name: "Add item" }));

    const supplierDialogAfterAdd = await screen.findByRole("dialog", { name: /Suministros Ibéricos Demo/ });
    await waitFor(() => expect(within(supplierDialogAfterAdd).getByText("Demo linked material")).toBeInTheDocument());
    fireEvent.click(within(supplierDialogAfterAdd).getByRole("button", { name: "Link product" }));
    const linkDialog = await screen.findByRole("dialog", { name: "Link supplier item" });
    fireEvent.click(within(linkDialog).getByRole("combobox", { name: "Catalog product or variant" }));
    fireEvent.click(await screen.findByRole("option", { name: product.name }));
    fireEvent.click(within(linkDialog).getByRole("button", { name: "Save link" }));

    const supplierDialogAfterLink = await screen.findByRole("dialog", { name: /Suministros Ibéricos Demo/ });
    const linkedItem = within(supplierDialogAfterLink).getByRole("heading", { name: "Demo linked material" }).closest("article");
    await waitFor(() => expect(linkedItem).toHaveTextContent("Catalog product:"));
    expect(linkedItem).toHaveTextContent(product.name);
    expect(localSupplierItemsStore.list()).toContainEqual(expect.objectContaining({
      name: "Demo linked material",
      productId: product.id,
      status: "draft",
    }));
  });
});
