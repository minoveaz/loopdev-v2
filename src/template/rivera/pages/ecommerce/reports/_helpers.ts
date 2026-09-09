import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  color: "hsl(var(--popover-foreground))",
  padding: "8px 12px",
  boxShadow: "0 12px 32px -12px hsl(var(--foreground) / 0.18)",
};

export const palette = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--gold))",
  "hsl(var(--info))",
  "hsl(var(--success))",
];

export type ReportRow = Record<string, string | number>;
export type ReportColumn<T extends ReportRow = ReportRow> = {
  key: keyof T;
  header: string;
  render?: (row: T) => ReactNode;
  align?: "left" | "right";
};

export type ReportMeta = {
  title: string;
  description: string;
  icon: LucideIcon;
};
