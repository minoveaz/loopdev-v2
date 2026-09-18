import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import en from "./locales/en.json";
import es from "./locales/es.json";

export type MobileLangCode = "en" | "es";

type Dict = Record<string, unknown>;

const DICTIONARIES: Record<MobileLangCode, Dict> = {
  en: en as Dict,
  es: es as Dict,
};

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
  setLang: (lang: MobileLangCode) => void;
  t: TranslateFn;
}

const MobileI18nContext = createContext<MobileI18nContextValue | undefined>(undefined);

function detectInitialLang(): MobileLangCode {
  return "es";
}

export function MobileI18nProvider({
  children,
  initialLang,
}: {
  children: ReactNode;
  initialLang?: MobileLangCode;
}) {
  const [lang, setLang] = useState<MobileLangCode>(() => initialLang || detectInitialLang());

  const t: TranslateFn = useCallback(
    (key: string, varsOrFallback?: Record<string, string | number> | string, fallback?: string) => {
      const fallbackText = typeof varsOrFallback === "string" ? varsOrFallback : fallback;
      const vars = typeof varsOrFallback === "object" ? varsOrFallback : undefined;
      const currentDict = DICTIONARIES[lang] || DICTIONARIES.es;
      const fallbackDict = DICTIONARIES.es;
      const raw = getValue(currentDict, key) ?? getValue(fallbackDict, key) ?? fallbackText ?? key;
      return format(raw, vars);
    },
    [lang],
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
    }),
    [lang, t],
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
