import { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

type MobileLogoSpinnerProps = {
  size?: number;
  speed?: "fast" | "normal" | "slow";
};

const infinityPath =
  "M31.5,50c-8.5,0-15.5-7-15.5-15.5S23,19,31.5,19c5.2,0,9.8,2.5,12.5,6.5L56,43.5c2.7,4,7.3,6.5,12.5,6.5c8.5,0,15.5-7,15.5-15.5S77,19,68.5,19c-5.2,0-9.8,2.5-12.5,6.5L44,43.5C41.3,47.5,36.7,50,31.5,50z";

export function MobileLogoSpinner({
  size = 72,
  speed = "normal",
}: MobileLogoSpinnerProps) {
  const duration = speed === "fast" ? "1.5s" : speed === "slow" ? "4s" : "2.5s";
  const [offset, setOffset] = useState(245);
  const animFrame = useRef<number | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return; // Web uses CSS keyframe animation for 60fps GPU flow

    let start: number | null = null;
    const durMs = speed === "fast" ? 1500 : speed === "slow" ? 4000 : 2500;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = ((timestamp - start) % durMs) / durMs;
      setOffset(245 * (1 - progress));
      animFrame.current = requestAnimationFrame(animate);
    };

    animFrame.current = requestAnimationFrame(animate);
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, [speed]);

  const height = (size * 69) / 100;

  return (
    <View style={[styles.container, { width: size, height }]}>
      <Svg viewBox="0 0 100 69" width={size} height={height} style={styles.svg}>
        <Defs>
          <LinearGradient id="mobileLoopGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#135bec" />
            <Stop offset="100%" stopColor="#60a5fa" />
          </LinearGradient>
        </Defs>
        {/* Background Track */}
        <Path
          d={infinityPath}
          stroke="#e2e8f0"
          strokeWidth="6.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Animated Gradient Flow */}
        <Path
          d={infinityPath}
          stroke="url(#mobileLoopGradient)"
          strokeWidth="6.5"
          strokeLinecap="round"
          // @ts-expect-error pathLength property in web svg
          pathLength={245}
          strokeDasharray="70 175"
          strokeDashoffset={Platform.OS === "web" ? undefined : offset}
          style={
            Platform.OS === "web"
              ? ({
                  animation: `mobile-loop-flow ${duration} linear infinite`,
                } as unknown as Record<string, string>)
              : undefined
          }
          fill="none"
        />
      </Svg>
      {Platform.OS === "web" && (
        // Inject keyframe animation directly into DOM for exact 1:1 desktop parity
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes mobile-loop-flow {
                from { stroke-dashoffset: 245; }
                to { stroke-dashoffset: 0; }
              }
            `,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    overflow: "visible",
  },
});
