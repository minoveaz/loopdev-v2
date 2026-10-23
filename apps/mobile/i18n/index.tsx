import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { I18nManager, StyleSheet, View } from "react-native";
import type { UserPreferenceLanguage } from "../../../packages/contracts/src/user-preferences";
import { isUserPreferenceLanguage } from "../../../packages/contracts/src/user-preferences";
import { mobileAuthStorage } from "../adapters/mobile-auth-storage";
import mobileEn from "./locales/en.json";
import mobileEs from "./locales/es.json";
import en from "../../../src/i18n/locales/en.json";
import es from "../../../src/i18n/locales/es.json";
import fr from "../../../src/i18n/locales/fr.json";
import de from "../../../src/i18n/locales/de.json";
import ar from "../../../src/i18n/locales/ar.json";
import he from "../../../src/i18n/locales/he.json";

export type MobileLangCode = UserPreferenceLanguage;

export interface MobileLanguageDescriptor {
  code: MobileLangCode;
  label: string;
  flag: string;
}

export const MOBILE_LANGUAGES: readonly MobileLanguageDescriptor[] = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "he", label: "עברית", flag: "🇮🇱" },
] as const;

type Dict = Record<string, unknown>;

const DICTIONARIES: Record<MobileLangCode, Dict> = {
  en: en as Dict,
  es: es as Dict,
  fr: fr as Dict,
  de: de as Dict,
  ar: ar as Dict,
  he: he as Dict,
};

const MOBILE_OVERRIDES: Partial<Record<MobileLangCode, Dict>> = {
  en: mobileEn as Dict,
  es: mobileEs as Dict,
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
  storageError: string | null;
  t: TranslateFn;
}

const MobileI18nContext = createContext<MobileI18nContextValue | undefined>(undefined);

export function MobileI18nProvider({
  children,
  initialLang,
}: {
  children: ReactNode;
  initialLang?: MobileLangCode;
}) {
  const [lang, setLangState] = useState<MobileLangCode>(initialLang ?? "es");
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void mobileAuthStorage.getItem(STORAGE_KEY).then((stored) => {
      if (!active || !isUserPreferenceLanguage(stored)) return;
      setLangState(stored);
      const rtl = stored === "ar" || stored === "he";
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(rtl);
    }).catch((error: unknown) => {
      if (active) setStorageError(error instanceof Error ? error.message : "The saved language could not be loaded.");
    });
    return () => {
      active = false;
    };
  }, []);

  const setLang = useCallback((nextLang: MobileLangCode) => {
    setLangState(nextLang);
    setStorageError(null);
    const rtl = nextLang === "ar" || nextLang === "he";
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(rtl);
    void mobileAuthStorage.setItem(STORAGE_KEY, nextLang).catch((error: unknown) => {
      setStorageError(error instanceof Error ? error.message : "The selected language could not be saved.");
    });
  }, []);

  const t: TranslateFn = useCallback(
    (key: string, varsOrFallback?: Record<string, string | number> | string, fallback?: string) => {
      const fallbackText = typeof varsOrFallback === "string" ? varsOrFallback : fallback;
      const vars = typeof varsOrFallback === "object" ? varsOrFallback : undefined;
      const currentDict = DICTIONARIES[lang] || DICTIONARIES.es;
      const raw = getValue(currentDict, key)
        ?? getValue(MOBILE_OVERRIDES[lang] ?? {}, key)
        ?? getValue(DICTIONARIES.en, key)
        ?? getValue(MOBILE_OVERRIDES.en ?? {}, key)
        ?? fallbackText
        ?? key;
      return format(raw, vars);
    },
    [lang],
  );

  const value = useMemo(
    () => ({
      lang,
      languages: MOBILE_LANGUAGES,
      setLang,
      storageError,
      t,
    }),
    [lang, setLang, storageError, t],
  );

  return (
    <MobileI18nContext.Provider value={value}>
      <View style={[styles.provider, { direction: lang === "ar" || lang === "he" ? "rtl" : "ltr" }]}>
        {children}
      </View>
    </MobileI18nContext.Provider>
  );
}

export function useMobileI18n(): MobileI18nContextValue {
  const ctx = useContext(MobileI18nContext);
  if (!ctx) {
    const defaultT: TranslateFn = (key, varsOrFallback, fallback) => {
      const fallbackText = typeof varsOrFallback === "string" ? varsOrFallback : fallback;
      const vars = typeof varsOrFallback === "object" ? varsOrFallback : undefined;
      const raw = getValue(DICTIONARIES.es, key)
        ?? getValue(MOBILE_OVERRIDES.es ?? {}, key)
        ?? getValue(DICTIONARIES.en, key)
        ?? getValue(MOBILE_OVERRIDES.en ?? {}, key)
        ?? fallbackText
        ?? key;
      return format(raw, vars);
    };
    return {
      lang: "es",
      languages: MOBILE_LANGUAGES,
      setLang: () => {},
      storageError: null,
      t: defaultT,
    };
  }
  return ctx;
}

export function useT() {
  const { t } = useMobileI18n();
  return t;
}

const styles = StyleSheet.create({ provider: { flex: 1 } });
