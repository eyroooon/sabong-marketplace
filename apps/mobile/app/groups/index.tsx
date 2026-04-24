/**
 * Groups list — Discover + My Groups tabs, category filters, search.
 */
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import {
  useGroups,
  useMyGroups,
  useJoinGroup,
  useLeaveGroup,
  type Group,
  type GroupCategory,
} from "@/lib/groups";
import { colors, fontSize, fontWeight, radii, spacing } from "@/lib/theme";

type Tab = "discover" | "mine";
type CategoryFilter = "all" | GroupCategory;

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: "All",
  regional: "Regional",
  bloodline: "Bloodline",
  topic: "Topic",
  general: "General",
};

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  regional: { bg: "#dbeafe", fg: "#1e40af" },
  bloodline: { bg: "#ede9fe", fg: "#6b21a8" },
  topic: { bg: "#d1fae5", fg: "#065f46" },
  general: { bg: colors.mutedBg, fg: colors.muted },
};

export default function GroupsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("discover");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");

  const discover = useGroups({ category, q: query });
  const mine = useMyGroups();
  const join = useJoinGroup();
  const leave = useLeaveGroup();

  const active = tab === "discover" ? discover : mine;
  const data = active.data ?? [];

  return (
    <>
      <Stack.Screen options={{ title: "Groups", headerTitleStyle: { fontWeight: "800" } }} />
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        {/* Tabs */}
        <View style={styles.tabBar}>
          {(["discover", "mine"] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text
                style={[styles.tabLabel, tab === t && styles.tabLabelActive]}
              >
                {t === "discover" ? "Discover" : "My Groups"}
              </Text>
              {t === "mine" && (mine.data?.length ?? 0) > 0 && (
                <View
                  style={[
                    styles.tabBadge,
                    tab === t ? styles.tabBadgeActive : styles.tabBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      tab === t && { color: "#fff" },
                    ]}
                  >
                    {mine.data?.length ?? 0}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Filters (Discover only) */}
        {tab === "discover" && (
          <View style={styles.filterBar}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search groups…"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
            />
            <View style={styles.chipRow}>
              {(Object.keys(CATEGORY_LABELS) as CategoryFilter[])
                .filter((c) => c !== "general")
                .map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => setCategory(c)}
                    style={[
                      styles.chip,
                      category === c && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        category === c && styles.chipTextActive,
                      ]}
                    >
                      {CATEGORY_LABELS[c]}
                    </Text>
                  </Pressable>
                ))}
            </View>
          </View>
        )}

        {/* List */}
        <FlatList
          data={data}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={
            <RefreshControl
              refreshing={active.isRefetching}
              onRefresh={() => active.refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            active.isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <EmptyState tab={tab} />
            )
          }
          renderItem={({ item }) => (
            <GroupCard
              group={item}
              busy={join.isPending || leave.isPending}
              onOpen={() => router.push(`/groups/${item.slug}`)}
              onJoin={() => join.mutate({ groupId: item.id })}
              onLeave={() => leave.mutate({ groupId: item.id })}
            />
          )}
        />
      </SafeAreaView>
    </>
  );
}

function GroupCard({
  group,
  busy,
  onOpen,
  onJoin,
  onLeave,
}: {
  group: Group;
  busy: boolean;
  onOpen: () => void;
  onJoin: () => void;
  onLeave: () => void;
}) {
  const catColors = CATEGORY_COLORS[group.category] ?? CATEGORY_COLORS.general;

  return (
    <Pressable onPress={onOpen} style={styles.card}>
      <View style={styles.cardHeader}>
        <LinearGradient
          colors={["#fbbf24", "#ef4444"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.avatarEmoji}>{group.iconEmoji || "👥"}</Text>
        </LinearGradient>
        <View style={styles.cardHeaderBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {group.name}
          </Text>
          <View style={styles.cardMeta}>
            <View
              style={[styles.catPill, { backgroundColor: catColors.bg }]}
            >
              <Text style={[styles.catPillText, { color: catColors.fg }]}>
                {group.category}
              </Text>
            </View>
            <Text style={styles.cardMetaText}>
              {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
            </Text>
            {group.postCount > 0 && (
              <Text style={styles.cardMetaText}>· {group.postCount} posts</Text>
            )}
          </View>
        </View>
      </View>

      {group.description && (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {group.description}
        </Text>
      )}

      <View style={styles.cardActions}>
        <Pressable style={styles.btnView} onPress={onOpen}>
          <Text style={styles.btnViewText}>View</Text>
        </Pressable>
        {group.isMember ? (
          <Pressable
            style={styles.btnMember}
            disabled={busy}
            onPress={onLeave}
          >
            <Text style={styles.btnMemberText}>✓ Member</Text>
          </Pressable>
        ) : (
          <Pressable
            style={styles.btnJoin}
            disabled={busy}
            onPress={onJoin}
          >
            <Text style={styles.btnJoinText}>{busy ? "…" : "Join"}</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>
        {tab === "discover" ? "No groups found" : "Not in any groups yet"}
      </Text>
      <Text style={styles.emptySub}>
        {tab === "discover"
          ? "Try a different category or search term."
          : "Tap Discover to find communities."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: colors.primary },
  tabLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.muted,
  },
  tabLabelActive: { color: colors.primary, fontWeight: fontWeight.bold },
  tabBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeActive: { backgroundColor: colors.primary },
  tabBadgeInactive: { backgroundColor: colors.mutedBg },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.muted,
  },
  filterBar: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  chipRow: { flexDirection: "row", gap: spacing[2], flexWrap: "wrap" },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.mutedBg,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: {
    fontSize: fontSize.xs,
    color: colors.muted,
    fontWeight: fontWeight.medium,
  },
  chipTextActive: { color: "#fff" },
  list: { padding: spacing[3], flexGrow: 1 },
  loadingBox: { paddingVertical: spacing[8], alignItems: "center" },
  card: {
    padding: spacing[4],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing[3],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 28 },
  cardHeaderBody: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  cardMeta: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  catPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  catPillText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    textTransform: "capitalize",
  },
  cardMetaText: { fontSize: fontSize.xs, color: colors.muted },
  cardDesc: {
    fontSize: fontSize.sm,
    color: colors.muted,
    lineHeight: 20,
  },
  cardActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  btnView: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: colors.mutedBg,
    alignItems: "center",
  },
  btnViewText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.muted,
  },
  btnJoin: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  btnJoinText: {
    color: "#fff",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  btnMember: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: "#d1fae5",
  },
  btnMemberText: {
    color: "#065f46",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[6],
    marginTop: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing[3] },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  emptySub: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
