import { describe, expect, it } from "vitest";
import { MOBILE_LANGUAGES } from "../../../apps/mobile/i18n";
import en from "../../../apps/mobile/i18n/locales/en.json";
import es from "../../../apps/mobile/i18n/locales/es.json";

function getValue(dict: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

describe("mobile i18n language support", () => {
  it("exports all six supported languages", () => {
    expect(MOBILE_LANGUAGES.map((l) => l.code)).toEqual(["es", "en", "fr", "de", "ar", "he"]);
    expect(MOBILE_LANGUAGES.find((l) => l.code === "es")?.label).toBe("Español");
    expect(MOBILE_LANGUAGES.find((l) => l.code === "en")?.label).toBe("English");
  });

  it("has corresponding core keys in both es and en locale dictionaries", () => {
    expect(es).toBeDefined();
    expect(en).toBeDefined();

    // Check common action translations
    expect(getValue(es as Record<string, unknown>, "common.save")).toBe("Guardar");
    expect(getValue(en as Record<string, unknown>, "common.save")).toBe("Save");
    expect(getValue(es as Record<string, unknown>, "common.cancel")).toBe("Cancelar");
    expect(getValue(en as Record<string, unknown>, "common.cancel")).toBe("Cancel");
    expect(getValue(es as Record<string, unknown>, "common.language")).toBe("Idioma");
    expect(getValue(en as Record<string, unknown>, "common.language")).toBe("Language");
    expect(getValue(es as Record<string, unknown>, "common.signOut")).toBe("Cerrar sesión");
    expect(getValue(en as Record<string, unknown>, "common.signOut")).toBe("Logout");
  });
});
