import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

const auth = vi.hoisted(() => ({ useAuth: vi.fn() }));

vi.mock("@/hooks/use-auth", () => ({ useAuth: auth.useAuth }));

function LoginRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="login-state">{JSON.stringify(location.state)}</output>
      <button onClick={() => navigate(-1)}>Back</button>
    </>
  );
}

describe("Supplier route authorization", () => {
  beforeEach(() => {
    auth.useAuth.mockReset();
  });

  it("redirects unauthenticated deep links to sign-in without trapping browser back", () => {
    auth.useAuth.mockReturnValue({ session: null, isLoading: false });
    render(
      <MemoryRouter initialEntries={["/app/erp/products", "/app/erp/suppliers"]} initialIndex={1}>
        <Routes>
          <Route path="/app/erp/products" element={<p>Products</p>} />
          <Route path="/app/erp/suppliers" element={<ProtectedRoute><p>Suppliers</p></ProtectedRoute>} />
          <Route path="/pages/login" element={<LoginRoute />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("login-state")).toHaveTextContent('{"from":"/app/erp/suppliers"}');
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("Products")).toBeInTheDocument();
  });

  it("renders the Supplier route for an authenticated session", () => {
    auth.useAuth.mockReturnValue({ session: { user: { id: "user-1" } }, isLoading: false });
    render(
      <MemoryRouter initialEntries={["/app/erp/suppliers"]}>
        <Routes>
          <Route path="/app/erp/suppliers" element={<ProtectedRoute><p>Suppliers</p></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Suppliers")).toBeInTheDocument();
  });
});
