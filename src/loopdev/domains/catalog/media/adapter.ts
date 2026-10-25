import { localProductMediaAdapter } from "../adapter/product-media-local";
import { supabaseProductMediaAdapter } from "../adapter/product-media-supabase";
import type { ProductMediaAdapter } from "./types";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const productMediaAdapter: ProductMediaAdapter = new Proxy(supabaseProductMediaAdapter, {
  get(target, property, receiver) {
    const value = Reflect.get(target, property, receiver);
    if (typeof value !== "function") return value;
    return (...args: unknown[]) => {
      const scope = args.find((arg): arg is { organizationId?: unknown } =>
        Boolean(arg) && typeof arg === "object" && "organizationId" in arg);
      if (scope?.organizationId && typeof scope.organizationId === "string" && !UUID_PATTERN.test(scope.organizationId)) {
        const localValue = Reflect.get(localProductMediaAdapter, property);
        if (typeof localValue === "function") return localValue.apply(localProductMediaAdapter, args);
      }
      return value.apply(target, args);
    };
  },
});

export { localProductMediaAdapter, supabaseProductMediaAdapter };
export type { ProductMediaAdapter, ProductMediaAsset, ProductMediaAssignment, ProductMediaScope } from "./types";
