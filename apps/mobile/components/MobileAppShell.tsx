import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { SafeAreaView, StyleSheet } from "react-native";

export function MobileAppShell({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: "#f8fafc" } });
