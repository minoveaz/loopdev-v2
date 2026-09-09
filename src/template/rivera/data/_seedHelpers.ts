/**
 * Deterministic helpers for seed data.
 * Anchored to a fixed reference date so the demo is reproducible
 * regardless of when it's loaded.
 */

export const SEED_REFERENCE_ISO = "2026-05-04T09:00:00.000Z";
export const SEED_REFERENCE_MS = new Date(SEED_REFERENCE_ISO).getTime();

/** ISO timestamp `days` (and optionally `hours`) before the reference. */
export function ago(days: number, hours = 0): string {
  return new Date(SEED_REFERENCE_MS - days * 86_400_000 - hours * 3_600_000).toISOString();
}

/** ISO timestamp `days` after the reference. */
export function inDays(days: number): string {
  return new Date(SEED_REFERENCE_MS + days * 86_400_000).toISOString();
}

/** YYYY-MM-DD slice of an ISO timestamp. */
export function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}
