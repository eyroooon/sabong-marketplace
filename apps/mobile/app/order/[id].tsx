import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import {
  useOrder,
  usePayOrder,
  useAcceptDelivery,
  useDisputeOrder,
  formatOrderPrice,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
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

// Visual status tracker — each step maps to the canonical order flow.
// Cancelled/refunded orders get their own visual treatment.
const STATUS_STEPS: { key: OrderStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "payment_pending", label: "Paid", icon: "card" },
  { key: "confirmed", label: "Confirmed", icon: "checkmark-circle" },
  { key: "shipped", label: "Shipped", icon: "airplane" },
  { key: "delivered", label: "Delivered", icon: "cube" },
  { key: "completed", label: "Completed", icon: "trophy" },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  pending: 0,
  payment_pending: 0,
  paid: 1,
  confirmed: 2,
  shipped: 3,
  delivered: 4,
  completed: 5,
  cancelled: -1,
  refunded: -1,
};

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, error } = useOrder(id);
  const pay = usePayOrder(id!);
  const accept = useAcceptDelivery(id!);
  const dispute = useDisputeOrder(id!);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

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

  const handleAccept = () => {
    Alert.alert(
      "Accept delivery",
      `Release ${formatOrderPrice(order?.totalAmount ?? "0")} to the seller?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Release",
          style: "default",
          onPress: () =>
            accept.mutate(undefined, {
              onError: (err) =>
                Alert.alert("Couldn't accept", err.message),
            }),
        },
      ],
    );
  };

  const handleSubmitDispute = () => {
    const reason = disputeReason.trim();
    if (!reason) {
      Alert.alert("Reason required", "Please describe what happened.");
      return;
    }
    dispute.mutate(
      { reason },
      {
        onSuccess: () => {
          setDisputeOpen(false);
          setDisputeReason("");
          Alert.alert(
            "Dispute submitted",
            "An admin will review your report within 24 hours.",
          );
        },
        onError: (err) => Alert.alert("Failed to open dispute", err.message),
      },
    );
  };

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
                  onPress: () => Linking.openURL(res.checkoutUrl!),
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

  const listing = (order as any).listing as
    | { title: string; breed: string | null; bloodline: string | null }
    | undefined;
  const listingImage = (order as any).listingImage as string | undefined;

  const currentStep = STATUS_ORDER[order.status] ?? 0;
  const isCancelled = order.status === "cancelled" || order.status === "refunded";

  return (
    <View style={{ flex: 1, backgroundColor: colors.mutedBg }}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero with listing image */}
        <View style={styles.hero}>
          {listingImage ? (
            <Image
              source={{ uri: listingImage }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: colors.inkSoft },
              ]}
            />
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.2)", "transparent", "rgba(0,0,0,0.85)"]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />

          <SafeAreaView edges={["top"]} style={styles.heroHeader}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backBtn,
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={22} color={colors.white} />
            </Pressable>
            <View style={styles.orderNumPill}>
              <Text style={styles.orderNumText}>#{order.orderNumber}</Text>
            </View>
            <View style={{ width: 36 }} />
          </SafeAreaView>

          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle} numberOfLines={2}>
              {listing?.title ?? "Your order"}
            </Text>
            {listing?.breed ? (
              <Text style={styles.heroBreed}>
                {listing.breed}
                {listing.bloodline ? ` · ${listing.bloodline}` : ""}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Status tracker */}
        {isCancelled ? (
          <View style={styles.cancelBanner}>
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.destructive}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.cancelTitle}>
                Order {order.status === "refunded" ? "refunded" : "cancelled"}
              </Text>
              {order.cancelReason ? (
                <Text style={styles.cancelReason}>{order.cancelReason}</Text>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.trackerCard}>
            <Text style={styles.sectionLabel}>Order Progress</Text>
            <View style={styles.trackerRow}>
              {STATUS_STEPS.map((step, i) => {
                const active = i <= currentStep;
                const isCurrent = i === currentStep;
                return (
                  <React.Fragment key={step.key}>
                    <View style={styles.stepCol}>
                      <View
                        style={[
                          styles.stepDot,
                          active && styles.stepDotActive,
                          isCurrent && styles.stepDotCurrent,
                        ]}
                      >
                        <Ionicons
                          name={active ? "checkmark" : step.icon}
                          size={14}
                          color={active ? colors.white : colors.muted}
                        />
                      </View>
                      <Text
                        style={[
                          styles.stepLabel,
                          active && styles.stepLabelActive,
                          isCurrent && styles.stepLabelCurrent,
                        ]}
                      >
                        {step.label}
                      </Text>
                    </View>
                    {i < STATUS_STEPS.length - 1 ? (
                      <View
                        style={[
                          styles.stepConnector,
                          i < currentStep && styles.stepConnectorActive,
                        ]}
                      />
                    ) : null}
                  </React.Fragment>
                );
              })}
            </View>

            <View style={styles.currentStatusRow}>
              <Ionicons
                name={getStatusIcon(order.status)}
                size={16}
                color={getStatusColor(order.status)}
              />
              <Text
                style={[
                  styles.currentStatusText,
                  { color: getStatusColor(order.status) },
                ]}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </Text>
              <Text style={styles.currentStatusDate}>
                · Updated{" "}
                {new Date(order.updatedAt).toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Escrow banner */}
        {order.escrowStatus && order.escrowStatus !== "none" ? (
          <View
            style={[
              styles.escrowCard,
              order.escrowStatus === "held" && styles.escrowHeld,
              order.escrowStatus === "released" && styles.escrowReleased,
              order.escrowStatus === "disputed" && styles.escrowDisputed,
              order.escrowStatus === "refunded" && styles.escrowRefunded,
            ]}
          >
            <View style={styles.escrowIcon}>
              <Ionicons
                name={
                  order.escrowStatus === "released"
                    ? "checkmark-circle"
                    : order.escrowStatus === "disputed"
                      ? "alert-circle"
                      : order.escrowStatus === "refunded"
                        ? "return-down-back"
                        : "lock-closed"
                }
                size={18}
                color={
                  order.escrowStatus === "held"
                    ? "#B45309"
                    : order.escrowStatus === "released"
                      ? "#047857"
                      : order.escrowStatus === "disputed"
                        ? colors.destructive
                        : colors.muted
                }
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.escrowTitle}>
                {order.escrowStatus === "held"
                  ? `Escrow: ${formatOrderPrice(order.totalAmount)} held safely`
                  : order.escrowStatus === "released"
                    ? `Payment released — ${formatOrderPrice(order.totalAmount)}`
                    : order.escrowStatus === "disputed"
                      ? "Under dispute — admin is reviewing"
                      : "Payment refunded"}
              </Text>
              <Text style={styles.escrowSub}>
                {order.escrowStatus === "held"
                  ? "Ang bayad mo ay safe hanggang matanggap mo ang manok."
                  : order.escrowStatus === "released"
                    ? "Transaction complete."
                    : order.escrowStatus === "disputed"
                      ? "A decision will be made within 24 hours."
                      : "Funds were returned."}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Dispute context (buyer's note) when disputed */}
        {order.escrowStatus === "disputed" && order.buyerNotes ? (
          <View style={styles.disputeContextCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="warning" size={16} color={colors.destructive} />
              <Text style={[styles.sectionLabel, { color: colors.destructive }]}>
                Dispute Details
              </Text>
            </View>
            <Text style={styles.address}>{order.buyerNotes}</Text>
          </View>
        ) : null}

        {/* Price breakdown */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Price Breakdown</Text>
          <Row label="Item price" value={formatOrderPrice(order.itemPrice)} />
          {Number(order.shippingFee) > 0 ? (
            <Row
              label="Shipping"
              value={formatOrderPrice(order.shippingFee)}
            />
          ) : null}
          <Row
            label="Platform fee (5%)"
            value={formatOrderPrice(order.platformFee)}
          />
          <View style={styles.priceDivider} />
          <Row
            label="Total"
            value={formatOrderPrice(order.totalAmount)}
            bold
          />
        </View>

        {/* Delivery */}
        {order.deliveryAddress ? (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={colors.muted}
              />
              <Text style={styles.sectionLabel}>Deliver To</Text>
            </View>
            <Text style={styles.address}>{order.deliveryAddress}</Text>
            {order.trackingNumber ? (
              <View style={styles.trackingPill}>
                <Ionicons name="airplane" size={12} color={colors.info} />
                <Text style={styles.trackingText}>
                  {order.shippingProvider ?? "Courier"} ·{" "}
                  {order.trackingNumber}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Payment */}
        {order.paymentMethod ? (
          <View style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="card-outline" size={16} color={colors.muted} />
              <Text style={styles.sectionLabel}>Payment</Text>
            </View>
            <View style={styles.paymentRow}>
              <View style={styles.paymentIcon}>
                <Ionicons
                  name={getPaymentIcon(order.paymentMethod)}
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentMethod}>
                  {PAYMENT_METHOD_LABELS[order.paymentMethod]}
                </Text>
                <Text style={styles.paymentStatus}>
                  {order.paymentStatus === "paid"
                    ? "✓ Payment received"
                    : `Status: ${order.paymentStatus.replace("_", " ")}`}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Notes */}
        {order.buyerNotes ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Your Notes</Text>
            <Text style={styles.address}>{order.buyerNotes}</Text>
          </View>
        ) : null}

        {/* Seller notes (if any) */}
        {order.sellerNotes ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Seller Notes</Text>
            <Text style={styles.address}>{order.sellerNotes}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky action bar */}
      {order.status === "pending" || order.status === "payment_pending" ? (
        <SafeAreaView edges={["bottom"]} style={styles.actionBarWrap}>
          <View style={styles.actionBarInner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionBarLabel}>Total</Text>
              <Text style={styles.actionBarTotal}>
                {formatOrderPrice(order.totalAmount)}
              </Text>
            </View>
            <Button
              variant="gold"
              onPress={handlePay}
              loading={pay.isPending}
              style={{ flex: 1.4 }}
            >
              Pay Now
            </Button>
          </View>
        </SafeAreaView>
      ) : order.status === "delivered" && order.escrowStatus === "held" ? (
        <SafeAreaView edges={["bottom"]} style={styles.actionBarWrap}>
          <View style={styles.actionBarInner}>
            <Pressable
              onPress={() => setDisputeOpen(true)}
              disabled={dispute.isPending}
              style={({ pressed }) => [
                styles.disputeBtn,
                pressed && { opacity: 0.75 },
                dispute.isPending && { opacity: 0.5 },
              ]}
            >
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color={colors.destructive}
              />
              <Text style={styles.disputeBtnText}>Report</Text>
            </Pressable>
            <Pressable
              onPress={handleAccept}
              disabled={accept.isPending}
              style={({ pressed }) => [
                styles.acceptBtn,
                pressed && { opacity: 0.85 },
                accept.isPending && { opacity: 0.5 },
              ]}
            >
              {accept.isPending ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.white}
                  />
                  <Text style={styles.acceptBtnText}>
                    Accept &amp; Release {formatOrderPrice(order.totalAmount)}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </SafeAreaView>
      ) : null}

      {/* Dispute modal */}
      <Modal
        visible={disputeOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDisputeOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report a Problem</Text>
              <Pressable
                onPress={() => setDisputeOpen(false)}
                hitSlop={10}
              >
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>
            <Text style={styles.modalHelp}>
              Escrow stays held until an admin reviews. Usually within 24 hours.
            </Text>
            <TextInput
              value={disputeReason}
              onChangeText={setDisputeReason}
              placeholder="What happened? e.g. bird arrived injured, not as described…"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              maxLength={1000}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setDisputeOpen(false)}
                style={({ pressed }) => [
                  styles.modalCancel,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmitDispute}
                disabled={dispute.isPending || !disputeReason.trim()}
                style={({ pressed }) => [
                  styles.modalSubmit,
                  (dispute.isPending || !disputeReason.trim()) && {
                    opacity: 0.5,
                  },
                  pressed && { opacity: 0.85 },
                ]}
              >
                {dispute.isPending ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit Dispute</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

function getStatusIcon(status: OrderStatus): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case "paid":
    case "confirmed":
      return "checkmark-circle";
    case "shipped":
      return "airplane";
    case "delivered":
      return "cube";
    case "completed":
      return "trophy";
    case "cancelled":
    case "refunded":
      return "close-circle";
    case "pending":
    case "payment_pending":
      return "time";
    default:
      return "ellipse";
  }
}

function getPaymentIcon(
  method: string,
): keyof typeof Ionicons.glyphMap {
  switch (method) {
    case "gcash":
    case "maya":
      return "phone-portrait";
    case "card":
      return "card";
    case "bank_transfer":
      return "business";
    case "otc_cash":
      return "cash";
    default:
      return "wallet";
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
  hero: {
    height: 240,
    backgroundColor: colors.ink,
    position: "relative",
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingTop: spacing[2],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  orderNumPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  orderNumText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: 0.5,
  },
  heroBottom: {
    position: "absolute",
    bottom: spacing[4],
    left: spacing[4],
    right: spacing[4],
  },
  heroTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: colors.white,
    lineHeight: 32,
  },
  heroBreed: {
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
    fontWeight: fontWeight.semibold,
  },
  card: {
    padding: spacing[4],
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    marginHorizontal: spacing[3],
    marginTop: spacing[3],
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.muted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  trackerCard: {
    padding: spacing[4],
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing[3],
    marginTop: -30,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 4 },
    }),
  },
  trackerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 4,
  },
  stepCol: {
    alignItems: "center",
    width: 52,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.mutedBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.border,
  },
  stepDotActive: {
    backgroundColor: colors.emerald,
    borderColor: colors.emerald,
  },
  stepDotCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepLabel: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 6,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
  },
  stepLabelActive: {
    color: colors.foreground,
  },
  stepLabelCurrent: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginTop: 15,
  },
  stepConnectorActive: {
    backgroundColor: colors.emerald,
  },
  currentStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexWrap: "wrap",
  },
  currentStatusText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  currentStatusDate: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  cancelBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing[4],
    borderRadius: radii.xl,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    marginHorizontal: spacing[3],
    marginTop: -30,
  },
  cancelTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.destructive,
  },
  cancelReason: {
    fontSize: fontSize.sm,
    color: colors.destructive,
    marginTop: 2,
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
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.primary,
  },
  priceDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  address: {
    fontSize: fontSize.base,
    color: colors.foreground,
    lineHeight: 22,
  },
  trackingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: "rgba(59,130,246,0.1)",
    marginTop: 8,
    alignSelf: "flex-start",
  },
  trackingText: {
    fontSize: fontSize.xs,
    color: colors.info,
    fontWeight: fontWeight.semibold,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(220,38,38,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  paymentMethod: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  paymentStatus: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  actionBarWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 10 },
    }),
  },
  actionBarInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  actionBarLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  actionBarTotal: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.primary,
    marginTop: 2,
  },

  // Escrow banner
  escrowCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: spacing[4],
    borderRadius: radii.xl,
    marginHorizontal: spacing[3],
    marginTop: spacing[3],
    borderWidth: 1,
  },
  escrowHeld: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FCD34D",
  },
  escrowReleased: {
    backgroundColor: "#D1FAE5",
    borderColor: "#6EE7B7",
  },
  escrowDisputed: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
  },
  escrowRefunded: {
    backgroundColor: "#F3F4F6",
    borderColor: "#D1D5DB",
  },
  escrowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  escrowTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  escrowSub: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 3,
  },

  // Dispute context card
  disputeContextCard: {
    padding: spacing[4],
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    marginHorizontal: spacing[3],
    marginTop: spacing[3],
  },

  // Accept / Dispute sticky bar
  acceptBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.emerald,
    paddingVertical: 14,
    borderRadius: radii.full,
  },
  acceptBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    color: colors.white,
  },
  disputeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: colors.white,
  },
  disputeBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.destructive,
  },

  // Dispute modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing[4],
    paddingBottom: spacing[6],
    gap: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: colors.foreground,
  },
  modalHelp: {
    fontSize: fontSize.sm,
    color: colors.muted,
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  modalSubmit: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: radii.full,
    backgroundColor: colors.destructive,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    color: colors.white,
  },
});
