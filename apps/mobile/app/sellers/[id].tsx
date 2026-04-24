/**
 * Public Seller Profile — farm info, stats, verification, responsiveness.
 *
 * The :id param is seller_profiles.id (NOT user.id). Use it to fetch via
 * GET /sellers/:id (public, no auth required).
 *
 * Active listings are omitted: the /listings browse endpoint does not support
 * a sellerId filter. The totalListings stat is shown in the stats grid instead.
 */
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import { usePublicSellerProfile } from "@/lib/sellers";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const seller = usePublicSellerProfile(id);
  const router = useRouter();

  if (seller.isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: "Seller" }} />
        <View style={styles.centred}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </>
    );
  }

  if (seller.isError || !seller.data) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: "Seller" }} />
        <View style={styles.centred}>
          <Ionicons name="person-circle-outline" size={48} color={colors.muted} />
          <Text style={styles.errorTitle}>Seller not found</Text>
          <Text style={styles.errorSubtitle}>
            This profile may be private or no longer exists.
          </Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go back</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const s = seller.data;
  const farmName = s.farmName ?? "Sabungero";
  const location =
    [s.farmCity, s.farmProvince].filter(Boolean).join(", ") || "—";
  const verified = s.verificationStatus === "verified";
  const avgRatingNum = Number(s.avgRating);
  const hasRating =
    s.ratingCount > 0 && Number.isFinite(avgRatingNum) && avgRatingNum > 0;
  const totalListings = s.totalListings ?? 0;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: farmName,
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header card */}
          <View style={styles.headerCard}>
            <LinearGradient
              colors={["#fbbf24", "#ef4444"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarInitial}>
                {farmName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>

            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.farmName} numberOfLines={2}>
                  {farmName}
                </Text>
                {verified ? (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={11} color={colors.white} />
                  </View>
                ) : null}
              </View>

              <View style={styles.locationRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={colors.muted}
                />
                <Text style={styles.locationText}>{location}</Text>
              </View>

              {s.plan && s.plan !== "free" ? (
                <View style={styles.planPill}>
                  <Ionicons name="ribbon" size={10} color="#7c2d12" />
                  <Text style={styles.planText}>
                    {s.plan === "pro" ? "Pro" : "Basic"} Breeder
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="trending-up-outline"
              label="Total Sales"
              value={s.totalSales.toString()}
              tint="#065f46"
            />
            <StatCard
              icon="star"
              label="Rating"
              value={hasRating ? avgRatingNum.toFixed(1) : "—"}
              sub={hasRating ? `${s.ratingCount} reviews` : undefined}
              tint="#b45309"
            />
            <StatCard
              icon="pricetag-outline"
              label="Listings"
              value={totalListings.toString()}
              tint="#1e40af"
            />
          </View>

          {/* Verification status */}
          {verified ? (
            <View style={styles.verifiedCard}>
              <Ionicons name="shield-checkmark" size={18} color="#065f46" />
              <View style={{ flex: 1 }}>
                <Text style={styles.verifiedTitle}>Verified Seller</Text>
                {s.verifiedAt ? (
                  <Text style={styles.verifiedSub}>
                    Since {new Date(s.verifiedAt).toLocaleDateString()}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : (
            <View style={styles.unverifiedCard}>
              <Ionicons name="time-outline" size={18} color={colors.muted} />
              <Text style={styles.unverifiedText}>
                Not yet verified — trade with care.
              </Text>
            </View>
          )}

          {/* Responsiveness */}
          {s.responseRate ?? s.responseTime ? (
            <View style={styles.metaCard}>
              <Text style={styles.sectionTitle}>Responsiveness</Text>
              {s.responseRate ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Response rate</Text>
                  <Text style={styles.metaValue}>{s.responseRate}</Text>
                </View>
              ) : null}
              {s.responseTime ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Typical reply</Text>
                  <Text style={styles.metaValue}>{s.responseTime}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* About / farm description */}
          {s.farmDescription ? (
            <View style={styles.descCard}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.descText}>{s.farmDescription}</Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  sub?: string;
  tint: string;
}) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={18} color={tint} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mutedBg },

  centred: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing[6],
    gap: spacing[3],
  },
  errorTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  errorSubtitle: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: "center",
  },
  backBtn: {
    marginTop: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    backgroundColor: colors.mutedBg,
  },
  backBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },

  content: {
    padding: spacing[4],
    gap: spacing[3],
  },

  // Header card
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: colors.white,
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
  },
  headerInfo: { flex: 1, gap: 4 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  farmName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: colors.foreground,
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.info,
    alignItems: "center",
    justifyContent: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  planPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    backgroundColor: "#fef3c7",
    marginTop: 2,
  },
  planText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: "#7c2d12",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    gap: spacing[2],
  },
  statCard: {
    flex: 1,
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: 4,
    alignItems: "flex-start",
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.foreground,
  },
  statSub: {
    fontSize: 10,
    color: colors.muted,
  },

  // Verification
  verifiedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  verifiedTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: "#166534",
  },
  verifiedSub: {
    fontSize: fontSize.xs,
    color: "#15803d",
    marginTop: 1,
  },
  unverifiedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: colors.mutedBg,
  },
  unverifiedText: {
    fontSize: fontSize.sm,
    color: colors.muted,
    flex: 1,
  },

  // Meta / responsiveness
  metaCard: {
    padding: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  metaValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },

  // Description
  descCard: {
    padding: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  descText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    lineHeight: 20,
  },
});
