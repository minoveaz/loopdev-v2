/**
 * localStore — a generic, frontend-only CRUD store.
 *
 * Each instance:
 *   • is keyed by a string namespace (persisted under `rivera:<key>`)
 *   • lazily seeds itself from a deterministic seed array on first access
 *   • supports create / read / update / remove / list / query
 *   • exposes a tiny pub/sub so React hooks can re-render on changes
 *
 * Frontend-only — no network, no external services.
 */

import type { Entity, QueryOptions } from "@/types";
import { storage } from "./storage";
import { applyFilters, filterBySearchTerm, sortBy } from "./formatters";

type Listener = () => void;

export interface QueryResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface LocalStore<T extends Entity> {
  /** Returns a fresh array every call (safe to mutate by caller). */
  list(): T[];
  /** Stable snapshot for `useSyncExternalStore` (same reference until a write occurs). */
  snapshot(): readonly T[];
  get(id: string): T | undefined;
  create(input: Omit<T, "id" | "createdAt" | "updatedAt">): T;
  update(id: string, patch: Partial<Omit<T, "id" | "createdAt">>): T | undefined;
  remove(id: string): boolean;
  /** Replace entire collection (e.g. after import). */
  replace(items: T[]): void;
  /** Reset back to the seed data. */
  reset(): void;
  /** Query helper combining search / filter / sort / pagination. */
  query(options?: QueryOptions<T>): QueryResult<T>;
  /** Subscribe to mutations. Returns an unsubscribe fn. */
  subscribe(listener: Listener): () => void;
  readonly key: string;
}

interface CreateStoreOptions<T extends Entity> {
  /** Storage namespace (without the `rivera:` prefix). */
  key: string;
  /** Deterministic seed data, used on first load and on `reset()`. */
  seed: T[];
  /** ID prefix for newly-created records (e.g. `"u"` -> `"u_n_…"`). */
  idPrefix?: string;
}

let counter = 0;
function genId(prefix: string): string {
  counter += 1;
  return `${prefix}_n_${Date.now().toString(36)}_${counter.toString(36)}`;
}

export function createLocalStore<T extends Entity>({ key, seed, idPrefix = key }: CreateStoreOptions<T>): LocalStore<T> {
  const listeners = new Set<Listener>();

  let cache: T[] | null = null;
  const read = (): T[] => {
    if (cache) return cache;
    cache = storage.get<T[]>(key, seed);
    return cache;
  };
  const write = (items: T[]) => {
    cache = items;
    storage.set(key, items);
    listeners.forEach((l) => l());
  };

  return {
    key,

    list() {
      return [...read()];
    },

    snapshot() {
      return read();
    },

    get(id) {
      return read().find((item) => item.id === id);
    },

    create(input) {
      const now = new Date().toISOString();
      const item = {
        ...(input as object),
        id: genId(idPrefix),
        createdAt: now,
        updatedAt: now,
      } as T;
      write([item, ...read()]);
      return item;
    },

    update(id, patch) {
      const items = read();
      const idx = items.findIndex((it) => it.id === id);
      if (idx === -1) return undefined;
      const next = {
        ...items[idx],
        ...(patch as object),
        id: items[idx].id,
        createdAt: items[idx].createdAt,
        updatedAt: new Date().toISOString(),
      } as T;
      const copy = [...items];
      copy[idx] = next;
      write(copy);
      return next;
    },

    remove(id) {
      const items = read();
      const next = items.filter((it) => it.id !== id);
      if (next.length === items.length) return false;
      write(next);
      return true;
    },

    replace(items) {
      write([...items]);
    },

    reset() {
      write([...seed]);
    },

    query(options = {}) {
      const { search, searchKeys, filters, sort, page = 1, pageSize = 25 } = options;
      let items = read();
      if (filters) items = applyFilters(items, filters);
      if (search) items = filterBySearchTerm(items as Record<string, unknown>[], search, searchKeys as string[] | undefined) as T[];
      if (sort) items = sortBy(items, sort.key, sort.direction);

      const total = items.length;
      const safePageSize = Math.max(1, pageSize);
      const pageCount = Math.max(1, Math.ceil(total / safePageSize));
      const safePage = Math.min(Math.max(1, page), pageCount);
      const start = (safePage - 1) * safePageSize;
      return {
        items: items.slice(start, start + safePageSize),
        total,
        page: safePage,
        pageSize: safePageSize,
        pageCount,
      };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener) as unknown as void;
    },
  };
}

/* ---------------- React hook ---------------- */

import { useSyncExternalStore } from "react";

/** Subscribe a component to a store and re-render on every change. Returns the live list. */
export function useLocalStore<T extends Entity>(store: LocalStore<T>): readonly T[] {
  return useSyncExternalStore(
    store.subscribe,
    store.snapshot,
    store.snapshot,
  );
}
