import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { colors, fontSize, fontWeight, gradients, radii } from "@/lib/theme";

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuth((s) => s.register);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!firstName || !lastName || !phone || !password) {
      setError("Please fill in all required fields");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith("+63")
        ? phone
        : `+63${phone.replace(/^0/, "")}`;
      await register({
        phone: formattedPhone,
        firstName,
        lastName,
        password,
      });
      router.replace("/(tabs)/profile");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoRow}>
          <Text style={styles.logoRed}>Bloodline</Text>
          <LinearGradient
            colors={gradients.flame}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.phBadge}
          >
            <Text style={styles.phText}>PH</Text>
          </LinearGradient>
        </View>

        <Text style={styles.subtitle}>Create your account</Text>

        <View style={styles.form}>
          {error && <Text style={styles.errorBanner}>{error}</Text>}

          <View style={styles.row}>
            <Input
              label="First Name"
              placeholder="Juan"
              value={firstName}
              onChangeText={setFirstName}
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Last Name"
              placeholder="Dela Cruz"
              value={lastName}
              onChangeText={setLastName}
              containerStyle={{ flex: 1 }}
            />
          </View>

          <Input
            label="Phone Number"
            placeholder="9171234567"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            leftAddon={<Text style={styles.addonText}>+63</Text>}
          />

          <Input
            label="Password"
            placeholder="Minimum 8 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />

          <Button
            variant="primary"
            fullWidth
            loading={loading}
            onPress={handleSubmit}
          >
            Create Account
          </Button>

          <Pressable onPress={() => router.back()}>
            <Text style={styles.switchText}>
              Already have an account?{" "}
              <Text style={styles.switchTextLink}>Sign In</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.mutedBg,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    gap: 24,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  logoRed: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: colors.primary,
  },
  phBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.md,
  },
  phText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: colors.white,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.muted,
    textAlign: "center",
  },
  form: {
    gap: 16,
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  errorBanner: {
    padding: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: colors.destructive,
    borderRadius: radii.lg,
    fontSize: fontSize.sm,
  },
  addonText: {
    fontSize: fontSize.base,
    color: colors.muted,
    fontWeight: fontWeight.medium,
  },
  switchText: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: "center",
    marginTop: 8,
  },
  switchTextLink: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
});
