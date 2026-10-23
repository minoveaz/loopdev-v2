export class MobileAuthStorageError extends Error {
  constructor(operation: string, cause: unknown) {
    const reason = cause instanceof Error ? cause.message : "unknown storage error";
    super(`Authentication storage ${operation} failed: ${reason}`);
    this.name = "MobileAuthStorageError";
  }
}

type SecureStorageDriver = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

type BrowserStorageDriver = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function createMobileAuthStorage(
  platform: string,
  secureStore: SecureStorageDriver,
  getBrowserStorage: () => BrowserStorageDriver,
) {
  const browserStorage = (): BrowserStorageDriver => {
    try {
      const storage = getBrowserStorage();
      if (!storage) throw new Error("browser storage is unavailable");
      return storage;
    } catch (error) {
      throw new MobileAuthStorageError("access", error);
    }
  };

  return {
    async getItem(key: string): Promise<string | null> {
      try {
        return platform === "web"
          ? browserStorage().getItem(key)
          : await secureStore.getItemAsync(key);
      } catch (error) {
        if (error instanceof MobileAuthStorageError) throw error;
        throw new MobileAuthStorageError("read", error);
      }
    },

    async setItem(key: string, value: string): Promise<void> {
      try {
        if (platform === "web") {
          browserStorage().setItem(key, value);
          return;
        }
        await secureStore.setItemAsync(key, value);
      } catch (error) {
        if (error instanceof MobileAuthStorageError) throw error;
        throw new MobileAuthStorageError("write", error);
      }
    },

    async removeItem(key: string): Promise<void> {
      try {
        if (platform === "web") {
          browserStorage().removeItem(key);
          return;
        }
        await secureStore.deleteItemAsync(key);
      } catch (error) {
        if (error instanceof MobileAuthStorageError) throw error;
        throw new MobileAuthStorageError("remove", error);
      }
    },
  };
}
