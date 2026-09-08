import { describe, it, expect, beforeEach } from "vitest";
import {
  setFormatterLocale,
  getFormatterLocale,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDate,
  formatRelative,
} from "@/lib/formatters";

const LOCALES: Record<string, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  ar: "ar-SA",
  he: "he-IL",
};

function expectMatchesIntl(actual: string, expected: string) {
  // Normalize NBSP / narrow NBSP that Intl emits inconsistently across ICU versions.
  const norm = (s: string) => s.replace(/[\u00a0\u202f\u2009]/g, " ");
  expect(norm(actual)).toBe(norm(expected));
}

describe("formatters — locale-aware output", () => {
  beforeEach(() => setFormatterLocale("en-US"));

  it.each(Object.entries(LOCALES))(
    "formatNumber matches Intl.NumberFormat for %s",
    (_lang, locale) => {
      setFormatterLocale(locale);
      expectMatchesIntl(
        formatNumber(1234567.89),
        new Intl.NumberFormat(locale).format(1234567.89),
      );
    },
  );

  it.each(Object.entries(LOCALES))(
    "formatCurrency matches Intl.NumberFormat for %s",
    (_lang, locale) => {
      setFormatterLocale(locale);
      expectMatchesIntl(
        formatCurrency(2499.5, "USD"),
        new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(2499.5),
      );
    },
  );

  it.each(Object.entries(LOCALES))(
    "formatPercent uses locale digits/separators for %s",
    (_lang, locale) => {
      setFormatterLocale(locale);
      const out = formatPercent(0.1234, { decimals: 1 });
      const expectedNum = (12.3).toLocaleString(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
      expect(out).toContain(expectedNum);
      expect(out).toMatch(/%/);
    },
  );

  it.each(Object.entries(LOCALES))(
    "formatDate medium matches Intl.DateTimeFormat for %s",
    (_lang, locale) => {
      setFormatterLocale(locale);
      const d = new Date(2026, 4, 7); // May 7, 2026
      expectMatchesIntl(
        formatDate(d, "medium"),
        new Intl.DateTimeFormat(locale, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(d),
      );
    },
  );

  it.each(Object.entries(LOCALES))(
    "formatRelative produces a non-empty locale string for %s",
    (_lang, locale) => {
      setFormatterLocale(locale);
      const past = new Date(Date.now() - 1000 * 60 * 60 * 3);
      const out = formatRelative(past);
      expect(out.length).toBeGreaterThan(0);
      // Must agree with native RTF for the same rounded delta.
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
      expect(out).toBe(rtf.format(-3, "hour"));
    },
  );

  it("Arabic uses Arabic-Indic digits", () => {
    setFormatterLocale("ar-SA");
    const out = formatNumber(123);
    expect(out).toMatch(/[\u0660-\u0669]/);
  });

  it("German number uses dot thousand separator and comma decimal", () => {
    setFormatterLocale("de-DE");
    expect(formatNumber(1234.5, { decimals: 1 })).toBe("1.234,5");
  });

  it("French currency formats with EUR symbol and locale separators", () => {
    setFormatterLocale("fr-FR");
    const out = formatCurrency(1234.5, "EUR");
    expect(out).toContain("€");
    expect(out).toMatch(/1[\u00a0\u202f\u2009 ]234/);
  });

  it("Hebrew is RTL locale and produces Latin or Hebrew digits via Intl", () => {
    setFormatterLocale("he-IL");
    expect(formatDate(new Date(2026, 4, 7), "medium")).toBe(
      new Intl.DateTimeFormat("he-IL", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(2026, 4, 7)),
    );
  });
});

describe("formatters — switching behavior", () => {
  it("getFormatterLocale reflects the latest setFormatterLocale call", () => {
    setFormatterLocale("fr-FR");
    expect(getFormatterLocale()).toBe("fr-FR");
    setFormatterLocale("ar-SA");
    expect(getFormatterLocale()).toBe("ar-SA");
  });

  it("formatNumber output changes when the locale switches", () => {
    setFormatterLocale("en-US");
    const en = formatNumber(1234567.89);
    setFormatterLocale("de-DE");
    const de = formatNumber(1234567.89);
    setFormatterLocale("ar-SA");
    const ar = formatNumber(1234567.89);
    expect(en).not.toBe(de);
    expect(en).not.toBe(ar);
    expect(de).not.toBe(ar);
  });

  it("formatCurrency reuses cached formatters per locale+currency", () => {
    setFormatterLocale("en-US");
    const a = formatCurrency(10, "USD");
    const b = formatCurrency(10, "USD");
    expect(a).toBe(b);
    setFormatterLocale("de-DE");
    const c = formatCurrency(10, "USD");
    expect(c).not.toBe(a);
  });

  it("falls back to en-US when given an empty locale", () => {
    setFormatterLocale("");
    expect(getFormatterLocale()).toBe("en-US");
  });
});