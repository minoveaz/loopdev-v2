import React from "react";

type StubProps = Record<string, unknown> & { children?: React.ReactNode };

function normalizeStyle(style: unknown): React.CSSProperties | undefined {
  if (!style) return undefined;
  const entries = Array.isArray(style) ? style : [style];
  return Object.assign({}, ...entries.filter((entry) => entry && typeof entry === "object"));
}

export function Image({ children, source, ...props }: StubProps & { source?: { uri?: string } }) {
  return React.createElement("img", { ...props, src: source?.uri }, children);
}

export const StyleSheet = {
  hairlineWidth: 1,
  create: <T extends Record<string, unknown>>(styles: T): T => styles,
};

export function Text({ children, accessibilityRole, accessibilityLiveRegion, selectable: _selectable, style, ...props }: StubProps & { accessibilityRole?: string; accessibilityLiveRegion?: string; selectable?: boolean }) {
  return React.createElement("div", {
    ...props,
    style: normalizeStyle(style),
    role: accessibilityRole,
    "aria-live": accessibilityLiveRegion === "polite" ? "polite" : undefined,
    "data-selectable": _selectable ? "true" : undefined,
  }, children);
}

export function View({ children, accessible: _accessible, accessibilityLabel, accessibilityRole, accessibilityLiveRegion, style, ...props }: StubProps & { accessible?: boolean; accessibilityLabel?: string; accessibilityRole?: string; accessibilityLiveRegion?: string }) {
  return React.createElement("div", {
    ...props,
    style: normalizeStyle(style),
    role: accessibilityRole,
    "aria-label": accessibilityLabel,
    "aria-live": accessibilityLiveRegion === "polite" ? "polite" : undefined,
  }, children);
}

export function ScrollView({ children, contentContainerStyle, style, ...props }: StubProps & { contentContainerStyle?: unknown; style?: unknown }) {
  return React.createElement("div", {
    ...props,
    style: normalizeStyle([style, contentContainerStyle]),
  }, children);
}

export function Pressable({
  children,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
  disabled,
  onPress,
}: StubProps & {
  accessibilityRole?: string;
  accessibilityLabel?: string;
  accessibilityState?: { checked?: boolean; selected?: boolean; disabled?: boolean; busy?: boolean };
  disabled?: boolean;
  onPress?: () => void;
}) {
  return React.createElement("button", {
    type: "button",
    role: accessibilityRole,
    "aria-label": accessibilityLabel,
    "aria-checked": accessibilityState?.checked,
    "aria-selected": accessibilityState?.selected,
    disabled: disabled ?? accessibilityState?.disabled,
    onClick: onPress,
  }, children);
}

export function Switch({
  accessibilityLabel,
  accessibilityState,
  disabled,
  value,
  onValueChange,
}: StubProps & {
  accessibilityLabel?: string;
  accessibilityState?: { checked?: boolean; disabled?: boolean };
  disabled?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
}) {
  return React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-label": accessibilityLabel,
    "aria-checked": value,
    disabled: disabled ?? accessibilityState?.disabled,
    onClick: () => onValueChange?.(!value),
  });
}

export const Appearance = { setColorScheme: (_scheme: "light" | "dark" | null) => {} };
export const I18nManager = { isRTL: false, allowRTL: (_allow: boolean) => {}, forceRTL: (_force: boolean) => {} };
export function useColorScheme() { return "light" as const; }
