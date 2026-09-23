import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import ar from "./locales/ar.json";
import he from "./locales/he.json";
import { storage } from "@/lib/storage";
import { setFormatterLocale } from "@/lib/formatters";

export type LangCode = "en" | "es" | "fr" | "de" | "ar" | "he";
export type Direction = "ltr" | "rtl";

export interface LanguageDescriptor {
  code: LangCode;
  label: string;
  flag: string;
  dir: Direction;
  /** BCP-47 locale tag used by `Intl.*` formatters. */
  locale: string;
}

export const LANGUAGES: readonly LanguageDescriptor[] = [
  { code: "en", label: "English",  flag: "🇬🇧", dir: "ltr", locale: "en-US" },
  { code: "es", label: "Español",  flag: "🇪🇸", dir: "ltr", locale: "es-ES" },
  { code: "fr", label: "Français", flag: "🇫🇷", dir: "ltr", locale: "fr-FR" },
  { code: "de", label: "Deutsch", flag: "🇩🇪", dir: "ltr", locale: "de-DE" },
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl", locale: "ar-SA" },
  { code: "he", label: "עברית", flag: "🇮🇱", dir: "rtl", locale: "he-IL" },
] as const;

type Dict = Record<string, unknown>;
const DICTIONARIES: Record<LangCode, Dict> = {
  en: en as Dict,
  es: es as Dict,
  fr: fr as Dict,
  de: de as Dict,
  ar: ar as Dict,
  he: he as Dict,
};

const STORAGE_KEY = "ui:language";

function getValue(dict: Dict, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Dict)) {
      cur = (cur as Dict)[p];
    } else return undefined;
  }
  return typeof cur === "string" ? cur : undefined;
}

function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? `{{${k}}}`));
}

interface I18nContextValue {
  lang: LangCode;
  dir: Direction;
  locale: string;
  setLang: (code: LangCode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  languages: readonly LanguageDescriptor[];
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function detectInitial(): LangCode {
  const stored = storage.get<string | null>(STORAGE_KEY, null);
  if (stored && LANGUAGES.some((l) => l.code === stored)) return stored as LangCode;
  if (typeof navigator !== "undefined") {
    const nav = navigator.language?.slice(0, 2).toLowerCase();
    const match = LANGUAGES.find((l) => l.code === nav);
    if (match) return match.code;
  }
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => detectInitial());

  const descriptor = useMemo(
    () => LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0],
    [lang],
  );

  // Apply lang + dir to <html>. ThemeConfigProvider's Direction setting
  // overrides this via a MutationObserver — so a user-chosen LTR override
  // holds even after switching to Arabic/Hebrew.
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.lang = descriptor.code;
    html.dir = descriptor.dir;
    setFormatterLocale(descriptor.locale);
  }, [descriptor]);

  const setLang = useCallback((code: LangCode) => {
    setLangState(code);
    storage.set(STORAGE_KEY, code);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = DICTIONARIES[lang];
      const fallback = DICTIONARIES.en;
      const raw = getValue(dict, key) ?? getValue(fallback, key) ?? key;
      return format(raw, vars);
    },
    [lang],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ lang, dir: descriptor.dir, locale: descriptor.locale, setLang, t, languages: LANGUAGES }),
    [lang, descriptor.dir, descriptor.locale, setLang, t],
  );

  // Keying the subtree on `lang` forces a remount when the language changes,
  // so any component that calls `formatDate` / `formatNumber` / `formatCurrency`
  // re-runs against the freshly-set `activeLocale` without each page needing
  // to subscribe to the i18n context.
  return (
    <I18nContext.Provider value={value}>
      {/*
        Keying remounts the subtree on language change so formatters refresh.
        We deliberately do NOT set `dir` here — the Theme Customizer is the
        source of truth for direction (applied to <html>). Setting dir on
        this wrapper would override the customizer for all descendants and
        break logical properties like `ps-*` / `start-*` / `border-e`.
      */}
      <div key={lang} className="contents">
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** Convenience hook for components that only need `t`. */
export function useT() {
  const ctx = useContext(I18nContext);
  const fallback = (key: string) => ({
    "crm.tasks.form.newTitle": "Nueva Tarea",
    "crm.tasks.form.titlePlaceholder": "Llamada de seguimiento...",
    "communicationsSettings.states.connected": "Connected",
    "communicationsSettings.states.comingSoon": "Prepared · not connected",
    "communicationsSettings.templates": "Templates",
    "communicationsSettings.killSwitch": "Communications kill-switch",
    "communicationsSettings.allowActions": "Enable communications kill-switch",
    "common.loopdev.documentIntelligence.pdfPreviewUnavailable": "PDF preview is disabled. Upload a passport image to review it directly.",
    "common.loopdev.documentIntelligence.noExtractionData": "No fields were extracted from this document. Review or enter the values manually before confirming.",
    "common.loopdev.documentIntelligence.findExistingContact": "Buscar contacto existente",
    "common.loopdev.documentIntelligence.createContact": "Crear contacto CRM",
    "common.loopdev.documentIntelligence.creatingContact": "Creando contacto...",
  }[key] ?? key);
  if (!ctx) return fallback;
  return (key: string, vars?: Record<string, string | number>) => {
    const translated = ctx.t(key, vars);
    return translated === key ? fallback(key) : translated;
  };
}