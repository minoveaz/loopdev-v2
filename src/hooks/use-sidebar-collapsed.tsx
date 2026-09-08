import { useEffect, useState } from "react";
import { storage, STORAGE_KEYS } from "@/lib/storage";

const FULL_KEY = "rivera:" + STORAGE_KEYS.sidebarCollapsed;

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState<boolean>(() =>
    storage.get<boolean>(STORAGE_KEYS.sidebarCollapsed, false),
  );
  useEffect(() => {
    storage.set(STORAGE_KEYS.sidebarCollapsed, collapsed);
  }, [collapsed]);
  // Sync when appearance config (or another tab) changes the value.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== FULL_KEY) return;
      const next = storage.get<boolean>(STORAGE_KEYS.sidebarCollapsed, false);
      setCollapsed(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return { collapsed, setCollapsed, toggle: () => setCollapsed((c) => !c) };
}
