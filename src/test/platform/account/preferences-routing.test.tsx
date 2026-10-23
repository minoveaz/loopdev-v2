import { Suspense } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/i18n";
import { AppRoutes } from "@/routes/AppRoutes";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    session: { userId: "user-1", email: "person@example.test", name: "Ada Lovelace" },
    isLoading: false,
  }),
}));

vi.mock("@/components/layout/AppShell", () => ({
  AppShell: () => (
    <Suspense fallback={<div role="status">Loading route…</div>}>
      <Outlet />
    </Suspense>
  ),
}));

vi.mock("@/loopdev/pages/Settings", () => ({
  default: () => <h1>Organization settings surface</h1>,
}));

vi.mock("@/hooks/use-theme", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

vi.mock("@/hooks/use-notification-prefs", () => ({
  useNotificationPrefs: () => ({
    prefs: {
      channels: { inApp: true, email: true, push: true, sound: false },
      types: { info: true, success: true, warning: true, error: true },
    },
  }),
  setNotificationPrefs: vi.fn(),
}));

vi.mock("@/hooks/use-breadcrumbs", () => ({
  useBreadcrumbs: () => ({ trail: [] }),
}));

vi.mock("@/loopdev/domains/platform/adapter/user-preferences", () => ({
  getWebUserPreferencesAdapter: () => ({
    pendingForCurrentUser: vi.fn().mockResolvedValue(null),
    read: vi.fn().mockResolvedValue({
      success: true,
      state: "synced",
      preferences: {
        userId: "user-1",
        language: "en",
        timeZone: "UTC",
        personalNotifications: {
          channels: { inApp: true, email: true, push: true, sound: false },
          types: { info: true, success: true, warning: true, error: true },
        },
        version: 0,
        updatedAt: "2026-10-12T10:00:00.000Z",
      },
    }),
  }),
}));

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

function renderAt(path: string) {
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={[path]}>
        <CurrentPath />
        <AppRoutes />
      </MemoryRouter>
    </I18nProvider>,
  );
}

describe("Account Preferences routes", () => {
  it("opens the canonical personal settings destination directly", async () => {
    renderAt("/app/account/settings");

    expect(await screen.findByRole("heading", { name: "Preferences" }, { timeout: 10_000 })).toBeInTheDocument();
    expect(screen.getByTestId("current-path")).toHaveTextContent("/app/account/settings");
  });

  it("replace-redirects the legacy personal settings URL to the canonical destination", async () => {
    renderAt("/account/settings");

    expect(await screen.findByRole("heading", { name: "Preferences" }, { timeout: 10_000 })).toBeInTheDocument();
    expect(screen.getByTestId("current-path")).toHaveTextContent("/app/account/settings");
  });

  it("keeps organization settings at the separate /app/settings destination", async () => {
    renderAt("/app/settings");

    expect(await screen.findByRole("heading", { name: "Organization settings surface" })).toBeInTheDocument();
    expect(screen.getByTestId("current-path")).toHaveTextContent("/app/settings");
  });

  it.each(["/account/billing", "/app/account/billing"])(
    "does not expose or redirect the disabled Billing route (%s)",
    async (path) => {
      renderAt(path);

      expect(await screen.findByRole("heading", { name: "Off the map." })).toBeInTheDocument();
      expect(screen.getByTestId("current-path")).toHaveTextContent(path);
      expect(screen.queryByRole("heading", { name: "Billing" })).not.toBeInTheDocument();
    },
  );
});
