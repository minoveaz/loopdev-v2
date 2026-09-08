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
import { APPEARANCE_STORAGE_KEY, DEFAULT_APPEARANCE } from "@/config/themeConfig";

/**
 * Visual snapshot regression — captures structural signatures of key
 * screens in both LTR and RTL after seeding the language toggle and the
 * Theme Customizer Direction. These snapshots lock in:
 *   - <html dir> + <html lang> resolved by the providers,
 *   - sidebar transform classes (the RTL-specific positive translate
 *     must appear when dir=rtl on mobile),
 *   - content padding-inline classes (logical `ps-` so they flip),
 *   - topbar / hamburger visibility classes.
 */

/* ---- matchMedia harness ---- */

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

function setViewport(width: number) {
  mqRegistry.clear();
  for (const q of [
    "(min-width: 768px)",
    "(min-width: 1024px)",
    "(min-width: 1200px)",
  ]) {
    const m = q.match(/min-width:\s*(\d+)px/);
    const min = m ? Number(m[1]) : 0;
    mqRegistry.set(q, { matches: width >= min, listeners: new Set() });
  }
}

/* ---- Signature extractor (dir/lang aware) ---- */

function signature(container: HTMLElement) {
  const html = document.documentElement;
  const sidebar = container.querySelector("#app-sidebar") as HTMLElement | null;
  const topbar = container.querySelector("[data-app-topbar]") as HTMLElement | null;
  const content = container.querySelector("[data-app-content]") as HTMLElement | null;
  const toggleBtn = topbar?.querySelector('[aria-controls="app-sidebar"]') as HTMLElement | null;

  const filt = (cls: string, re: RegExp) =>
    cls.split(/\s+/).filter((c) => re.test(c)).sort();

  return {
    html: { dir: html.getAttribute("dir"), lang: html.getAttribute("lang") },
    sidebar: sidebar
      ? {
          role: sidebar.getAttribute("role"),
          transformClasses: filt(sidebar.className, /translate-x|rtl:/),
          widthClasses: filt(sidebar.className, /(^|:)w-\[/),
        }
      : null,
    content: content
      ? { paddingClasses: filt(content.className, /(^|:)ps-/) }
      : null,
    sidebarToggle: toggleBtn
      ? { visibilityClasses: filt(toggleBtn.className, /^(flex|hidden|md:|nav:|max-md:)/) }
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

/** Pre-seed both toggles before mount: the customizer direction lives in
 *  `rivera-theme-config` (raw key), language lives under the `rivera:`
 *  prefix used by storage.ts. */
function seed({ direction, lang }: { direction: "ltr" | "rtl"; lang: string }) {
  localStorage.setItem(
    APPEARANCE_STORAGE_KEY,
    JSON.stringify({ ...DEFAULT_APPEARANCE, direction }),
  );
  localStorage.setItem("rivera:ui:language", JSON.stringify(lang));
  localStorage.setItem(
    "rivera:" + STORAGE_KEYS.session,
    JSON.stringify({ email: "test@example.com", name: "Test User" }),
  );
}

function resetHtml() {
  const r = document.documentElement;
  ["brand","density","sidebarStyle","navbarStyle","radius","contentWidth","chartStyle","headerHeight","headerPosition"].forEach((k) => delete r.dataset[k]);
  r.removeAttribute("dir");
  r.removeAttribute("lang");
  r.removeAttribute("style");
  r.classList.remove("dark");
}

/* ---- Test matrix ---- */

const KEY_ROUTES = [
  { name: "dashboard", path: "/" },
  { name: "analytics", path: "/dashboard/analytics" },
  { name: "users", path: "/management/users" },
  { name: "appearance", path: "/settings/appearance" },
];

const BREAKPOINTS = [
  { name: "mobile", width: 375 },
  { name: "desktop", width: 1366 },
];

describe("Visual regression — LTR vs RTL after toggle", () => {
  beforeEach(() => {
    mqRegistry.clear();
    installMatchMedia();
    localStorage.clear();
    resetHtml();
  });
  afterEach(() => {
    cleanup();
    localStorage.clear();
    resetHtml();
  });

  for (const route of KEY_ROUTES) {
    for (const bp of BREAKPOINTS) {
      it(`LTR signature stable @ ${route.name}/${bp.name}`, () => {
        seed({ direction: "ltr", lang: "en" });
        const { container } = renderShellAt(bp.width, route.path);
        expect(signature(container)).toMatchSnapshot();
      });

      it(`RTL signature stable @ ${route.name}/${bp.name}`, () => {
        seed({ direction: "rtl", lang: "ar" });
        const { container } = renderShellAt(bp.width, route.path);
        const sig = signature(container);
        expect(sig.html?.dir).toBe("rtl");
        expect(sig).toMatchSnapshot();
      });
    }
  }

  it("Arabic language results in RTL on <html dir>", () => {
    seed({ direction: "ltr", lang: "ar" });
    const { container } = renderShellAt(1366, "/");
    const sig = signature(container);
    expect(sig.html?.dir).toBe("rtl");
    expect(sig.html?.lang).toBe("ar");
  });

  it("Customizer RTL toggle sets <html dir> to rtl", () => {
    seed({ direction: "rtl", lang: "en" });
    const { container } = renderShellAt(1366, "/");
    const sig = signature(container);
    expect(sig.html?.dir).toBe("rtl");
    expect(sig.html?.lang).toBe("en");
  });
});
