import { DynamicColorIOS, Platform, PlatformColor } from "react-native";
import { createCommonMobileStyles, mobileTheme as baseTheme } from "./tokens.base";

function adaptiveColor(light: string, dark: string, androidResource: string) {
  return Platform.OS === "ios"
    ? DynamicColorIOS({ light, dark })
    : PlatformColor(androidResource);
}

const colors = {
  ...baseTheme.colors,
  canvas: adaptiveColor("#f8fafc", "#0d1018", "?android:attr/colorBackground"),
  background: adaptiveColor("#f8fafc", "#0d1018", "?android:attr/colorBackground"),
  surface: adaptiveColor("#ffffff", "#171b25", "?android:attr/colorBackgroundFloating"),
  input: adaptiveColor("#ffffff", "#171b25", "?android:attr/colorBackgroundFloating"),
  surfaceMuted: adaptiveColor("#f1f5f9", "#202633", "?android:attr/colorBackground"),
  surfaceHighlight: adaptiveColor("#e2e8f0", "#303848", "?android:attr/colorBackground"),
  textMain: adaptiveColor("#111827", "#f3f4f6", "?android:attr/textColorPrimary"),
  textHeading: adaptiveColor("#0f172a", "#f8fafc", "?android:attr/textColorPrimary"),
  text: adaptiveColor("#111827", "#f3f4f6", "?android:attr/textColorPrimary"),
  textPrimary: adaptiveColor("#111827", "#f3f4f6", "?android:attr/textColorPrimary"),
  textMuted: adaptiveColor("#64748b", "#aab4c3", "?android:attr/textColorSecondary"),
  textSecondary: adaptiveColor("#64748b", "#aab4c3", "?android:attr/textColorSecondary"),
  textSubtle: adaptiveColor("#94a3b8", "#8b95a5", "?android:attr/textColorSecondary"),
  border: adaptiveColor("#e2e8f0", "#323949", "?android:attr/listDivider"),
  borderSubtle: adaptiveColor("#cbd5e1", "#424a59", "?android:attr/listDivider"),
  borderLight: adaptiveColor("#f1f5f9", "#252c39", "?android:attr/listDivider"),
  primarySoft: adaptiveColor("#eff6ff", "#172c4d", "?android:attr/colorBackground"),
  primaryBorder: adaptiveColor("#bfdbfe", "#284d7a", "?android:attr/colorBackground"),
  success: adaptiveColor("#15803d", "#4ade80", "?android:attr/textColorPrimary"),
  successBg: adaptiveColor("#f0fdf4", "#173322", "?android:attr/colorBackground"),
  successBorder: adaptiveColor("#bbf7d0", "#28543a", "?android:attr/listDivider"),
  warning: adaptiveColor("#b45309", "#fbbf24", "?android:attr/textColorPrimary"),
  warningBg: adaptiveColor("#fffbeb", "#352b15", "?android:attr/colorBackground"),
  warningBorder: adaptiveColor("#fde68a", "#5a471e", "?android:attr/listDivider"),
  danger: adaptiveColor("#dc2626", "#f87171", "?android:attr/textColorPrimary"),
  destructive: adaptiveColor("#dc2626", "#f87171", "?android:attr/textColorPrimary"),
  error: adaptiveColor("#dc2626", "#f87171", "?android:attr/textColorPrimary"),
  dangerBg: adaptiveColor("#fef2f2", "#3a2025", "?android:attr/colorBackground"),
  dangerBorder: adaptiveColor("#fecaca", "#5b3038", "?android:attr/listDivider"),
  info: adaptiveColor("#1d4ed8", "#60a5fa", "?android:attr/textColorPrimary"),
  infoBg: adaptiveColor("#eff6ff", "#172c4d", "?android:attr/colorBackground"),
  infoBorder: adaptiveColor("#bfdbfe", "#284d7a", "?android:attr/listDivider"),
};

export const mobileTheme = {
  ...baseTheme,
  colors,
  typography: {
    ...baseTheme.typography,
    eyebrow: { ...baseTheme.typography.eyebrow, color: colors.primary },
    title: { ...baseTheme.typography.title, color: colors.textHeading },
    subtitle: { ...baseTheme.typography.subtitle, color: colors.textMuted },
    cardTitle: { ...baseTheme.typography.cardTitle, color: colors.textHeading },
    body: { ...baseTheme.typography.body, color: colors.textMain },
    caption: { ...baseTheme.typography.caption, color: colors.textMuted },
  },
};

export const commonMobileStyles = createCommonMobileStyles(mobileTheme);
