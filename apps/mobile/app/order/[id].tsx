import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import {
  useOrder,
  usePayOrder,
  formatOrderPrice,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/orders";
import { Button } from "@/components/ui/Button";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, error } = useOrder(id);
  const pay = usePayOrder(id!);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }
  if (error || !order) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <Ionicons name="alert-circle" size={48} color={colors.destructive} />
        <Text style={styles.errorText}>
          {error?.message ?? "Order not found"}
        </Text>
        <Button variant="ghost" onPress={() => router.back()}>
          Go back
        </Button>
      </SafeAreaView>
    );
  }

  const handlePay = () => {
    if (!order.paymentMethod) return;
    pay.mutate(
      { paymentMethod: order.paymentMethod },
      {
        onSuccess: (res) => {
          if (res.checkoutUrl) {
            Alert.alert(
              "Payment link ready",
              "Complete the payment in your browser.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Open",
                  onPress: () => {
                    Linking.openURL(res.checkoutUrl!);
                  },
                },
              ],
            );
          } else {
            Alert.alert("Payment started", "Check the order status shortly.");
          }
        },
        onError: (err) => Alert.alert("Payment failed", err.message),
      },
    );
  };

  const statusColor = getStatusColor(order.status);

  return (
    <View style={{ flex: 1, backgroundColor: colors.mutedBg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={colors.foreground}
            />
          </Pressable>
          <Text style={styles.title}>Order {order.orderNumber}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Status */}
          <View style={[styles.statusCard, { borderLeftColor: statusColor }]}>
            <Text style={styles.statusLabel}>STATUS</Text>
            <Text style={[styles.statusValue, { color: statusColor }]}>
              {ORDER_STATUS_LABELS[order.status]}
            </Text>
            <Text style={styles.statusDate}>
              Updated {new Date(order.updatedAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Summary */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Summary</Text>
            <Row label="Item" value={formatOrderPrice(order.itemPrice)} />
            {Number(order.shippingFee) > 0 ? (
              <Row
                label="Shipping"
                value={formatOrderPrice(order.shippingFee)}
              />
            ) : null}
            <Row
              label="Platform fee"
              value={formatOrderPrice(order.platformFee)}
            />
            <View style={styles.divider} />
            <Row
              label="Total"
              value={formatOrderPrice(order.totalAmount)}
              bold
            />
          </View>

          {/* Delivery */}
          {order.deliveryAddress ? (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Deliver To</Text>
              <Text style={styles.address}>{order.deliveryAddress}</Text>
              {order.trackingNumber ? (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
                    Tracking
                  </Text>
                  <Text style={styles.tracking}>
                    {order.shippingProvider ?? "Courier"} ·{" "}
                    {order.trackingNumber}
                  </Text>
                </>
              ) : null}
            </View>
          ) : null}

          {/* Payment */}
          {order.paymentMethod ? (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Payment</Text>
              <Text style={styles.paymentMethod}>
                {PAYMENT_METHOD_LABELS[order.paymentMethod]}
              </Text>
              <Text style={styles.paymentStatus}>
                Payment status: {order.paymentStatus}
              </Text>
            </View>
          ) : null}

          {/* Notes */}
          {order.buyerNotes ? (
            <View style={styles.card}>
              <Text style={styles.sectionLabel}>Your Notes</Text>
              <Text style={styles.address}>{order.buyerNotes}</Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Pay CTA if unpaid */}
        {order.status === "pending" || order.status === "payment_pending" ? (
          <SafeAreaView edges={["bottom"]} style={styles.actionBar}>
            <Button
              variant="gold"
              onPress={handlePay}
              loading={pay.isPending}
              fullWidth
            >
              Pay {formatOrderPrice(order.totalAmount)}
            </Button>
          </SafeAreaView>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowLabelBold]}>
        {label}
      </Text>
      <Text style={[styles.rowValue, bold && styles.rowValueBold]}>
        {value}
      </Text>
    </View>
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
  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: 40,
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
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  scroll: {
    padding: spacing[4],
    gap: spacing[3],
  },
  statusCard: {
    padding: spacing[4],
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
  },
  statusLabel: {
    fontSize: fontSize.xs,
    color: colors.muted,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  statusValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    marginTop: 4,
  },
  statusDate: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 4,
  },
  card: {
    padding: spacing[4],
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.muted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingVertical: 3,
  },
  rowLabel: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  rowLabelBold: {
    color: colors.foreground,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },
  rowValue: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  rowValueBold: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  address: {
    fontSize: fontSize.base,
    color: colors.foreground,
    lineHeight: 22,
  },
  tracking: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  paymentMethod: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  paymentStatus: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  actionBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
});
