// apps/mobile/app/(auth)/reset-password.tsx
/**
 * Reset Password — step 3 of the 3-step password reset flow.
 *
 * Receives a verified reset token from verify-otp. User enters a new
 * password + confirmation; on success, bounces back to /login so they
 * can log in fresh with the new credentials.
 */
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { resetPassword } from "@/lib/auth";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

const MIN_LENGTH = 8;

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => {
    return {
      length: password.length >= MIN_LENGTH,
      mixed: /[a-zA-Z]/.test(password) && /\d/.test(password),
    };
  }, [password]);

  const matches = password.length > 0 && password === confirm;
  const canSubmit =
    !loading &&
    !!token &&
    strength.length &&
    matches;

  if (!token) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <View style={styles.centredMsg}>
          <Text style={styles.title}>Invalid link</Text>
          <Text style={styles.subtitle}>
            This reset link is missing or expired.
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

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await resetPassword({ resetToken: token, password });
      Alert.alert(
        "Password updated",
        "You can now log in with your new password.",
        [
          {
            text: "Go to Login",
            onPress: () => {
              setLoading(false);
              router.replace("/login");
            },
          },
        ],
        { cancelable: false },
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Couldn't reset your password. Please try again.";
      setError(msg);
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

            <View style={styles.card}>
              <Text style={styles.title}>Set a new password</Text>
              <Text style={styles.subtitle}>
                Choose a strong password you haven't used before.
              </Text>

              <PasswordField
                label="New Password"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (error) setError(null);
                }}
                visible={showPassword}
                onToggle={() => setShowPassword((s) => !s)}
                editable={!loading}
                accessibilityLabel="New password"
                autoFocus
              />

              <View style={styles.hintsBox}>
                <HintRow met={strength.length} label={`At least ${MIN_LENGTH} characters`} />
                <HintRow
                  met={strength.mixed}
                  label="Mix of letters and numbers (recommended)"
                />
              </View>

              <PasswordField
                label="Confirm Password"
                value={confirm}
                onChangeText={(v) => {
                  setConfirm(v);
                  if (error) setError(null);
                }}
                visible={showConfirm}
                onToggle={() => setShowConfirm((s) => !s)}
                editable={!loading}
                accessibilityLabel="Confirm new password"
              />
              {confirm.length > 0 && !matches ? (
                <Text style={styles.warnText}>Passwords don't match.</Text>
              ) : null}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                accessibilityRole="button"
                accessibilityLabel="Update password"
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
                      Update Password
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
  editable?: boolean;
  accessibilityLabel: string;
  autoFocus?: boolean;
}

function PasswordField({
  label,
  value,
  onChangeText,
  visible,
  onToggle,
  editable = true,
  accessibilityLabel,
  autoFocus = false,
}: PasswordFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.pwWrapper}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          editable={editable}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.muted}
          style={styles.pwInput}
          accessibilityLabel={accessibilityLabel}
        />
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            visible ? "Hide password" : "Show password"
          }
          style={styles.eyeBtn}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={18}
            color={colors.muted}
          />
        </Pressable>
      </View>
    </View>
  );
}

function HintRow({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={styles.hintRow}>
      <Ionicons
        name={met ? "checkmark-circle" : "ellipse-outline"}
        size={14}
        color={met ? "#10b981" : colors.muted}
      />
      <Text
        style={[
          styles.hintText,
          met ? styles.hintTextMet : null,
        ]}
      >
        {label}
      </Text>
    </View>
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
  field: {
    gap: 6,
    marginTop: spacing[2],
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  pwWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
  },
  pwInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  eyeBtn: {
    padding: 4,
  },
  hintsBox: {
    gap: 4,
    paddingHorizontal: 4,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hintText: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  hintTextMet: {
    color: "#065f46",
  },
  warnText: {
    fontSize: fontSize.xs,
    color: "#b45309",
    marginTop: -2,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: "#dc2626",
    textAlign: "center",
    marginTop: spacing[2],
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
  textBtn: {
    paddingVertical: spacing[2],
  },
  textBtnLabel: {
    fontSize: fontSize.base,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
});
