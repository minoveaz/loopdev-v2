import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { I18nProvider, useI18n, type LangCode } from "@/i18n";
import { AuthProvider } from "@/hooks/use-auth";

/* ------- matchMedia harness: lets each test pick LG vs mobile ------- */

type Listener = (e: MediaQueryListEvent) => void;
const mqRegistry = new Map<string, { matches: boolean; listeners: Set<Listener> }>();

function setMatch(query: string, matches: boolean) {
  const entry = mqRegistry.get(query) ?? { matches, listeners: new Set() };
  const changed = entry.matches !== matches;
  entry.matches = matches;
  mqRegistry.set(query, entry);
  if (changed) {
    entry.listeners.forEach((l) =>
      l({ matches, media: query } as MediaQueryListEvent),
    );
  }
}

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

/* ------- Test harness: a small AppShell-like wrapper around Sidebar ------- */

function Harness({
  lang = "en",
  initialOpen = false,
  exposeRef,
}: {
  lang?: LangCode;
  initialOpen?: boolean;
  exposeRef?: (api: {
    open: () => void;
    close: () => void;
    isOpen: () => boolean;
    setLang: (l: LangCode) => void;
  }) => void;
}) {
  return (
    <MemoryRouter>
      <AuthProvider>
        <I18nProvider>
          <Inner lang={lang} initialOpen={initialOpen} exposeRef={exposeRef} />
        </I18nProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

function Inner({
  lang,
  initialOpen,
  exposeRef,
}: {
  lang: LangCode;
  initialOpen: boolean;
  exposeRef?: Parameters<typeof Harness>[0]["exposeRef"];
}) {
  const { setLang } = useI18n();
  const [open, setOpen] = useState(initialOpen);
  useEffect(() => { setLang(lang); }, [lang, setLang]);

  // Mirror AppShell's "auto-close on lg" listener so resize tests are
  // exercising the same logic the real shell uses.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    exposeRef?.({
      open: () => setOpen(true),
      close: () => setOpen(false),
      isOpen: () => open,
      setLang,
    });
  });

  return (
    <>
      <button data-testid="opener" onClick={() => setOpen(true)}>open</button>
      <Sidebar collapsed={false} mobileOpen={open} onMobileClose={() => setOpen(false)} />
    </>
  );
}

function getAside() {
  return document.getElementById("app-sidebar") as HTMLElement;
}

/* ------- Tests ------- */

describe("Sidebar mobile drawer — regression checks", () => {
  beforeEach(() => {
    mqRegistry.clear();
    installMatchMedia();
    localStorage.clear();
    document.documentElement.removeAttribute("dir");
    document.documentElement.removeAttribute("lang");
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("LTR: closed drawer applies -translate-x-full and is aria-hidden on mobile", () => {
    setMatch("(min-width: 768px)", false); // mobile
    render(<Harness lang="en" initialOpen={false} />);
    const aside = getAside();
    expect(aside.className).toContain("max-md:-translate-x-full");
    expect(aside.getAttribute("aria-hidden")).toBe("true");
    expect(aside.getAttribute("role")).toBe("dialog");
    expect(aside.getAttribute("aria-modal")).toBeNull();
  });

  it("LTR: open drawer applies translate-x-0 and aria-modal=true on mobile", () => {
    setMatch("(min-width: 768px)", false);
    render(<Harness lang="en" initialOpen={true} />);
    const aside = getAside();
    expect(aside.className).toContain("max-md:translate-x-0");
    expect(aside.getAttribute("aria-modal")).toBe("true");
    expect(aside.getAttribute("aria-hidden")).toBeNull();
  });

  it("RTL: closed drawer applies +translate-x-full (rtl-scoped)", async () => {
    setMatch("(min-width: 768px)", false);
    render(<Harness lang="ar" initialOpen={false} />);
    // Wait for setLang effect to flush.
    await act(async () => {});
    const aside = getAside();
    expect(aside.className).toContain("max-md:rtl:translate-x-full");
    expect(aside.className).toContain("max-md:-translate-x-full");
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("Desktop: role stays navigation, no aria-modal, no transform on lg", () => {
    setMatch("(min-width: 768px)", true);
    setMatch("(min-width: 1200px)", true);
    render(<Harness lang="en" initialOpen={false} />);
    const aside = getAside();
    expect(aside.getAttribute("role")).toBe("navigation");
    expect(aside.getAttribute("aria-modal")).toBeNull();
    expect(aside.getAttribute("aria-hidden")).toBeNull();
    expect(aside.className).toContain("md:translate-x-0");
  });

  it("shows Plan & Billing as disabled in the sidebar", () => {
    setMatch("(min-width: 768px)", true);
    setMatch("(min-width: 1200px)", true);
    render(<Harness lang="en" />);

    fireEvent.click(screen.getByRole("treeitem", { name: "Account Settings" }));
    const billing = screen.getByRole("treeitem", { name: "Plan & Billing" });

    expect(billing).toHaveAttribute("aria-disabled", "true");
    expect(billing.tagName).not.toBe("A");
  });

  it("Resize while open: crossing into lg auto-closes the drawer", () => {
    setMatch("(min-width: 768px)", false);
    setMatch("(min-width: 1200px)", false);
    render(<Harness lang="en" initialOpen={true} />);
    expect(getAside().className).toContain("max-md:translate-x-0");

    // Cross the breakpoint.
    act(() => {
      setMatch("(min-width: 768px)", true);
      setMatch("(min-width: 1200px)", true);
    });

    const aside = getAside();
    // Now on desktop: role navigation, no aria-modal, no max-lg open class.
    expect(aside.getAttribute("role")).toBe("navigation");
    expect(aside.getAttribute("aria-modal")).toBeNull();
    expect(aside.className).not.toContain("max-md:translate-x-0");
  });

  it("Language flip from LTR to RTL while open: drawer stays open and dir flips", async () => {
    setMatch("(min-width: 768px)", false);
    const { rerender } = render(<Harness lang="en" initialOpen={true} />);
    await act(async () => {});
    expect(getAside().getAttribute("aria-modal")).toBe("true");
    expect(document.documentElement.dir).toBe("ltr");

    rerender(<Harness lang="he" initialOpen={true} />);
    await act(async () => {});

    const aside = getAside();
    expect(document.documentElement.dir).toBe("rtl");
    expect(aside.getAttribute("aria-modal")).toBe("true");
    expect(aside.className).toContain("max-md:translate-x-0");
  });

  it("Backdrop click invokes onMobileClose", () => {
    setMatch("(min-width: 768px)", false);
    render(<Harness lang="en" initialOpen={true} />);
    expect(getAside().getAttribute("aria-modal")).toBe("true");
    const backdrop = document.querySelector('[aria-hidden="true"].fixed.inset-0') as HTMLElement;
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop);
    expect(getAside().getAttribute("aria-modal")).toBeNull();
  });
});