// apps/mobile/app/(auth)/verify-otp.tsx
/**
 * Verify OTP — step 2 of the 3-step password reset flow.
 *
 * 6 separate digit boxes. Auto-focus next on type, auto-focus previous
 * on backspace. Auto-submits when all 6 are filled.
 *
 * On success, navigates to /reset-password carrying the reset token.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { requestPasswordReset, verifyResetOtp } from "@/lib/auth";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const [digits, setDigits] = useState<string[]>(() =>
    Array(OTP_LENGTH).fill(""),
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Guard for missing phone param
  if (!phone) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.centredMsg}>
          <Text style={styles.title}>Invalid link</Text>
          <Text style={styles.subtitle}>
            This reset link is missing information.
          </Text>
          <Pressable
            onPress={() => router.replace("/forgot-password")}
            accessibilityRole="button"
            accessibilityLabel="Start over"
            style={styles.textBtn}
          >
            <Text style={styles.textBtnLabel}>Start over</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleDigitChange = (index: number, value: string) => {
    // Handle paste (user pastes 6 digits into any box)
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
      const next = Array(OTP_LENGTH).fill("");
      for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
      setDigits(next);
      setError(null);
      const lastFilled = Math.min(pasted.length - 1, OTP_LENGTH - 1);
      inputRefs.current[lastFilled]?.focus();
      if (pasted.length === OTP_LENGTH && !loading) {
        void submitCode(next.join(""));
      }
      return;
    }

    const cleaned = value.replace(/\D/g, "").slice(0, 1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (error) setError(null);

    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const complete = next.every((d) => d !== "");
    if (complete && !loading) {
      void submitCode(next.join(""));
    }
  };

  const handleKeyPress = (
    index: number,
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitCode = async (code: string) => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await verifyResetOtp({ phone, code });
      router.push({
        pathname: "/reset-password",
        params: { token: res.token },
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Invalid code. Please try again.";
      setError(msg);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      await requestPasswordReset(phone);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Couldn't resend the code. Please try again.";
      setError(msg);
    } finally {
      setResending(false);
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

            <View style={styles.card}>
              <Text style={styles.title}>Enter the 6-digit code</Text>
              <Text style={styles.subtitle}>
                Code sent to <Text style={styles.phoneHighlight}>{phone}</Text>
              </Text>
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Change number"
                style={styles.changeLink}
              >
                <Text style={styles.changeLinkText}>Change number?</Text>
              </Pressable>

              <View style={styles.otpRow}>
                {digits.map((d, i) => (
                  <TextInput
                    key={i}
                    ref={(ref) => {
                      inputRefs.current[i] = ref;
                    }}
                    value={d}
                    onChangeText={(v) => handleDigitChange(i, v)}
                    onKeyPress={(e) => handleKeyPress(i, e)}
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    selectTextOnFocus
                    textContentType={i === 0 ? "oneTimeCode" : undefined}
                    autoComplete={i === 0 ? "sms-otp" : "off"}
                    style={[
                      styles.otpBox,
                      d ? styles.otpBoxFilled : null,
                      error ? styles.otpBoxError : null,
                    ]}
                    accessibilityLabel={`OTP digit ${i + 1}`}
                    editable={!loading}
                  />
                ))}
              </View>

              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingText}>Verifying…</Text>
                </View>
              ) : null}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.resendRow}>
                {resendCooldown > 0 ? (
                  <Text style={styles.resendDisabled}>
                    Resend in {resendCooldown}s
                  </Text>
                ) : (
                  <Pressable
                    onPress={handleResend}
                    disabled={resending}
                    accessibilityRole="button"
                    accessibilityLabel="Resend code"
                  >
                    <Text style={styles.resendLink}>
                      {resending ? "Resending…" : "Resend code"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
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
  centredMsg: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[6],
    gap: spacing[3],
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
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[5],
    gap: spacing[3],
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
  phoneHighlight: {
    color: colors.foreground,
    fontWeight: fontWeight.bold,
  },
  changeLink: {
    alignSelf: "flex-start",
    paddingVertical: 2,
  },
  changeLinkText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing[3],
    gap: 6,
  },
  otpBox: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    textAlign: "center",
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    backgroundColor: colors.mutedBg,
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  otpBoxError: {
    borderColor: "#dc2626",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
    marginTop: spacing[2],
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: "#dc2626",
    textAlign: "center",
    marginTop: spacing[2],
  },
  resendRow: {
    alignItems: "center",
    marginTop: spacing[3],
  },
  resendDisabled: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  resendLink: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  textBtn: {
    paddingVertical: spacing[2],
  },
  textBtnLabel: {
    fontSize: fontSize.base,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
});
