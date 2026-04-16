import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useBrowseListings, type BrowseFilters } from "@/lib/listings";
import { ListingCard } from "@/components/listings/ListingCard";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

const SORT_OPTIONS: { label: string; value: BrowseFilters["sort"] }[] = [
  { label: "Newest", value: "newest" },
  { label: "Low → High", value: "price_asc" },
  { label: "High → Low", value: "price_desc" },
  { label: "Popular", value: "popular" },
];

export default function BrowseScreen() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<BrowseFilters["sort"]>("newest");

  const filters = useMemo<BrowseFilters>(
    () => ({
      search: search.trim() || undefined,
      sort,
    }),
    [search, sort],
  );

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
    error,
  } = useBrowseListings(filters);

  const listings = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  const total = data?.pages[0]?.pagination.total ?? 0;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse</Text>
        {total > 0 ? (
          <Text style={styles.countText}>
            {total.toLocaleString()} {total === 1 ? "listing" : "listings"}
          </Text>
        ) : null}
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search breed, title, bloodline..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          returnKeyType="search"
          autoCorrect={false}
        />
        {search ? (
          <Ionicons
            name="close-circle"
            size={18}
            color={colors.muted}
            onPress={() => setSearch("")}
            suppressHighlighting
          />
        ) : null}
      </View>

      {/* Sort chips */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt) => (
          <SortChip
            key={opt.value}
            label={opt.label}
            active={sort === opt.value}
            onPress={() => setSort(opt.value)}
          />
        ))}
      </View>

      {/* List */}
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <ListingCard listing={item} />
          </View>
        )}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerBlock}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.centerBlock}>
              <Ionicons name="cloud-offline" size={40} color={colors.muted} />
              <Text style={styles.emptyTitle}>Can&apos;t reach server</Text>
              <Text style={styles.emptyText}>
                {error.message ||
                  "Check that the API is running at EXPO_PUBLIC_API_URL"}
              </Text>
            </View>
          ) : (
            <View style={styles.centerBlock}>
              <Ionicons name="search-outline" size={40} color={colors.muted} />
              <Text style={styles.emptyTitle}>No listings found</Text>
              <Text style={styles.emptyText}>
                {search
                  ? `No matches for "${search}". Try another search.`
                  : "Be the first to list a bird!"}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerSpinner}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function SortChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      style={[styles.sortChip, active && styles.sortChipActive]}
      suppressHighlighting
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.mutedBg,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: colors.foreground,
  },
  countText: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: spacing[5],
    paddingHorizontal: spacing[3],
    height: 42,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.foreground,
    paddingVertical: 0,
  },
  sortRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    flexWrap: "wrap",
  },
  sortChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: radii.full,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  sortChipActive: {
    color: colors.white,
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  list: {
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[10],
    flexGrow: 1,
  },
  row: {
    gap: spacing[3],
  },
  cell: {
    flex: 1,
    marginBottom: spacing[3],
  },
  centerBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[10],
    gap: 10,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  footerSpinner: {
    padding: spacing[4],
  },
});
