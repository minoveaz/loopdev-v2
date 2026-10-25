import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "@/i18n";
import Suppliers from "@/loopdev/pages/erp/Suppliers";
import {
  localCatalogItemsStore,
  localCatalogVariantsStore,
} from "@/loopdev/domains/catalog/data/localCatalog";
import { localSupplierP2PStore } from "@/loopdev/domains/suppliers/data/localSupplierP2P";
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
    localSupplierP2PStore.reset();
    localSupplierItemsStore.reset();
    localCatalogItemsStore.reset();
    localCatalogVariantsStore.reset();
    window.localStorage.setItem("rivera:ui:language", JSON.stringify("en"));
  });

  it("opens the approved full-page supplier setup instead of a minimal modal", async () => {
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/app/erp/suppliers"]}>
          <Suppliers />
        </MemoryRouter>
      </I18nProvider>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "New supplier" }));

    expect(await screen.findByRole("heading", { name: "New supplier" })).toBeInTheDocument();
    expect(screen.getByText("Tax profile pending Finance/Legal validation")).toBeInTheDocument();
    expect(screen.getByText("Purchasing defaults")).toBeInTheDocument();
    expect(screen.getAllByText("Payment instructions").length).toBeGreaterThan(0);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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

    fireEvent.click(within(linkedItem!).getByRole("button", { name: "Edit" }));
    const editDialog = await screen.findByRole("dialog", { name: "Edit supplier item" });
    fireEvent.change(within(editDialog).getByLabelText("Item name"), { target: { value: "Updated linked material" } });
    fireEvent.change(within(editDialog).getByLabelText("Purchase unit"), { target: { value: "case" } });
    fireEvent.change(within(editDialog).getByLabelText("Units per stock unit"), { target: { value: "12" } });
    fireEvent.change(within(editDialog).getByLabelText("Unit price"), { target: { value: "32.5" } });
    fireEvent.click(within(editDialog).getByRole("button", { name: "Save item" }));

    const supplierDialogAfterEdit = await screen.findByRole("dialog", { name: /Suministros Ibéricos Demo/ });
    const updatedItem = within(supplierDialogAfterEdit)
      .getByRole("heading", { name: "Updated linked material" })
      .closest("article");
    await waitFor(() => expect(updatedItem).toHaveTextContent("case = 12 stock units"));
    expect(updatedItem).toHaveTextContent("32.50 EUR");

    const currentItem = () => {
      const article = screen.getByRole("heading", { name: "Updated linked material" }).closest("article");
      if (!article) throw new Error("Updated supplier item is not rendered.");
      return article;
    };
    fireEvent.click(within(currentItem()).getByRole("button", { name: "Activate" }));
    await waitFor(() => expect(currentItem()).toHaveTextContent("Order eligible"));
    fireEvent.click(within(currentItem()).getByRole("button", { name: "Deactivate" }));
    await waitFor(() => expect(currentItem()).toHaveTextContent("inactive"));
    fireEvent.click(within(currentItem()).getByRole("button", { name: "Reactivate" }));
    await waitFor(() => expect(currentItem()).toHaveTextContent("Order eligible"));
  }, 15000);
});
