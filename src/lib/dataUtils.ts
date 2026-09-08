/**
 * Frontend-only data utilities — thin wrappers around storage + the
 * formatter helpers so feature code can speak in CRUD/query verbs
 * without coupling to the localStore implementation.
 */

import { storage } from "./storage";
import {
  applyFilters,
  filterBySearchTerm,
  sortBy,
} from "./formatters";
import type { Entity, QueryOptions } from "@/types";

/* ---------- Raw localStorage helpers ---------- */

export function getLocalData<T>(key: string, fallback: T): T {
  return storage.get<T>(key, fallback);
}

export function setLocalData<T>(key: string, value: T): void {
  storage.set<T>(key, value);
}

export function resetLocalData(key: string): void {
  storage.remove(key);
}

/* ---------- Collection CRUD ---------- */

let _idCounter = 0;
function nextId(prefix = "id"): string {
  _idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${_idCounter.toString(36)}`;
}

export function createItem<T extends Entity>(
  items: T[],
  input: Omit<T, "id" | "createdAt" | "updatedAt">,
  idPrefix = "item",
): { items: T[]; item: T } {
  const now = new Date().toISOString();
  const item = {
    ...(input as object),
    id: nextId(idPrefix),
    createdAt: now,
    updatedAt: now,
  } as T;
  return { items: [item, ...items], item };
}

export function updateItem<T extends Entity>(
  items: T[],
  id: string,
  patch: Partial<Omit<T, "id" | "createdAt">>,
): { items: T[]; item?: T } {
  let updated: T | undefined;
  const next = items.map((it) => {
    if (it.id !== id) return it;
    updated = {
      ...it,
      ...(patch as object),
      id: it.id,
      createdAt: it.createdAt,
      updatedAt: new Date().toISOString(),
    } as T;
    return updated;
  });
  return { items: next, item: updated };
}

export function deleteItem<T extends Entity>(items: T[], id: string): T[] {
  return items.filter((it) => it.id !== id);
}

/* ---------- Query helpers ---------- */

export function searchItems<T extends Record<string, unknown>>(
  items: T[],
  term: string,
  keys?: (keyof T)[],
): T[] {
  return filterBySearchTerm(items, term, keys);
}

export function sortItems<T>(
  items: T[],
  key: keyof T,
  direction: "asc" | "desc" = "asc",
): T[] {
  return sortBy(items, key, direction);
}

export function filterItems<T>(
  items: T[],
  filters?: Partial<Record<keyof T, unknown | unknown[]>>,
): T[] {
  return applyFilters(items, filters);
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export function paginateItems<T>(items: T[], page = 1, pageSize = 25): PageResult<T> {
  const total = items.length;
  const safeSize = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(total / safeSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * safeSize;
  return {
    items: items.slice(start, start + safeSize),
    total,
    page: safePage,
    pageSize: safeSize,
    pageCount,
  };
}

/** Combined query: filter → search → sort → paginate. */
export function queryItems<T extends Record<string, unknown> & Entity>(
  items: T[],
  options: QueryOptions<T> = {},
): PageResult<T> {
  const { search, searchKeys, filters, sort, page, pageSize } = options;
  let out: T[] = items;
  if (filters) out = filterItems(out, filters);
  if (search) out = searchItems(out, search, searchKeys as (keyof T)[] | undefined);
  if (sort) out = sortItems(out, sort.key, sort.direction);
  return paginateItems(out, page, pageSize);
}