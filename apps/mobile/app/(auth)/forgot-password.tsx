// apps/mobile/app/(auth)/forgot-password.tsx
/**
 * Forgot Password — step 1 of 3 in the password-reset flow.
 *
 * Flow:
 *   1. User enters phone (+63XXXXXXXXXX)
 *   2. POST /auth/forgot-password (via lib/auth.ts → requestPasswordReset)
 *   3. Navigate to /verify-otp?phone=... carrying the phone number
 */
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { requestPasswordReset } from "@/lib/auth";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

const PH_PHONE_REGEX = /^\+639\d{9}$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [phoneDigits, setPhoneDigits] = useState(""); // 10 digits after +63
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fullPhone = `+63${phoneDigits.replace(/\D/g, "")}`;
  const canSubmit = PH_PHONE_REGEX.test(fullPhone) && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError("Enter a valid PH phone number (10 digits after +63).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await requestPasswordReset(fullPhone);
      router.push({
        pathname: "/verify-otp",
        params: { phone: fullPhone },
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Couldn't send the code. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backBtn}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={colors.foreground}
              />
              <Text style={styles.backText}>Back</Text>
            </Pressable>

            <Text style={styles.title}>Forgot your password?</Text>
            <Text style={styles.subtitle}>
              Enter your phone number and we'll send you a 6-digit code to
              reset your password.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Phone Number</Text>
              <View
                style={[
                  styles.phoneWrapper,
                  error ? styles.phoneWrapperError : null,
                ]}
              >
                <Text style={styles.prefix}>+63</Text>
                <TextInput
                  value={phoneDigits}
                  onChangeText={(v) => {
                    setPhoneDigits(v.replace(/\D/g, "").slice(0, 10));
                    if (error) setError(null);
                  }}
                  placeholder="9XXXXXXXXX"
                  placeholderTextColor={colors.muted}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  maxLength={10}
                  style={styles.phoneInput}
                  accessibilityLabel="Phone number, ten digits after plus sixty three"
                />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              accessibilityRole="button"
              accessibilityLabel="Send reset code"
              style={[
                styles.primaryBtnWrapper,
                !canSubmit && styles.btnDisabled,
              ]}
            >
              <LinearGradient
                colors={["#fbbf24", "#ef4444"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    Send Reset Code
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={styles.loginLink}
              accessibilityRole="button"
              accessibilityLabel="Back to login"
            >
              <Text style={styles.loginLinkText}>
                Remembered your password?{" "}
                <Text style={styles.loginLinkBold}>Log in</Text>
              </Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mutedBg },
  kav: { flex: 1 },
  content: {
    padding: spacing[6],
    gap: spacing[4],
    flexGrow: 1,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    alignSelf: "flex-start",
    marginBottom: spacing[2],
  },
  backText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    fontWeight: fontWeight.medium,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: colors.foreground,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.muted,
    lineHeight: 20,
  },
  field: {
    gap: 6,
    marginTop: spacing[2],
    backgroundColor: colors.white,
    padding: spacing[6],
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  phoneWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
  },
  phoneWrapperError: {
    borderColor: "#dc2626",
  },
  prefix: {
    fontSize: fontSize.base,
    color: colors.muted,
    marginRight: 8,
    fontWeight: fontWeight.semibold,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: "#dc2626",
    marginTop: 2,
  },
  primaryBtnWrapper: {
    borderRadius: radii.lg,
    overflow: "hidden",
    marginTop: spacing[3],
  },
  primaryBtn: {
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  loginLink: {
    alignItems: "center",
    paddingVertical: spacing[3],
  },
  loginLinkText: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  loginLinkBold: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
});
