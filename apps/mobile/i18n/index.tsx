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

interface MobileI18nContextValue {
  lang: MobileLangCode;
  setLang: (lang: MobileLangCode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const MobileI18nContext = createContext<MobileI18nContextValue | undefined>(undefined);

function detectInitialLang(): MobileLangCode {
  if (typeof navigator !== "undefined" && navigator.language) {
    const code = navigator.language.slice(0, 2).toLowerCase();
    if (code === "es") return "es";
  }
  return "en";
}

export function MobileI18nProvider({
  children,
  initialLang,
}: {
  children: ReactNode;
  initialLang?: MobileLangCode;
}) {
  const [lang, setLang] = useState<MobileLangCode>(() => initialLang || detectInitialLang());

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const currentDict = DICTIONARIES[lang] || DICTIONARIES.en;
      const fallbackDict = DICTIONARIES.en;
      const raw = getValue(currentDict, key) ?? getValue(fallbackDict, key) ?? key;
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
    const defaultT = (key: string, vars?: Record<string, string | number>) => {
      const raw = getValue(DICTIONARIES.en, key) ?? key;
      return format(raw, vars);
    };
    return {
      lang: "en",
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
