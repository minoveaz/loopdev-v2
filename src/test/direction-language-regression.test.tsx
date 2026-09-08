import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ThemeConfigProvider, useThemeConfigContext } from "@/providers/ThemeConfigProvider";
import { I18nProvider, useI18n, type LangCode } from "@/i18n";

/**
 * Selecting an RTL language (Arabic / Hebrew) must flip `<html dir>` to
 * "rtl" and stay there across:
 *   - changing brand / density / navbar / etc. via the customizer
 *   - toggling color mode (dark/light)
 *   - resizing the viewport
 *   - navigating between routes
 */

function resetDom() {
  const root = document.documentElement;
  root.removeAttribute("style");
  ["brand","density","sidebarStyle","navbarStyle","radius","contentWidth","chartStyle","headerHeight","headerPosition"].forEach((k) => {
    delete root.dataset[k];
  });
  root.removeAttribute("dir");
  root.removeAttribute("lang");
  root.classList.remove("dark");
}

type Handle = {
  setLang: (l: LangCode) => void;
  setMany: (patch: Record<string, unknown>) => void;
  navigate: (to: string) => void;
};

function Page({ name }: { name: string }) {
  return <div data-testid={`page-${name}`}>{name}</div>;
}

function Harness({ handle }: { handle: Handle }) {
  const { setLang } = useI18n();
  const { setMany } = useThemeConfigContext();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    Object.assign(handle, {
      setLang,
      setMany: (p: Record<string, unknown>) => setMany(p as never),
      navigate: (to: string) => navigate(to),
    });
    void location.pathname;
  });
  return (
    <Routes>
      <Route path="/" element={<Page name="home" />} />
      <Route path="/dashboard/analytics" element={<Page name="analytics" />} />
      <Route path="/management/users" element={<Page name="users" />} />
      <Route path="/settings/appearance" element={<Page name="appearance" />} />
    </Routes>
  );
}

function mount(initial = "/") {
  const handle = {} as Handle;
  const utils = render(
    <ThemeConfigProvider>
      <I18nProvider>
        <MemoryRouter initialEntries={[initial]}>
          <Harness handle={handle} />
        </MemoryRouter>
      </I18nProvider>
    </ThemeConfigProvider>,
  );
  return { handle, ...utils };
}

const ROUTES = ["/", "/dashboard/analytics", "/management/users", "/settings/appearance"];

describe("RTL languages — Arabic & Hebrew flip and stay RTL", () => {
  beforeEach(() => { localStorage.clear(); resetDom(); });
  afterEach(() => { cleanup(); localStorage.clear(); resetDom(); });

  for (const lang of ["ar", "he"] as const) {
    it(`${lang} sets dir=rtl on <html>`, async () => {
      const { handle } = mount("/");
      await act(async () => handle.setLang(lang));
      expect(document.documentElement.getAttribute("dir")).toBe("rtl");
      expect(document.documentElement.lang).toBe(lang);
    });

    it(`${lang} stays rtl after customizer theme changes`, async () => {
      const { handle } = mount("/");
      await act(async () => handle.setLang(lang));
      await act(async () => handle.setMany({ brand: "emerald", density: "compact", navbarStyle: "glass", radius: "soft" }));
      expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    });

    it(`${lang} stays rtl after toggling dark mode class`, async () => {
      const { handle } = mount("/");
      await act(async () => handle.setLang(lang));
      await act(async () => { document.documentElement.classList.add("dark"); });
      expect(document.documentElement.getAttribute("dir")).toBe("rtl");
      await act(async () => { document.documentElement.classList.remove("dark"); });
      expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    });

    it(`${lang} stays rtl after viewport resize`, async () => {
      const { handle } = mount("/");
      await act(async () => handle.setLang(lang));
      await act(async () => {
        Object.defineProperty(window, "innerWidth", { value: 375, configurable: true });
        Object.defineProperty(window, "innerHeight", { value: 812, configurable: true });
        window.dispatchEvent(new Event("resize"));
      });
      expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    });

    it(`${lang} stays rtl across every route navigation`, async () => {
      const { handle } = mount("/");
      await act(async () => handle.setLang(lang));
      for (const r of ROUTES) {
        await act(async () => handle.navigate(r));
        expect(document.documentElement.getAttribute("dir")).toBe("rtl");
      }
    });
  }

  it("switching from ar → en flips back to ltr", async () => {
    const { handle } = mount("/");
    await act(async () => handle.setLang("ar"));
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    await act(async () => handle.setLang("en"));
    expect(document.documentElement.getAttribute("dir")).toBe("ltr");
  });
});
