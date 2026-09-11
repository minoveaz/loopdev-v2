const databaseName = "loopdev-files";
const storeName = "previews";
const memory = new Map<string, File>();

function supported() {
  return typeof indexedDB !== "undefined";
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open local preview storage."));
  });
}

export async function putLocalPreview(id: string, file: File) {
  memory.set(id, file);
  if (!supported()) return;
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(storeName, "readwrite").objectStore(storeName).put(file, id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("Unable to persist local preview."));
    });
    database.close();
  } catch {
    // Memory remains the safe fallback when IndexedDB is unavailable.
  }
}

export async function getLocalPreview(id: string): Promise<File | null> {
  const cached = memory.get(id);
  if (cached) return cached;
  if (!supported()) return null;
  try {
    const database = await openDatabase();
    const file = await new Promise<File | null>((resolve, reject) => {
      const request = database.transaction(storeName, "readonly").objectStore(storeName).get(id);
      request.onsuccess = () => resolve((request.result as File | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error("Unable to read local preview."));
    });
    database.close();
    if (file) memory.set(id, file);
    return file;
  } catch {
    return null;
  }
}

export async function deleteLocalPreview(id: string) {
  memory.delete(id);
  if (!supported()) return;
  try {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const request = database.transaction(storeName, "readwrite").objectStore(storeName).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("Unable to delete local preview."));
    });
    database.close();
  } catch {
    // Metadata deletion remains valid if local preview cleanup is unavailable.
  }
}
