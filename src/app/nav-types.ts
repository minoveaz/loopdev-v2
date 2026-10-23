import type { LucideIcon } from "lucide-react";

/** Node in the navigation tree — supports arbitrary nesting. */
export interface NavNode {
  label: string;
  to?: string;
  disabled?: boolean;
  icon?: LucideIcon;
  badge?: string;
  description?: string;
  children?: NavNode[];
}

/** Backwards-compatible aliases. */
export type NavItem = NavNode;
export type NavChild = NavNode;

export interface NavSection {
  label: string;
  items: NavNode[];
}
