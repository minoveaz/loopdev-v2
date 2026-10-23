import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { I18nManager } from "./stubs/react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileI18nProvider, useMobileI18n } from "../../../../apps/mobile/i18n";
import { mobileAuthStorage } from "../../../../apps/mobile/adapters/mobile-auth-storage";

vi.mock("../../../../apps/mobile/adapters/mobile-auth-storage", () => ({
  mobileAuthStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

function I18nProbe() {
  const { lang, languages, setLang, t } = useMobileI18n();
  return (
    <div>
      <output>{lang}</output>
      <p>{t("common.accountPreferences.title")}</p>
      {languages.map((language) => (
        <button key={language.code} type="button" onClick={() => setLang(language.code)}>
          {language.code}
        </button>
      ))}
    </div>
  );
}

describe("Native Account Preferences localization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mobileAuthStorage.getItem).mockResolvedValue(null);
    vi.mocked(mobileAuthStorage.setItem).mockResolvedValue(undefined);
  });

  it("restores the saved language from device storage and uses the shared locale", async () => {
    vi.mocked(mobileAuthStorage.getItem).mockResolvedValue("fr");
    render(
      <MobileI18nProvider initialLang="es">
        <I18nProbe />
      </MobileI18nProvider>,
    );

    await waitFor(() => expect(screen.getByText("fr")).toBeInTheDocument());
    expect(screen.getByText("Préférences")).toBeInTheDocument();
  });

  it("applies Arabic immediately, enables RTL layout and persists the selected language", async () => {
    const forceRTL = vi.spyOn(I18nManager, "forceRTL");
    render(
      <MobileI18nProvider initialLang="en">
        <I18nProbe />
      </MobileI18nProvider>,
    );
    await screen.findByText("Preferences");

    fireEvent.click(screen.getByRole("button", { name: "ar" }));

    expect(screen.getByRole("status")).toHaveTextContent("ar");
    expect(screen.getByText("التفضيلات")).toBeInTheDocument();
    expect(forceRTL).toHaveBeenCalledWith(true);
    await waitFor(() => expect(mobileAuthStorage.setItem).toHaveBeenCalledWith("mobile:language", "ar"));
  });
});
