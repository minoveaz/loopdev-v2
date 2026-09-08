import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { ThemeConfigProvider } from "@/providers/ThemeConfigProvider";
import { ThemeCustomizerProvider } from "@/components/theme/ThemeCustomizer";
import { AuthProvider } from "@/hooks/use-auth";
import { I18nProvider } from "@/i18n";
import { AppShell } from "@/components/layout/AppShell";
import { STORAGE_KEYS } from "@/lib/storage";

/* ---- matchMedia harness (per-breakpoint) ---- */

type Listener = (e: MediaQueryListEvent) => void;
const mqRegistry = new Map<string, { matches: boolean; listeners: Set<Listener> }>();

function installMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => {
      const entry = mqRegistry.get(query) ?? { matches: false, listeners: new Set() };
      mqRegistry.set(query, entry);
      return {
        get matches() { return entry.matches; },
        media: query,
        onchange: null,
        addListener: (l: Listener) => entry.listeners.add(l),
        removeListener: (l: Listener) => entry.listeners.delete(l),
        addEventListener: (_: string, l: Listener) => entry.listeners.add(l),
        removeEventListener: (_: string, l: Listener) => entry.listeners.delete(l),
        dispatchEvent: () => true,
      };
    },
  });
}

/** Map a logical viewport width into the matchMedia state our shell reads. */
function setViewport(width: number) {
  mqRegistry.clear();
  // Common queries the shell + sidebar + topbar query.
  const queries = [
    "(min-width: 768px)",
    "(min-width: 1024px)",
    "(min-width: 1200px)",
  ];
  for (const q of queries) {
    const m = q.match(/min-width:\s*(\d+)px/);
    const min = m ? Number(m[1]) : 0;
    mqRegistry.set(q, { matches: width >= min, listeners: new Set() });
  }
}

/* ---- Layout signature extractor ----
 *
 * Rather than snapshotting megabytes of markup, we extract a small,
 * deterministic summary of the structural decisions that drive layout
 * (sidebar width/transform, content padding, topbar toggle visibility,
 * backdrop, ARIA roles). Any regression in those will diff cleanly.
 */
function signature(container: HTMLElement) {
  const sidebar = container.querySelector("#app-sidebar") as HTMLElement | null;
  const topbar = container.querySelector("[data-app-topbar]") as HTMLElement | null;
  const content = container.querySelector("[data-app-content]") as HTMLElement | null;
  const backdrop = container.querySelector('[aria-hidden="true"].fixed.inset-0') as HTMLElement | null;
  const toggleBtn = topbar?.querySelector('[aria-controls="app-sidebar"]') as HTMLElement | null;
  const sidebarLogoImg = sidebar?.querySelector("img") as HTMLImageElement | null;
  const sidebarWordmark = sidebar?.querySelector("span.font-display") as HTMLElement | null;

  const pickWidth = (cls: string) =>
    cls
      .split(/\s+/)
      .filter((c) => /(^|:)w-\[/.test(c) || /(^|:)w-\d/.test(c))
      .sort();
  const pickTransform = (cls: string) =>
    cls
      .split(/\s+/)
      .filter((c) => /translate-x/.test(c))
      .sort();
  const pickPadding = (cls: string) =>
    cls
      .split(/\s+/)
      .filter((c) => /(^|:)ps-/.test(c) || /(^|:)pl-/.test(c))
      .sort();
  const pickVisibility = (cls: string) =>
    cls
      .split(/\s+/)
      .filter((c) => /^(hidden|flex|block|md:|nav:|lg:|max-md:)/.test(c) && /(hidden|flex|block)/.test(c))
      .sort();

  return {
    sidebar: sidebar
      ? {
          role: sidebar.getAttribute("role"),
          ariaModal: sidebar.getAttribute("aria-modal"),
          ariaHidden: sidebar.getAttribute("aria-hidden"),
          widthClasses: pickWidth(sidebar.className),
          transformClasses: pickTransform(sidebar.className),
        }
      : null,
    backdropPresent: !!backdrop,
    topbar: topbar
      ? {
          present: true,
        }
      : null,
    sidebarToggle: toggleBtn
      ? {
          visibilityClasses: pickVisibility(toggleBtn.className),
          ariaPressed: toggleBtn.getAttribute("aria-pressed"),
        }
      : null,
    content: content ? { paddingClasses: pickPadding(content.className) } : null,
    logo: sidebarLogoImg
      ? {
          src: (sidebarLogoImg.getAttribute("src") || "").replace(/^.*\/(?=[^/]+$)/, "/"),
          alt: sidebarLogoImg.getAttribute("alt"),
          hasWordmark: !!sidebarWordmark,
        }
      : null,
  };
}

/* ---- Render harness ---- */

function Providers({ children, route = "/" }: { children: React.ReactNode; route?: string }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <ThemeConfigProvider>
          <I18nProvider>
            <AuthProvider>
              <TooltipProvider delayDuration={0}>
                <MemoryRouter initialEntries={[route]}>
                  <ThemeCustomizerProvider>{children}</ThemeCustomizerProvider>
                </MemoryRouter>
              </TooltipProvider>
            </AuthProvider>
          </I18nProvider>
        </ThemeConfigProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function renderShellAt(width: number, route = "/") {
  setViewport(width);
  return render(
    <Providers route={route}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="*" element={<div data-testid="page-stub">stub</div>} />
        </Route>
      </Routes>
    </Providers>,
  );
}

/* ---- Tests ---- */

const BREAKPOINTS = [
  { name: "mobile-375", width: 375 },
  { name: "tablet-768", width: 768 },
  { name: "laptop-1024", width: 1024 },
  { name: "desktop-1366", width: 1366 },
  { name: "wide-1920", width: 1920 },
];

describe("Visual regression — AppShell layout signatures", () => {
  beforeEach(() => {
    mqRegistry.clear();
    installMatchMedia();
    localStorage.clear();
    // Pre-seed a session so AppShell renders without redirecting.
    // storage.ts namespaces all keys under the "rivera:" prefix.
    localStorage.setItem(
      "rivera:" + STORAGE_KEYS.session,
      JSON.stringify({ email: "test@example.com", name: "Test User" }),
    );
  });
  afterEach(() => {
    cleanup();
  });

  for (const bp of BREAKPOINTS) {
    it(`layout signature is stable @ ${bp.name}`, () => {
      const { container } = renderShellAt(bp.width);
      expect(signature(container)).toMatchSnapshot();
    });
  }

  it("sidebar collapsed=true changes content padding @ desktop", () => {
    localStorage.setItem("rivera:" + STORAGE_KEYS.sidebarCollapsed, "true");
    const { container } = renderShellAt(1366);
    const sig = signature(container);
    expect(sig.content?.paddingClasses).toMatchInlineSnapshot(`
      [
        "md:ps-[60px]",
        "nav:ps-[60px]",
      ]
    `);
  });

  it("sidebar collapsed=false yields full-width padding @ desktop", () => {
    localStorage.setItem("rivera:" + STORAGE_KEYS.sidebarCollapsed, "false");
    const { container } = renderShellAt(1366);
    const sig = signature(container);
    expect(sig.content?.paddingClasses).toMatchInlineSnapshot(`
      [
        "md:ps-[60px]",
        "nav:ps-[260px]",
      ]
    `);
  });

  it("hamburger toggle visibility classes are stable across breakpoints", () => {
    const out: Record<string, string[] | undefined> = {};
    for (const bp of BREAKPOINTS) {
      const { container, unmount } = renderShellAt(bp.width);
      out[bp.name] = signature(container).sidebarToggle?.visibilityClasses;
      unmount();
    }
    // Same set of classes regardless of breakpoint — actual show/hide
    // is driven by CSS, not React, so the markup must be invariant.
    expect(out).toMatchInlineSnapshot(`
      {
        "desktop-1366": [
          "flex",
          "md:hidden",
          "nav:flex",
        ],
        "laptop-1024": [
          "flex",
          "md:hidden",
          "nav:flex",
        ],
        "mobile-375": [
          "flex",
          "md:hidden",
          "nav:flex",
        ],
        "tablet-768": [
          "flex",
          "md:hidden",
          "nav:flex",
        ],
        "wide-1920": [
          "flex",
          "md:hidden",
          "nav:flex",
        ],
      }
    `);
  });

  it("RTL flip preserves sidebar structure but adds rtl-scoped transform @ mobile", async () => {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
    const { container } = renderShellAt(375);
    const sig = signature(container);
    // Mobile drawer closed by default — both transform classes must
    // be present so RTL gets a positive translate.
    expect(sig.sidebar?.transformClasses).toEqual(
      expect.arrayContaining([
        "max-md:-translate-x-full",
        "max-md:rtl:translate-x-full",
        "md:translate-x-0",
      ]),
    );
  });

  it("logo renders with Rivera asset and wordmark across breakpoints (expanded)", () => {
    localStorage.setItem("rivera:" + STORAGE_KEYS.sidebarCollapsed, "false");
    const out: Record<string, ReturnType<typeof signature>["logo"]> = {};
    for (const bp of BREAKPOINTS) {
      const { container, unmount } = renderShellAt(bp.width);
      out[bp.name] = signature(container).logo;
      unmount();
    }
    for (const bp of BREAKPOINTS) {
      const logo = out[bp.name];
      expect(logo, `logo missing @ ${bp.name}`).not.toBeNull();
      expect(logo!.alt).toBe("Rivera");
      // Vite resolves the asset import to a hashed path; just verify
      // the basename references the dark Rivera mark.
      expect(logo!.src).toMatch(/rivera-logo-dark/);
    }
    // Above the nav breakpoint the wordmark is visible.
    expect(out["desktop-1366"]?.hasWordmark).toBe(true);
    expect(out["wide-1920"]?.hasWordmark).toBe(true);
  });

  it("logo mark renders even when sidebar is collapsed @ laptop", () => {
    localStorage.setItem("rivera:" + STORAGE_KEYS.sidebarCollapsed, "true");
    const { container } = renderShellAt(1024);
    const logo = signature(container).logo;
    expect(logo).not.toBeNull();
    expect(logo!.alt).toBe("Rivera");
    expect(logo!.src).toMatch(/rivera-logo-dark/);
  });
});
