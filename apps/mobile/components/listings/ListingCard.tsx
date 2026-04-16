import React from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";
import { formatLocation, formatPeso, type Listing } from "@/lib/listings";

interface Props {
  listing: Listing;
  style?: "grid" | "row";
}

/**
 * Reusable listing card. `grid` = square-ish tile for 2-column layouts,
 * `row` = wider card for featured rail / list views.
 */
export function ListingCard({ listing, style = "grid" }: Props) {
  const router = useRouter();
  const location = formatLocation(
    listing.locationProvince,
    listing.locationCity,
  );

  return (
    <Pressable
      onPress={() => router.push(`/listing/${listing.slug}`)}
      style={({ pressed }) => [
        styles.card,
        style === "row" && styles.cardRow,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.imageWrap}>
        {listing.primaryImage ? (
          <Image
            source={{ uri: listing.primaryImage }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={36} color={colors.muted} />
          </View>
        )}
        {listing.isFeatured ? (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color={colors.white} />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        ) : null}
        {listing.sellerVerified ? (
          <View style={styles.verifiedBadge}>
            <Ionicons name="shield-checkmark" size={10} color={colors.white} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>

        {listing.breed ? (
          <Text style={styles.breed} numberOfLines={1}>
            {listing.breed}
            {listing.bloodline ? ` · ${listing.bloodline}` : ""}
          </Text>
        ) : null}

        <Text style={styles.price}>{formatPeso(listing.price)}</Text>

        {location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.muted} />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  cardRow: {
    width: 260,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: colors.mutedBg,
    position: "relative",
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
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.gold,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: 0.3,
  },
  verifiedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.emerald,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: 0.3,
  },
  body: {
    padding: spacing[3],
    gap: 4,
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    lineHeight: 18,
  },
  breed: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  price: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    color: colors.primary,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    fontSize: fontSize.xs,
    color: colors.muted,
    flex: 1,
  },
});
