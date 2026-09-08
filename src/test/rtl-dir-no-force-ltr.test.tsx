import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { useEffect } from "react";
import { ThemeConfigProvider, useThemeConfigContext } from "@/providers/ThemeConfigProvider";
import { I18nProvider, useI18n, type LangCode } from "@/i18n";

/**
 * Regression: nothing in the app may force `<html dir>` back to "ltr"
 * after the user picks an RTL language. Previously a MutationObserver in
 * ThemeConfigProvider re-asserted the customizer's stored direction
 * whenever I18nProvider flipped `dir`, silently undoing RTL.
 *
 * We:
 *   1. Pick an RTL language (ar / he) and assert dir=rtl.
 *   2. Spy on every dir mutation via MutationObserver and run the same
 *      side-effects that previously triggered the override (customizer
 *      changes, dark-mode class flip, manual dir poke). The observed
 *      sequence must end on "rtl" with no spurious "ltr" writes after
 *      the language change.
 */

function resetDom() {
  const root = document.documentElement;
  root.removeAttribute("style");
  root.removeAttribute("dir");
  root.removeAttribute("lang");
  root.classList.remove("dark");
  ["brand","density","sidebarStyle","navbarStyle","radius","contentWidth","chartStyle","headerHeight","headerPosition"].forEach((k) => {
    delete root.dataset[k];
  });
}

type Handle = {
  setLang: (l: LangCode) => void;
  setMany: (patch: Record<string, unknown>) => void;
};

function Harness({ handle }: { handle: Handle }) {
  const { setLang } = useI18n();
  const { setMany } = useThemeConfigContext();
  useEffect(() => {
    Object.assign(handle, {
      setLang,
      setMany: (p: Record<string, unknown>) => setMany(p as never),
    });
  });
  return null;
}

function mount() {
  const handle = {} as Handle;
  const utils = render(
    <ThemeConfigProvider>
      <I18nProvider>
        <Harness handle={handle} />
      </I18nProvider>
    </ThemeConfigProvider>,
  );
  return { handle, ...utils };
}

function recordDir() {
  const writes: string[] = [];
  const root = document.documentElement;
  const obs = new MutationObserver(() => {
    writes.push(root.getAttribute("dir") ?? "");
  });
  obs.observe(root, { attributes: true, attributeFilter: ["dir"] });
  return { writes, stop: () => obs.disconnect() };
}

describe("RTL dir cannot be forced back to LTR after language change", () => {
  beforeEach(() => { localStorage.clear(); resetDom(); });
  afterEach(() => { cleanup(); localStorage.clear(); resetDom(); });

  for (const lang of ["ar", "he"] as const) {
    it(`${lang}: dir stays rtl across non-direction customizer changes + dark-mode + manual poke`, async () => {
      const { handle } = mount();

      await act(async () => handle.setLang(lang));
      expect(document.documentElement.getAttribute("dir")).toBe("rtl");

      const recorder = recordDir();

      // Change every customizer field EXCEPT direction. None should flip dir.
      await act(async () => handle.setMany({
        brand: "emerald", density: "compact", sidebarStyle: "floating",
        navbarStyle: "glass", radius: "soft", contentWidth: "centered",
        chartStyle: "linear", headerHeight: "tall", headerPosition: "static",
        direction: "rtl",
      }));

      // Dark-mode toggle (class mutation) — used to make the observer re-apply dir.
      await act(async () => { document.documentElement.classList.add("dark"); });
      await act(async () => { document.documentElement.classList.remove("dark"); });

      recorder.stop();

      // No write during customizer/dark-mode mutations may flip to ltr.
      expect(
        recorder.writes.every((v) => v === "rtl"),
        `mutations forced ltr: ${JSON.stringify(recorder.writes)}`,
      ).toBe(true);
      expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    });
  }

  it("switching ar → en flips ltr, switching back to ar flips rtl again", async () => {
    const { handle } = mount();
    await act(async () => handle.setLang("ar"));
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    await act(async () => handle.setLang("en"));
    expect(document.documentElement.getAttribute("dir")).toBe("ltr");
    await act(async () => handle.setLang("he"));
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");
  });
});
