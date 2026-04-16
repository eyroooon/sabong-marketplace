import React, { useState } from "react";
import {
  KeyboardAvoidingView,
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
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useCreateOrder,
  PAYMENT_METHOD_LABELS,
  formatOrderPrice,
  type PaymentMethod,
} from "@/lib/orders";
import { useListingBySlug, formatPeso } from "@/lib/listings";
import { Button } from "@/components/ui/Button";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

const PAYMENT_METHODS: PaymentMethod[] = [
  "gcash",
  "maya",
  "card",
  "bank_transfer",
  "otc_cash",
];

export default function NewOrderScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: listing, isLoading } = useListingBySlug(slug);

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [buyerNotes, setBuyerNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("gcash");

  const createOrder = useCreateOrder();

  const itemPrice = Number(listing?.price ?? 0);
  const shippingFee = Number(listing?.shippingFee ?? 0);
  const platformFee = Math.round(itemPrice * 0.05);
  const total = itemPrice + shippingFee + platformFee;

  const handleSubmit = () => {
    if (!listing) return;
    if (!deliveryAddress.trim()) {
      Alert.alert(
        "Missing info",
        "Please enter your delivery address.",
      );
      return;
    }
    createOrder.mutate(
      {
        listingId: listing.id,
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod,
        buyerNotes: buyerNotes.trim() || undefined,
      },
      {
        onSuccess: (order) => {
          router.replace(`/order/${order.id}`);
        },
        onError: (err) => {
          Alert.alert("Could not place order", err.message);
        },
      },
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={styles.title}>Review Order</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {isLoading || !listing ? (
            <Text style={styles.muted}>Loading listing…</Text>
          ) : (
            <>
              {/* Item summary */}
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Item</Text>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {listing.title}
                </Text>
                <Text style={styles.itemSub}>
                  {listing.breed ?? ""}
                  {listing.bloodline ? ` · ${listing.bloodline}` : ""}
                </Text>
                <Text style={styles.itemPrice}>{formatPeso(listing.price)}</Text>
              </View>

              {/* Delivery address */}
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Delivery Address</Text>
                <TextInput
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  placeholder="House #, street, barangay, city, province"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  multiline
                />
              </View>

              {/* Payment method */}
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Payment Method</Text>
                <View style={styles.paymentGrid}>
                  {PAYMENT_METHODS.map((m) => {
                    const selected = paymentMethod === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => setPaymentMethod(m)}
                        style={({ pressed }) => [
                          styles.paymentChip,
                          selected && styles.paymentChipSelected,
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.paymentChipText,
                            selected && styles.paymentChipTextSelected,
                          ]}
                        >
                          {PAYMENT_METHOD_LABELS[m]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Notes */}
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Notes to Seller (optional)</Text>
                <TextInput
                  value={buyerNotes}
                  onChangeText={setBuyerNotes}
                  placeholder="e.g. Please pack carefully, call on arrival…"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  multiline
                />
              </View>

              {/* Breakdown */}
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Price Breakdown</Text>
                <PriceRow label="Item" value={formatOrderPrice(String(itemPrice))} />
                {shippingFee > 0 ? (
                  <PriceRow
                    label="Shipping"
                    value={formatOrderPrice(String(shippingFee))}
                  />
                ) : null}
                <PriceRow
                  label="Platform fee (5%)"
                  value={formatOrderPrice(String(platformFee))}
                />
                <View style={styles.divider} />
                <PriceRow
                  label="Total"
                  value={formatOrderPrice(String(total))}
                  bold
                />
              </View>
            </>
          )}
        </ScrollView>

        {/* Action bar */}
        <View style={styles.actionBar}>
          <Button
            variant="gold"
            onPress={handleSubmit}
            loading={createOrder.isPending}
            fullWidth
          >
            Place Order · {formatOrderPrice(String(total))}
          </Button>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function PriceRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceLabel, bold && styles.priceLabelBold]}>
        {label}
      </Text>
      <Text style={[styles.priceValue, bold && styles.priceValueBold]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  scroll: {
    padding: spacing[4],
    gap: spacing[3],
  },
  muted: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: "center",
    paddingVertical: spacing[6],
  },
  card: {
    padding: spacing[4],
    borderRadius: radii.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[2],
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.muted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  itemTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  itemSub: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  itemPrice: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.primary,
    marginTop: 4,
  },
  input: {
    borderRadius: radii.lg,
    backgroundColor: colors.mutedBg,
    padding: spacing[3],
    minHeight: 52,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  paymentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  paymentChip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  paymentChipSelected: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  paymentChipText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    fontWeight: fontWeight.medium,
  },
  paymentChipTextSelected: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  priceLabel: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  priceLabelBold: {
    color: colors.foreground,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },
  priceValue: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  priceValueBold: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  actionBar: {
    padding: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
});
