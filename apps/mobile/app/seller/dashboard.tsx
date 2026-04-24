/**
 * Seller Dashboard — mirrors apps/web/src/app/(dashboard)/dashboard/page.tsx.
 *
 * Shows:
 *  - Welcome header with first name + role
 *  - 4 quick-stats cards (active listings, pending orders, unread notifs, favorites)
 *  - Seller-only stats (total sales + avg rating) when user has a seller profile
 *  - Plan badge + verification banner (mirrors /sell page)
 *  - Quick actions: New Listing, My Listings, My Orders, Verification
 */
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";

import { useAuth } from "@/lib/auth";
import {
  useMyPlan,
  useMyStats,
  useSellerProfile,
  type PlanTier,
} from "@/lib/sellers";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

const PLAN_COLORS: Record<PlanTier, { bg: string; fg: string }> = {
  free: { bg: "#f3f4f6", fg: "#374151" },
  basic: { bg: "#dbeafe", fg: "#1e40af" },
  pro: { bg: "#ede9fe", fg: "#6d28d9" },
};

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const stats = useMyStats();
  const sellerProfile = useSellerProfile();
  const myPlan = useMyPlan();

  const loading = stats.isLoading || sellerProfile.isLoading;
  const refreshing =
    stats.isRefetching || sellerProfile.isRefetching || myPlan.isRefetching;

  const handleRefresh = () => {
    stats.refetch();
    sellerProfile.refetch();
    myPlan.refetch();
  };

  const verification = sellerProfile.data?.verificationStatus;
  const hasDocs = !!sellerProfile.data?.governmentIdUrl;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Dashboard",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Welcome header */}
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>
              Welcome back, {user?.firstName || "Sabungero"}!
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Manage your listings, orders, and farm from here.
            </Text>
          </View>

          {/* Plan badge */}
          {myPlan.data && (
            <Pressable
              style={[
                styles.planBadge,
                { backgroundColor: PLAN_COLORS[myPlan.data.plan].bg },
              ]}
              onPress={() => router.push("/plans")}
            >
              <Ionicons
                name="ribbon"
                size={14}
                color={PLAN_COLORS[myPlan.data.plan].fg}
              />
              <Text
                style={[
                  styles.planBadgeText,
                  { color: PLAN_COLORS[myPlan.data.plan].fg },
                ]}
              >
                {myPlan.data.planDetails.name} plan
              </Text>
              <Text style={styles.planBadgeCounts}>
                · {myPlan.data.usage.activeListings}/
                {myPlan.data.usage.maxActiveListings === -1
                  ? "∞"
                  : myPlan.data.usage.maxActiveListings}{" "}
                listings
              </Text>
            </Pressable>
          )}

          {/* Verification banner */}
          {sellerProfile.data && (
            <VerificationBanner
              status={verification}
              hasDocs={hasDocs}
              verifiedAt={sellerProfile.data.verifiedAt}
              onPressUpload={() => router.push("/seller/verification")}
            />
          )}

          {/* Quick stats */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="pricetag-outline"
              label="Active Listings"
              value={stats.data?.activeListings ?? 0}
              loading={loading}
              onPress={() => router.push("/seller/listings")}
            />
            <StatCard
              icon="cube-outline"
              label="Pending Orders"
              value={stats.data?.pendingOrders ?? 0}
              loading={loading}
              onPress={() => router.push("/orders")}
            />
            <StatCard
              icon="notifications-outline"
              label="Unread"
              value={stats.data?.unreadNotifications ?? 0}
              loading={loading}
              highlighted={Boolean(
                stats.data?.unreadNotifications &&
                  stats.data.unreadNotifications > 0,
              )}
            />
            <StatCard
              icon="heart-outline"
              label="Favorites"
              value={stats.data?.favorites ?? 0}
              loading={loading}
            />
          </View>

          {/* Seller-specific stats */}
          {sellerProfile.data && stats.data?.totalSales !== null && (
            <View style={styles.sellerStatsGrid}>
              <View style={styles.sellerStatCard}>
                <Ionicons
                  name="trending-up-outline"
                  size={20}
                  color={colors.emerald}
                />
                <Text style={styles.sellerStatLabel}>Total Sales</Text>
                <Text style={styles.sellerStatValue}>
                  {stats.data?.totalSales ?? 0}
                </Text>
              </View>
              <View style={styles.sellerStatCard}>
                <Ionicons name="star" size={20} color="#f59e0b" />
                <Text style={styles.sellerStatLabel}>Average Rating</Text>
                <Text style={styles.sellerStatValue}>
                  {stats.data?.avgRating && Number(stats.data.avgRating) > 0
                    ? `${Number(stats.data.avgRating).toFixed(1)} / 5`
                    : "— / 5"}
                </Text>
              </View>
            </View>
          )}

          {/* Quick actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <ActionTile
              icon="add-circle"
              label="New Listing"
              subtitle="Post a bird for sale"
              gradient
              onPress={() => router.push("/seller/listings/new")}
            />
            <ActionTile
              icon="list-outline"
              label="My Listings"
              subtitle="Manage your inventory"
              onPress={() => router.push("/seller/listings")}
            />
            <ActionTile
              icon="cube-outline"
              label="Orders"
              subtitle="Ship & track sales"
              onPress={() => router.push("/orders")}
            />
            <ActionTile
              icon="shield-checkmark-outline"
              label="Verification"
              subtitle={
                verification === "verified"
                  ? "Verified ✓"
                  : verification === "pending"
                    ? "Under review"
                    : "Get verified"
              }
              onPress={() => router.push("/seller/verification")}
            />
          </View>

          {/* Loading fallback */}
          {loading && !stats.data && (
            <View style={styles.initialLoading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  loading,
  highlighted,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  loading: boolean;
  highlighted?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <View
      style={[
        styles.statCard,
        highlighted && styles.statCardHighlight,
      ]}
    >
      <Ionicons
        name={icon}
        size={18}
        color={highlighted ? colors.primary : colors.muted}
      />
      <Text
        style={[styles.statLabel, highlighted && { color: colors.primary }]}
      >
        {label}
      </Text>
      {loading ? (
        <View style={styles.statLoading} />
      ) : (
        <Text
          style={[styles.statValue, highlighted && { color: colors.primary }]}
        >
          {value}
        </Text>
      )}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.statCardWrapper}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.statCardWrapper}>{content}</View>;
}

function VerificationBanner({
  status,
  hasDocs,
  verifiedAt,
  onPressUpload,
}: {
  status: "pending" | "verified" | "rejected" | null | undefined;
  hasDocs: boolean;
  verifiedAt: string | null | undefined;
  onPressUpload: () => void;
}) {
  if (status === "verified") {
    return (
      <View style={[styles.banner, styles.bannerVerified]}>
        <Ionicons name="checkmark-circle" size={18} color="#15803d" />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.bannerTitleVerified}>Verified Seller</Text>
          {verifiedAt && (
            <Text style={styles.bannerSubVerified}>
              Since {new Date(verifiedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    );
  }
  if (status === "pending") {
    return (
      <View style={[styles.banner, styles.bannerPending]}>
        <Ionicons name="time-outline" size={18} color="#a16207" />
        <Text style={[styles.bannerText, { color: "#854d0e" }]}>
          Verification pending — we'll notify you in 24-48 hours.
        </Text>
      </View>
    );
  }
  if (status === "rejected" || !hasDocs) {
    return (
      <View style={[styles.banner, styles.bannerRejected]}>
        <Ionicons name="alert-circle" size={18} color="#b91c1c" />
        <Text style={[styles.bannerText, { color: "#991b1b" }]}>
          {status === "rejected"
            ? "Verification rejected — re-upload your documents."
            : "Not yet verified — upload your Gov ID to get a verified badge."}
        </Text>
        <Pressable style={styles.bannerCta} onPress={onPressUpload}>
          <Text style={styles.bannerCtaText}>Upload</Text>
        </Pressable>
      </View>
    );
  }
  return null;
}

function ActionTile({
  icon,
  label,
  subtitle,
  gradient,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  gradient?: boolean;
  onPress: () => void;
}) {
  if (gradient) {
    return (
      <Pressable style={styles.actionTileWrapper} onPress={onPress}>
        <LinearGradient
          colors={["#fbbf24", "#ef4444"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.actionTile}
        >
          <Ionicons name={icon} size={24} color="#fff" />
          <Text style={[styles.actionLabel, { color: "#fff" }]}>{label}</Text>
          <Text style={[styles.actionSubtitle, { color: "#fff" }]}>
            {subtitle}
          </Text>
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable style={styles.actionTileWrapper} onPress={onPress}>
      <View style={styles.actionTileMuted}>
        <Ionicons name={icon} size={24} color={colors.primary} />
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[4],
  },
  welcomeCard: {
    gap: 4,
  },
  welcomeTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: colors.foreground,
  },
  welcomeSubtitle: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  planBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: "capitalize",
  },
  planBadgeCounts: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  bannerText: {
    flex: 1,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
  bannerVerified: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  bannerTitleVerified: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: "#166534",
  },
  bannerSubVerified: {
    fontSize: fontSize.xs,
    color: "#15803d",
    marginTop: 1,
  },
  bannerPending: {
    backgroundColor: "#fef9c3",
    borderColor: "#fde68a",
  },
  bannerRejected: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  bannerCta: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bannerCtaText: {
    color: "#fff",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  statCardWrapper: {
    flexBasis: "48%",
    flexGrow: 1,
  },
  statCard: {
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: 6,
  },
  statCardHighlight: {
    borderColor: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  statValue: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: colors.foreground,
  },
  statLoading: {
    width: 32,
    height: 28,
    borderRadius: 4,
    backgroundColor: colors.mutedBg,
  },
  sellerStatsGrid: {
    flexDirection: "row",
    gap: spacing[2],
  },
  sellerStatCard: {
    flex: 1,
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "flex-start",
    gap: 4,
  },
  sellerStatLabel: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 4,
  },
  sellerStatValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.foreground,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginTop: spacing[2],
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  actionTileWrapper: {
    flexBasis: "48%",
    flexGrow: 1,
  },
  actionTile: {
    padding: spacing[4],
    borderRadius: radii.lg,
    gap: 6,
    minHeight: 96,
  },
  actionTileMuted: {
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: 6,
    minHeight: 96,
  },
  actionLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginTop: 4,
  },
  actionSubtitle: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  initialLoading: {
    paddingVertical: spacing[8],
    alignItems: "center",
  },
});
