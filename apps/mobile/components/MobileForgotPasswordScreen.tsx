import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ArrowLeft, ArrowRight, CheckCircle2, Info, Mail, ShieldAlert } from "lucide-react-native";
import { mobileAuthAdapter } from "../adapters/auth";

type MobileForgotPasswordScreenProps = {
  onBackToLogin: () => void;
};

export function MobileForgotPasswordScreen({
  onBackToLogin,
}: MobileForgotPasswordScreenProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReset = async () => {
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await mobileAuthAdapter.requestPasswordReset({
        email: email.trim(),
      });
      if (!res.success) {
        setErrorMessage(res.error.message || "Failed to submit password reset.");
      } else {
        setSubmitted(true);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error submitting request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* Back button */}
      <Pressable onPress={onBackToLogin} style={styles.backButton}>
        <ArrowLeft color="#135bec" size={18} />
        <Text style={styles.backText}>Back to sign in</Text>
      </Pressable>

      {/* Brand Header */}
      <View style={styles.brandRow}>
        <View style={styles.brandIcon}>
          <View style={styles.infinityMark}>
            <Text style={styles.infinityText}>∞</Text>
          </View>
        </View>
        <Text style={styles.brandName}>loop.dev</Text>
        <View style={styles.mobileBadge}>
          <Text style={styles.mobileBadgeText}>MOBILE</Text>
        </View>
      </View>

      {submitted ? (
        <View style={styles.successCard}>
          <View style={styles.successIconBox}>
            <CheckCircle2 color="#16a34a" size={32} />
          </View>
          <Text style={styles.successTitle}>Check your inbox</Text>
          <Text style={styles.successMessage}>
            We have processed a password recovery request for{" "}
            <Text style={styles.bold}>{email}</Text>. In development without an SMTP server, check local Inbucket or Supabase CLI admin logs.
          </Text>
          <Pressable onPress={onBackToLogin} style={styles.submitButton}>
            <Text style={styles.submitText}>Return to sign in</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Title & Eyebrow */}
          <View style={styles.titleGroup}>
            <Text style={styles.eyebrow}>RECOVER ACCOUNT</Text>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>
              Enter your verified email to receive a password reset link.
            </Text>
          </View>

          {errorMessage && (
            <View style={styles.errorAlert}>
              <ShieldAlert color="#ef4444" size={18} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email address</Text>
              <View style={styles.inputContainer}>
                <Mail color="#64748b" size={18} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="user@organization.com"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Inbucket / Local Dev Notice */}
            <View style={styles.infoBox}>
              <Info color="#135bec" size={18} style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Local Development Note</Text>
                <Text style={styles.infoDesc}>
                  No active SMTP server is configured. Recovery requests will log to local Inbucket or Supabase admin without errors.
                </Text>
              </View>
            </View>

            <Pressable
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleReset}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.submitText}>Send reset link</Text>
                  <ArrowRight size={16} color="#ffffff" />
                </View>
              )}
            </Pressable>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 40,
    backgroundColor: "#f8fafc",
    flexGrow: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#135bec",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#135bec",
    alignItems: "center",
    justifyContent: "center",
  },
  infinityMark: {
    alignItems: "center",
    justifyContent: "center",
  },
  infinityText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 24,
  },
  brandName: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: "#135bec",
  },
  mobileBadge: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  mobileBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b",
    letterSpacing: 1,
  },
  titleGroup: {
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#135bec",
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#0f172a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  errorAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  form: {
    gap: 18,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#0f172a",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1d4ed8",
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: 12,
    color: "#3b82f6",
    lineHeight: 16,
  },
  submitButton: {
    backgroundColor: "#135bec",
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  successCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    textAlign: "center",
  },
  successIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  bold: {
    fontWeight: "700",
    color: "#0f172a",
  },
});
