import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
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
  type OrderStatus,
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
          <OrderCard
            order={item}
            onPress={() => router.push(`/order/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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

function OrderCard({
  order,
  onPress,
}: {
  order: Order;
  onPress: () => void;
}) {
  const statusColor = getStatusColor(order.status);
  const title = order.listing?.title || "Listing";
  const breed = order.listing?.breed
    ? `${order.listing.breed}${order.listing.bloodline ? ` · ${order.listing.bloodline}` : ""}`
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
      ]}
    >
      {/* Top row — image + title + status pill */}
      <View style={styles.topRow}>
        <View style={styles.imageWrap}>
          {order.listingImage ? (
            <Image
              source={{ uri: order.listingImage }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={24} color={colors.muted} />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.listingTitle} numberOfLines={2}>
            {title}
          </Text>
          {breed ? (
            <Text style={styles.breedText} numberOfLines={1}>
              {breed}
            </Text>
          ) : null}
          <Text style={styles.orderNum}>#{order.orderNumber}</Text>
        </View>

        <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>
            {ORDER_STATUS_LABELS[order.status]}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom row — date + total + CTA */}
      <View style={styles.bottomRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.dateLabel}>Placed</Text>
          <Text style={styles.dateValue}>
            {new Date(order.createdAt).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", flex: 1 }}>
          <Text style={styles.dateLabel}>Total</Text>
          <Text style={styles.total}>{formatOrderPrice(order.totalAmount)}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.muted}
          style={{ marginLeft: 6 }}
        />
      </View>
    </Pressable>
  );
}

function getStatusColor(status: OrderStatus): string {
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
  card: {
    padding: spacing[3],
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 1 },
    }),
  },
  topRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.mutedBg,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  listingTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    lineHeight: 19,
  },
  breedText: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  orderNum: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[3],
    marginHorizontal: -spacing[3],
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  dateValue: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  total: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: colors.primary,
    marginTop: 2,
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
