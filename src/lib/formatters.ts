import type { Currency } from "@/types";

/* ---------- Locale registry ---------- */

/**
 * Active BCP-47 locale used by every formatter in this module.
 * `setFormatterLocale` is called by `I18nProvider` whenever the user
 * switches languages, so all `formatDate` / `formatNumber` / `formatCurrency`
 * call sites automatically pick up the new locale + numbering system.
 *
 * Cache key includes the locale so we do not re-create `Intl.*` instances
 * on every render.
 */
let activeLocale = "en-US";

export function setFormatterLocale(locale: string): void {
  activeLocale = locale || "en-US";
}

export function getFormatterLocale(): string {
  return activeLocale;
}

/* ---------- Numbers / currency ---------- */

const compactNFCache = new Map<string, Intl.NumberFormat>();
const standardNFCache = new Map<string, Intl.NumberFormat>();

function compactNF() {
  let f = compactNFCache.get(activeLocale);
  if (!f) {
    f = new Intl.NumberFormat(activeLocale, { notation: "compact", maximumFractionDigits: 1 });
    compactNFCache.set(activeLocale, f);
  }
  return f;
}

function standardNF() {
  let f = standardNFCache.get(activeLocale);
  if (!f) {
    f = new Intl.NumberFormat(activeLocale);
    standardNFCache.set(activeLocale, f);
  }
  return f;
}

export function formatNumber(value: number, options?: { compact?: boolean; decimals?: number }): string {
  if (!Number.isFinite(value)) return "—";
  if (options?.compact) return compactNF().format(value);
  if (options?.decimals !== undefined) {
    return value.toLocaleString(activeLocale, {
      minimumFractionDigits: options.decimals,
      maximumFractionDigits: options.decimals,
    });
  }
  return standardNF().format(value);
}

const currencyCache = new Map<string, Intl.NumberFormat>();
function currencyFormatter(currency: Currency, compact?: boolean) {
  const key = `${activeLocale}-${currency}-${compact ? "c" : "f"}`;
  let f = currencyCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(activeLocale, {
      style: "currency",
      currency,
      notation: compact ? "compact" : "standard",
      maximumFractionDigits: compact ? 1 : 2,
    });
    currencyCache.set(key, f);
  }
  return f;
}

export function formatCurrency(value: number, currency: Currency = "USD", options?: { compact?: boolean }): string {
  if (!Number.isFinite(value)) return "—";
  return currencyFormatter(currency, options?.compact).format(value);
}

/* ---------- Dates ---------- */

export type DateStyle = "short" | "medium" | "long" | "relative" | "datetime";

const dateOptions: Record<Exclude<DateStyle, "relative">, Intl.DateTimeFormatOptions> = {
  short: { month: "numeric", day: "numeric", year: "2-digit" },
  medium: { month: "short", day: "numeric", year: "numeric" },
  long: { month: "long", day: "numeric", year: "numeric" },
  datetime: { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" },
};

const dateCache = new Map<string, Intl.DateTimeFormat>();
function dateFormatter(style: Exclude<DateStyle, "relative">) {
  const key = `${activeLocale}-${style}`;
  let f = dateCache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(activeLocale, dateOptions[style]);
    dateCache.set(key, f);
  }
  return f;
}

const relTimeCache = new Map<string, Intl.RelativeTimeFormat>();
function relTime() {
  let f = relTimeCache.get(activeLocale);
  if (!f) {
    f = new Intl.RelativeTimeFormat(activeLocale, { numeric: "auto" });
    relTimeCache.set(activeLocale, f);
  }
  return f;
}

export function formatDate(input: string | number | Date, style: DateStyle = "medium"): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  if (style === "relative") return formatRelative(date);
  return dateFormatter(style).format(date);
}

export function formatRelative(input: string | number | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const m = 60_000, h = 60 * m, d = 24 * h, w = 7 * d, mo = 30 * d, y = 365 * d;
  const fmt = (val: number, unit: Intl.RelativeTimeFormatUnit) => relTime().format(Math.round(val), unit);
  if (abs < m) return relTime().format(0, "second");
  if (abs < h) return fmt(diffMs / m, "minute");
  if (abs < d) return fmt(diffMs / h, "hour");
  if (abs < w) return fmt(diffMs / d, "day");
  if (abs < mo) return fmt(diffMs / w, "week");
  if (abs < y) return fmt(diffMs / mo, "month");
  return fmt(diffMs / y, "year");
}

/** Formal ISO date + time formatter (handy alias). */
export function formatDateTime(input: string | number | Date): string {
  return formatDate(input, "datetime");
}

/* ---------- Percent ---------- */

export function formatPercent(
  value: number,
  options?: { decimals?: number; alreadyPercent?: boolean; signed?: boolean },
): string {
  if (!Number.isFinite(value)) return "—";
  const pct = options?.alreadyPercent ? value : value * 100;
  const decimals = options?.decimals ?? (Math.abs(pct) >= 10 ? 0 : 1);
  const formatted = pct.toLocaleString(activeLocale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  if (options?.signed && pct > 0) return `+${formatted}%`;
  return `${formatted}%`;
}

/* ---------- Status variants ---------- */

export type StatusVariant = "neutral" | "info" | "success" | "warning" | "danger";

const STATUS_VARIANT_MAP: Record<string, StatusVariant> = {
  // Generic
  active: "success", inactive: "neutral", archived: "neutral",
  pending: "warning", scheduled: "info", running: "info",
  paused: "warning", completed: "success", draft: "neutral",
  // Orders / payments / invoices
  paid: "success", refunded: "warning", failed: "danger",
  shipped: "info", cancelled: "danger", overdue: "danger",
  void: "neutral", sent: "info",
  // Tasks / projects
  in_progress: "info", todo: "neutral", backlog: "neutral",
  review: "warning", done: "success", blocked: "danger",
  on_hold: "warning", planned: "info",
  // Users
  suspended: "danger",
  // Logistics
  in_transit: "info", delivered: "success", delayed: "warning",
  // Real estate
  available: "success", sold: "neutral", rented: "info", off_market: "neutral",
  // Tickets
  open: "info", resolved: "success", closed: "neutral",
  // NFT
  listed: "info", auction: "warning",
  // Severity / priority
  low: "neutral", normal: "info", medium: "info", high: "warning", urgent: "danger",
  info: "info", success: "success", warning: "warning", error: "danger",
};

export function getStatusVariant(status: string | null | undefined): StatusVariant {
  if (!status) return "neutral";
  return STATUS_VARIANT_MAP[status.toLowerCase()] ?? "neutral";
}

/* ---------- Strings ---------- */

export function getInitials(name: string, max = 2): string {
  if (!name) return "·";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  return parts
    .slice(0, max)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function truncate(value: string, max = 80): string {
  if (value.length <= max) return value;
  return value.slice(0, max - 1).trimEnd() + "…";
}

/* ---------- Math ---------- */

/**
 * Percent change between two values.
 * Returns 0 when previous is 0 (avoid Infinity).
 */
export function calculateTrend(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return 0;
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* ---------- Search / filter / sort utilities ---------- */

/** Case-insensitive substring search across the chosen keys (or all string fields). */
export function filterBySearchTerm<T extends Record<string, unknown>>(
  items: T[],
  term: string,
  keys?: (keyof T)[],
): T[] {
  const q = term.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const fields = keys ?? (Object.keys(item) as (keyof T)[]);
    return fields.some((k) => {
      const v = item[k];
      if (typeof v === "string") return v.toLowerCase().includes(q);
      if (typeof v === "number") return String(v).includes(q);
      return false;
    });
  });
}

/** Stable sort by a single key. */
export function sortBy<T>(items: T[], key: keyof T, direction: "asc" | "desc" = "asc"): T[] {
  const copy = [...items];
  const dir = direction === "asc" ? 1 : -1;
  copy.sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
  return copy;
}

/** Apply equality (or "any-of") filters: `{ status: "paid" }` or `{ currency: ["USD","EUR"] }`. */
export function applyFilters<T>(items: T[], filters?: Partial<Record<keyof T, unknown | unknown[]>>): T[] {
  if (!filters) return items;
  const entries = Object.entries(filters) as [keyof T, unknown][];
  if (entries.length === 0) return items;
  return items.filter((item) =>
    entries.every(([key, expected]) => {
      const actual = item[key];
      if (Array.isArray(expected)) {
        if (expected.length === 0) return true;
        return expected.includes(actual);
      }
      return actual === expected;
    }),
  );
}
