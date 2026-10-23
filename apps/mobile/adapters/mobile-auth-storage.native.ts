import * as SecureStore from "expo-secure-store";
import { createMobileAuthStorage } from "./mobile-auth-storage-core";

export { MobileAuthStorageError } from "./mobile-auth-storage-core";

export const mobileAuthStorage = createMobileAuthStorage("native", SecureStore, () => {
  throw new Error("Browser authentication storage is unavailable in the native app.");
});
