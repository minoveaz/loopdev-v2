import { Path, Rect, Svg } from "react-native-svg";
import { View, Text, StyleSheet } from "react-native";

const infinityPath =
  "M31.5,50c-8.5,0-15.5-7-15.5-15.5S23,19,31.5,19c5.2,0,9.8,2.5,12.5,6.5L56,43.5c2.7,4,7.3,6.5,12.5,6.5c8.5,0,15.5-7,15.5-15.5S77,19,68.5,19c-5.2,0-9.8,2.5-12.5,6.5L44,43.5C41.3,47.5,36.7,50,31.5,50z";

export function BrandMark() {
  return (
    <View style={styles.container}>
      <View style={styles.mark}>
        <Svg height={22} viewBox="0 0 100 69" width={30}>
          <Rect fill="#135bec" height="69" rx="12" width="100" />
          <Path
            d={infinityPath}
            fill="none"
            stroke="#ffffff"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="10"
          />
        </Svg>
      </View>
      <Text style={styles.wordmark}>loop.dev</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },
  mark: {
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    color: "#135bec",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -1,
  },
});
