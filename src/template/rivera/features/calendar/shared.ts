import type { StatusTone } from "@/components/common";
import type { EventCategory } from "@/types";

export const categoryTone: Record<EventCategory, StatusTone> = {
  meeting: "primary",
  deadline: "destructive",
  release: "info",
  holiday: "success",
  personal: "accent",
};

export const categoryLabel: Record<EventCategory, string> = {
  meeting: "Meeting",
  deadline: "Deadline",
  release: "Release",
  holiday: "Holiday",
  personal: "Personal",
};

/** Solid bar color (used for event chips on month grid). */
export const categoryBar: Record<EventCategory, string> = {
  meeting: "bg-primary text-primary-foreground",
  deadline: "bg-destructive text-destructive-foreground",
  release: "bg-info text-info-foreground",
  holiday: "bg-success text-success-foreground",
  personal: "bg-accent text-accent-foreground",
};

export const categoryDot: Record<EventCategory, string> = {
  meeting: "bg-primary",
  deadline: "bg-destructive",
  release: "bg-info",
  holiday: "bg-success",
  personal: "bg-accent",
};