import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/i18n";
import type { UserPreferences, UserPreferencesPatch } from "../../../../packages/contracts/src/user-preferences";
import type { UserPreferencesSyncResult } from "../../../../packages/contracts/src/user-preferences-sync";
import AccountSettings from "@/loopdev/pages/account/Settings";

const mocks = vi.hoisted(() => ({
  adapter: {
    read: vi.fn(),
    patch: vi.fn(),
    pendingForCurrentUser: vi.fn(),
    retryPending: vi.fn(),
    discardPending: vi.fn(),
  },
  getAdapter: vi.fn(),
  setLang: vi.fn(),
  setTheme: vi.fn(),
  setNotificationPrefs: vi.fn(),
}));

vi.mock("@/loopdev/domains/platform/adapter/user-preferences", () => ({
  getWebUserPreferencesAdapter: mocks.getAdapter,
}));

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({ theme: "light", setTheme: mocks.setTheme }),
}));

vi.mock("@/hooks/use-notification-prefs", () => ({
  useNotificationPrefs: () => ({
    prefs: {
      channels: { inApp: true, email: true, push: true, sound: false },
      types: { info: true, success: true, warning: true, error: true },
    },
  }),
  setNotificationPrefs: mocks.setNotificationPrefs,
}));

vi.mock("@/hooks/use-breadcrumbs", () => ({
  useBreadcrumbs: () => ({ trail: [] }),
}));

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

function renderPage() {
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={["/app/account/settings"]}>
        <AccountSettings />
      </MemoryRouter>
    </I18nProvider>,
  );
}

describe("Account Preferences page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.setItem("rivera:ui:language", JSON.stringify("en"));
    mocks.setLang.mockImplementation(() => undefined);
    mocks.adapter.read.mockResolvedValue({ success: true, state: "synced", preferences: preferences() });
    mocks.adapter.pendingForCurrentUser.mockResolvedValue(null);
    mocks.adapter.retryPending.mockResolvedValue(null);
    mocks.adapter.discardPending.mockResolvedValue(undefined);
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
    mocks.getAdapter.mockReturnValue(mocks.adapter);
  });

  it("reads and presents the server-confirmed preferences", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Preferences" })).toBeInTheDocument();
    expect(await screen.findByText("Preferences are up to date.")).toBeInTheDocument();
    expect(mocks.adapter.read).toHaveBeenCalledOnce();
    expect(screen.getByRole("combobox", { name: "Display language" })).toHaveTextContent("English");
    expect(screen.getByRole("combobox", { name: "Account time zone" })).toHaveTextContent("UTC");
  });

  it("keeps the current app language when the server initializes an untouched preference", async () => {
    window.localStorage.setItem("rivera:ui:language", JSON.stringify("es"));
    mocks.adapter.read.mockResolvedValue({
      success: true,
      state: "synced",
      preferences: preferences({ language: "es" }),
    });
    renderPage();

    expect(await screen.findByRole("heading", { name: "Preferencias" })).toBeInTheDocument();
    expect(mocks.adapter.read).toHaveBeenCalledWith("es");
    expect(screen.getByRole("combobox", { name: "Idioma de visualización" })).toHaveTextContent("Español");
    expect(document.documentElement.lang).toBe("es");
  });

  it("persists language changes through the shared preference adapter", async () => {
    renderPage();
    await screen.findByText("Preferences are up to date.");

    fireEvent.click(screen.getByRole("combobox", { name: "Display language" }));
    fireEvent.click(await screen.findByRole("option", { name: "Español" }));
    await waitFor(() => expect(mocks.adapter.patch).toHaveBeenCalledWith(expect.objectContaining({
      patch: { language: "es" },
      expectedVersion: 0,
      mutationId: expect.any(String),
    })));
  });

  it("persists time-zone changes through the shared preference adapter", async () => {
    renderPage();
    await screen.findByText("Preferences are up to date.");
    fireEvent.click(screen.getByRole("combobox", { name: "Account time zone" }));
    fireEvent.click(await screen.findByRole("option", { name: "Europe/Madrid" }));
    await waitFor(() => expect(mocks.adapter.patch).toHaveBeenLastCalledWith(expect.objectContaining({
      patch: { timeZone: "Europe/Madrid" },
      expectedVersion: 0,
    })));
  });

  it("keeps appearance device-local and sends no remote preference mutation", async () => {
    renderPage();
    await screen.findByText("Preferences are up to date.");

    fireEvent.click(screen.getByRole("button", { name: "Dark" }));

    expect(mocks.setTheme).toHaveBeenCalledWith("dark");
    expect(await screen.findByText("Appearance is saved on this device only.")).toBeInTheDocument();
    expect(mocks.adapter.patch).not.toHaveBeenCalled();
  });

  it("saves personal notification toggles remotely and updates the shared local notification hook", async () => {
    renderPage();
    await screen.findByText("Preferences are up to date.");

    fireEvent.click(screen.getByRole("switch", { name: "Email" }));

    await waitFor(() => expect(mocks.adapter.patch).toHaveBeenCalledWith(expect.objectContaining({
      patch: { personalNotifications: { channels: { email: false } } },
      expectedVersion: 0,
    })));
    expect(mocks.setNotificationPrefs).toHaveBeenCalled();
  });

  it("keeps all preference operations discoverable at mobile-web widths", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    const { container } = renderPage();

    expect(await screen.findByRole("heading", { name: "Preferences" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Display language" })).toHaveClass("min-h-11");
    expect(screen.getByRole("combobox", { name: "Account time zone" })).toHaveClass("min-h-11");
    expect(screen.getByRole("button", { name: "Dark" })).toHaveClass("min-h-11");
    expect(screen.getAllByRole("switch")).toHaveLength(8);
    expect(container.querySelectorAll("select")).toHaveLength(0);
  });

  it("applies the selected RTL language to the responsive Preferences screen", async () => {
    mocks.adapter.read.mockResolvedValue({
      success: true,
      state: "synced",
      preferences: preferences({ language: "ar" }),
    });
    renderPage();

    expect(await screen.findByRole("heading", { name: "التفضيلات" })).toBeInTheDocument();
    await waitFor(() => expect(document.documentElement.dir).toBe("rtl"));
    expect(screen.getByRole("combobox", { name: "لغة العرض" })).toBeInTheDocument();
    expect(screen.getAllByRole("switch")).toHaveLength(8);
  });

  it.each([
    {
      state: "pending_sync" as const,
      statusText: "Changes are saved on this device and waiting to sync.",
      result: {
        success: true as const,
        state: "pending_sync" as const,
        preferences: preferences(),
        mutationId: "queued-mutation",
      },
    },
    {
      state: "offline" as const,
      statusText: "Showing the last confirmed preferences while offline.",
      result: {
        success: true as const,
        state: "offline" as const,
        preferences: preferences(),
        message: "Showing the last confirmed preferences while offline.",
      },
    },
  ])("shows the $state sync state without claiming confirmation", async ({ statusText, result }) => {
    mocks.adapter.read.mockResolvedValue(result satisfies UserPreferencesSyncResult);

    renderPage();

    expect(await screen.findByText(statusText)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Display language" })).toHaveTextContent("English");
  });

  it("retries a recovered queued mutation and reports the server-confirmed result", async () => {
    mocks.adapter.pendingForCurrentUser.mockResolvedValue({
      userId: "user-1",
      expectedVersion: 0,
      mutationId: "queued-mutation",
      patch: { timeZone: "Europe/Madrid" },
      createdAt: "2026-10-12T10:00:00.000Z",
      state: "queued",
    });
    mocks.adapter.retryPending
      .mockResolvedValueOnce({
        success: true,
        state: "pending_sync",
        preferences: preferences(),
        mutationId: "queued-mutation",
      })
      .mockResolvedValueOnce({
        success: true,
        state: "synced",
        preferences: preferences({ timeZone: "Europe/Madrid", version: 1 }),
      });

    renderPage();
    expect(await screen.findByText("Changes are saved on this device and waiting to sync.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry sync" }));

    expect(await screen.findByText("Preferences are up to date.")).toBeInTheDocument();
    expect(mocks.adapter.retryPending).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("combobox", { name: "Account time zone" })).toHaveTextContent("Europe/Madrid");
  });

  it("discards a pending mutation and reloads the last confirmed preferences", async () => {
    mocks.adapter.read
      .mockResolvedValueOnce({
        success: true,
        state: "pending_sync",
        preferences: preferences(),
        mutationId: "queued-mutation",
      })
      .mockResolvedValueOnce({ success: true, state: "synced", preferences: preferences() });

    renderPage();
    expect(await screen.findByText("Changes are saved on this device and waiting to sync.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Discard pending change" }));

    expect(await screen.findByText("Preferences are up to date.")).toBeInTheDocument();
    expect(mocks.adapter.discardPending).toHaveBeenCalledOnce();
    expect(mocks.adapter.read).toHaveBeenCalledTimes(2);
  });

  it("shows an explicit conflict resolution instead of silently overwriting the server value", async () => {
    const latest = preferences({ version: 3, language: "fr" });
    mocks.adapter.read.mockResolvedValue({
      success: false,
      state: "conflict",
      latest,
      attemptedPatch: { language: "es" },
      error: { code: "PREFERENCES_VERSION_CONFLICT", message: "Changed elsewhere." },
    } satisfies UserPreferencesSyncResult);

    renderPage();

    expect(await screen.findByText("Another session changed these preferences. Choose whether to apply your change or keep the latest server value.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep my change" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use latest value" })).toBeInTheDocument();
    expect(mocks.adapter.patch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Keep my change" }));
    await waitFor(() => expect(mocks.adapter.patch).toHaveBeenCalledWith(expect.objectContaining({
      patch: { language: "es" },
      expectedVersion: 3,
    })));
  });

  it("prompts for sign-in when the preferences adapter rejects an unauthenticated user", async () => {
    mocks.adapter.read.mockResolvedValue({
      success: false,
      state: "forbidden",
      error: { code: "UNAUTHENTICATED", message: "Sign in to read account preferences." },
    } satisfies UserPreferencesSyncResult);

    renderPage();

    expect(await screen.findByText("Sign in to view and update your account preferences.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/pages/login");
  });

  it("reports provider failures and exposes a retry action", async () => {
    mocks.adapter.read.mockResolvedValue({
      success: false,
      state: "error",
      error: { code: "PREFERENCES_NETWORK_ERROR", message: "The provider is unavailable." },
    } satisfies UserPreferencesSyncResult);

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("The provider is unavailable.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
