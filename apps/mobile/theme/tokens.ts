import { StyleSheet } from "react-native";

/**
 * LoopDev & Rivera Mobile Design Tokens
 * ---------------------------------------
 * Single source of truth for all styling, colors, typography,
 * borders, radii, and shadows across apps/mobile.
 */

export const mobileTheme = {
  colors: {
    // Primary / Brand
    primary: "#135bec",
    primaryHover: "#0f4bc5",
    primarySoft: "#eff6ff",
    primaryBorder: "#bfdbfe",

    // Backgrounds & Surfaces
    canvas: "#f8fafc",
    surface: "#ffffff",
    surfaceMuted: "#f1f5f9",
    surfaceHighlight: "#e2e8f0",

    // Slate Text Scale
    textMain: "#111827",
    textHeading: "#0f172a",
    textMuted: "#64748b",
    textSubtle: "#94a3b8",
    textInverse: "#ffffff",

    // Borders & Dividers
    border: "#e2e8f0",
    borderSubtle: "#cbd5e1",
    borderLight: "#f1f5f9",

    // Status / Tone Badges
    success: "#15803d",
    successBg: "#f0fdf4",
    successBorder: "#bbf7d0",

    warning: "#b45309",
    warningBg: "#fffbeb",
    warningBorder: "#fde68a",

    danger: "#dc2626",
    dangerBg: "#fef2f2",
    dangerBorder: "#fecaca",

    info: "#1d4ed8",
    infoBg: "#eff6ff",
    infoBorder: "#bfdbfe",
    // Compatibility aliases for existing mobile screens during token migration.
    background: "#f8fafc",
    input: "#ffffff",
    text: "#111827",
    textPrimary: "#111827",
    textSecondary: "#64748b",
    destructive: "#dc2626",
    error: "#dc2626",
  },

  radii: {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 14,
    input: 10,
    card: 17,
    sheet: 22,
    pill: 99,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    pageHorizontal: 18,
    pageTop: 14,
    pageBottom: 30,
  },

  typography: {
    eyebrow: {
      fontSize: 10,
      fontWeight: "800" as const,
      letterSpacing: 1.8,
      textTransform: "uppercase" as const,
      color: "#135bec",
    },
    title: {
      fontSize: 32,
      fontWeight: "800" as const,
      color: "#111827",
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 12,
      fontWeight: "500" as const,
      color: "#64748b",
      marginTop: 4,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "700" as const,
      color: "#111827",
      lineHeight: 22,
    },
    body: {
      fontSize: 14,
      color: "#334155",
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      color: "#64748b",
    },
    badge: {
      fontSize: 11,
      fontWeight: "700" as const,
    },
  },

  shadows: {
    sm: { boxShadow: "0px 1px 3px rgba(15,23,42,0.08)", elevation: 1 },
    card: {
      boxShadow: "0px 2px 7px rgba(15,23,42,0.04)",
      elevation: 1,
    },
    sheet: {
      boxShadow: "0px -4px 16px rgba(15,23,42,0.12)",
      elevation: 8,
    },
  },
};

export const commonMobileStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: mobileTheme.colors.canvas,
  },
  scrollContent: {
    paddingHorizontal: mobileTheme.spacing.pageHorizontal,
    paddingTop: mobileTheme.spacing.pageTop,
    paddingBottom: mobileTheme.spacing.pageBottom,
  },
  card: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radii.card,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    ...mobileTheme.shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  divider: {
    height: 1,
    backgroundColor: mobileTheme.colors.borderLight,
    marginVertical: 13,
  },
  primaryButton: {
    backgroundColor: mobileTheme.colors.primary,
    borderRadius: mobileTheme.radii.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  primaryButtonText: {
    color: mobileTheme.colors.textInverse,
    fontSize: 14,
    fontWeight: "800",
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: mobileTheme.radii.pill,
  },
});
