import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { Appearance } from "./stubs/react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mobileAuthStorage } from "../../../../apps/mobile/adapters/mobile-auth-storage";
import { MobileThemeProvider, useMobileTheme } from "../../../../apps/mobile/theme/MobileThemeProvider";

vi.mock("../../../../apps/mobile/adapters/mobile-auth-storage", () => ({
  mobileAuthStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}));

function ThemeProbe() {
  const theme = useMobileTheme();
  return (
    <div>
      <output>{`${theme.appearance}/${theme.resolvedAppearance}/${theme.loading}`}</output>
      {theme.error ? <p role="alert">{theme.error}</p> : null}
      <button type="button" onClick={() => void theme.setAppearance("dark")}>dark</button>
      <button type="button" onClick={() => void theme.setAppearance("system")}>system</button>
    </div>
  );
}

function renderTheme() {
  return render(
    <MobileThemeProvider>
      <ThemeProbe />
    </MobileThemeProvider>,
  );
}

describe("Native device appearance provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mobileAuthStorage.getItem).mockResolvedValue(null);
    vi.mocked(mobileAuthStorage.setItem).mockResolvedValue(undefined);
  });

  it("restores a saved device theme and applies it through React Native Appearance", async () => {
    vi.mocked(mobileAuthStorage.getItem).mockResolvedValue("dark");
    const setColorScheme = vi.spyOn(Appearance, "setColorScheme");
    renderTheme();

    await waitFor(() => expect(screen.getByText("dark/dark/false")).toBeInTheDocument());
    expect(setColorScheme).toHaveBeenCalledWith("dark");
  });

  it("persists explicit modes and resets system mode without remote preference writes", async () => {
    const setColorScheme = vi.spyOn(Appearance, "setColorScheme");
    renderTheme();

    await screen.findByText("system/light/false");
    fireEvent.click(screen.getByRole("button", { name: "dark" }));
    await waitFor(() => expect(mobileAuthStorage.setItem).toHaveBeenCalledWith("loopdev:device-appearance", "dark"));
    expect(setColorScheme).toHaveBeenLastCalledWith("dark");

    fireEvent.click(screen.getByRole("button", { name: "system" }));
    await waitFor(() => expect(screen.getByText("system/light/false")).toBeInTheDocument());
    expect(mobileAuthStorage.setItem).toHaveBeenLastCalledWith("loopdev:device-appearance", "system");
    expect(setColorScheme).toHaveBeenLastCalledWith("unspecified");
  });

  it("surfaces local storage failures and leaves the active mode unchanged", async () => {
    vi.mocked(mobileAuthStorage.setItem).mockRejectedValue(new Error("SecureStore unavailable"));
    renderTheme();
    await screen.findByText("system/light/false");

    fireEvent.click(screen.getByRole("button", { name: "dark" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("SecureStore unavailable");
    expect(screen.getByText("system/light/false")).toBeInTheDocument();
  });
});
