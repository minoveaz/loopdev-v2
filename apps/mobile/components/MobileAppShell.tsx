import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { mobileTheme } from "../theme/tokens";
import { useMobileTheme } from "../theme/MobileThemeProvider";

export function MobileAppShell({ children }: { children: ReactNode }) {
  const { resolvedAppearance } = useMobileTheme();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={resolvedAppearance === "dark" ? "light" : "dark"} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: mobileTheme.colors.canvas } });
