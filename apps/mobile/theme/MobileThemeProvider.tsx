import {
  Appearance,
  useColorScheme,
  type ColorSchemeName,
} from "react-native";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { mobileAuthStorage } from "../adapters/mobile-auth-storage";
import type { DeviceAppearance } from "../../../packages/contracts/src/user-preferences";

const APPEARANCE_KEY = "loopdev:device-appearance";

interface MobileThemeContextValue {
  appearance: DeviceAppearance;
  resolvedAppearance: "light" | "dark";
  loading: boolean;
  error: string | null;
  setAppearance: (appearance: DeviceAppearance) => Promise<boolean>;
}

const MobileThemeContext = createContext<MobileThemeContextValue | undefined>(undefined);

function parseAppearance(value: string | null): DeviceAppearance {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

function nativeScheme(appearance: DeviceAppearance): ColorSchemeName {
  return appearance === "system" ? "unspecified" : appearance;
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : "The device appearance could not be saved.";
}

export function MobileThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [appearance, setAppearanceState] = useState<DeviceAppearance>("system");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void mobileAuthStorage.getItem(APPEARANCE_KEY).then((stored) => {
      if (!active) return;
      const nextAppearance = parseAppearance(stored);
      Appearance.setColorScheme(nativeScheme(nextAppearance));
      setAppearanceState(nextAppearance);
    }).catch((cause: unknown) => {
      if (active) setError(describeError(cause));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const setAppearance = useCallback(async (nextAppearance: DeviceAppearance) => {
    const previousAppearance = appearance;
    setError(null);
    try {
      await mobileAuthStorage.setItem(APPEARANCE_KEY, nextAppearance);
      Appearance.setColorScheme(nativeScheme(nextAppearance));
      setAppearanceState(nextAppearance);
      return true;
    } catch (cause) {
      setError(describeError(cause));
      try {
        Appearance.setColorScheme(nativeScheme(previousAppearance));
      } catch (restoreCause) {
        setError(`${describeError(cause)} ${describeError(restoreCause)}`);
      }
      return false;
    }
  }, [appearance]);

  const resolvedAppearance = appearance === "system"
    ? systemScheme === "dark" ? "dark" : "light"
    : appearance;

  const value = useMemo(
    () => ({ appearance, resolvedAppearance, loading, error, setAppearance }),
    [appearance, resolvedAppearance, loading, error, setAppearance],
  );

  return <MobileThemeContext.Provider value={value}>{children}</MobileThemeContext.Provider>;
}

export function useMobileTheme() {
  const value = useContext(MobileThemeContext);
  if (!value) throw new Error("useMobileTheme must be used within MobileThemeProvider");
  return value;
}
