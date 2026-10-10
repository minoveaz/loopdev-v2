import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Login from "@/template/rivera/pages/auth/Login";

const authMocks = vi.hoisted(() => ({
  signIn: vi.fn(),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ signIn: authMocks.signIn }),
}));

describe("Login", () => {
  beforeEach(() => {
    authMocks.signIn.mockReset().mockResolvedValue({ success: false, error: "Invalid credentials" });
  });

  it("starts with empty credentials and does not expose demo accounts", () => {
    render(<MemoryRouter><Login /></MemoryRouter>);

    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
    expect(screen.queryByText(/Demo Accounts|admin@loop\.dev|admin@localhost\.com|password123/)).not.toBeInTheDocument();
  });

  it("authenticates with the credentials entered by the user", async () => {
    render(<MemoryRouter><Login /></MemoryRouter>);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "member@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct-horse" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in to LoopDev" }));

    await waitFor(() => {
      expect(authMocks.signIn).toHaveBeenCalledWith("member@example.com", "correct-horse");
    });
  });
});
