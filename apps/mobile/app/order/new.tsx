import React, { useState } from "react";
import {
  Image,
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

const PAYMENT_METHODS: {
  value: PaymentMethod;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
  { value: "gcash", icon: "phone-portrait", color: "#0051A0" },
  { value: "maya", icon: "phone-portrait", color: "#00B14F" },
  { value: "card", icon: "card", color: "#6B7280" },
  { value: "bank_transfer", icon: "business", color: "#4B5563" },
  { value: "otc_cash", icon: "cash", color: "#059669" },
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

  const primaryImage =
    listing?.images?.find((i) => i.isPrimary)?.url ??
    listing?.images?.[0]?.url ??
    null;

  const handleSubmit = () => {
    if (!listing) return;
    if (!deliveryAddress.trim()) {
      Alert.alert("Missing info", "Please enter your delivery address.");
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
      style={{ flex: 1, backgroundColor: colors.mutedBg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={26} color={colors.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>Review Order</Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isLoading || !listing ? (
            <Text style={styles.muted}>Loading listing…</Text>
          ) : (
            <>
              {/* Item summary card */}
              <View style={styles.itemCard}>
                <View style={styles.itemImageWrap}>
                  {primaryImage ? (
                    <Image
                      source={{ uri: primaryImage }}
                      style={styles.itemImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[styles.itemImage, styles.itemImagePlaceholder]}
                    >
                      <Ionicons
                        name="image-outline"
                        size={32}
                        color={colors.muted}
                      />
                    </View>
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {listing.title}
                  </Text>
                  {listing.breed ? (
                    <Text style={styles.itemBreed}>
                      {listing.breed}
                      {listing.bloodline ? ` · ${listing.bloodline}` : ""}
                    </Text>
                  ) : null}
                  <Text style={styles.itemPrice}>
                    {formatPeso(listing.price)}
                  </Text>
                </View>
              </View>

              {/* Delivery address */}
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.sectionTitle}>Delivery Address</Text>
                </View>
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
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="card-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.sectionTitle}>Payment Method</Text>
                </View>
                <View style={styles.paymentList}>
                  {PAYMENT_METHODS.map((m) => {
                    const selected = paymentMethod === m.value;
                    return (
                      <Pressable
                        key={m.value}
                        onPress={() => setPaymentMethod(m.value)}
                        style={({ pressed }) => [
                          styles.paymentOption,
                          selected && styles.paymentOptionSelected,
                          pressed && { opacity: 0.9 },
                        ]}
                      >
                        <View
                          style={[
                            styles.paymentIconBox,
                            {
                              backgroundColor: selected
                                ? m.color + "20"
                                : colors.mutedBg,
                            },
                          ]}
                        >
                          <Ionicons
                            name={m.icon}
                            size={20}
                            color={selected ? m.color : colors.muted}
                          />
                        </View>
                        <Text
                          style={[
                            styles.paymentLabel,
                            selected && styles.paymentLabelSelected,
                          ]}
                        >
                          {PAYMENT_METHOD_LABELS[m.value]}
                        </Text>
                        <View
                          style={[
                            styles.radio,
                            selected && styles.radioSelected,
                          ]}
                        >
                          {selected ? (
                            <View style={styles.radioInner} />
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Notes */}
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.sectionTitle}>
                    Notes to Seller{" "}
                    <Text style={styles.optional}>(optional)</Text>
                  </Text>
                </View>
                <TextInput
                  value={buyerNotes}
                  onChangeText={setBuyerNotes}
                  placeholder="e.g. Please pack carefully, call on arrival…"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                  multiline
                />
              </View>

              {/* Price breakdown */}
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="receipt-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.sectionTitle}>Price Breakdown</Text>
                </View>
                <PriceRow
                  label="Item"
                  value={formatOrderPrice(String(itemPrice))}
                />
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

              {/* Escrow assurance badge */}
              <View style={styles.assuranceCard}>
                <Ionicons
                  name="shield-checkmark"
                  size={20}
                  color={colors.emerald}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.assuranceTitle}>
                    Escrow-Protected Payment
                  </Text>
                  <Text style={styles.assuranceText}>
                    Your money is held safely until you confirm delivery. No
                    scams, no hassle.
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Sticky action bar */}
        <SafeAreaView edges={["bottom"]} style={styles.actionBar}>
          <View style={styles.actionBarInner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionBarLabel}>Total</Text>
              <Text style={styles.actionBarTotal}>
                {formatOrderPrice(String(total))}
              </Text>
            </View>
            <Button
              variant="gold"
              onPress={handleSubmit}
              loading={createOrder.isPending}
              style={{ flex: 1.4 }}
            >
              Place Order
            </Button>
          </View>
        </SafeAreaView>
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  scroll: {
    padding: spacing[3],
    paddingBottom: 120,
    gap: spacing[3],
  },
  muted: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: "center",
    paddingVertical: spacing[6],
  },
  itemCard: {
    flexDirection: "row",
    gap: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemImageWrap: {
    width: 88,
    height: 88,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.mutedBg,
  },
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 3,
  },
  itemTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    lineHeight: 20,
  },
  itemBreed: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  itemPrice: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.primary,
    marginTop: 2,
  },
  card: {
    padding: spacing[4],
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[2],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing[2],
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  optional: {
    color: colors.muted,
    fontWeight: fontWeight.normal,
  },
  input: {
    borderRadius: radii.lg,
    backgroundColor: colors.mutedBg,
    padding: spacing[3],
    minHeight: 56,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  paymentList: {
    gap: 6,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: "rgba(220,38,38,0.04)",
  },
  paymentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentLabel: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.foreground,
    fontWeight: fontWeight.medium,
  },
  paymentLabelSelected: {
    fontWeight: fontWeight.bold,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingVertical: 3,
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
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  assuranceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing[4],
    borderRadius: radii.xl,
    backgroundColor: "rgba(16,185,129,0.08)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },
  assuranceTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.emerald,
  },
  assuranceText: {
    fontSize: fontSize.xs,
    color: colors.foreground,
    lineHeight: 16,
    marginTop: 2,
  },
  actionBar: {
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
});
