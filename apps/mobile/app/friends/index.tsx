/**
 * Friends screen — 4 tabs: Friends, Requests (incoming), Sent (outgoing),
 * Discover (suggestions). Actions: Accept, Decline, Remove, Add Friend.
 */
import React, { useMemo, useState } from "react";
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
import { useRouter, Stack } from "expo-router";
import {
  useFriends,
  useIncomingRequests,
  useOutgoingRequests,
  useFriendSuggestions,
  useSendFriendRequest,
  useAcceptFriend,
  useDeclineFriend,
  useRemoveFriend,
  type FriendUser,
} from "@/lib/friends";
import { colors, fontSize, fontWeight, radii, spacing } from "@/lib/theme";

type Tab = "friends" | "incoming" | "outgoing" | "suggestions";

const TAB_LABELS: Record<Tab, string> = {
  friends: "Friends",
  incoming: "Requests",
  outgoing: "Sent",
  suggestions: "Discover",
};

export default function FriendsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("friends");

  const friends = useFriends();
  const incoming = useIncomingRequests();
  const outgoing = useOutgoingRequests();
  const suggestions = useFriendSuggestions();

  const sendRequest = useSendFriendRequest();
  const acceptFriend = useAcceptFriend();
  const declineFriend = useDeclineFriend();
  const removeFriend = useRemoveFriend();

  const queries = useMemo(
    () => ({
      friends,
      incoming,
      outgoing,
      suggestions,
    }),
    [friends, incoming, outgoing, suggestions],
  );

  const active = queries[tab];
  const data = active.data ?? [];
  const refreshing = active.isRefetching;

  const counts = {
    friends: friends.data?.length ?? 0,
    incoming: incoming.data?.length ?? 0,
    outgoing: outgoing.data?.length ?? 0,
    suggestions: suggestions.data?.length ?? 0,
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Friends",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        {/* Tab bar */}
        <View style={styles.tabBar}>
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  tab === t && styles.tabLabelActive,
                ]}
              >
                {TAB_LABELS[t]}
              </Text>
              {counts[t] > 0 && (
                <View
                  style={[
                    styles.tabBadge,
                    tab === t
                      ? styles.tabBadgeActive
                      : styles.tabBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      tab === t && { color: "#fff" },
                    ]}
                  >
                    {counts[t]}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <FlatList
          data={data}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
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
            <UserCard
              user={item}
              tab={tab}
              busy={
                sendRequest.isPending ||
                acceptFriend.isPending ||
                declineFriend.isPending ||
                removeFriend.isPending
              }
              onPressCard={() => {
                // Seller profile route not yet implemented on mobile
              }}
              onMessage={() => router.push("/messages")}
              onSendRequest={() =>
                sendRequest.mutate({ userId: item.id })
              }
              onAccept={() => acceptFriend.mutate({ userId: item.id })}
              onDecline={() => declineFriend.mutate({ userId: item.id })}
              onRemove={() => removeFriend.mutate({ userId: item.id })}
            />
          )}
        />
      </SafeAreaView>
    </>
  );
}

function UserCard({
  user,
  tab,
  busy,
  onPressCard,
  onMessage,
  onSendRequest,
  onAccept,
  onDecline,
  onRemove,
}: {
  user: FriendUser;
  tab: Tab;
  busy: boolean;
  onPressCard: () => void;
  onMessage: () => void;
  onSendRequest: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onRemove: () => void;
}) {
  const name =
    user.displayName || `${user.firstName} ${user.lastName}`.trim();
  const initial = (name[0] || "?").toUpperCase();
  const location = user.city
    ? `${user.city}${user.province ? `, ${user.province}` : ""}`
    : user.province || "";

  return (
    <Pressable onPress={onPressCard} style={styles.card}>
      <LinearGradient
        colors={["#fbbf24", "#ef4444"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.avatar}
      >
        {user.avatarUrl ? (
          <Image
            source={{ uri: user.avatarUrl }}
            style={styles.avatarImage}
          />
        ) : (
          <Text style={styles.avatarText}>{initial}</Text>
        )}
      </LinearGradient>

      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {user.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={9} color="#fff" />
            </View>
          )}
        </View>
        {!!location && (
          <Text style={styles.subtext} numberOfLines={1}>
            📍 {location}
          </Text>
        )}
        {tab === "friends" && user.friendsSince && (
          <Text style={styles.hint}>
            Since {new Date(user.friendsSince).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        {tab === "friends" && (
          <>
            <Pressable style={styles.btnMessage} onPress={onMessage}>
              <Text style={styles.btnMessageText}>Message</Text>
            </Pressable>
            <Pressable
              style={styles.btnMuted}
              disabled={busy}
              onPress={onRemove}
            >
              <Text style={styles.btnMutedText}>Remove</Text>
            </Pressable>
          </>
        )}

        {tab === "incoming" && (
          <>
            <Pressable
              style={styles.btnPrimary}
              disabled={busy}
              onPress={onAccept}
            >
              <Text style={styles.btnPrimaryText}>Accept</Text>
            </Pressable>
            <Pressable
              style={styles.btnMuted}
              disabled={busy}
              onPress={onDecline}
            >
              <Text style={styles.btnMutedText}>Decline</Text>
            </Pressable>
          </>
        )}

        {tab === "outgoing" && (
          <View style={styles.pendingPill}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        )}

        {tab === "suggestions" && (
          <Pressable
            style={styles.btnPrimary}
            disabled={busy}
            onPress={onSendRequest}
          >
            <Text style={styles.btnPrimaryText}>+ Add</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { title: string; subtitle: string }> = {
    friends: {
      title: "No friends yet",
      subtitle:
        "Discover sabungeros and send friend requests to build your network.",
    },
    incoming: {
      title: "No pending requests",
      subtitle: "When someone adds you, it'll show up here.",
    },
    outgoing: {
      title: "No sent requests",
      subtitle: "Tap Discover to find sabungeros to add.",
    },
    suggestions: {
      title: "No suggestions right now",
      subtitle: "More sabungeros join every day — check back later.",
    },
  };
  const m = messages[tab];
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>{m.title}</Text>
      <Text style={styles.emptySubtitle}>{m.subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.muted,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeActive: {
    backgroundColor: colors.primary,
  },
  tabBadgeInactive: {
    backgroundColor: colors.mutedBg,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.muted,
  },
  list: {
    padding: spacing[3],
    flexGrow: 1,
  },
  loadingBox: {
    paddingVertical: spacing[8],
    alignItems: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    color: "#fff",
    fontWeight: fontWeight.black,
    fontSize: fontSize.base,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  verifiedBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  subtext: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  hint: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  btnPrimary: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  btnMessage: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: "#fee2e2",
  },
  btnMessageText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  btnMuted: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: colors.mutedBg,
  },
  btnMutedText: {
    color: colors.muted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  pendingPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: "#fef3c7",
  },
  pendingText: {
    color: "#b45309",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[6],
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing[3],
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
