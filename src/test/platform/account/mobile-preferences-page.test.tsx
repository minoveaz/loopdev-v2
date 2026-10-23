import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserPreferences, UserPreferencesPatch } from "../../../../packages/contracts/src/user-preferences";
import type { UserPreferencesSyncResult } from "../../../../packages/contracts/src/user-preferences-sync";
import { MobilePreferencesScreen } from "../../../../apps/mobile/components/MobilePreferencesScreen";

const mocks = vi.hoisted(() => ({
  adapter: {
    read: vi.fn(),
    patch: vi.fn(),
    pendingForCurrentUser: vi.fn(),
    retryPending: vi.fn(),
    discardPending: vi.fn(),
  },
  setLang: vi.fn(),
  setAppearance: vi.fn(),
}));

vi.mock("../../../../apps/mobile/adapters/user-preferences", () => ({
  mobileUserPreferencesAdapter: mocks.adapter,
}));

vi.mock("../../../../apps/mobile/i18n", () => ({
  MOBILE_LANGUAGES: [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "fr", label: "Français" },
    { code: "de", label: "Deutsch" },
    { code: "ar", label: "العربية" },
    { code: "he", label: "עברית" },
  ],
  useMobileI18n: () => ({ t: translate, lang: "en", setLang: mocks.setLang, storageError: null }),
}));

vi.mock("../../../../apps/mobile/theme/MobileThemeProvider", () => ({
  useMobileTheme: () => ({
    appearance: "system",
    resolvedAppearance: "light",
    loading: false,
    error: null,
    setAppearance: mocks.setAppearance,
  }),
}));

vi.mock("../../../../apps/mobile/components/ui", async () => {
  const { createElement } = await import("react");
  return {
    MobileButton: ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) =>
      createElement("button", { type: "button", onClick: onPress, disabled }, label),
    MobileCard: ({ children }: { children: React.ReactNode }) => createElement("section", null, children),
    MobilePageContainer: ({ children }: { children: React.ReactNode }) => createElement("main", null, children),
    MobilePageHeader: ({ title, onBack, backLabel }: { title: string; onBack: () => void; backLabel: string }) =>
      createElement("header", null,
        createElement("h1", null, title),
        createElement("button", { type: "button", onClick: onBack }, backLabel)),
    MobileSelectSheet: ({
      visible,
      title,
      options,
      onSelect,
    }: {
      visible: boolean;
      title: string;
      options: Array<{ id: string; label: string }>;
      onSelect: (value: string) => void;
    }) => visible
      ? createElement("div", { role: "dialog", "aria-label": title },
        options.map((option) => createElement("button", {
          type: "button",
          key: option.id,
          onClick: () => onSelect(option.id),
        }, option.label)))
      : null,
  };
});

const messages: Record<string, string> = {
  "common.account": "Account",
  "common.back": "Back",
  "common.retry": "Retry",
  "common.search": "Search",
  "common.accountPreferences.title": "Preferences",
  "common.accountPreferences.description": "Personal account preferences",
  "common.accountPreferences.loading": "Loading preferences",
  "common.accountPreferences.loadError": "Preferences could not be loaded",
  "common.accountPreferences.saveError": "Preferences could not be saved",
  "common.accountPreferences.signInRequired": "Sign in to view preferences",
  "common.accountPreferences.signIn": "Sign in",
  "common.accountPreferences.synced": "Preferences are up to date",
  "common.accountPreferences.pending": "Changes are pending sync",
  "common.accountPreferences.offline": "Showing the last confirmed preferences offline",
  "common.accountPreferences.conflict": "Preferences changed elsewhere",
  "common.accountPreferences.conflictDescription": "Choose which preference value to keep",
  "common.accountPreferences.keepMine": "Keep my change",
  "common.accountPreferences.keepServer": "Use latest value",
  "common.accountPreferences.retry": "Retry sync",
  "common.accountPreferences.discard": "Discard pending change",
  "common.accountPreferences.deviceSaved": "Appearance is saved on this device only",
  "common.accountPreferences.languageTitle": "Language",
  "common.accountPreferences.languageDescription": "Language used across LoopDev",
  "common.accountPreferences.language": "Display language",
  "common.accountPreferences.timeZoneTitle": "Time zone",
  "common.accountPreferences.timeZoneDescription": "Used to display dates",
  "common.accountPreferences.timeZone": "Account time zone",
  "common.accountPreferences.appearanceTitle": "Appearance",
  "common.accountPreferences.appearanceDescription": "Appearance is local to this device",
  "common.accountPreferences.light": "Light",
  "common.accountPreferences.dark": "Dark",
  "common.accountPreferences.system": "System",
  "common.accountPreferences.notificationsTitle": "Personal notifications",
  "common.accountPreferences.notificationsDescription": "Choose notification types and channels",
  "common.accountPreferences.channelsTitle": "Delivery channels",
  "common.accountPreferences.typesTitle": "Notification types",
  "common.accountPreferences.channels.inApp": "In-app",
  "common.accountPreferences.channels.email": "Email",
  "common.accountPreferences.channels.push": "Push",
  "common.accountPreferences.channels.sound": "Sound",
  "common.accountPreferences.types.info": "Information",
  "common.accountPreferences.types.success": "Success",
  "common.accountPreferences.types.warning": "Warning",
  "common.accountPreferences.types.error": "Error",
};

function translate(key: string): string {
  return messages[key] ?? key.split(".").at(-1) ?? key;
}

function preferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    userId: "user-1",
    language: "en",
    timeZone: "UTC",
    personalNotifications: {
      channels: { inApp: true, email: true, push: true, sound: false },
      types: { info: true, success: true, warning: true, error: true },
    },
    version: 0,
    updatedAt: "2026-10-12T10:00:00.000Z",
    ...overrides,
  };
}

function renderPage(onBack = vi.fn()) {
  return render(<MobilePreferencesScreen onBack={onBack} />);
}

describe("Native Account Preferences screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setAppearance.mockResolvedValue(true);
    mocks.adapter.pendingForCurrentUser.mockResolvedValue(null);
    mocks.adapter.retryPending.mockResolvedValue(null);
    mocks.adapter.discardPending.mockResolvedValue(undefined);
    mocks.adapter.read.mockResolvedValue({ success: true, state: "synced", preferences: preferences() });
    mocks.adapter.patch.mockImplementation(async ({ patch }: { patch: UserPreferencesPatch }) => ({
      success: true,
      state: "synced",
      preferences: {
        ...preferences(),
        ...patch,
        personalNotifications: {
          ...preferences().personalNotifications,
          ...patch.personalNotifications,
          channels: {
            ...preferences().personalNotifications.channels,
            ...patch.personalNotifications?.channels,
          },
          types: {
            ...preferences().personalNotifications.types,
            ...patch.personalNotifications?.types,
          },
        },
        version: 1,
      },
    }));
  });

  it("loads synced preferences, exposes every contract language, and returns through the native back action", async () => {
    const onBack = vi.fn();
    renderPage(onBack);

    expect(await screen.findByRole("heading", { name: "Preferences" })).toBeInTheDocument();
    expect(await screen.findByText("Preferences are up to date")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Display language" }));
    for (const language of ["English", "Español", "Français", "Deutsch", "العربية", "עברית"]) {
      expect(screen.getByRole("button", { name: language })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("saves a language change through the shared user-bound sync adapter and applies it locally", async () => {
    renderPage();
    await screen.findByText("Preferences are up to date");

    fireEvent.click(screen.getByRole("button", { name: "Display language" }));
    fireEvent.click(screen.getByRole("button", { name: "Français" }));

    await waitFor(() => expect(mocks.adapter.patch).toHaveBeenCalledWith(expect.objectContaining({
      patch: { language: "fr" },
      expectedVersion: 0,
      mutationId: expect.any(String),
    })));
    expect(mocks.setLang).toHaveBeenCalledWith("en");
    expect(mocks.setLang).toHaveBeenCalledWith("fr");
  });

  it("saves timezone and personal notification changes remotely", async () => {
    renderPage();
    await screen.findByText("Preferences are up to date");

    fireEvent.click(screen.getByRole("button", { name: "Account time zone" }));
    fireEvent.click(screen.getByRole("button", { name: "Europe/Madrid" }));
    await waitFor(() => expect(mocks.adapter.patch).toHaveBeenCalledWith(expect.objectContaining({
      patch: { timeZone: "Europe/Madrid" },
      expectedVersion: 0,
    })));

    fireEvent.click(screen.getByRole("switch", { name: "Email" }));
    await waitFor(() => expect(mocks.adapter.patch).toHaveBeenLastCalledWith(expect.objectContaining({
      patch: { personalNotifications: { channels: { email: false } } },
    })));
  });

  it("applies appearance locally without sending it through the remote preferences contract", async () => {
    renderPage();
    await screen.findByText("Preferences are up to date");
    fireEvent.click(screen.getByRole("button", { name: "Appearance" }));
    fireEvent.click(screen.getByRole("button", { name: "Dark" }));

    expect(mocks.setAppearance).toHaveBeenCalledWith("dark");
    expect(await screen.findByText("Appearance is saved on this device only")).toBeInTheDocument();
    expect(mocks.adapter.patch).not.toHaveBeenCalled();
  });

  it("shows pending offline work with retry and discard actions", async () => {
    mocks.adapter.pendingForCurrentUser.mockResolvedValue({ userId: "user-1", mutationId: "pending-1" });
    mocks.adapter.retryPending.mockResolvedValue({
      success: true,
      state: "pending_sync",
      preferences: preferences({ timeZone: "Europe/Madrid" }),
      mutationId: "pending-1",
      message: "Waiting for network",
    });
    renderPage();

    expect(await screen.findByText("Changes are pending sync")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry sync" }));
    await waitFor(() => expect(mocks.adapter.retryPending).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole("button", { name: "Discard pending change" }));
    await waitFor(() => expect(mocks.adapter.discardPending).toHaveBeenCalledOnce());
  });

  it("surfaces version conflicts and lets the user retain the latest server value", async () => {
    mocks.adapter.patch.mockResolvedValue({
      success: false,
      state: "conflict",
      latest: preferences({ language: "es", version: 2 }),
      attemptedPatch: { language: "fr" },
      error: { code: "PREFERENCES_VERSION_CONFLICT", message: "Concurrent change" },
    } satisfies UserPreferencesSyncResult);
    renderPage();
    await screen.findByText("Preferences are up to date");
    fireEvent.click(screen.getByRole("button", { name: "Account time zone" }));
    fireEvent.click(screen.getByRole("button", { name: "Europe/Madrid" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Preferences changed elsewhere");
    fireEvent.click(screen.getByRole("button", { name: "Use latest value" }));
    expect(mocks.setLang).toHaveBeenCalledWith("es");
  });
});
