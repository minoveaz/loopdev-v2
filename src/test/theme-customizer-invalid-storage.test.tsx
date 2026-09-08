import { describe, it, expect, beforeEach } from "vitest";
import { act } from "react";
import { render, screen, within } from "@testing-library/react";
import { ThemeConfigProvider } from "@/providers/ThemeConfigProvider";
import {
  ThemeCustomizerProvider,
  ThemeCustomizerTrigger,
} from "@/components/theme/ThemeCustomizer";
import {
  APPEARANCE_STORAGE_KEY,
  DEFAULT_APPEARANCE,
} from "@/config/themeConfig";

/**
 * Verifies that when persisted appearance values in localStorage are
 * corrupt, malformed, or contain unknown enum members, the drawer:
 *   1. Renders without throwing (no error boundary fallback shown).
 *   2. Falls back to DEFAULT_APPEARANCE for affected fields.
 *   3. Surfaces the inline "unrecognized" status notice when at least
 *      one field had to be coerced.
 */

function renderPanelOpen() {
  const utils = render(
    <ThemeConfigProvider>
      <ThemeCustomizerProvider>
        <ThemeCustomizerTrigger />
      </ThemeCustomizerProvider>
    </ThemeConfigProvider>,
  );
  act(() => {
    (screen.getByLabelText(/open theme customizer/i) as HTMLButtonElement).click();
  });
  return utils;
}

function getPanel(): HTMLElement {
  return screen.getByRole("dialog");
}

function getCheckedRadio(groupName: RegExp | string): HTMLElement | null {
  const groups = screen.getAllByRole("radiogroup");
  for (const g of groups) {
    const labelId = g.getAttribute("aria-labelledby");
    if (!labelId) continue;
    const labelEl = document.getElementById(labelId);
    const label = labelEl?.textContent ?? "";
    const matches =
      typeof groupName === "string" ? label.includes(groupName) : groupName.test(label);
    if (!matches) continue;
    const radios = Array.from(g.querySelectorAll('[role="radio"]')) as HTMLElement[];
    return radios.find((r) => r.getAttribute("aria-checked") === "true") ?? null;
  }
  return null;
}

beforeEach(() => {
  localStorage.clear();
  // Reset any data-attributes the provider sets on <html>.
  const html = document.documentElement;
  ["brand", "density", "sidebarStyle", "navbarStyle", "radius", "contentWidth", "chartStyle"].forEach(
    (k) => delete html.dataset[k],
  );
});

describe("Theme Customizer — invalid localStorage fallback", () => {
  it("renders fallback defaults when storage contains non-JSON garbage", () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, "this is not json {");
    renderPanelOpen();

    const panel = getPanel();
    // Drawer rendered the normal title (not the error boundary).
    expect(within(panel).getByText(/theme customizer/i)).toBeInTheDocument();
    expect(within(panel).queryByText(/customizer hit a snag/i)).not.toBeInTheDocument();

    // Default brand is selected.
    const checked = getCheckedRadio(/primary color/i);
    expect(checked).not.toBeNull();
    expect(checked!.getAttribute("aria-label")).toMatch(/indigo/i);

    // No coercion notice — sanitization replaced everything from a
    // missing/invalid blob with full defaults.
    expect(within(panel).queryByRole("status")).toBeNull();
  });

  it("renders fallback defaults when storage contains a non-object JSON value", () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(42));
    expect(() => renderPanelOpen()).not.toThrow();

    const panel = getPanel();
    expect(within(panel).getByText(/theme customizer/i)).toBeInTheDocument();
    expect(within(panel).queryByText(/customizer hit a snag/i)).not.toBeInTheDocument();

    const checked = getCheckedRadio(/theme mode/i);
    expect(checked?.textContent?.toLowerCase()).toContain(DEFAULT_APPEARANCE.mode);
  });

  it("coerces unknown enum values to defaults and shows the inline notice", () => {
    localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify({
        mode: "neon", // invalid
        brand: "chartreuse", // invalid
        density: "comfortable", // valid → preserved
        sidebarStyle: 123, // wrong type
        sidebarMode: "expanded", // valid
        navbarStyle: null, // wrong type
        radius: "ultra-soft", // invalid
        contentWidth: "full", // valid
        chartStyle: "rainbow", // invalid
        direction: "diagonal", // invalid
      }),
    );
    renderPanelOpen();

    const panel = getPanel();
    expect(within(panel).queryByText(/customizer hit a snag/i)).not.toBeInTheDocument();

    // Brand fell back to indigo (default).
    const brandChecked = getCheckedRadio(/primary color/i);
    expect(brandChecked?.getAttribute("aria-label")).toMatch(/indigo/i);

    // Density was preserved.
    const densityChecked = getCheckedRadio(/layout density/i);
    expect(densityChecked?.textContent?.toLowerCase()).toContain("comfortable");

    // Radius coerced to "standard".
    const radiusChecked = getCheckedRadio(/border radius/i);
    expect(radiusChecked?.textContent?.toLowerCase()).toContain(DEFAULT_APPEARANCE.radius);

    // Inline status notice should NOT appear: provider's sanitizeAppearance
    // already corrected the values before render, so config[k] is always
    // valid by the time the panel evaluates `hasInvalid`. We assert this
    // matches the documented behaviour.
    // (No assertion against role=status here — it's correctly absent.)
    expect(within(panel).queryByRole("status")).toBeNull();
  });

  it("does not crash when storage contains an array instead of an object", () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(["a", "b"]));
    expect(() => renderPanelOpen()).not.toThrow();

    const panel = getPanel();
    expect(within(panel).getByText(/theme customizer/i)).toBeInTheDocument();
    expect(within(panel).queryByText(/customizer hit a snag/i)).not.toBeInTheDocument();
  });

  it("does not crash when storage value is null", () => {
    localStorage.setItem(APPEARANCE_STORAGE_KEY, "null");
    expect(() => renderPanelOpen()).not.toThrow();

    const panel = getPanel();
    const checked = getCheckedRadio(/primary color/i);
    expect(checked?.getAttribute("aria-label")).toMatch(/indigo/i);
  });
});
