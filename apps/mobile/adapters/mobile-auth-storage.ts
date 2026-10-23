import { createMobileAuthStorage } from "./mobile-auth-storage-core";

export { MobileAuthStorageError } from "./mobile-auth-storage-core";

const unavailableNativeStorage = {
  async getItemAsync(): Promise<string | null> {
    throw new Error("Native secure storage is unavailable in the browser build.");
  },
  async setItemAsync(): Promise<void> {
    throw new Error("Native secure storage is unavailable in the browser build.");
  },
  async deleteItemAsync(): Promise<void> {
    throw new Error("Native secure storage is unavailable in the browser build.");
  },
};

export const mobileAuthStorage = createMobileAuthStorage(
  "web",
  unavailableNativeStorage,
  () => {
    if (typeof globalThis.localStorage === "undefined") {
      throw new Error("Browser authentication storage is unavailable.");
    }
    return globalThis.localStorage;
  },
);
