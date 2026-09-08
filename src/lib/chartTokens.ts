/**
 * Shared Recharts color + style helpers so every chart in the app
 * pulls from the Rivera design tokens. All values resolve via CSS variables
 * so they automatically adapt to dark mode.
 */
export const chartColors = {
  primary: "hsl(var(--primary))",
  primaryGlow: "hsl(var(--primary-glow))",
  accent: "hsl(var(--accent))",
  gold: "hsl(var(--gold))",
  info: "hsl(var(--info))",
  warning: "hsl(var(--warning))",
  destructive: "hsl(var(--destructive))",
  success: "hsl(var(--success))",
  muted: "hsl(var(--muted-foreground))",
  border: "hsl(var(--border))",
  foreground: "hsl(var(--foreground))",
} as const;

/** Ordered palette for series (charts with multiple lines/bars). */
export const chartPalette = [
  chartColors.primary,
  chartColors.accent,
  chartColors.gold,
  chartColors.info,
  chartColors.warning,
  chartColors.destructive,
];

/** Defaults to spread into Recharts grid, axis, tooltip, etc. */
export const chartDefaults = {
  grid: {
    stroke: "hsl(var(--border) / 0.6)",
    strokeDasharray: "4 4",
    vertical: false,
  },
  axis: {
    stroke: "hsl(var(--border) / 0.6)",
    tick: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
    tickLine: false,
    axisLine: false,
  },
  tooltip: {
    contentStyle: {
      borderRadius: 12,
      border: "1px solid hsl(var(--border))",
      background: "hsl(var(--popover))",
      color: "hsl(var(--popover-foreground))",
      boxShadow: "0 12px 32px -12px hsl(var(--foreground) / 0.18)",
      fontSize: 12,
      padding: "8px 12px",
    },
    labelStyle: {
      color: "hsl(var(--foreground))",
      fontWeight: 600,
      marginBottom: 4,
    },
    itemStyle: {
      color: "hsl(var(--popover-foreground))",
      padding: 0,
    },
    cursor: { fill: "hsl(var(--muted) / 0.45)", stroke: "hsl(var(--border))" },
  },
  legend: {
    iconType: "circle" as const,
    iconSize: 8,
    wrapperStyle: {
      fontSize: 12,
      color: "hsl(var(--muted-foreground))",
      paddingTop: 12,
    },
  },
};

/**
 * Resolve Recharts curve + grid visibility from the global chart style.
 * `style` comes from `useThemeConfig().config.chartStyle`.
 */
export type RechartsCurve = "monotone" | "linear";
export function resolveChartStyle(style: "smooth" | "linear" | "minimal" | undefined): {
  curve: RechartsCurve;
  showGrid: boolean;
  showLegend: boolean;
} {
  switch (style) {
    case "linear":
      return { curve: "linear", showGrid: true, showLegend: true };
    case "minimal":
      return { curve: "monotone", showGrid: false, showLegend: false };
    case "smooth":
    default:
      return { curve: "monotone", showGrid: true, showLegend: true };
  }
}