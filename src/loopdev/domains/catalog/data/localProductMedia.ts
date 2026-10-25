import { createLocalStore } from "@/lib/localStore";
import type { ProductMediaAsset, ProductMediaAssignment } from "../media/types";

export const localProductMediaAssetsStore = createLocalStore<ProductMediaAsset>({
  key: "loopdev:catalog:product-media-assets",
  idPrefix: "product_media_asset",
  seed: [],
});

export const localProductMediaAssignmentsStore = createLocalStore<ProductMediaAssignment>({
  key: "loopdev:catalog:product-media-assignments",
  idPrefix: "product_media_assignment",
  seed: [],
});
