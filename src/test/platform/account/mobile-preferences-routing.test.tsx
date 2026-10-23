import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { accountDestinations } from "../../../../packages/contracts/src/account-navigation";
import { MobileAccountSheet } from "../../../../apps/mobile/components/MobileAccountSheet";
import { MobileAccountScreen } from "../../../../apps/mobile/components/MobileAccountScreen";

const mocks = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signOut: vi.fn(),
  },
  tenant: {
    getTenantContext: vi.fn(),
    onTenantContextChange: vi.fn(),
    listOrganizations: vi.fn(),
    selectOrganization: vi.fn(),
  },
  translate: (key: string) => key.split(".").at(-1) ?? key,
}));

vi.mock("../../../../apps/mobile/adapters/auth", () => ({
  mobileAuthAdapter: mocks.auth,
  mobileTenantContextAdapter: mocks.tenant,
}));

vi.mock("../../../../apps/mobile/i18n", () => ({
  useMobileI18n: () => ({ t: mocks.translate }),
}));

vi.mock("../../../../apps/mobile/components/MobileBottomSheet", async () => {
  const { createElement } = await import("react");
  return {
    MobileBottomSheet: ({ children, visible }: { children: React.ReactNode; visible: boolean }) =>
      visible ? createElement("div", null, children) : null,
  };
});

vi.mock("../../../../apps/mobile/components/MobileModal", () => ({
  MobileConfirmDialog: () => null,
}));

vi.mock("../../../../apps/mobile/theme/tokens", () => ({
  mobileTheme: { colors: { primary: "", textHeading: "", textMuted: "", textSubtle: "", destructive: "", danger: "", textInverse: "", primarySoft: "", primaryBorder: "", border: "" } },
}));

vi.mock("../../../../apps/mobile/node_modules/lucide-react-native/dist/esm/lucide-react-native.mjs", () => {
  const Icon = () => null;
  return {
    Check: Icon,
    ChevronRight: Icon,
    CreditCard: Icon,
    Globe: Icon,
    LogOut: Icon,
    Settings: Icon,
    ShieldCheck: Icon,
    UserRound: Icon,
  };
});

describe("Native Account Preferences navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.getSession.mockResolvedValue(null);
    mocks.auth.onAuthStateChange.mockReturnValue(() => {});
    mocks.tenant.getTenantContext.mockReturnValue(null);
    mocks.tenant.onTenantContextChange.mockReturnValue(() => {});
    mocks.tenant.listOrganizations.mockResolvedValue({ success: true, data: [] });
  });

  it("opens canonical personal settings from the account sheet and removes the legacy quick-language control", async () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    render(<MobileAccountSheet visible onClose={onClose} onNavigate={onNavigate} />);
    await waitFor(() => expect(mocks.tenant.listOrganizations).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "accountSettings" }));

    expect(onNavigate).toHaveBeenCalledWith(accountDestinations.settings.path);
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("opens the canonical Profile destination from the account sheet", async () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    render(<MobileAccountSheet visible onClose={onClose} onNavigate={onNavigate} />);
    await waitFor(() => expect(mocks.tenant.listOrganizations).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "profile" }));

    expect(onNavigate).toHaveBeenCalledWith(accountDestinations.profile.path);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps Billing visible but disabled without navigating or closing the account sheet", async () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    render(<MobileAccountSheet visible onClose={onClose} onNavigate={onNavigate} />);
    await waitFor(() => expect(mocks.tenant.listOrganizations).toHaveBeenCalled());

    const billing = screen.getByRole("button", { name: "billing" });
    expect(billing).toBeDisabled();

    fireEvent.click(billing);

    expect(onNavigate).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(billing).toBeInTheDocument();
  });

  it("opens personal settings from the More screen", () => {
    const onNavigate = vi.fn();
    render(<MobileAccountScreen onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole("button", { name: "Preferences" }));

    expect(onNavigate).toHaveBeenCalledWith(accountDestinations.settings.path);
  });

  it("opens Profile from the More screen", () => {
    const onNavigate = vi.fn();
    render(<MobileAccountScreen onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole("button", { name: "Profile" }));

    expect(onNavigate).toHaveBeenCalledWith(accountDestinations.profile.path);
  });
});
