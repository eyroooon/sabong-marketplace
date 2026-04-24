/**
 * My Listings — mirrors apps/web/src/app/(dashboard)/sell/page.tsx.
 *
 * Lists every listing the current seller owns across all statuses (draft,
 * active, reserved, sold, archived). Each row shows title, price, status
 * chip, view count, and an Edit action.
 */
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";

import { formatPeso, type Listing, useMyListings } from "@/lib/listings";
import { useMyPlan } from "@/lib/sellers";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

const STATUS_COLORS: Record<
  Listing["status"],
  { bg: string; fg: string; label: string }
> = {
  draft: { bg: "#fef3c7", fg: "#92400e", label: "Draft" },
  active: { bg: "#d1fae5", fg: "#065f46", label: "Active" },
  reserved: { bg: "#dbeafe", fg: "#1e40af", label: "Reserved" },
  sold: { bg: "#e5e7eb", fg: "#374151", label: "Sold" },
  archived: { bg: "#f3f4f6", fg: "#6b7280", label: "Archived" },
};

export default function MyListingsScreen() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch } = useMyListings();
  const myPlan = useMyPlan();

  const listings = data?.data ?? [];

  const limitInfo = useMemo(() => {
    if (!myPlan.data) return null;
    const used = myPlan.data.usage.activeListings;
    const max = myPlan.data.usage.maxActiveListings;
    if (max === -1) return null; // unlimited
    const atLimit = used >= max;
    const nearLimit =
      !atLimit && used >= Math.max(1, Math.floor(max * 0.8));
    return { used, max, atLimit, nearLimit };
  }, [myPlan.data]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "My Listings",
          headerTitleStyle: { fontWeight: "800" },
          headerRight: () => (
            <Pressable
              onPress={() => router.push("/seller/listings/new" as never)}
              hitSlop={10}
              style={({ pressed }) => [
                styles.headerCta,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.headerCtaText}>New</Text>
            </Pressable>
          ),
        }}
      />
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            limitInfo && (limitInfo.atLimit || limitInfo.nearLimit) ? (
              <View
                style={[
                  styles.limitBanner,
                  limitInfo.atLimit
                    ? styles.limitBannerAt
                    : styles.limitBannerNear,
                ]}
              >
                <Text
                  style={[
                    styles.limitBannerText,
                    limitInfo.atLimit
                      ? { color: "#991b1b" }
                      : { color: "#854d0e" },
                  ]}
                >
                  {limitInfo.atLimit
                    ? `You've reached your listing limit (${limitInfo.used}/${limitInfo.max}).`
                    : `You've used ${limitInfo.used}/${limitInfo.max} listings.`}{" "}
                  Upgrade for more.
                </Text>
                <Pressable
                  style={[
                    styles.limitCta,
                    limitInfo.atLimit
                      ? { backgroundColor: "#dc2626" }
                      : { backgroundColor: "#ca8a04" },
                  ]}
                  onPress={() => router.push("/plans")}
                >
                  <Text style={styles.limitCtaText}>
                    {limitInfo.atLimit ? "Upgrade" : "View plans"}
                  </Text>
                </Pressable>
              </View>
            ) : null
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <EmptyState
                onCreate={() => router.push("/seller/listings/new" as never)}
              />
            )
          }
          renderItem={({ item }) => (
            <ListingRow
              listing={item}
              onPress={() =>
                router.push(`/seller/listings/${item.id}` as never)
              }
            />
          )}
        />
      </SafeAreaView>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ListingRow({
  listing,
  onPress,
}: {
  listing: Listing;
  onPress: () => void;
}) {
  const statusStyle = STATUS_COLORS[listing.status];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
    >
      {listing.primaryImage ? (
        <Image source={{ uri: listing.primaryImage }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Ionicons
            name="image-outline"
            size={22}
            color={colors.muted}
          />
        </View>
      )}
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={styles.rowPrice}>{formatPeso(listing.price)}</Text>
        <View style={styles.rowMeta}>
          <View
            style={[styles.statusChip, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusChipText, { color: statusStyle.fg }]}>
              {statusStyle.label}
            </Text>
          </View>
          <View style={styles.metaDot} />
          <Ionicons name="eye-outline" size={12} color={colors.muted} />
          <Text style={styles.metaText}>{listing.viewCount} views</Text>
          {listing.isFeatured ? (
            <>
              <View style={styles.metaDot} />
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={[styles.metaText, { color: "#d97706" }]}>
                Featured
              </Text>
            </>
          ) : null}
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={18}
        color={colors.muted}
        style={{ marginLeft: 4 }}
      />
    </Pressable>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No listings yet</Text>
      <Text style={styles.emptySubtitle}>
        Post your first gamefowl to reach thousands of sabungeros.
      </Text>
      <Pressable onPress={onCreate} style={styles.emptyBtnWrapper}>
        <LinearGradient
          colors={["#fbbf24", "#ef4444"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.emptyBtn}
        >
          <Ionicons name="add-circle" size={18} color="#fff" />
          <Text style={styles.emptyBtnText}>Create Your First Listing</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing[3],
    flexGrow: 1,
  },
  headerCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 999,
    marginRight: spacing[3],
  },
  headerCtaText: {
    color: "#fff",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing[3],
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: colors.mutedBg,
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  rowPrice: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.muted,
    opacity: 0.5,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  limitBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[3],
    marginBottom: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing[3],
  },
  limitBannerAt: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  limitBannerNear: {
    backgroundColor: "#fef9c3",
    borderColor: "#fde68a",
  },
  limitBannerText: {
    flex: 1,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
  limitCta: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  limitCtaText: {
    color: "#fff",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  loadingWrap: {
    paddingVertical: spacing[10],
    alignItems: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[10],
    paddingHorizontal: spacing[6],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing[3],
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing[5],
  },
  emptyBtnWrapper: {
    borderRadius: 999,
    overflow: "hidden",
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyBtnText: {
    color: "#fff",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
