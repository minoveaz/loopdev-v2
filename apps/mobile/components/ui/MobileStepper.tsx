import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Check } from "lucide-react-native";
import { mobileTheme } from "../../theme/tokens";

export interface MobileStepItem<T extends string = string> {
  key?: T;
  id?: T;
  label?: string;
  title?: string;
  subtitle?: string;
  stepNumber?: number;
  color?: string;
  isTerminalWon?: boolean;
  isTerminalLost?: boolean;
}

export interface MobileStepperProps<T extends string = string> {
  steps: MobileStepItem<T>[];
  currentStep?: T;
  currentStepIndex?: number;
  onStepSelect?: (stepKey: T) => void;
  onStepPress?: (stepIndex: number) => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * MobileStepper
 * --------------
 * Interactive stage progression stepper for Leads & Opportunity Pipeline.
 * Strictly adheres to clean tab/stepper styling (NO rounded pills).
 * Renders crisp step segments with active underlines and completed checkmarks.
 */
export function MobileStepper<T extends string = string>({
  steps,
  currentStep,
  currentStepIndex,
  onStepSelect,
  onStepPress,
  style,
}: MobileStepperProps<T>) {
  const currentIndex =
    currentStepIndex !== undefined
      ? currentStepIndex
      : currentStep
      ? steps.findIndex((s) => (s.key ?? s.id) === currentStep)
      : -1;

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {steps.map((step, index) => {
          const stepKey = step.key ?? step.id ?? String(index);
          const stepLabel = step.label ?? step.title ?? "";
          const isCurrent = currentIndex === index;
          const isPassed = currentIndex >= 0 && currentIndex > index;
          const isInteractive = Boolean(onStepSelect || onStepPress);

          return (
            <Pressable
              key={stepKey}
              accessibilityRole="button"
              accessibilityLabel={`Etapa ${stepLabel}, ${isCurrent ? "actual" : isPassed ? "completada" : "pendiente"}`}
              disabled={!isInteractive}
              onPress={() => {
                if (onStepSelect && (step.key || step.id)) {
                  onStepSelect((step.key || step.id) as T);
                }
                if (onStepPress) {
                  onStepPress(index);
                }
              }}
              style={[
                styles.stepSegment,
                isCurrent && styles.stepSegmentCurrent,
                isPassed && styles.stepSegmentPassed,
              ]}
            >
              <View
                style={[
                  styles.badge,
                  isCurrent && styles.badgeCurrent,
                  isPassed && styles.badgePassed,
                  step.color && isCurrent ? { backgroundColor: step.color } : null,
                ]}
              >
                {isPassed ? (
                  <Check size={11} color="#15803d" strokeWidth={3} />
                ) : (
                  <Text
                    style={[
                      styles.badgeNumber,
                      isCurrent && styles.badgeNumberCurrent,
                    ]}
                  >
                    {step.stepNumber ?? index + 1}
                  </Text>
                )}
              </View>

              <Text
                style={[
                  styles.stepLabel,
                  isCurrent && styles.stepLabelCurrent,
                  isPassed && styles.stepLabelPassed,
                ]}
              >
                {stepLabel}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radii.md,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  scroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  stepSegment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: mobileTheme.radii.sm,
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
    minHeight: 44,
  },
  stepSegmentCurrent: {
    backgroundColor: "#eff6ff",
    borderBottomColor: mobileTheme.colors.primary,
  },
  stepSegmentPassed: {
    backgroundColor: "#f8fafc",
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: mobileTheme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeCurrent: {
    backgroundColor: mobileTheme.colors.primary,
  },
  badgePassed: {
    backgroundColor: "#dcfce7",
  },
  badgeNumber: {
    fontSize: 11,
    fontWeight: "700",
    color: mobileTheme.colors.textMuted,
  },
  badgeNumberCurrent: {
    color: "#ffffff",
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: mobileTheme.colors.textMuted,
  },
  stepLabelCurrent: {
    color: mobileTheme.colors.primary,
    fontWeight: "800",
  },
  stepLabelPassed: {
    color: "#15803d",
    fontWeight: "600",
  },
});
