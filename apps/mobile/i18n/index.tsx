import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import en from "./locales/en.json";
import es from "./locales/es.json";

export type MobileLangCode = "en" | "es";

export interface MobileLanguageDescriptor {
  code: MobileLangCode;
  label: string;
  flag: string;
}

export const MOBILE_LANGUAGES: readonly MobileLanguageDescriptor[] = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇬🇧" },
] as const;

type Dict = Record<string, unknown>;

const DICTIONARIES: Record<MobileLangCode, Dict> = {
  en: en as Dict,
  es: es as Dict,
};

const STORAGE_KEY = "mobile:language";

function getValue(dict: Dict, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Dict)) {
      cur = (cur as Dict)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? `{{${k}}}`));
}

export type TranslateFn = (
  key: string,
  varsOrFallback?: Record<string, string | number> | string,
  fallback?: string,
) => string;

interface MobileI18nContextValue {
  lang: MobileLangCode;
  languages: readonly MobileLanguageDescriptor[];
  setLang: (lang: MobileLangCode) => void;
  t: TranslateFn;
}

const MobileI18nContext = createContext<MobileI18nContextValue | undefined>(undefined);

function detectInitialLang(): MobileLangCode {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "es") return stored;
    } catch {
      // ignore
    }
  }
  return "es";
}

export function MobileI18nProvider({
  children,
  initialLang,
}: {
  children: ReactNode;
  initialLang?: MobileLangCode;
}) {
  const [lang, setLangState] = useState<MobileLangCode>(() => initialLang || detectInitialLang());

  const setLang = useCallback((nextLang: MobileLangCode) => {
    setLangState(nextLang);
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, nextLang);
      } catch {
        // ignore
      }
    }
  }, []);

  const t: TranslateFn = useCallback(
    (key: string, varsOrFallback?: Record<string, string | number> | string, fallback?: string) => {
      const fallbackText = typeof varsOrFallback === "string" ? varsOrFallback : fallback;
      const vars = typeof varsOrFallback === "object" ? varsOrFallback : undefined;
      const currentDict = DICTIONARIES[lang] || DICTIONARIES.es;
      const fallbackDict = lang === "es" ? DICTIONARIES.en : DICTIONARIES.es;
      const raw = getValue(currentDict, key) ?? getValue(fallbackDict, key) ?? fallbackText ?? key;
      return format(raw, vars);
    },
    [lang],
  );

  const value = useMemo(
    () => ({
      lang,
      languages: MOBILE_LANGUAGES,
      setLang,
      t,
    }),
    [lang, setLang, t],
  );

  return <MobileI18nContext.Provider value={value}>{children}</MobileI18nContext.Provider>;
}

export function useMobileI18n(): MobileI18nContextValue {
  const ctx = useContext(MobileI18nContext);
  if (!ctx) {
    const defaultT: TranslateFn = (key, varsOrFallback, fallback) => {
      const fallbackText = typeof varsOrFallback === "string" ? varsOrFallback : fallback;
      const vars = typeof varsOrFallback === "object" ? varsOrFallback : undefined;
      const raw = getValue(DICTIONARIES.es, key) ?? getValue(DICTIONARIES.en, key) ?? fallbackText ?? key;
      return format(raw, vars);
    };
    return {
      lang: "es",
      languages: MOBILE_LANGUAGES,
      setLang: () => {},
      t: defaultT,
    };
  }
  return ctx;
}

export function useT() {
  const { t } = useMobileI18n();
  return t;
}
