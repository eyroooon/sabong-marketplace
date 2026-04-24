// apps/mobile/app/settings/index.tsx
/**
 * Settings menu — top-level hub linking to profile edit + deferred items.
 */
import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/lib/auth";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert(
      "Log out?",
      "You'll need your phone + password to sign in again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/login");
          },
        },
      ],
    );
  };

  const comingSoon = (label: string) =>
    Alert.alert("Coming soon", `${label} settings are in the next update.`);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Settings",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        {user ? (
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {(user.firstName?.[0] || "?").toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user.firstName || ""} {user.lastName || ""}
              </Text>
              <Text style={styles.userPhone}>{user.phone}</Text>
            </View>
          </View>
        ) : null}

        <Section title="Account">
          <Row
            icon="person-outline"
            label="Profile"
            sub="Name, email, location"
            onPress={() => router.push("/settings/profile")}
          />
          <Row
            icon="lock-closed-outline"
            label="Security"
            sub="Password, 2FA"
            rightLabel="Soon"
            onPress={() => comingSoon("Security")}
          />
          <Row
            icon="notifications-outline"
            label="Notifications"
            sub="Manage alerts"
            rightLabel="Soon"
            onPress={() => comingSoon("Notification")}
          />
          <Row
            icon="language-outline"
            label="Language"
            sub="English / Filipino"
            rightLabel="Soon"
            onPress={() => comingSoon("Language")}
          />
        </Section>

        <Section title="Support">
          <Row
            icon="sparkles-outline"
            label="Ask AI"
            sub="24/7 Claude assistant"
            onPress={() => router.push("/support")}
          />
          <Row
            icon="help-circle-outline"
            label="Help Center"
            rightLabel="Web"
            onPress={() =>
              Alert.alert(
                "Help Center",
                "Visit bloodlineph.com/help from a browser.",
              )
            }
          />
        </Section>

        <Pressable
          onPress={confirmLogout}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          style={styles.logoutBtn}
        >
          <Ionicons name="log-out-outline" size={18} color="#dc2626" />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </SafeAreaView>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  label,
  sub,
  rightLabel,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub?: string;
  rightLabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Ionicons name={icon} size={20} color={colors.foreground} />
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {rightLabel ? <Text style={styles.rowRight}>{rightLabel}</Text> : null}
      <Ionicons
        name="chevron-forward"
        size={16}
        color={colors.muted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mutedBg },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    margin: spacing[4],
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#fff",
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
  },
  userInfo: { flex: 1 },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  userPhone: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: spacing[2],
    marginBottom: 6,
  },
  sectionCard: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    backgroundColor: colors.mutedBg,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  rowSub: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 1,
  },
  rowRight: {
    fontSize: fontSize.xs,
    color: colors.muted,
    fontWeight: fontWeight.semibold,
    backgroundColor: colors.mutedBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    margin: spacing[4],
    marginTop: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  logoutText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: "#dc2626",
  },
});
