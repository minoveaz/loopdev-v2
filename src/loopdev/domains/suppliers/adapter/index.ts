import { localSupplierAdapter } from "./local";
import { localSupplierItemAdapter } from "./localItems";
import { localSupplierP2PAdapter } from "./localP2P";
import { supabaseSupplierAdapter } from "./supabase";
import { supabaseSupplierItemAdapter } from "./supabaseItems";
import { supabaseSupplierP2PAdapter } from "./supabaseP2P";
import { SupplierAdapterError } from "../types";
import type {
  SupplierAdapter,
  SupplierCreateInput,
  SupplierItemAdapter,
  SupplierItemCreateInput,
  SupplierItemLinkInput,
  SupplierItemListParams,
  SupplierItemTermsInput,
  SupplierItemUpdateInput,
  SupplierListParams,
  SupplierP2PAdapter,
  SupplierScopeParams,
  SupplierUpdateInput,
} from "../types";

type AdapterMode = "local_demo" | "supabase";

function configuredAdapterMode(): AdapterMode {
  const mode = import.meta.env?.VITE_CATALOG_ADAPTER_MODE;
  if (mode === "local_demo" || mode === "supabase") return mode;
  throw new SupplierAdapterError(
    "Supplier adapter mode must be explicitly configured as local_demo or supabase.",
    "server-error",
  );
}

function configuredProxy<T extends object>(selectAdapter: (mode: AdapterMode) => T): T {
  return new Proxy({} as T, {
    get(_target, property) {
      if (property === "then" || typeof property !== "string") return undefined;
      return (...args: unknown[]) => {
        try {
          const adapter = selectAdapter(configuredAdapterMode());
          const method = Reflect.get(adapter, property);
          if (typeof method !== "function") {
            throw new SupplierAdapterError("The requested Supplier operation is unavailable.", "server-error");
          }
          return method.apply(adapter, args);
        } catch (error) {
          return Promise.reject(error);
        }
      };
    },
  });
}

export const supplierAdapter: SupplierAdapter = configuredProxy((mode) =>
  mode === "supabase" ? supabaseSupplierAdapter : localSupplierAdapter);

export const supplierItemAdapter: SupplierItemAdapter = configuredProxy((mode) =>
  mode === "supabase" ? supabaseSupplierItemAdapter : localSupplierItemAdapter);

export const supplierP2PAdapter: SupplierP2PAdapter = configuredProxy((mode) =>
  mode === "supabase" ? supabaseSupplierP2PAdapter : localSupplierP2PAdapter);

export { SupplierAdapterError } from "../types";
export type {
  SupplierAdapter,
  SupplierItemAdapter,
  SupplierP2PAdapter,
  SupplierP2PSetup,
  SupplierItemCreateInput,
  SupplierItemLinkInput,
  SupplierItemListParams,
  SupplierItemProductHandoff,
  SupplierItemTermsInput,
  SupplierItemUpdateInput,
} from "../types";
