/**
 * Shoppable Reels — bottom sheet listing creator's tagged products.
 *
 * Rendered when the user taps the 🛒 pill on a video. Shows each tagged
 * listing with thumbnail, title, breed, price, and a big 'Shop' CTA that
 * navigates to the listing detail. Tapping a row fires click tracking.
 */
import React from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight, radii, spacing } from "@/lib/theme";
import type { TaggedListing } from "@/lib/videos";
import { formatVideoPrice } from "@/lib/videos";

const MEDIA_BASE =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/api$/, "") ||
  "http://localhost:3001";

export function ShopSheet({
  visible,
  onClose,
  listings,
  loading,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  listings: TaggedListing[];
  loading: boolean;
  onPick: (listing: TaggedListing) => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.grabber} />

          <View style={styles.header}>
            <Text style={styles.title}>🛒 Shop this reel</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : listings.length === 0 ? (
            <Text style={styles.emptyText}>No listings tagged yet.</Text>
          ) : (
            <ScrollView style={styles.list}>
              {listings.map((l) => (
                <Pressable
                  key={l.id}
                  onPress={() => onPick(l)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && { backgroundColor: "#f9fafb" },
                  ]}
                >
                  <View style={styles.thumb}>
                    {l.primaryImageUrl ? (
                      <Image
                        source={{
                          uri: l.primaryImageUrl.startsWith("http")
                            ? l.primaryImageUrl
                            : `${MEDIA_BASE}${l.primaryImageUrl}`,
                        }}
                        style={styles.thumbImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.thumbEmoji}>🐓</Text>
                    )}
                  </View>
                  <View style={styles.body}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {l.title}
                    </Text>
                    {l.breed && (
                      <Text style={styles.rowBreed}>{l.breed}</Text>
                    )}
                    <Text style={styles.rowPrice}>
                      {formatVideoPrice(l.price)}
                    </Text>
                  </View>
                  <LinearGradient
                    colors={["#fbbf24", "#ef4444"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.shopCta}
                  >
                    <Text style={styles.shopCtaText}>Shop →</Text>
                  </LinearGradient>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
    maxHeight: "70%",
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#d4d4d8",
    alignSelf: "center",
    marginBottom: spacing[3],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: colors.foreground,
  },
  loadingBox: {
    paddingVertical: spacing[6],
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: spacing[5],
    color: colors.muted,
  },
  list: {
    maxHeight: 400,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: "#f5f5f4",
    marginBottom: spacing[2],
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbEmoji: {
    fontSize: 28,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  rowBreed: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  rowPrice: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.black,
    color: colors.primary,
    marginTop: 2,
  },
  shopCta: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
  },
  shopCtaText: {
    color: "#fff",
    fontWeight: fontWeight.bold,
    fontSize: fontSize.xs,
  },
});
