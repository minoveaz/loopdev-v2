import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthSession, PlatformUser } from "../../../../packages/contracts/src/auth-port";
import { MobileProfileScreen } from "../../../../apps/mobile/components/MobileProfileScreen";

const mocks = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    updateProfile: vi.fn(),
  },
  avatar: {
    getPreview: vi.fn(),
    updateAvatar: vi.fn(),
    removeAvatar: vi.fn(),
  },
  picker: { pickImage: vi.fn() },
  translate: (key: string, params?: Record<string, string>) => {
    const label = key.split(".").at(-1) ?? key;
    return label === "avatarAlt" ? `${params?.name ?? ""} avatar` : label;
  },
}));

vi.mock("../../../../apps/mobile/adapters/auth", () => ({ mobileAuthAdapter: mocks.auth }));
vi.mock("../../../../apps/mobile/adapters/profile-avatar", () => ({ mobileProfileAvatarAdapter: mocks.avatar }));
vi.mock("../../../../apps/mobile/adapters/profile-image-picker", () => ({ mobileProfileImagePicker: mocks.picker }));
vi.mock("../../../../apps/mobile/i18n", () => ({
  useMobileI18n: () => ({ t: mocks.translate }),
}));
vi.mock("../../../../apps/mobile/theme/tokens", () => ({
  mobileTheme: {
    colors: { danger: "", success: "", warning: "", textMuted: "" },
  },
}));
vi.mock("../../../../apps/mobile/components/ui", async () => {
  const { createElement } = await import("react");
  return {
    MobileAvatar: ({ name, imageUri }: { name: string; imageUri?: string | null }) =>
        createElement("span", { "aria-label": name, "data-testid": "mobile-avatar", "data-image-uri": imageUri ?? "" }),
    MobileButton: ({
      label,
      onPress,
      disabled,
      loading,
    }: {
      label: string;
      onPress: () => void;
      disabled?: boolean;
      loading?: boolean;
    }) => createElement("button", { type: "button", onClick: onPress, disabled: disabled || loading }, label),
    MobileCard: ({ children }: { children: React.ReactNode }) => createElement("section", null, children),
    MobileCardBody: ({ children }: { children: React.ReactNode }) => createElement("div", null, children),
    MobileCardHeader: ({ title, subtitle }: { title: string; subtitle: string }) =>
      createElement("header", null, createElement("h2", null, title), createElement("p", null, subtitle)),
    MobileConfirmDialog: ({
      visible,
      title,
      confirmLabel,
      cancelLabel,
      onCancel,
      onConfirm,
    }: {
      visible: boolean;
      title: string;
      confirmLabel: string;
      cancelLabel: string;
      onCancel: () => void;
      onConfirm: () => void;
    }) => visible
      ? createElement("div", { role: "alertdialog" },
        createElement("h2", null, title),
        createElement("button", { type: "button", onClick: onCancel }, cancelLabel),
        createElement("button", { type: "button", onClick: onConfirm }, confirmLabel))
      : null,
    MobileInput: ({
      label,
      accessibilityLabel,
      value,
      editable = true,
      onChangeText,
      error,
    }: {
      label: string;
      accessibilityLabel: string;
      value: string;
      editable?: boolean;
      onChangeText?: (value: string) => void;
      error?: string;
    }) => createElement("label", null, label,
      createElement("input", {
        "aria-label": accessibilityLabel,
        value,
        disabled: !editable,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChangeText?.(event.target.value),
      }),
      error ? createElement("span", null, error) : null),
    MobileLoadingState: ({ message }: { message: string }) => createElement("div", null, message),
    MobilePageContainer: ({ children }: { children: React.ReactNode }) => createElement("main", null, children),
    MobilePageHeader: ({
      title,
      onBack,
      backLabel,
    }: {
      title: string;
      onBack: () => void;
      backLabel: string;
    }) => createElement("header", null,
      createElement("h1", null, title),
      createElement("button", { type: "button", onClick: onBack }, backLabel)),
  };
});

const avatarReference = "loopdev-file://11111111-1111-4111-8111-111111111111";

const profileUser: PlatformUser = {
  id: "user-1",
  email: "person@example.test",
  fullName: "Ada Lovelace",
  avatarUrl: avatarReference,
  isSuperAdmin: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-10-11T00:00:00.000Z",
};

const session: AuthSession = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresAt: 1,
  user: profileUser,
};

function renderProfile() {
  return render(<MobileProfileScreen onBack={vi.fn()} />);
}

describe("Native Account Profile screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      blob: async () => new Blob(["image-bytes"], { type: "image/png" }),
    }));
    mocks.auth.getSession.mockResolvedValue(session);
    mocks.auth.onAuthStateChange.mockReturnValue(() => {});
    mocks.auth.updateProfile.mockResolvedValue({ success: true, data: { ...profileUser, fullName: "Ada Byron" } });
    mocks.avatar.getPreview.mockResolvedValue({ success: true, data: { url: "https://files.example.test/signed-avatar" } });
    mocks.avatar.updateAvatar.mockResolvedValue({
      success: true,
      data: { user: profileUser, cleanup: { previousAvatar: null } },
    });
    mocks.avatar.removeAvatar.mockResolvedValue({
      success: true,
      data: { user: { ...profileUser, avatarUrl: null }, cleanup: { previousAvatar: { success: true, data: undefined } } },
    });
    mocks.picker.pickImage.mockResolvedValue(null);
  });

  it("loads the signed-in user's canonical profile and private avatar preview", async () => {
    renderProfile();

    expect(await screen.findByDisplayValue("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByDisplayValue("person@example.test")).toBeDisabled();
    await waitFor(() => expect(mocks.avatar.getPreview).toHaveBeenCalledWith(avatarReference));
    expect(screen.getByRole("image", { name: "Ada Lovelace avatar" })).toBeInTheDocument();
    expect(screen.getByTestId("mobile-avatar")).toHaveAttribute("data-image-uri", "https://files.example.test/signed-avatar");
  });

  it("updates only the canonical display name and reports provider confirmation", async () => {
    renderProfile();
    const name = await screen.findByLabelText("fullName");
    fireEvent.change(name, { target: { value: "Ada Byron" } });
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    expect(await screen.findByText("saved")).toBeInTheDocument();
    expect(mocks.auth.updateProfile).toHaveBeenCalledWith({
      fullName: "Ada Byron",
      expectedUserUpdatedAt: profileUser.updatedAt,
      mutationId: expect.any(String),
    });
  });

  it("keeps invalid or conflicting name changes visible without claiming success", async () => {
    mocks.auth.updateProfile.mockResolvedValue({
      success: false,
      error: { code: "AUTH_VERSION_CONFLICT", message: "A newer profile exists." },
    });
    renderProfile();
    const name = await screen.findByLabelText("fullName");
    fireEvent.change(name, { target: { value: "Ada Byron" } });
    fireEvent.click(screen.getByRole("button", { name: "save" }));

    expect(await screen.findByText("conflict")).toBeInTheDocument();
    expect(screen.queryByText("saved")).not.toBeInTheDocument();
  });

  it("uploads a selected avatar through the shared private Files/Profile adapter", async () => {
    mocks.picker.pickImage.mockResolvedValue({
      uri: "file:///private/avatar.png",
      width: 128,
      height: 128,
      fileName: "avatar.png",
      fileSize: 12,
      mimeType: "image/png",
    });
    mocks.avatar.updateAvatar.mockResolvedValue({
      success: true,
      data: { user: { ...profileUser, avatarUrl: "loopdev-file://22222222-2222-4222-8222-222222222222" }, cleanup: { previousAvatar: null } },
    });
    renderProfile();
    fireEvent.click(await screen.findByRole("button", { name: "changeAvatar" }));

    await waitFor(() => expect(mocks.avatar.updateAvatar).toHaveBeenCalledWith({
      fileName: "avatar.png",
      mediaType: "image/png",
      content: expect.any(Blob),
      mutationId: expect.any(String),
      expectedUserUpdatedAt: profileUser.updatedAt,
      previousAvatarReference: avatarReference,
    }));
    expect(await screen.findByText("avatarUpdated")).toBeInTheDocument();
  });

  it("does not send a mutation when the photo picker is cancelled", async () => {
    renderProfile();
    fireEvent.click(await screen.findByRole("button", { name: "changeAvatar" }));
    await waitFor(() => expect(mocks.picker.pickImage).toHaveBeenCalledOnce());
    expect(mocks.avatar.updateAvatar).not.toHaveBeenCalled();
  });

  it("requires confirmation before removing the private avatar and surfaces cleanup errors", async () => {
    mocks.avatar.removeAvatar.mockResolvedValue({
      success: true,
      data: {
        user: { ...profileUser, avatarUrl: null },
        cleanup: { previousAvatar: { success: false, error: { code: "FILE_DELETE_FAILED", message: "Cleanup unavailable." } } },
      },
    });
    renderProfile();
    fireEvent.click(await screen.findByRole("button", { name: "removeAvatar" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "removeAvatar" }));

    expect(await screen.findByText("cleanupWarning Cleanup unavailable.")).toBeInTheDocument();
    expect(mocks.avatar.removeAvatar).toHaveBeenCalledWith({
      mutationId: expect.any(String),
      expectedUserUpdatedAt: profileUser.updatedAt,
      previousAvatarReference: avatarReference,
    });
  });

  it("shows an explicit forbidden state when there is no authenticated session", async () => {
    mocks.auth.getSession.mockResolvedValue(null);
    renderProfile();

    expect(await screen.findByText("signInRequired")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "save" })).not.toBeInTheDocument();
    expect(mocks.auth.updateProfile).not.toHaveBeenCalled();
  });
});
