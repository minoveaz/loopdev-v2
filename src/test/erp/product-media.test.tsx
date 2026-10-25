import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { I18nProvider } from "@/i18n";
import { localCatalogItemsStore, localCatalogVariantsStore } from "@/loopdev/domains/catalog/data/localCatalog";
import { localCatalogAdapter } from "@/loopdev/domains/catalog";
import { localProductMediaAssetsStore, localProductMediaAssignmentsStore } from "@/loopdev/domains/catalog/data/localProductMedia";
import { localProductMediaAdapter } from "@/loopdev/domains/catalog/media/adapter";
import { localFilesAdapter } from "@/loopdev/domains/files/adapter";
import { FILES_LOCAL_STORAGE_KEY } from "@/loopdev/domains/files/data/localFiles";
import type { CatalogVariant } from "@/loopdev/domains/catalog";
import { ProductMediaGalleryManager } from "@/loopdev/pages/erp/ProductMediaGalleryManager";
import ProductMediaGalleryPage from "@/loopdev/pages/erp/ProductMediaGalleryPage";
import { ProductMediaSection } from "@/loopdev/pages/erp/ProductMediaSection";

vi.mock("@/loopdev/components/files/FilePicker", () => ({
  FilePicker: ({ onFilesSelected }: { onFilesSelected?: (files: File[]) => void }) => (
    <button
      type="button"
      onClick={() => onFilesSelected?.([new File(["product image"], "product-image.png", { type: "image/png" })])}
    >
      Choose test image
    </button>
  ),
}));

vi.mock("@/hooks/use-tenant-context", () => ({
  useTenantContext: () => ({
    activeOrganization: { id: "local-development-organization" },
    activeWorkspace: { id: "ws_loopdev_main" },
  }),
}));

const organizationId = "local-development-organization";
const productId = "catalog_item_store_kit";

function CurrentPath() {
  const location = useLocation();
  return <span data-testid="current-path">{location.pathname}</span>;
}

function createVariant(): CatalogVariant {
  return localCatalogVariantsStore.create({
    organizationId,
    workspaceId: "workspace-commerce",
    catalogItemId: productId,
    key: "90001",
    sku: "90001",
    name: "Teal / Small",
    status: "draft",
    attributes: { color: "Teal", size: "S" },
    metadata: {},
  });
}

describe("product media", () => {
  beforeEach(() => {
    localProductMediaAssetsStore.reset();
    localProductMediaAssignmentsStore.reset();
    localCatalogVariantsStore.reset();
    window.localStorage.removeItem(FILES_LOCAL_STORAGE_KEY);
    window.localStorage.setItem("rivera:ui:language", JSON.stringify("en"));
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: () => "blob:product-media-test" });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: () => undefined });
  });

  it("uploads one organization asset and reuses it on a product and its variant", async () => {
    const variant = createVariant();
    const file = new File(["image content for this test"], "teal-cat-toy.png", { type: "image/png" });
    const asset = await localProductMediaAdapter.uploadAsset({ organizationId, file });

    expect(asset).toMatchObject({
      organizationId,
      fileName: "teal-cat-toy.png",
      mimeType: "image/png",
      byteSize: file.size,
    });
    await localProductMediaAdapter.updateTags({ organizationId, assetId: asset.id, tags: [" ecommerce ", "Instagram", "ecommerce"] });
    expect((await localProductMediaAdapter.listLibrary({ organizationId }))[0].tags).toEqual(["ecommerce", "Instagram"]);
    await localProductMediaAdapter.attach({ organizationId, assetId: asset.id, catalogItemId: productId, altText: "Teal cotton cat toy" });
    await localProductMediaAdapter.attach({ organizationId, assetId: asset.id, catalogItemId: productId, variantId: variant.id, altText: "Teal small cat toy" });

    expect(await localProductMediaAdapter.listLibrary({ organizationId })).toHaveLength(1);
    expect(await localProductMediaAdapter.listAssignments({ organizationId, catalogItemId: productId })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ variantId: null, altText: "Teal cotton cat toy" }),
        expect.objectContaining({ variantId: variant.id, altText: "Teal small cat toy" }),
      ]),
    );
    await expect(localProductMediaAdapter.listLibrary({ organizationId: "other-development-organization" })).rejects.toThrow();
  });

  it("attaches uploads directly to products without variants", async () => {
    const item = localCatalogItemsStore.get(productId);
    if (!item) throw new Error("Seed product is unavailable.");

    render(
      <I18nProvider>
        <ProductMediaGalleryManager item={item} variants={[]} organizationId={organizationId} />
      </I18nProvider>,
    );

    expect(screen.queryByRole("combobox", { name: "Attach images to" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Choose test image" }));

    await waitFor(async () => {
      expect(await localProductMediaAdapter.listAssignments({ organizationId, catalogItemId: productId })).toEqual(
        expect.arrayContaining([expect.objectContaining({ catalogItemId: productId, variantId: null })]),
      );
    });
  });

  it("previews product-level images and opens the full product gallery", async () => {
    const item = localCatalogItemsStore.get(productId);
    if (!item) throw new Error("Seed product is unavailable.");
    const asset = await localProductMediaAdapter.uploadAsset({
      organizationId,
      file: new File(["product image preview"], "product-gallery.png", { type: "image/png" }),
    });
    await localProductMediaAdapter.attach({
      organizationId,
      assetId: asset.id,
      catalogItemId: productId,
      altText: "Front view of the product",
    });

    render(
      <MemoryRouter initialEntries={[`/app/erp/products/${productId}`]}>
        <I18nProvider>
          <ProductMediaSection item={item} organizationId={organizationId} />
          <CurrentPath />
        </I18nProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("img", { name: "Front view of the product" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Open gallery" }));
    expect(screen.getByTestId("current-path")).toHaveTextContent(`/app/erp/products/${productId}/media`);
  });

  it("finishes loading the dedicated gallery without repeating product lookups", async () => {
    const galleryProductId = "catalog_item_enterprise_plan";
    const getCatalogItem = vi.spyOn(localCatalogAdapter, "getCatalogItem");
    render(
      <MemoryRouter initialEntries={[`/app/erp/products/${galleryProductId}/media`]}>
        <I18nProvider>
          <Routes>
            <Route path="/app/erp/products/:productId/media" element={<ProductMediaGalleryPage />} />
          </Routes>
        </I18nProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Product gallery" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Choose test image" })).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(getCatalogItem).toHaveBeenCalledTimes(1);
    expect(getCatalogItem).toHaveBeenCalledWith(galleryProductId, { organizationId });
    getCatalogItem.mockRestore();
  });

  it("uploads an image to the selected variant and edits its alternative text", async () => {
    const item = localCatalogItemsStore.get(productId);
    if (!item) throw new Error("Seed product is unavailable.");
    const variant = createVariant();
    const generalAsset = await localProductMediaAdapter.uploadAsset({
      organizationId,
      file: new File(["general product image"], "product-cover.png", { type: "image/png" }),
    });
    await localProductMediaAdapter.attach({
      organizationId,
      assetId: generalAsset.id,
      catalogItemId: productId,
      altText: "General product photo",
    });

    render(
      <I18nProvider>
        <ProductMediaGalleryManager item={item} variants={[variant]} organizationId={organizationId} />
      </I18nProvider>,
    );

    fireEvent.click(screen.getByRole("combobox", { name: "Attach images to" }));
    fireEvent.click(await screen.findByRole("option", { name: "Teal / Small" }));
    fireEvent.click(screen.getByRole("button", { name: "Choose test image" }));
    await waitFor(async () => {
      expect(await localProductMediaAdapter.listAssignments({ organizationId, catalogItemId: productId })).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ asset: expect.objectContaining({ fileName: "product-image.png" }), variantId: variant.id }),
        ]),
      );
    });

    expect(await screen.findByRole("img", { name: "General product photo" })).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: "product-image.png" })).toBeInTheDocument();
    expect(screen.getByText("Product gallery")).toBeInTheDocument();

    const variantCard = screen.getByText("product-image.png").closest("article");
    if (!variantCard) throw new Error("Variant image card is unavailable.");
    expect(within(variantCard).getByText("Teal / Small")).toBeInTheDocument();
    fireEvent.change(within(variantCard).getByRole("textbox", { name: "Alternative text" }), {
      target: { value: "A small teal toy made from cotton." },
    });
    fireEvent.click(within(variantCard).getByRole("button", { name: "Save text" }));

    await waitFor(async () => {
      expect(await localProductMediaAdapter.listAssignments({ organizationId, catalogItemId: productId })).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ variantId: variant.id, altText: "A small teal toy made from cotton." }),
        ]),
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Enlarge product-image.png" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByRole("img", { name: "A small teal toy made from cotton." })).toBeInTheDocument();
  });
});
