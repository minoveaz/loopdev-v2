import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupplierP2PForm } from "@/loopdev/pages/erp/suppliers/SupplierP2PForm";
import type { SupplierP2PSetup, SupplierRecord } from "@/loopdev/domains/suppliers";

const mocks = vi.hoisted(() => ({
  userId: "reviewer-id",
  getSetup: vi.fn(),
  canReviewPayee: vi.fn(),
  saveSetup: vi.fn(),
  createPayeeInstruction: vi.fn(),
  updatePayeeInstruction: vi.fn(),
  verifyPayeeInstruction: vi.fn(),
  rejectPayeeInstruction: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    authSession: { user: { id: mocks.userId } },
    session: null,
  }),
}));

vi.mock("@/loopdev/domains/suppliers/adapter", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/loopdev/domains/suppliers/adapter")>();
  return {
    ...actual,
    supplierP2PAdapter: {
      getSetup: mocks.getSetup,
      canReviewPayee: mocks.canReviewPayee,
      saveSetup: mocks.saveSetup,
      createPayeeInstruction: mocks.createPayeeInstruction,
      updatePayeeInstruction: mocks.updatePayeeInstruction,
      verifyPayeeInstruction: mocks.verifyPayeeInstruction,
      rejectPayeeInstruction: mocks.rejectPayeeInstruction,
    },
  };
});

const supplier: SupplierRecord = {
  id: "supplier-protected-ui",
  organizationId: "organization-protected-ui",
  kind: "organization",
  legalName: "Protected Supplier",
  countryCode: "ES",
  status: "active",
  version: 1,
  createdAt: "2026-10-25T00:00:00.000Z",
  updatedAt: "2026-10-25T00:00:00.000Z",
};

const setup: SupplierP2PSetup = {
  version: 1,
  contacts: [],
  addresses: [],
  purchaseDefaults: {
    currency: null,
    paymentTermCode: null,
    deliveryTermCode: null,
    deliveryAddressId: null,
    financeReference: null,
  },
  payeeInstructions: [{
    id: "payee-instruction-1",
    beneficiaryName: "Test Beneficiary",
    bankCountryCode: "ES",
    bankName: "Test Bank",
    accountIdentifier: "ES00-SYNTHETIC-ACCOUNT",
    currency: "EUR",
    status: "pending_review",
    rejectionReason: null,
    updatedBy: "editor-id",
    reviewedBy: null,
    reviewedAt: null,
    verifiedBy: null,
    verifiedAt: null,
    version: 3,
  }],
};

describe("Supplier protected payment UI", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_CATALOG_ADAPTER_MODE", "supabase");
    mocks.userId = "reviewer-id";
    mocks.getSetup.mockReset().mockResolvedValue(setup);
    mocks.canReviewPayee.mockReset().mockResolvedValue(true);
    mocks.saveSetup.mockReset();
    mocks.createPayeeInstruction.mockReset();
    mocks.updatePayeeInstruction.mockReset();
    mocks.verifyPayeeInstruction.mockReset().mockResolvedValue(setup.payeeInstructions[0]);
    mocks.rejectPayeeInstruction.mockReset();
  });

  it("exposes verification only to a different eligible reviewer", async () => {
    const first = render(<SupplierP2PForm organizationId={supplier.organizationId} supplier={supplier} onExit={vi.fn()} onSaved={vi.fn()} />);

    expect(await screen.findByText("Test Beneficiary")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Verify" }));

    await waitFor(() => expect(mocks.verifyPayeeInstruction).toHaveBeenCalledWith(
      "payee-instruction-1",
      { organizationId: supplier.organizationId },
      3,
    ));

    first.unmount();
    mocks.userId = "editor-id";
    const { unmount } = render(<SupplierP2PForm organizationId={supplier.organizationId} supplier={supplier} onExit={vi.fn()} onSaved={vi.fn()} />);
    expect(await screen.findByText("The editor cannot verify or reject their own instruction.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Verify" })).not.toBeInTheDocument();
    unmount();
  });

  it("removes protected payment values from the UI when the browser goes offline", async () => {
    render(<SupplierP2PForm organizationId={supplier.organizationId} supplier={supplier} onExit={vi.fn()} onSaved={vi.fn()} />);

    expect(await screen.findByText("Test Beneficiary")).toBeInTheDocument();
    fireEvent(window, new Event("offline"));

    expect(await screen.findByText("Payment instructions are unavailable offline")).toBeInTheDocument();
    expect(screen.queryByText("Test Beneficiary")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Account identifier")).not.toBeInTheDocument();
  });
});
