// apps/mobile/app/settings/profile.tsx
/**
 * Profile Edit — update name, email, display name, city/province.
 * Persists via PATCH /users/me and mirrors the update back into
 * the local auth store so changes show instantly.
 *
 * NOTE: The local AuthUser type only carries firstName/lastName (not
 * email/displayName/province/city). Those fields are still sent to the
 * server via UpdateProfileInput; they simply cannot be pre-populated from
 * the cached user object until the backend starts returning them in the
 * auth response.
 */
import React, { useState } from "react";
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
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PROVINCES } from "@sabong/shared";

import { useAuth } from "@/lib/auth";
import { useUpdateProfile } from "@/lib/settings";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();

  // AuthUser has firstName/lastName; email/displayName/province/city are not
  // in the local type — initialize to empty string (server may return them
  // in the PATCH response and they'll be persisted via setAuth).
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed =
    firstName !== (user?.firstName ?? "") ||
    lastName !== (user?.lastName ?? "") ||
    email !== "" ||
    displayName !== "" ||
    province !== "" ||
    city !== "";

  const emailValid =
    email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const canSave =
    changed &&
    !saving &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    emailValid;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await updateProfile.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        displayName: displayName.trim() || undefined,
        province: province || undefined,
        city: city.trim() || undefined,
      });
      Alert.alert(
        "Profile updated",
        "Your changes have been saved.",
        [
          {
            text: "OK",
            onPress: () => {
              setSaving(false);
              router.back();
            },
          },
        ],
        { cancelable: false },
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Please try again.";
      setError(msg);
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Edit Profile",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <Field
                label="First Name *"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Juan"
              />
              <Field
                label="Last Name *"
                value={lastName}
                onChangeText={setLastName}
                placeholder="dela Cruz"
              />
              <Field
                label="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Optional — how others see you"
              />
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {!emailValid ? (
                <Text style={styles.warnText}>
                  Please enter a valid email address.
                </Text>
              ) : null}

              <View style={styles.fieldWrapper}>
                <Text style={styles.fieldLabel}>Province</Text>
                <Pressable
                  style={styles.pickerBtn}
                  onPress={() => setProvinceOpen((o) => !o)}
                  accessibilityRole="button"
                  accessibilityLabel="Province"
                >
                  <Text
                    style={[
                      styles.inputText,
                      !province && styles.inputPlaceholder,
                    ]}
                  >
                    {province || "Select…"}
                  </Text>
                  <Ionicons
                    name={provinceOpen ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={colors.muted}
                  />
                </Pressable>
                {provinceOpen ? (
                  <ScrollView
                    style={styles.dropdown}
                    nestedScrollEnabled
                  >
                    <Pressable
                      style={styles.dropdownItem}
                      onPress={() => {
                        setProvince("");
                        setProvinceOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>— none —</Text>
                    </Pressable>
                    {PROVINCES.map((p) => (
                      <Pressable
                        key={p.name}
                        style={[
                          styles.dropdownItem,
                          p.name === province && styles.dropdownItemActive,
                        ]}
                        onPress={() => {
                          setProvince(p.name);
                          setProvinceOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            p.name === province &&
                              styles.dropdownItemTextActive,
                          ]}
                        >
                          {p.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                ) : null}
              </View>

              <Field
                label="City / Municipality"
                value={city}
                onChangeText={setCity}
                placeholder="Angeles"
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                onPress={handleSave}
                disabled={!canSave}
                accessibilityRole="button"
                accessibilityLabel="Save profile changes"
                style={[
                  styles.saveBtnWrapper,
                  !canSave && styles.btnDisabled,
                ]}
              >
                <LinearGradient
                  colors={["#fbbf24", "#ef4444"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtn}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
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

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        style={styles.textInput}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mutedBg },
  kav: { flex: 1 },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[5],
    gap: spacing[3],
  },
  fieldWrapper: { gap: 4 },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.background,
  },
  inputText: {
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  inputPlaceholder: {
    color: colors.muted,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    maxHeight: 240,
    marginTop: 4,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemActive: {
    backgroundColor: colors.mutedBg,
  },
  dropdownItemText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  warnText: {
    fontSize: fontSize.xs,
    color: "#b45309",
  },
  errorText: {
    fontSize: fontSize.sm,
    color: "#dc2626",
    marginTop: spacing[2],
  },
  saveBtnWrapper: {
    borderRadius: radii.lg,
    overflow: "hidden",
    marginTop: spacing[3],
  },
  saveBtn: {
    paddingVertical: 14,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
