// apps/mobile/app/notifications.tsx
/**
 * Notifications tab — infinite-scroll list + mark-all-read + deep link.
 */
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
import { Stack, useRouter } from "expo-router";

import {
  iconForNotificationType,
  routeForNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  type Notification,
} from "@/lib/notifications";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

export default function NotificationsScreen() {
  const router = useRouter();
  const list = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications: Notification[] =
    list.data?.pages.flatMap((p) => p.data) ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  const handleOpen = (n: Notification) => {
    if (!n.isRead) markRead.mutate({ id: n.id });
    const target = routeForNotification(n);
    if (target) router.push(target as never);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Notifications",
          headerTitleStyle: { fontWeight: "700" },
          headerRight: hasUnread
            ? () => (
                <Pressable
                  onPress={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Mark all as read"
                  style={({ pressed }) => [
                    styles.headerBtn,
                    pressed && styles.headerBtnPressed,
                  ]}
                >
                  <Text style={styles.headerBtnText}>
                    {markAllRead.isPending ? "…" : "Mark all read"}
                  </Text>
                </Pressable>
              )
            : undefined,
        }}
      />
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching && !list.isFetchingNextPage}
              onRefresh={list.refetch}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) {
              list.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            list.isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.muted} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            list.isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <EmptyState />
            )
          }
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              onPress={() => handleOpen(item)}
            />
          )}
        />
      </SafeAreaView>
    </>
  );
}

// --- Sub-components ---

function NotificationRow({
  notification,
  onPress,
}: {
  notification: Notification;
  onPress: () => void;
}) {
  const icon = iconForNotificationType(
    notification.type,
  ) as keyof typeof Ionicons.glyphMap;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={notification.title}
      style={({ pressed }) => [
        styles.row,
        !notification.isRead && styles.rowUnread,
        pressed && styles.rowPressed,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          !notification.isRead && styles.iconWrapUnread,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={notification.isRead ? colors.muted : colors.primary}
        />
      </View>
      <View style={styles.body}>
        <Text
          style={[styles.title, !notification.isRead && styles.titleUnread]}
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        {notification.body ? (
          <Text style={styles.bodyText} numberOfLines={2}>
            {notification.body}
          </Text>
        ) : null}
        <Text style={styles.time}>
          {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>
      {!notification.isRead ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptySubtitle}>
        Order updates, messages, and activity will appear here.
      </Text>
    </View>
  );
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: {
    padding: spacing[3],
    flexGrow: 1,
  },
  sep: { height: 8 },
  loadingWrap: {
    paddingVertical: spacing[10],
    alignItems: "center",
  },
  footer: {
    paddingVertical: spacing[4],
    alignItems: "center",
  },
  headerBtn: {
    marginRight: spacing[3],
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
  },
  headerBtnPressed: {
    opacity: 0.6,
  },
  headerBtnText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  rowUnread: {
    borderColor: colors.primary,
    backgroundColor: colors.mutedBg,
  },
  rowPressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: colors.mutedBg,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapUnread: {
    backgroundColor: "#fee2e2",
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  titleUnread: {
    fontWeight: fontWeight.bold,
  },
  bodyText: {
    fontSize: fontSize.xs,
    color: colors.muted,
    lineHeight: 18,
  },
  time: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
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
  },
});
