import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, render, cleanup } from "@testing-library/react";
import { ThemeProvider } from "@/hooks/use-theme";
import { Topbar } from "@/components/layout/Topbar";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { I18nProvider } from "@/i18n";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeCustomizerProvider } from "@/components/theme/ThemeCustomizer";
import { ThemeConfigProvider } from "@/providers/ThemeConfigProvider";

/**
 * Verifies that when the user selects `system` mode, the topbar's
 * background (`bg-card`) and border (`border-border/70`) recompute
 * the right HSL token as `prefers-color-scheme` flips between
 * light and dark — i.e. the `dark` class on <html> tracks the OS,
 * which drives `--card` / `--border` tokens.
 */

type Listener = (e: MediaQueryListEvent) => void;
const listeners = new Set<Listener>();
let darkMatches = false;

function installMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      get matches() {
        return query.includes("dark") ? darkMatches : false;
      },
      media: query,
      onchange: null,
      addListener: (l: Listener) => listeners.add(l),
      removeListener: (l: Listener) => listeners.delete(l),
      addEventListener: (_: string, l: Listener) => listeners.add(l),
      removeEventListener: (_: string, l: Listener) => listeners.delete(l),
      dispatchEvent: () => true,
    }),
  });
}

function fireSystemChange(toDark: boolean) {
  darkMatches = toDark;
  const evt = { matches: toDark, media: "(prefers-color-scheme: dark)" } as MediaQueryListEvent;
  for (const l of listeners) l(evt);
}

function Harness() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <ThemeConfigProvider>
          <I18nProvider>
            <AuthProvider>
              <MemoryRouter>
                <TooltipProvider>
                  <ThemeCustomizerProvider>
                    <Topbar onSidebarToggle={() => {}} sidebarCollapsed={false} />
                  </ThemeCustomizerProvider>
                </TooltipProvider>
              </MemoryRouter>
            </AuthProvider>
          </I18nProvider>
        </ThemeConfigProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe("Topbar — system mode background & border tracking", () => {
  beforeEach(() => {
    listeners.clear();
    darkMatches = false;
    document.documentElement.classList.remove("dark");
    localStorage.clear();
    localStorage.setItem("rivera:theme", JSON.stringify("system"));
    installMatchMedia();
  });
  afterEach(() => {
    cleanup();
    document.documentElement.classList.remove("dark");
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("starts in light: <html> has no `dark` class; topbar bg/border classes intact", () => {
    const { container } = render(<Harness />);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    const header = container.querySelector("[data-app-topbar]")!;
    expect(header.className).toMatch(/\bbg-card\b/);
    expect(header.className).toMatch(/\bborder-border\/70\b/);
    // No translucent overlay that would taint the background.
    expect(header.className).not.toMatch(/bg-card\/85/);
    expect(header.className).not.toMatch(/bg-card\/70/);
  });

  it("system → dark flip toggles `dark` on <html> so tokens recompute", () => {
    render(<Harness />);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    act(() => fireSystemChange(true));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    act(() => fireSystemChange(false));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("topbar uses semantic tokens, not hardcoded colors", () => {
    const { container } = render(<Harness />);
    const header = container.querySelector("[data-app-topbar]")!;
    // Hardcoded RGB / hex / Tailwind palette names would defeat system mode.
    expect(header.className).not.toMatch(/\bbg-(white|black|gray-|slate-|zinc-|neutral-)/);
    expect(header.className).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    expect(header.getAttribute("style") ?? "").not.toMatch(/background/);
  });
});