import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthSecurityStatus } from "../../../../packages/contracts/src/auth-port";
import { I18nProvider } from "@/i18n";
import Security from "@/loopdev/pages/account/Security";

const { authAdapter } = vi.hoisted(() => ({
  authAdapter: {
    getSecurityStatus: vi.fn(),
    getClient: vi.fn(() => null),
    requestEmailChange: vi.fn(),
    updatePassword: vi.fn(),
    beginTotpEnrollment: vi.fn(),
    verifyTotp: vi.fn(),
    removeTotpFactor: vi.fn(),
    signOutOtherSessions: vi.fn(),
  },
}));

vi.mock("@/loopdev/domains/platform/adapter/auth-supabase", () => ({
  defaultWebAuthAdapter: authAdapter,
}));

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
  return render(
    <I18nProvider>
      <MemoryRouter initialEntries={["/app/account/security"]}>
        <Security />
      </MemoryRouter>
    </I18nProvider>,
  );
}

describe("Account Security page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authAdapter.getSecurityStatus.mockResolvedValue({ success: true, data: emptyStatus });
    authAdapter.requestEmailChange.mockResolvedValue({
      success: true,
      data: { currentEmail: emptyStatus.email, newEmail: "next@example.test", status: "pending_confirmation" },
    });
    authAdapter.updatePassword.mockResolvedValue({ success: true, data: undefined });
    authAdapter.beginTotpEnrollment.mockResolvedValue({
      success: true,
      data: { factorId: "factor-new", qrCode: "<svg></svg>", secret: "private-secret", uri: "otpauth://totp/example" },
    });
    authAdapter.verifyTotp.mockResolvedValue({ success: true, data: undefined });
    authAdapter.removeTotpFactor.mockResolvedValue({ success: true, data: undefined });
    authAdapter.signOutOtherSessions.mockResolvedValue({ success: true, data: undefined });
  });

  it("loads provider-owned account security state", async () => {
    renderSecurity();

    expect(await screen.findByText("person@example.test")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(authAdapter.getSecurityStatus).toHaveBeenCalledOnce();
  });

  it("shows an expired-session error and retries the provider read without inventing security data", async () => {
    authAdapter.getSecurityStatus.mockResolvedValueOnce({
      success: false,
      error: { code: "AUTH_SESSION_EXPIRED", message: "Expired provider session" },
    });
    renderSecurity();

    expect(await screen.findByText("Your session has expired. Sign in again to continue.")).toBeInTheDocument();
    expect(screen.queryByText("person@example.test")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("person@example.test")).toBeInTheDocument();
    expect(authAdapter.getSecurityStatus).toHaveBeenCalledTimes(2);
  });

  it("validates and changes the password through AuthPort", async () => {
    renderSecurity();
    const password = await screen.findByLabelText("New password");
    const confirmation = screen.getByLabelText("Confirm new password");
    fireEvent.change(password, { target: { value: "strong-password" } });
    fireEvent.change(confirmation, { target: { value: "different-password" } });

    expect(screen.getByText("The passwords do not match.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change password" })).toBeDisabled();

    fireEvent.change(confirmation, { target: { value: "strong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Your password was changed.");
    expect(authAdapter.updatePassword).toHaveBeenCalledWith({ newPassword: "strong-password" });
  });

  it("requests an email change and displays only its pending provider result", async () => {
    renderSecurity();
    await screen.findByText("person@example.test");
    fireEvent.change(screen.getByLabelText("New email address"), { target: { value: "next@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Request email change" }));

    expect(await screen.findByText("Confirmation pending for next@example.test")).toBeInTheDocument();
    expect(authAdapter.requestEmailChange).toHaveBeenCalledWith({ newEmail: "next@example.test" });
  });

  it("enrolls and verifies TOTP before showing MFA as enabled", async () => {
    authAdapter.getSecurityStatus
      .mockResolvedValueOnce({ success: true, data: emptyStatus })
      .mockResolvedValueOnce({ success: true, data: { ...emptyStatus, mfaFactors: [verifiedFactor] } });
    renderSecurity();
    fireEvent.click(await screen.findByRole("button", { name: "Set up authenticator app" }));

    expect(await screen.findByTestId("totp-secret")).toHaveTextContent("private-secret");
    fireEvent.change(screen.getByLabelText("Six-digit verification code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify and enable" }));

    expect(await screen.findByText("Authenticator verified")).toBeInTheDocument();
    expect(authAdapter.verifyTotp).toHaveBeenCalledWith({ factorId: "factor-new", code: "123456" });
    expect(authAdapter.beginTotpEnrollment).toHaveBeenCalledOnce();
  });

  it("removes an incomplete TOTP enrollment when setup is cancelled", async () => {
    renderSecurity();
    fireEvent.click(await screen.findByRole("button", { name: "Set up authenticator app" }));
    expect(await screen.findByTestId("totp-secret")).toHaveTextContent("private-secret");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(authAdapter.removeTotpFactor).toHaveBeenCalledWith({ factorId: "factor-new" }));
    expect(await screen.findByText("Authenticator removed.")).toBeInTheDocument();
    expect(screen.queryByTestId("totp-secret")).not.toBeInTheDocument();
    expect(authAdapter.removeTotpFactor).toHaveBeenCalledWith({ factorId: "factor-new" });
  });

  it("removes only a provider-listed factor and signs out other sessions after confirmation", async () => {
    authAdapter.getSecurityStatus.mockResolvedValue({
      success: true,
      data: { ...emptyStatus, mfaFactors: [verifiedFactor] },
    });
    renderSecurity();
    await screen.findByText("Authenticator verified");
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    const removeDialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(removeDialog).getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(authAdapter.removeTotpFactor).toHaveBeenCalledWith({ factorId: "factor-1" }));

    fireEvent.click(screen.getByRole("button", { name: "Sign out other sessions" }));
    const signOutDialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(signOutDialog).getByRole("button", { name: "Sign out other sessions" }));
    await waitFor(() => expect(authAdapter.signOutOtherSessions).toHaveBeenCalledOnce());
    expect(await screen.findByText("Your other sessions were signed out.")).toBeInTheDocument();
  });

  it("surfaces step-up requirements and verifies with an enrolled TOTP factor", async () => {
    authAdapter.getSecurityStatus.mockResolvedValue({
      success: true,
      data: { ...emptyStatus, mfaFactors: [verifiedFactor] },
    });
    authAdapter.updatePassword
      .mockResolvedValueOnce({
        success: false,
        error: { code: "AUTH_REAUTH_REQUIRED", message: "Additional verification required." },
      })
      .mockResolvedValueOnce({ success: true, data: undefined });
    renderSecurity();
    const password = await screen.findByLabelText("New password");
    fireEvent.change(password, { target: { value: "strong-password" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "strong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(await screen.findByText(/requires additional verification/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Six-digit verification code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify code" }));
    await waitFor(() => expect(authAdapter.verifyTotp).toHaveBeenCalledWith({ factorId: "factor-1", code: "123456" }));
    expect(await screen.findByText(/Retry the action/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    expect(await screen.findByText("Your password was changed.")).toBeInTheDocument();
    expect(authAdapter.verifyTotp).toHaveBeenCalledWith({ factorId: "factor-1", code: "123456" });
    expect(authAdapter.updatePassword).toHaveBeenCalledTimes(2);
  });

  it("surfaces provider failures for email, MFA verification, and session revocation without success-shaped updates", async () => {
    authAdapter.requestEmailChange.mockResolvedValue({
      success: false,
      error: { code: "AUTH_NETWORK_ERROR", message: "Email provider unavailable." },
    });
    authAdapter.verifyTotp.mockResolvedValue({
      success: false,
      error: { code: "AUTH_NETWORK_ERROR", message: "Authenticator verification failed." },
    });
    authAdapter.signOutOtherSessions.mockResolvedValue({
      success: false,
      error: { code: "AUTH_NETWORK_ERROR", message: "Session provider unavailable." },
    });
    renderSecurity();

    await screen.findByText("person@example.test");
    fireEvent.change(screen.getByLabelText("New email address"), { target: { value: "next@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Request email change" }));
    expect(await screen.findByText("Email provider unavailable.")).toBeInTheDocument();
    expect(screen.queryByText(/Confirmation pending for/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Set up authenticator app" }));
    await screen.findByTestId("totp-secret");
    fireEvent.change(screen.getByLabelText("Six-digit verification code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verify and enable" }));
    expect(await screen.findByText("Authenticator verification failed.")).toBeInTheDocument();
    expect(screen.queryByText("Two-factor authentication is enabled.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Sign out other sessions" }));
    const signOutDialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(signOutDialog).getByRole("button", { name: "Sign out other sessions" }));
    expect(await screen.findByText("Session provider unavailable.")).toBeInTheDocument();
    expect(screen.queryByText("Your other sessions were signed out.")).not.toBeInTheDocument();
  });
});
