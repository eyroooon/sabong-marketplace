import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  formatLocation,
  formatPeso,
  useListingBySlug,
} from "@/lib/listings";
import { useStartConversation } from "@/lib/messages";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";

export default function ListingDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const { data, isLoading, error } = useListingBySlug(slug);
  const startConversation = useStartConversation();
  const [imageIndex, setImageIndex] = useState(0);
  const galleryRef = useRef<FlatList>(null);
  const { width: SCREEN_W } = useWindowDimensions();
  const dynamicStyles = useMemo(
    () => ({
      gallery: { width: SCREEN_W, height: SCREEN_W },
      galleryImage: { width: SCREEN_W, height: SCREEN_W },
    }),
    [SCREEN_W],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <Ionicons name="alert-circle" size={48} color={colors.destructive} />
        <Text style={styles.errorTitle}>
          {error?.message ?? "Listing not found"}
        </Text>
        <Button variant="ghost" onPress={() => router.back()}>
          Go back
        </Button>
      </SafeAreaView>
    );
  }

  const location = formatLocation(data.locationProvince, data.locationCity);
  const images = data.images ?? [];
  const primary = images.find((i) => i.isPrimary) ?? images[0];
  const galleryImages = images.length > 0 ? images : primary ? [primary] : [];

  const requireSignIn = (action: string): boolean => {
    if (user) return false;
    Alert.alert("Sign in required", `Mag-login para ${action}.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Sign in", onPress: () => router.push("/login") },
    ]);
    return true;
  };

  const handleContactSeller = () => {
    if (requireSignIn("makausap ang seller")) return;
    if (!data || !data.seller) return;
    if (data.seller.userId === user!.id) {
      Alert.alert(
        "That's your listing",
        "Hindi mo kailangan kausapin ang sarili mo.",
      );
      return;
    }
    startConversation.mutate(
      {
        sellerId: data.seller.userId,
        listingId: data.id,
        message: `Hi! Interesado ako sa "${data.title}".`,
      },
      {
        onSuccess: (res) => router.push(`/chat/${res.conversationId}`),
        onError: (err) =>
          Alert.alert("Could not start chat", err.message),
      },
    );
  };

  const handleBuyNow = () => {
    if (requireSignIn("bumili")) return;
    if (!data) return;
    if (data.seller?.userId === user!.id) {
      Alert.alert(
        "That's your listing",
        "Hindi ka pwede bumili ng sarili mong listing.",
      );
      return;
    }
    router.push({ pathname: "/order/new", params: { slug: data.slug } });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gallery */}
        <View style={[styles.gallery, dynamicStyles.gallery]}>
          {galleryImages.length > 0 ? (
            <FlatList
              ref={galleryRef}
              data={galleryImages}
              keyExtractor={(img) => img.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_W,
                );
                setImageIndex(idx);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.url }}
                  style={dynamicStyles.galleryImage}
                  resizeMode="cover"
                />
              )}
            />
          ) : (
            <View
              style={[styles.galleryPlaceholder, dynamicStyles.galleryImage]}
            >
              <Ionicons name="image-outline" size={64} color={colors.muted} />
            </View>
          )}

          {galleryImages.length > 1 ? (
            <View style={styles.dots}>
              {galleryImages.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === imageIndex && styles.dotActive]}
                />
              ))}
            </View>
          ) : null}

          {/* Back button overlay */}
          <SafeAreaView
            edges={["top"]}
            style={styles.backOverlay}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={22} color={colors.white} />
            </Pressable>

            {data.isFeatured ? (
              <View style={styles.featuredTag}>
                <Ionicons name="star" size={10} color={colors.white} />
                <Text style={styles.featuredTagText}>Featured</Text>
              </View>
            ) : null}
          </SafeAreaView>
        </View>

        {/* Main info */}
        <View style={styles.body}>
          <Text style={styles.price}>{formatPeso(data.price)}</Text>
          {data.priceType === "negotiable" ? (
            <Text style={styles.priceNote}>· Negotiable</Text>
          ) : null}

          <Text style={styles.title}>{data.title}</Text>

          {location ? (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.muted}
              />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          ) : null}

          {/* Seller card */}
          {data.seller ? (
            <View style={styles.sellerCard}>
              <View style={styles.sellerIcon}>
                <Ionicons name="person" size={20} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.sellerNameRow}>
                  <Text style={styles.sellerName}>
                    {data.seller.farmName || "Seller"}
                  </Text>
                  {data.seller.verificationStatus === "verified" ? (
                    <Ionicons
                      name="shield-checkmark"
                      size={14}
                      color={colors.emerald}
                    />
                  ) : null}
                </View>
                {data.seller.avgRating ? (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color={colors.gold} />
                    <Text style={styles.ratingText}>
                      {Number(data.seller.avgRating).toFixed(1)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.sellerSub}>New seller</Text>
                )}
              </View>
            </View>
          ) : null}

          {/* Specs */}
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.specGrid}>
            {data.breed ? <Spec label="Breed" value={data.breed} /> : null}
            {data.bloodline ? (
              <Spec label="Bloodline" value={data.bloodline} />
            ) : null}
            {data.ageMonths ? (
              <Spec label="Age" value={`${data.ageMonths} mo.`} />
            ) : null}
            {data.weightKg ? (
              <Spec label="Weight" value={`${data.weightKg} kg`} />
            ) : null}
            {data.color ? <Spec label="Color" value={data.color} /> : null}
            {data.legColor ? (
              <Spec label="Leg color" value={data.legColor} />
            ) : null}
            {data.fightingStyle ? (
              <Spec label="Style" value={data.fightingStyle} />
            ) : null}
            {data.vaccinationStatus ? (
              <Spec label="Vaccinated" value={data.vaccinationStatus} />
            ) : null}
          </View>

          {/* Lineage */}
          {(data.sireInfo || data.damInfo) && (
            <>
              <Text style={styles.sectionTitle}>Lineage</Text>
              <View style={styles.lineageCard}>
                {data.sireInfo ? (
                  <Text style={styles.lineageText}>
                    <Text style={styles.lineageLabel}>Sire: </Text>
                    {data.sireInfo}
                  </Text>
                ) : null}
                {data.damInfo ? (
                  <Text style={styles.lineageText}>
                    <Text style={styles.lineageLabel}>Dam: </Text>
                    {data.damInfo}
                  </Text>
                ) : null}
              </View>
            </>
          )}

          {/* Description */}
          {data.description ? (
            <>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{data.description}</Text>
            </>
          ) : null}

          {/* Shipping */}
          {data.shippingAvailable ? (
            <>
              <Text style={styles.sectionTitle}>Shipping</Text>
              <View style={styles.shippingRow}>
                <Ionicons
                  name="airplane-outline"
                  size={16}
                  color={colors.info}
                />
                <Text style={styles.shippingText}>
                  {data.shippingAreas === "nationwide"
                    ? "Nationwide shipping available"
                    : data.shippingAreas === "regional"
                      ? "Regional shipping available"
                      : "Local shipping available"}
                  {data.shippingFee
                    ? ` · ${formatPeso(data.shippingFee)} fee`
                    : ""}
                </Text>
              </View>
            </>
          ) : null}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Sticky action bar */}
      <SafeAreaView edges={["bottom"]} style={styles.actionBarWrap}>
        <View style={styles.actionBar}>
          <Button
            variant="outline"
            style={{ flex: 1 }}
            onPress={handleContactSeller}
          >
            Message
          </Button>
          <Button variant="gold" style={{ flex: 1.3 }} onPress={handleBuyNow}>
            Buy now
          </Button>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specCell}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: spacing[6],
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    textAlign: "center",
  },
  gallery: {
    backgroundColor: colors.inkSoft,
    position: "relative",
  },
  galleryPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dotActive: {
    backgroundColor: colors.white,
    width: 16,
  },
  backOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: spacing[3],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.gold,
  },
  featuredTagText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  body: {
    padding: spacing[5],
  },
  price: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.black,
    color: colors.primary,
  },
  priceNote: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: -4,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginTop: 8,
    lineHeight: 28,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  locationText: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: spacing[3],
    borderRadius: radii.xl,
    backgroundColor: colors.mutedBg,
    marginTop: spacing[4],
  },
  sellerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sellerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sellerName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  sellerSub: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: fontSize.xs,
    color: colors.foreground,
    fontWeight: fontWeight.semibold,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginTop: spacing[5],
    marginBottom: spacing[2],
  },
  specGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  specCell: {
    flexBasis: "48%",
    flexGrow: 1,
    padding: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: colors.mutedBg,
  },
  specLabel: {
    fontSize: fontSize.xs,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: fontWeight.semibold,
  },
  specValue: {
    fontSize: fontSize.base,
    color: colors.foreground,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  lineageCard: {
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  lineageLabel: {
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  lineageText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    lineHeight: 20,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.foreground,
    lineHeight: 22,
  },
  shippingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  shippingText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  actionBarWrap: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -2 },
      },
      android: { elevation: 8 },
    }),
  },
  actionBar: {
    flexDirection: "row",
    gap: 10,
    padding: spacing[3],
  },
});
