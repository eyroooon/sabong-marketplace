// apps/mobile/app/favorites.tsx
/**
 * My Favorites — list of saved listings with quick-remove action.
 */
import React from "react";
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

import {
  useMyFavorites,
  useToggleFavorite,
  type FavoriteEntry,
} from "@/lib/favorites";
import { formatLocation, formatPeso } from "@/lib/listings";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

export default function FavoritesScreen() {
  const router = useRouter();
  const favorites = useMyFavorites();
  const toggleFavorite = useToggleFavorite();

  const data = favorites.data ?? [];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Favorites",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <FlatList
          data={data}
          keyExtractor={(f) => f.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          refreshControl={
            <RefreshControl
              refreshing={favorites.isRefetching}
              onRefresh={favorites.refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            favorites.isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <EmptyState onBrowse={() => router.push("/browse")} />
            )
          }
          renderItem={({ item }) => (
            <FavoriteRow
              favorite={item}
              busy={toggleFavorite.isPending}
              onOpen={() =>
                router.push({
                  pathname: "/listing/[slug]",
                  params: { slug: item.listing.slug },
                })
              }
              onRemove={() =>
                toggleFavorite.mutate({
                  listingId: item.listingId,
                  currentlyFavorited: true,
                })
              }
            />
          )}
        />
      </SafeAreaView>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function FavoriteRow({
  favorite,
  busy,
  onOpen,
  onRemove,
}: {
  favorite: FavoriteEntry;
  busy: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const { listing } = favorite;
  const location = formatLocation(
    listing.locationProvince,
    listing.locationCity,
  );

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Open ${listing.title}`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {listing.primaryImage ? (
        <Image
          source={{ uri: listing.primaryImage }}
          style={styles.thumb}
        />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Ionicons name="image-outline" size={22} color={colors.muted} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={styles.price}>{formatPeso(listing.price)}</Text>
        {location ? (
          <Text style={styles.meta} numberOfLines={1}>
            📍 {location}
          </Text>
        ) : null}
        {listing.breed ? (
          <Text style={styles.meta} numberOfLines={1}>
            {listing.breed}
            {listing.category ? ` · ${listing.category}` : ""}
          </Text>
        ) : null}
      </View>
      <Pressable
        onPress={onRemove}
        disabled={busy}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Remove from favorites"
        style={[styles.heartBtn, busy && styles.btnDisabled]}
      >
        <Ionicons name="heart" size={22} color={colors.primary} />
      </Pressable>
    </Pressable>
  );
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>💔</Text>
      <Text style={styles.emptyTitle}>No favorites yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap the heart on any listing to save it for later.
      </Text>
      <Pressable
        onPress={onBrowse}
        accessibilityRole="button"
        accessibilityLabel="Browse listings"
        style={styles.emptyBtnWrapper}
      >
        <LinearGradient
          colors={["#fbbf24", "#ef4444"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.emptyBtn}
        >
          <Ionicons name="search" size={18} color="#fff" />
          <Text style={styles.emptyBtnText}>Browse Listings</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: {
    padding: spacing[3],
    flexGrow: 1,
  },
  sep: { height: 10 },
  loadingWrap: {
    paddingVertical: spacing[10],
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  rowPressed: {
    backgroundColor: colors.mutedBg,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.mutedBg,
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  price: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  meta: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  heartBtn: {
    padding: 6,
  },
  btnDisabled: {
    opacity: 0.5,
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
