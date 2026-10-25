// Tiny localStorage helper with JSON + safe fallback.
const PREFIX = "rivera:";

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* ignore quota errors */
    }
  },
  getStrict<T>(key: string, fallback: T): T {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new Error(`Stored data for "${key}" is invalid JSON.`);
    }
  },
  setStrict<T>(key: string, value: T): void {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
  },
};

export const STORAGE_KEYS = {
  theme: "theme",
  sidebarCollapsed: "sidebar:collapsed",
  session: "auth:session",
  users: "data:users",
  projects: "data:projects",
  orders: "data:orders",
  notifications: "data:notifications",
} as const;
