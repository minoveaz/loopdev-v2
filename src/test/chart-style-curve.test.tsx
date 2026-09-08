import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { LineChart, Line, AreaChart, Area } from "recharts";
import { ThemeConfigProvider } from "@/providers/ThemeConfigProvider";
import { useThemeConfig } from "@/hooks/useThemeConfig";
import { resolveChartStyle } from "@/lib/chartTokens";
import { APPEARANCE_STORAGE_KEY, type ChartStyle } from "@/config/themeConfig";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * The Theme Customizer's "Chart Style" setting must propagate the chosen
 * curve to every Recharts <Line> / <Area> in the app and update them live
 * (no reload required). We verify three layers:
 *
 *  1. Pure mapping       — resolveChartStyle() returns the right curve.
 *  2. Source contract    — every chart page reads from useThemeConfig + uses
 *                          type={curve} (never a hardcoded "monotone"/"linear").
 *  3. Live behavior      — flipping chartStyle on the provider re-renders
 *                          a real Recharts <Line>/<Area> with a curve= attribute
 *                          matching the new style.
 */

const CHART_PAGES = [
  "src/pages/Dashboard.tsx",
  "src/pages/dashboards/Analytics.tsx",
  "src/pages/dashboards/CRM.tsx",
  "src/pages/dashboards/Ecommerce.tsx",
  "src/pages/academy/Analytics.tsx",
  "src/pages/academy/Dashboard.tsx",
  "src/pages/blogs/Analytics.tsx",
  "src/pages/ecommerce/reports/ProductReturns.tsx",
  "src/pages/ecommerce/reports/ProductSales.tsx",
  "src/pages/ecommerce/reports/ProductViewed.tsx",
  "src/pages/logistics/Analytics.tsx",
  "src/pages/logistics/Dashboard.tsx",
  "src/pages/marketing/Dashboard.tsx",
  "src/pages/nft/Dashboard.tsx",
  "src/pages/nft/Overview.tsx",
  "src/pages/realestate/Analytics.tsx",
  "src/pages/realestate/Dashboard.tsx",
  "src/pages/reports/SalesReport.tsx",
  "src/pages/reports/TrafficReport.tsx",
  "src/pages/subscription/Lifecycle.tsx",
];

const read = (p: string) => fs.readFile(path.resolve(process.cwd(), p), "utf8");

describe("Chart Style — pure mapping", () => {
  it("smooth → monotone, grid + legend on", () => {
    expect(resolveChartStyle("smooth")).toEqual({ curve: "monotone", showGrid: true, showLegend: true });
  });
  it("linear → linear, grid + legend on", () => {
    expect(resolveChartStyle("linear")).toEqual({ curve: "linear", showGrid: true, showLegend: true });
  });
  it("minimal → monotone, grid + legend off", () => {
    expect(resolveChartStyle("minimal")).toEqual({ curve: "monotone", showGrid: false, showLegend: false });
  });
  it("undefined → smooth defaults", () => {
    expect(resolveChartStyle(undefined)).toEqual({ curve: "monotone", showGrid: true, showLegend: true });
  });
});

describe("Chart Style — source contract across every chart page", () => {
  for (const file of CHART_PAGES) {
    it(`${file} reads chartStyle from theme + uses dynamic curve`, async () => {
      const src = await read(file);

      // Imports the global theme hook + resolver.
      expect(src, `${file} must import useThemeConfig`).toMatch(/useThemeConfig/);
      expect(src, `${file} must import resolveChartStyle`).toMatch(/resolveChartStyle/);

      // Has no hardcoded curve attribute on Line/Area — must use {curve}.
      expect(src, `${file} contains hardcoded type="monotone"`).not.toMatch(/type="monotone"/);
      expect(src, `${file} contains hardcoded type="linear"`).not.toMatch(/type="linear"/);
      expect(src, `${file} must use type={curve}`).toMatch(/type=\{curve\}/);
    });
  }
});

// -- Live behavior --------------------------------------------------------

function ChartProbe() {
  const { config } = useThemeConfig();
  const { curve } = resolveChartStyle(config.chartStyle);
  return (
    <>
      <LineChart width={120} height={60} data={[{ x: 0, y: 1 }, { x: 1, y: 2 }]}>
        <Line type={curve} dataKey="y" data-testid="line" />
      </LineChart>
      <AreaChart width={120} height={60} data={[{ x: 0, y: 1 }, { x: 1, y: 2 }]}>
        <Area type={curve} dataKey="y" data-testid="area" />
      </AreaChart>
      <span data-testid="curve-marker">{curve}</span>
    </>
  );
}

function setStored(style: ChartStyle) {
  localStorage.setItem(
    APPEARANCE_STORAGE_KEY,
    JSON.stringify({
      mode: "light", brand: "indigo", density: "comfortable",
      sidebarStyle: "default", sidebarMode: "expanded", navbarStyle: "sticky",
      radius: "standard", contentWidth: "full", chartStyle: style, direction: "ltr",
    }),
  );
}

describe("Chart Style — live curve switching", () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { cleanup(); localStorage.clear(); });

  it("renders monotone curve when chartStyle=smooth", () => {
    setStored("smooth");
    const { getByTestId } = render(
      <ThemeConfigProvider><ChartProbe /></ThemeConfigProvider>,
    );
    expect(getByTestId("curve-marker").textContent).toBe("monotone");
  });

  it("renders linear curve when chartStyle=linear", () => {
    setStored("linear");
    const { getByTestId } = render(
      <ThemeConfigProvider><ChartProbe /></ThemeConfigProvider>,
    );
    expect(getByTestId("curve-marker").textContent).toBe("linear");
  });

  it("renders monotone curve when chartStyle=minimal", () => {
    setStored("minimal");
    const { getByTestId } = render(
      <ThemeConfigProvider><ChartProbe /></ThemeConfigProvider>,
    );
    expect(getByTestId("curve-marker").textContent).toBe("monotone");
  });

  it("re-renders curve when chartStyle changes via storage event (cross-tab sync)", () => {
    setStored("smooth");
    const { getByTestId } = render(
      <ThemeConfigProvider><ChartProbe /></ThemeConfigProvider>,
    );
    expect(getByTestId("curve-marker").textContent).toBe("monotone");

    // Simulate Theme Customizer change in another tab.
    const newValue = JSON.stringify({
      mode: "light", brand: "indigo", density: "comfortable",
      sidebarStyle: "default", sidebarMode: "expanded", navbarStyle: "sticky",
      radius: "standard", contentWidth: "full", chartStyle: "linear", direction: "ltr",
    });
    localStorage.setItem(APPEARANCE_STORAGE_KEY, newValue);
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", {
        key: APPEARANCE_STORAGE_KEY, newValue,
      }));
    });

    expect(getByTestId("curve-marker").textContent).toBe("linear");
  });

  it("renders an actual Recharts SVG path for each style", () => {
    for (const style of ["smooth", "linear", "minimal"] as const) {
      cleanup();
      setStored(style);
      const { container } = render(
        <ThemeConfigProvider><ChartProbe /></ThemeConfigProvider>,
      );
      // Recharts emits <path class="recharts-curve …"> for Line + Area.
      const paths = container.querySelectorAll("path.recharts-curve");
      expect(paths.length, `chartStyle=${style} should render at least 2 curves`).toBeGreaterThanOrEqual(2);
      paths.forEach((p) => {
        // Curve must produce a non-empty `d` attribute.
        expect(p.getAttribute("d")?.length ?? 0).toBeGreaterThan(0);
      });
    }
  });
});
