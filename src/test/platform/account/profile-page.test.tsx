import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PlatformUser } from "../../../../packages/contracts/src/auth-port";
import { createPlatformAvatarReference } from "../../../../packages/contracts/src/account-profile";
import { I18nProvider } from "@/i18n";
import Profile from "@/loopdev/pages/account/Profile";

const { authAdapter, avatarAdapter } = vi.hoisted(() => ({
  authAdapter: {
    getSession: vi.fn(),
    updateProfile: vi.fn(),
    getClient: vi.fn(() => null),
  },
  avatarAdapter: {
    getPreview: vi.fn(),
    updateAvatar: vi.fn(),
    removeAvatar: vi.fn(),
  },
}));

vi.mock("@/loopdev/domains/platform/adapter/auth-supabase", () => ({
  defaultWebAuthAdapter: authAdapter,
}));

vi.mock("@/loopdev/domains/platform/adapter/profile-avatar", () => ({
  supabaseProfileAvatarAdapter: avatarAdapter,
}));

const AVATAR_REFERENCE = createPlatformAvatarReference("6a7876f0-1e8f-49e4-b843-147c350c96cc");

function createUser(overrides: Partial<PlatformUser> = {}): PlatformUser {
  return {
    id: "user-1",
    email: "person@example.test",
    fullName: "Ada Lovelace",
    avatarUrl: null,
    isSuperAdmin: false,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

function session(user: PlatformUser) {
  return {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: 1_900_000_000,
    user,
  };
}

function renderProfile(path = "/app/account/profile", direction: "ltr" | "rtl" = "ltr") {
  return render(
    <I18nProvider>
      <div dir={direction}>
        <MemoryRouter initialEntries={[path]}>
          <Profile />
        </MemoryRouter>
      </div>
    </I18nProvider>,
  );
}

describe("Account Profile page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authAdapter.getSession.mockResolvedValue({ ...session(createUser()) });
    authAdapter.updateProfile.mockImplementation(async (input: { fullName?: string; avatarUrl?: string | null }) => ({
      success: true,
      data: createUser({
        fullName: input.fullName ?? "Ada Lovelace",
        avatarUrl: input.avatarUrl ?? null,
        updatedAt: "2026-10-11T00:00:00.000Z",
      }),
    }));
    avatarAdapter.getPreview.mockResolvedValue({
      success: true,
      data: { url: "https://signed.example.test/avatar", expiresAt: "2026-10-11T00:05:00.000Z" },
    });
    avatarAdapter.updateAvatar.mockImplementation(async () => ({
      success: true,
      data: {
        user: createUser({ avatarUrl: AVATAR_REFERENCE, updatedAt: "2026-10-11T00:00:00.000Z" }),
        cleanup: { previousAvatar: null },
      },
    }));
    avatarAdapter.removeAvatar.mockImplementation(async () => ({
      success: true,
      data: {
        user: createUser({ updatedAt: "2026-10-11T00:00:00.000Z" }),
        cleanup: { previousAvatar: { success: true, data: undefined } },
      },
    }));
  });

  it("loads the authenticated user's canonical profile", async () => {
    renderProfile();

    expect(await screen.findByDisplayValue("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByDisplayValue("person@example.test")).toHaveAttribute("readonly");
    expect(authAdapter.getSession).toHaveBeenCalledOnce();
  });

  it("shows loading, then offers retry after a profile read error", async () => {
    authAdapter.getSession
      .mockRejectedValueOnce(new Error("Provider unavailable"))
      .mockResolvedValueOnce(session(createUser()));
    renderProfile();

    expect(screen.getByRole("status")).toHaveTextContent("Loading your profile");
    expect(await screen.findByText("Provider unavailable")).toBeInTheDocument();
    const retry = screen.getByRole("button", { name: "Try again" });
    expect(retry).toHaveClass("min-h-11");
    fireEvent.click(retry);

    expect(await screen.findByDisplayValue("Ada Lovelace")).toBeInTheDocument();
    expect(authAdapter.getSession).toHaveBeenCalledTimes(2);
  });

  it("does not render profile data when no authenticated session exists", async () => {
    authAdapter.getSession.mockResolvedValue(null);
    renderProfile();

    expect(await screen.findByRole("alert")).toHaveTextContent("Sign in to view and update your profile.");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/pages/login");
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveClass("min-h-11");
    expect(screen.queryByDisplayValue("Ada Lovelace")).not.toBeInTheDocument();
  });

  it("saves only the full name with a version precondition and confirms success", async () => {
    renderProfile();
    const nameField = await screen.findByLabelText("Full name");
    fireEvent.change(nameField, { target: { value: "  Grace Hopper  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Your profile was updated.");
    expect(authAdapter.updateProfile).toHaveBeenCalledWith(expect.objectContaining({
      fullName: "Grace Hopper",
      expectedUserUpdatedAt: "2026-10-01T00:00:00.000Z",
    }));
    expect(authAdapter.updateProfile.mock.calls[0][0]).not.toHaveProperty("email");
  });

  it("keeps edits on a version conflict and reloads the current profile on request", async () => {
    authAdapter.getSession
      .mockResolvedValueOnce(session(createUser()))
      .mockResolvedValueOnce(session(createUser({ fullName: "Updated elsewhere" })));
    authAdapter.updateProfile.mockResolvedValueOnce({
      success: false,
      error: { code: "AUTH_VERSION_CONFLICT", message: "stale profile" },
    });
    renderProfile();
    fireEvent.change(await screen.findByLabelText("Full name"), { target: { value: "My edit" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText(/Your profile changed elsewhere/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("My edit")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reload profile" }));

    expect(await screen.findByDisplayValue("Updated elsewhere")).toBeInTheDocument();
  });

  it("uploads an avatar through private Files and resolves only its signed preview", async () => {
    const updatedUser = createUser({ avatarUrl: AVATAR_REFERENCE });
    avatarAdapter.updateAvatar.mockResolvedValueOnce({
      success: true,
      data: { user: updatedUser, cleanup: { previousAvatar: null } },
    });
    const { container } = renderProfile();
    await screen.findByDisplayValue("Ada Lovelace");
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    fireEvent.change(input as HTMLInputElement, {
      target: { files: [new File(["image"], "avatar.png", { type: "image/png" })] },
    });

    await waitFor(() => expect(avatarAdapter.updateAvatar).toHaveBeenCalledWith(expect.objectContaining({
      fileName: "avatar.png",
      mediaType: "image/png",
      previousAvatarReference: null,
    })));
    expect(await screen.findByRole("status")).toHaveTextContent("Your profile photo was updated.");
    await waitFor(() => expect(avatarAdapter.getPreview).toHaveBeenCalledWith(AVATAR_REFERENCE));
  });

  it("keeps avatar upload pending and disables repeat submission until Files completes", async () => {
    let finishUpload: (result: {
      success: true;
      data: { user: PlatformUser; cleanup: { previousAvatar: null } };
    }) => void = () => {};
    avatarAdapter.updateAvatar.mockReturnValueOnce(new Promise((resolve) => {
      finishUpload = resolve;
    }));
    const { container } = renderProfile();
    await screen.findByDisplayValue("Ada Lovelace");
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    fireEvent.change(input as HTMLInputElement, {
      target: { files: [new File(["image"], "avatar.png", { type: "image/png" })] },
    });

    const uploading = await screen.findByRole("button", { name: "Uploading…" });
    expect(uploading).toBeDisabled();
    finishUpload({
      success: true,
      data: { user: createUser({ avatarUrl: AVATAR_REFERENCE }), cleanup: { previousAvatar: null } },
    });
    expect(await screen.findByText("Your profile photo was updated.")).toBeInTheDocument();
  });

  it("uses mobile touch targets and keyboard-visible logical controls in RTL", async () => {
    authAdapter.getSession.mockResolvedValue(session(createUser({ avatarUrl: AVATAR_REFERENCE })));
    const { container } = renderProfile("/app/account/profile", "rtl");
    await screen.findByDisplayValue("Ada Lovelace");

    const avatarTriggers = screen.getAllByRole("button", { name: "Change photo" });
    const avatarTrigger = avatarTriggers[0];
    expect(avatarTriggers[1]).toHaveClass("min-h-11");
    expect(avatarTrigger).toHaveClass("h-11", "w-11", "-end-1", "focus-visible:ring-2");
    avatarTrigger.focus();
    expect(document.activeElement).toBe(avatarTrigger);
    expect(screen.getByLabelText("Full name")).toHaveClass("h-11");
    expect(screen.getByLabelText("Email address")).toHaveClass("h-11");
    expect(screen.getByRole("button", { name: "Save changes" })).toHaveClass("min-h-11");
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveClass("min-h-11");
    expect(within(dialog).getByRole("button", { name: "Remove photo" })).toHaveClass("min-h-11");
  });

  it("confirms avatar removal and reports cleanup errors without hiding the profile update", async () => {
    authAdapter.getSession.mockResolvedValue(session(createUser({ avatarUrl: AVATAR_REFERENCE })));
    avatarAdapter.removeAvatar.mockResolvedValueOnce({
      success: true,
      data: {
        user: createUser({ updatedAt: "2026-10-11T00:00:00.000Z" }),
        cleanup: { previousAvatar: { success: false, error: { code: "FILE_DELETE_FAILED", message: "storage cleanup failed" } } },
      },
    });
    renderProfile();
    fireEvent.click(await screen.findByRole("button", { name: "Remove photo" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove photo" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Your profile was updated, but the previous photo could not be removed.");
    expect(screen.getByRole("status")).toHaveTextContent("storage cleanup failed");
    expect(avatarAdapter.removeAvatar).toHaveBeenCalledWith(expect.objectContaining({
      previousAvatarReference: AVATAR_REFERENCE,
      expectedUserUpdatedAt: "2026-10-01T00:00:00.000Z",
    }));
  });

  it("surfaces avatar upload validation and provider errors", async () => {
    avatarAdapter.updateAvatar.mockResolvedValueOnce({
      success: false,
      error: { code: "FILE_VALIDATION_ERROR", message: "Avatar images must be JPEG, PNG, or WebP." },
    });
    const { container } = renderProfile();
    await screen.findByDisplayValue("Ada Lovelace");
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    fireEvent.change(input as HTMLInputElement, {
      target: { files: [new File(["not an image"], "avatar.gif", { type: "image/gif" })] },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Avatar images must be JPEG, PNG, or WebP.");
  });
});
