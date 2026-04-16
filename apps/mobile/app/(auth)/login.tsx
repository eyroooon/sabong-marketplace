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

export default function LoginScreen() {
  const router = useRouter();
  const login = useAuth((s) => s.login);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!phone || !password) {
      setError("Please enter phone and password");
      return;
    }
    setLoading(true);
    try {
      const formattedPhone = phone.startsWith("+63")
        ? phone
        : `+63${phone.replace(/^0/, "")}`;
      await login(formattedPhone, password);
      router.replace("/(tabs)/profile");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
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

        <Text style={styles.subtitle}>Sign in to your account</Text>

        <View style={styles.form}>
          {error && <Text style={styles.errorBanner}>{error}</Text>}

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
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button variant="primary" fullWidth loading={loading} onPress={handleSubmit}>
            Sign In
          </Button>

          <Pressable onPress={() => router.push("/register")}>
            <Text style={styles.switchText}>
              Don't have an account?{" "}
              <Text style={styles.switchTextLink}>Register</Text>
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
    marginTop: 20,
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
