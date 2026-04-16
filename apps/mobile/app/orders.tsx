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
import {
  useMyOrders,
  formatOrderPrice,
  ORDER_STATUS_LABELS,
  type Order,
} from "@/lib/orders";
import { Button } from "@/components/ui/Button";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

export default function OrdersScreen() {
  const router = useRouter();
  const { data, isLoading, error, refetch, isRefetching } = useMyOrders();
  const orders = data?.data ?? [];

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>My Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <OrderRow
            order={item}
            onPress={() => router.push(`/order/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centerBlock}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : error ? (
            <View style={styles.centerBlock}>
              <Ionicons name="cloud-offline" size={40} color={colors.muted} />
              <Text style={styles.emptyTitle}>Can&apos;t load orders</Text>
              <Text style={styles.emptyText}>{error.message}</Text>
            </View>
          ) : (
            <View style={styles.centerBlock}>
              <Ionicons name="cube-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptyText}>
                Browse the marketplace and tap &quot;Buy now&quot; to place
                your first order.
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

function OrderRow({
  order,
  onPress,
}: {
  order: Order;
  onPress: () => void;
}) {
  const statusColor = getStatusColor(order.status);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.rowTop}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>
            {ORDER_STATUS_LABELS[order.status]}
          </Text>
        </View>
      </View>
      <View style={styles.rowBottom}>
        <Text style={styles.date}>
          {new Date(order.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.total}>
          {formatOrderPrice(order.totalAmount)}
        </Text>
      </View>
    </Pressable>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case "paid":
    case "confirmed":
    case "delivered":
    case "completed":
      return colors.emerald;
    case "shipped":
      return colors.info;
    case "cancelled":
    case "refunded":
      return colors.destructive;
    case "pending":
    case "payment_pending":
      return colors.warning;
    default:
      return colors.muted;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.mutedBg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  list: {
    padding: spacing[3],
    flexGrow: 1,
  },
  row: {
    padding: spacing[4],
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderNumber: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  rowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  date: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  total: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: colors.primary,
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
