import React from "react";
import { StyleSheet, Text, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { colors, fontSize, fontWeight, radii, spacing } from "@/lib/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={styles.muted}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.guestBody}>
          <Ionicons name="person-circle-outline" size={80} color={colors.muted} />
          <Text style={styles.guestTitle}>Welcome to BloodlinePH</Text>
          <Text style={styles.guestText}>
            Mag-login para i-track ang mga listings, messages, at orders mo.
          </Text>
          <Button variant="gold" fullWidth onPress={() => router.push("/login")}>
            Sign In
          </Button>
          <Button
            variant="outline"
            fullWidth
            onPress={() => router.push("/register")}
          >
            Create Account
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>
              {user.firstName[0]?.toUpperCase() ?? "B"}
            </Text>
          </View>
          <Text style={styles.name}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.muted}>{user.phone}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{user.role.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.menu}>
          <MenuItem icon="settings-outline" label="Settings" onPress={() => {}} />
          <MenuItem icon="heart-outline" label="Favorites" onPress={() => {}} />
          <MenuItem icon="cube-outline" label="My Orders" onPress={() => {}} />
          <MenuItem icon="storefront-outline" label="Sell" onPress={() => {}} />
        </View>

        <Button
          variant="outline"
          fullWidth
          onPress={() => {
            Alert.alert("Sign out?", "You'll need to log in again.", [
              { text: "Cancel", style: "cancel" },
              {
                text: "Sign out",
                style: "destructive",
                onPress: () => logout(),
              },
            ]);
          }}
        >
          Sign Out
        </Button>
      </View>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.menuItem}>
      <Ionicons name={icon} size={20} color={colors.muted} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.mutedBg,
  },
  guestBody: {
    flex: 1,
    padding: 24,
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  guestTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.foreground,
  },
  guestText: {
    fontSize: fontSize.base,
    color: colors.muted,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  body: {
    padding: 24,
    gap: 24,
  },
  avatarBlock: {
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: fontWeight.black,
    color: colors.white,
  },
  name: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  muted: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  roleBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: 0.8,
  },
  menu: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuLabel: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.foreground,
    fontWeight: fontWeight.medium,
  },
});
