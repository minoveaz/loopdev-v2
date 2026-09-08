import { useCallback, useSyncExternalStore } from "react";
import { storage } from "@/lib/storage";
import type { NotificationType } from "@/types";

/**
 * Notification preferences — frontend-only, persisted to localStorage.
 *
 * The NotificationsFeed reads these to decide which notifications to render,
 * and the Account → Settings page exposes toggles to mutate them.
 *
 * Shape:
 *  - `channels.inApp` is the master switch for the in-app feed.
 *  - `channels.email` / `push` / `sound` are surfaced in settings; they don't
 *    gate the local feed today, but other components can read them.
 *  - `types[*]` controls which notification types show in the feed.
 */

export interface NotificationPrefs {
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
    sound: boolean;
  };
  types: Record<NotificationType, boolean>;
}

export const NOTIFICATION_PREFS_KEY = "account:notification-prefs";

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  channels: { inApp: true, email: true, push: true, sound: false },
  types: { info: true, success: true, warning: true, error: true },
};

/* ------------------------------------------------------------------ */
/* Tiny pub/sub so all subscribers update when prefs change            */
/* ------------------------------------------------------------------ */

const listeners = new Set<() => void>();
let cache: NotificationPrefs | null = null;

function read(): NotificationPrefs {
  if (cache) return cache;
  const raw = storage.get<Partial<NotificationPrefs> | null>(NOTIFICATION_PREFS_KEY, null);
  cache = mergeWithDefaults(raw);
  return cache;
}

function mergeWithDefaults(raw: Partial<NotificationPrefs> | null): NotificationPrefs {
  if (!raw) return DEFAULT_NOTIFICATION_PREFS;
  return {
    channels: { ...DEFAULT_NOTIFICATION_PREFS.channels, ...(raw.channels ?? {}) },
    types: { ...DEFAULT_NOTIFICATION_PREFS.types, ...(raw.types ?? {}) },
  };
}

function write(next: NotificationPrefs) {
  cache = next;
  storage.set(NOTIFICATION_PREFS_KEY, next);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Cross-tab sync via the native storage event.
  const onStorage = (e: StorageEvent) => {
    if (e.key && e.key.endsWith(NOTIFICATION_PREFS_KEY)) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Read prefs without subscribing (useful in event handlers). */
export function getNotificationPrefs(): NotificationPrefs {
  return read();
}

export function setNotificationPrefs(next: NotificationPrefs): void {
  write(next);
}

/** React hook — subscribes to prefs changes. */
export function useNotificationPrefs() {
  const prefs = useSyncExternalStore(subscribe, read, () => DEFAULT_NOTIFICATION_PREFS);

  const setChannel = useCallback(
    <K extends keyof NotificationPrefs["channels"]>(key: K, value: boolean) => {
      const current = read();
      write({ ...current, channels: { ...current.channels, [key]: value } });
    },
    [],
  );

  const setType = useCallback((type: NotificationType, value: boolean) => {
    const current = read();
    write({ ...current, types: { ...current.types, [type]: value } });
  }, []);

  const reset = useCallback(() => write(DEFAULT_NOTIFICATION_PREFS), []);

  return { prefs, setChannel, setType, reset };
}