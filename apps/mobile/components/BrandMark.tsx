import { Path, Rect, Svg } from "react-native-svg";
import { View, Text, StyleSheet } from "react-native";

const infinityPath =
  "M31.5,50c-8.5,0-15.5-7-15.5-15.5S23,19,31.5,19c5.2,0,9.8,2.5,12.5,6.5L56,43.5c2.7,4,7.3,6.5,12.5,6.5c8.5,0,15.5-7,15.5-15.5S77,19,68.5,19c-5.2,0-9.8,2.5-12.5,6.5L44,43.5C41.3,47.5,36.7,50,31.5,50z";

export function BrandInfinityIcon({ color = "#ffffff", size = 22, strokeWidth = 10 }: { color?: string; size?: number; strokeWidth?: number }) {
  return (
    <Svg height={size} viewBox="0 0 100 69" width={size}>
      <Path
        d={infinityPath}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}

export function BrandMark() {
  return (
    <View style={styles.container}>
      <View style={styles.mark}>
        <Svg height={40} viewBox="0 0 100 100" width={40}>
          <Rect fill="#135bec" height="100" rx="24" width="100" />
          <Path
            d="M0 20H100M0 40H100M0 60H100M0 80H100M20 0V100M40 0V100M60 0V100M80 0V100"
            opacity={0.12}
            stroke="#ffffff"
            strokeWidth="1"
          />
        </Svg>
        <View style={styles.innerMark}><BrandInfinityIcon size={28} /></View>
      </View>
      <Text style={styles.wordmark}>loop.dev</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
  },
  mark: {
    alignItems: "center",
    borderRadius: 12,
    elevation: 4,
    justifyContent: "center",
    position: "relative",
    shadowColor: "#135bec",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  innerMark: {
    position: "absolute",
  },
  wordmark: {
    color: "#135bec",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
});
