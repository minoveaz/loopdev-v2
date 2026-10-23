import { Suspense } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, useLocation, useNavigate } from "react-router-dom";
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

vi.mock("@/loopdev/domains/platform/adapter/auth-supabase", () => ({
  defaultWebAuthAdapter: {
    getClient: () => null,
    getSession: vi.fn().mockResolvedValue({
      user: {
        id: "user-1",
        email: "person@example.test",
        fullName: "Ada Lovelace",
        avatarUrl: null,
        isSuperAdmin: false,
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-10-01T00:00:00.000Z",
      },
    }),
    updateProfile: vi.fn(),
  },
}));

vi.mock("@/loopdev/domains/platform/adapter/profile-avatar", () => ({
  supabaseProfileAvatarAdapter: {
    getPreview: vi.fn(),
    updateAvatar: vi.fn(),
    removeAvatar: vi.fn(),
  },
}));

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}{location.search}</output>;
}

function BackButton() {
  const navigate = useNavigate();
  return <button onClick={() => navigate(-1)}>Go back</button>;
}

function renderRoutes(path: string) {
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={[path]}>
        <CurrentPath />
        <BackButton />
        <AppRoutes />
      </MemoryRouter>
    </I18nProvider>,
  );
}

describe("Account Profile routes", () => {
  it("renders the canonical destination when opened directly", async () => {
    renderRoutes("/app/account/profile");

    expect(await screen.findByRole("heading", { name: "Profile" }, { timeout: 10_000 })).toBeInTheDocument();
    expect(screen.getByTestId("current-path")).toHaveTextContent("/app/account/profile");
  }, 10_000);

  it("replace-redirects the protected legacy destination to Profile", async () => {
    renderRoutes("/account/profile");

    expect(await screen.findByRole("heading", { name: "Profile" }, { timeout: 10_000 })).toBeInTheDocument();
    expect(screen.getByTestId("current-path")).toHaveTextContent("/app/account/profile");
  });

  it("keeps back navigation on the previous route after replacing the protected legacy entry", async () => {
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={["/app/account/profile?previous", "/account/profile"]} initialIndex={1}>
          <CurrentPath />
          <BackButton />
          <AppRoutes />
        </MemoryRouter>
      </I18nProvider>,
    );

    expect(await screen.findByRole("heading", { name: "Profile" }, { timeout: 10_000 })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Go back" }));
    await waitFor(() => expect(screen.getByTestId("current-path")).toHaveTextContent("/app/account/profile?previous"));
  }, 10_000);
});
