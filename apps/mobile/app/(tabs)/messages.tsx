import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  useConversations,
  formatRelativeTime,
  type Conversation,
} from "@/lib/messages";
import { useChatSocket } from "@/lib/socket";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
} from "@/lib/theme";

export default function MessagesScreen() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const isAuthLoading = useAuth((s) => s.isLoading);
  const qc = useQueryClient();

  // Wire real-time updates when logged in
  useChatSocket(qc);

  const {
    data,
    isLoading,
    refetch,
    isRefetching,
    error,
  } = useConversations();

  if (!user && !isAuthLoading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Messages</Text>
        </View>
        <View style={styles.centerBlock}>
          <Ionicons
            name="chatbubbles-outline"
            size={52}
            color={colors.muted}
          />
          <Text style={styles.emptyTitle}>Mag-sign in muna</Text>
          <Text style={styles.emptyText}>
            Mag-login para makita ang mga chat mo sa mga seller.
          </Text>
          <Button variant="primary" onPress={() => router.push("/login")}>
            Sign in
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const conversations = data?.data ?? [];

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        {conversations.length > 0 ? (
          <Text style={styles.countText}>
            {conversations.length}{" "}
            {conversations.length === 1 ? "chat" : "chats"}
          </Text>
        ) : null}
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <ConversationRow
            conversation={item}
            onPress={() => router.push(`/chat/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          isLoading || isAuthLoading ? (
            <View style={styles.centerBlock}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.centerBlock}>
              <Ionicons name="cloud-offline" size={40} color={colors.muted} />
              <Text style={styles.emptyTitle}>Can&apos;t load chats</Text>
              <Text style={styles.emptyText}>{error.message}</Text>
            </View>
          ) : (
            <View style={styles.centerBlock}>
              <Ionicons
                name="chatbubbles-outline"
                size={48}
                color={colors.muted}
              />
              <Text style={styles.emptyTitle}>Wala pang chat</Text>
              <Text style={styles.emptyText}>
                Mag-browse ng listing at pindutin ang &quot;Message&quot; para
                simulan ang usapan.
              </Text>
              <Button variant="outline" onPress={() => router.push("/browse")}>
                Browse listings
              </Button>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: Conversation;
  onPress: () => void;
}) {
  const other = conversation.otherUser;
  const name = other
    ? `${other.firstName} ${other.lastName}`.trim() || "User"
    : "User";
  const hasUnread = (conversation.unreadCount ?? 0) > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: colors.mutedBg },
      ]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text
            style={[styles.rowName, hasUnread && styles.rowNameBold]}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text style={styles.rowTime}>
            {formatRelativeTime(conversation.lastMessageAt)}
          </Text>
        </View>

        <View style={styles.rowBottom}>
          <Text
            style={[styles.rowPreview, hasUnread && styles.rowPreviewUnread]}
            numberOfLines={1}
          >
            {conversation.lastMessagePreview ?? "…"}
          </Text>
          {hasUnread ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {conversation.unreadCount > 9
                  ? "9+"
                  : String(conversation.unreadCount)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  list: {
    flexGrow: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  rowBody: {
    flex: 1,
    gap: 3,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 8,
  },
  rowName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    flex: 1,
  },
  rowNameBold: {
    fontWeight: fontWeight.bold,
  },
  rowTime: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowPreview: {
    fontSize: fontSize.sm,
    color: colors.muted,
    flex: 1,
  },
  rowPreviewUnread: {
    color: colors.foreground,
    fontWeight: fontWeight.medium,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  centerBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[10],
    gap: 12,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    textAlign: "center",
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
});
