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
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from "lucide-react-native";
import { mobileAuthAdapter } from "../adapters/auth";
import { MobileLogoSpinner } from "./MobileLogoSpinner";

type MobileLoginScreenProps = {
  onLoginSuccess: () => void;
  onForgotPassword: () => void;
};

export function MobileLoginScreen({
  onLoginSuccess,
  onForgotPassword,
}: MobileLoginScreenProps) {
  const [email, setEmail] = useState("admin@localhost");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }
    setErrorMessage(null);
    setLoading(true);
    try {
      const res = await mobileAuthAdapter.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (!res.success) {
        setErrorMessage(res.error.message || "Failed to sign in.");
      } else {
        setTransitioning(true);
        setTimeout(() => {
          onLoginSuccess();
        }, 750);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Authentication error.");
    } finally {
      setLoading(false);
    }
  };

  if (transitioning) {
    return (
      <View style={styles.transitionContainer}>
        <MobileLogoSpinner size={72} />
        <Text style={styles.transitionTitle}>Entering LoopDev Mobile</Text>
        <Text style={styles.transitionSubtitle}>Setting up workspace and permissions...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
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

      {/* Title & Eyebrow */}
      <View style={styles.titleGroup}>
        <Text style={styles.eyebrow}>SIGN IN</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Sign in to access your organizations &amp; sync data.
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
              placeholder="user@loop.dev"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.passwordHeader}>
            <Text style={styles.label}>Password</Text>
            <Pressable onPress={onForgotPassword}>
              <Text style={styles.forgotLink}>Forgot?</Text>
            </Pressable>
          </View>
          <View style={styles.inputContainer}>
            <Lock color="#64748b" size={18} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              style={styles.eyeBtn}
            >
              {showPassword ? (
                <EyeOff color="#64748b" size={18} />
              ) : (
                <Eye color="#64748b" size={18} />
              )}
            </Pressable>
          </View>
        </View>

        {/* Development Helper Box */}
        <View style={styles.devBox}>
          <Text style={styles.devBoxTitle}>Demo Mode (Mock / Supabase Local)</Text>
          <Text style={styles.devBoxDesc}>
            Use <Text style={styles.bold}>admin@rivera.app</Text> for Super Admin or any email to test multi-tenant organization context.
          </Text>
        </View>

        <Pressable
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.submitText}>Sign in to LoopDev →</Text>
          )}
        </Pressable>
      </View>
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
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: "700",
    color: "#135bec",
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
  eyeBtn: {
    padding: 6,
  },
  devBox: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginTop: 4,
  },
  devBoxTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1d4ed8",
    marginBottom: 4,
  },
  devBoxDesc: {
    fontSize: 12,
    color: "#3b82f6",
    lineHeight: 16,
  },
  bold: {
    fontWeight: "700",
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
  transitionContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  brandIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#135bec",
    alignItems: "center",
    justifyContent: "center",
  },
  infinityTextLarge: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "900",
    lineHeight: 40,
  },
  transitionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 16,
    letterSpacing: -0.4,
  },
  transitionSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
});
