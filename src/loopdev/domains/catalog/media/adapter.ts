import { localProductMediaAdapter } from "../adapter/product-media-local";
import { supabaseProductMediaAdapter } from "../adapter/product-media-supabase";
import type { ProductMediaAdapter } from "./types";

function configuredProductMediaAdapter(): ProductMediaAdapter {
  const mode: string | undefined = import.meta.env?.VITE_CATALOG_ADAPTER_MODE;
  if (mode === "local_demo") return localProductMediaAdapter;
  if (mode === "supabase") return supabaseProductMediaAdapter;
  throw new Error("Product media adapter mode must be explicitly configured as local_demo or supabase.");
}

export const productMediaAdapter: ProductMediaAdapter = new Proxy({} as ProductMediaAdapter, {
  get(_target, property) {
    if (property === "then" || typeof property !== "string") return undefined;
    return (...args: unknown[]) => {
      try {
        const adapter = configuredProductMediaAdapter();
        const method = Reflect.get(adapter, property);
        if (typeof method !== "function") throw new Error("The requested product media operation is unavailable.");
        return method.apply(adapter, args);
      } catch (error) {
        return Promise.reject(error);
      }
    };
  },
});

export { localProductMediaAdapter, supabaseProductMediaAdapter };
export type { ProductMediaAdapter, ProductMediaAsset, ProductMediaAssignment, ProductMediaScope } from "./types";
