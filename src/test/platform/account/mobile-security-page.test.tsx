import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthSecurityStatus } from "../../../../packages/contracts/src/auth-port";
import { MobileSecurityScreen } from "../../../../apps/mobile/components/MobileSecurityScreen";

const { mobileAuthAdapter, translate } = vi.hoisted(() => ({
  mobileAuthAdapter: {
    getSecurityStatus: vi.fn(),
    requestEmailChange: vi.fn(),
    updatePassword: vi.fn(),
    beginTotpEnrollment: vi.fn(),
    verifyTotp: vi.fn(),
    removeTotpFactor: vi.fn(),
    signOutOtherSessions: vi.fn(),
  },
  translate: (key: string, params?: Record<string, string>) => {
    const label = key.split(".").at(-1) ?? key;
    if (label === "pendingEmail") return `Confirmation pending for ${params?.email ?? ""}`;
    return label;
  },
}));

vi.mock("../../../../apps/mobile/adapters/auth", () => ({ mobileAuthAdapter }));
vi.mock("../../../../apps/mobile/i18n", () => ({
  useMobileI18n: () => ({ t: translate }),
}));
vi.mock("../../../../apps/mobile/theme/tokens", () => ({
  mobileTheme: { colors: { dangerBg: "", danger: "", primarySoft: "", textHeading: "", textMuted: "", warning: "", border: "" }, radii: { md: 0, sm: 0 } },
}));
vi.mock("../../../../apps/mobile/components/ui", async () => {
  const { createElement } = await import("react");
  return {
    MobileButton: ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) =>
      createElement("button", { type: "button", onClick: onPress, disabled }, label),
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
      onChangeText,
    }: {
      label: string;
      accessibilityLabel: string;
      value: string;
      onChangeText: (value: string) => void;
    }) => createElement("label", null, label,
      createElement("input", {
        "aria-label": accessibilityLabel,
        value,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChangeText(event.target.value),
      })),
    MobileLoadingState: ({ message }: { message: string }) => createElement("div", null, message),
    MobilePageContainer: ({ children }: { children: React.ReactNode }) => createElement("main", null, children),
    MobilePageHeader: ({ title, onBack, backLabel }: { title: string; onBack: () => void; backLabel: string }) =>
      createElement("header", null,
        createElement("h1", null, title),
        createElement("button", { type: "button", onClick: onBack }, backLabel)),
  };
});

const emptyStatus: AuthSecurityStatus = {
  userId: "user-1",
  email: "person@example.test",
  emailVerified: true,
  pendingEmailChange: null,
  mfaFactors: [],
  currentAssuranceLevel: "aal1",
  nextAssuranceLevel: "aal1",
  signOutOtherSessionsAvailable: true,
};

const verifiedFactor = {
  id: "factor-1",
  type: "totp" as const,
  status: "verified" as const,
  friendlyName: "Authenticator",
  createdAt: null,
  updatedAt: null,
};

function renderSecurity() {
  return render(<MobileSecurityScreen onBack={vi.fn()} />);
}

describe("Mobile Account Security screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mobileAuthAdapter.getSecurityStatus.mockResolvedValue({ success: true, data: emptyStatus });
    mobileAuthAdapter.requestEmailChange.mockResolvedValue({
      success: true,
      data: { currentEmail: emptyStatus.email, newEmail: "next@example.test", status: "pending_confirmation" },
    });
    mobileAuthAdapter.updatePassword.mockResolvedValue({ success: true, data: undefined });
    mobileAuthAdapter.beginTotpEnrollment.mockResolvedValue({
      success: true,
      data: { factorId: "factor-new", qrCode: "<svg></svg>", secret: "private-secret", uri: "otpauth://totp/example" },
    });
    mobileAuthAdapter.verifyTotp.mockResolvedValue({ success: true, data: undefined });
    mobileAuthAdapter.removeTotpFactor.mockResolvedValue({ success: true, data: undefined });
    mobileAuthAdapter.signOutOtherSessions.mockResolvedValue({ success: true, data: undefined });
  });

  it("shows provider loading errors and retries without displaying fabricated account data", async () => {
    mobileAuthAdapter.getSecurityStatus
      .mockResolvedValueOnce({
        success: false,
        error: { code: "AUTH_SESSION_EXPIRED", message: "Expired provider session" },
      })
      .mockResolvedValueOnce({ success: true, data: emptyStatus });
    renderSecurity();

    expect(await screen.findByRole("alert")).toHaveTextContent("sessionExpired");
    expect(screen.queryByText(emptyStatus.email)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "retry" }));
    expect(await screen.findByText(emptyStatus.email)).toBeInTheDocument();
    expect(mobileAuthAdapter.getSecurityStatus).toHaveBeenCalledTimes(2);
  });

  it("validates password confirmation and updates it only through Auth", async () => {
    renderSecurity();
    const password = await screen.findByLabelText("newPassword");
    fireEvent.change(password, { target: { value: "strong-password" } });
    fireEvent.change(screen.getByLabelText("confirmPassword"), { target: { value: "different-password" } });
    expect(screen.getByRole("button", { name: "changePassword" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("confirmPassword"), { target: { value: "strong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "changePassword" }));
    expect(await screen.findByText("passwordSuccess")).toBeInTheDocument();
    expect(mobileAuthAdapter.updatePassword).toHaveBeenCalledWith({ newPassword: "strong-password" });
  });

  it("shows email change as pending only after the provider confirms the request", async () => {
    mobileAuthAdapter.requestEmailChange.mockResolvedValue({
      success: false,
      error: { code: "AUTH_NETWORK_ERROR", message: "Email provider unavailable." },
    });
    renderSecurity();
    await screen.findByText(emptyStatus.email);
    fireEvent.change(screen.getByLabelText("newEmail"), { target: { value: "next@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "requestEmailChange" }));
    expect(await screen.findByText("Email provider unavailable.")).toBeInTheDocument();
    expect(screen.queryByText(/Confirmation pending for/)).not.toBeInTheDocument();

    mobileAuthAdapter.requestEmailChange.mockResolvedValue({
      success: true,
      data: { currentEmail: emptyStatus.email, newEmail: "next@example.test", status: "pending_confirmation" },
    });
    fireEvent.change(screen.getByLabelText("newEmail"), { target: { value: "next@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "requestEmailChange" }));
    expect(await screen.findByText("Confirmation pending for next@example.test")).toBeInTheDocument();
  });

  it("enrolls, verifies and removes TOTP only through provider results", async () => {
    mobileAuthAdapter.getSecurityStatus
      .mockResolvedValueOnce({ success: true, data: emptyStatus })
      .mockResolvedValueOnce({ success: true, data: { ...emptyStatus, mfaFactors: [verifiedFactor] } })
      .mockResolvedValueOnce({ success: true, data: emptyStatus });
    mobileAuthAdapter.verifyTotp
      .mockResolvedValueOnce({
        success: false,
        error: { code: "AUTH_NETWORK_ERROR", message: "Authenticator verification failed." },
      })
      .mockResolvedValueOnce({ success: true, data: undefined });
    renderSecurity();
    fireEvent.click(await screen.findByRole("button", { name: "enableTotp" }));
    expect(await screen.findByText("private-secret")).toBeInTheDocument();
    expect(screen.getByTestId("totp-qr")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("verificationCode"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "verifyAndEnable" }));
    expect(await screen.findByText("Authenticator verification failed.")).toBeInTheDocument();
    expect(screen.getByText("private-secret")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "verifyAndEnable" }));
    expect(await screen.findByText("factorVerified")).toBeInTheDocument();
    expect(mobileAuthAdapter.verifyTotp).toHaveBeenCalledWith({ factorId: "factor-new", code: "123456" });

    fireEvent.click(screen.getByRole("button", { name: "removeFactor" }));
    const removeDialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(removeDialog).getByRole("button", { name: "removeFactor" }));
    await waitFor(() => expect(mobileAuthAdapter.removeTotpFactor).toHaveBeenCalledWith({ factorId: "factor-1" }));
  });

  it("deletes an incomplete enrollment when setup is cancelled", async () => {
    renderSecurity();
    fireEvent.click(await screen.findByRole("button", { name: "enableTotp" }));
    expect(await screen.findByText("private-secret")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    await waitFor(() => expect(mobileAuthAdapter.removeTotpFactor).toHaveBeenCalledWith({ factorId: "factor-new" }));
    expect(screen.queryByText("private-secret")).not.toBeInTheDocument();
  });

  it("confirms other-session revocation and surfaces provider failures", async () => {
    mobileAuthAdapter.signOutOtherSessions.mockResolvedValue({
      success: false,
      error: { code: "AUTH_NETWORK_ERROR", message: "Session provider unavailable." },
    });
    renderSecurity();
    await screen.findByText(emptyStatus.email);
    fireEvent.click(screen.getByRole("button", { name: "signOutOthers" }));
    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "signOutOthers" }));
    expect(await screen.findByText("Session provider unavailable.")).toBeInTheDocument();
    expect(screen.queryByText("sessionsRevoked")).not.toBeInTheDocument();
    expect(mobileAuthAdapter.signOutOtherSessions).toHaveBeenCalledOnce();
  });

  it("handles step-up verification before allowing a password retry", async () => {
    mobileAuthAdapter.getSecurityStatus.mockResolvedValue({
      success: true,
      data: { ...emptyStatus, mfaFactors: [verifiedFactor] },
    });
    mobileAuthAdapter.updatePassword
      .mockResolvedValueOnce({
        success: false,
        error: { code: "AUTH_REAUTH_REQUIRED", message: "Additional verification required." },
      })
      .mockResolvedValueOnce({ success: true, data: undefined });
    renderSecurity();
    await screen.findByText(emptyStatus.email);
    fireEvent.change(screen.getByLabelText("newPassword"), { target: { value: "strong-password" } });
    fireEvent.change(screen.getByLabelText("confirmPassword"), { target: { value: "strong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "changePassword" }));

    expect(await screen.findByText("reauthRequired")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("verificationCode"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "verify" }));
    await waitFor(() => expect(mobileAuthAdapter.verifyTotp).toHaveBeenCalledWith({ factorId: "factor-1", code: "123456" }));
    expect(await screen.findByText("reauthSuccess")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "changePassword" }));
    expect(await screen.findByText("passwordSuccess")).toBeInTheDocument();
    expect(mobileAuthAdapter.verifyTotp).toHaveBeenCalledWith({ factorId: "factor-1", code: "123456" });
    expect(mobileAuthAdapter.updatePassword).toHaveBeenCalledTimes(2);
  });
});
