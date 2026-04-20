import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

/** Dummy feed data — replace with API call to /feed/posts once we wire up
 *  the real video feed module. Using Unsplash rooster photos for visuals
 *  and realistic caption/metadata so scrolling feels authentic. */
interface FeedPost {
  id: string;
  imageUrl: string;
  username: string;
  handle: string;
  farm: string;
  verified: boolean;
  caption: string;
  hashtags: string[];
  likes: number;
  comments: number;
  shares: number;
  location: string;
  hasListing?: {
    title: string;
    price: number;
  };
}

const DUMMY_POSTS: FeedPost[] = [
  {
    id: "1",
    imageUrl:
      "https://images.unsplash.com/photo-1583510383754-35fc1d1eb598?w=1200&q=80",
    username: "Mang Juan",
    handle: "@juan_kelso_farm",
    farm: "Juan Kelso Farm",
    verified: true,
    caption:
      "Bagong keep! McLean Hatch bloodline, malakas ang kamao nito. Interested pm lang!",
    hashtags: ["#Kelso", "#Hatch", "#Pampanga"],
    likes: 2847,
    comments: 184,
    shares: 92,
    location: "Angeles, Pampanga",
    hasListing: {
      title: "McLean Hatch Stag",
      price: 25000,
    },
  },
  {
    id: "2",
    imageUrl:
      "https://images.unsplash.com/photo-1585670603060-f92c1e4f3d12?w=1200&q=80",
    username: "Ate Marites",
    handle: "@bacolod_sabungera",
    farm: "Marites Gamefowl",
    verified: false,
    caption:
      "Sunday pasilip sa mga manok ko. Sweater hen — champion bloodline from Negros.",
    hashtags: ["#Sweater", "#Negros", "#Hen", "#ChampionBlood"],
    likes: 1203,
    comments: 67,
    shares: 34,
    location: "Bacolod City, Negros",
  },
  {
    id: "3",
    imageUrl:
      "https://images.unsplash.com/photo-1471623817296-aa07ae5c9f47?w=1200&q=80",
    username: "Tatay Dong",
    handle: "@roundhead_master",
    farm: "Dong Roundhead PH",
    verified: true,
    caption:
      "Pure Roundhead, 7 months. Ready to fight. PM for price. Local and nationwide shipping available.",
    hashtags: ["#Roundhead", "#Pure", "#Cavite"],
    likes: 4521,
    comments: 312,
    shares: 178,
    location: "Silang, Cavite",
    hasListing: {
      title: "Pure Roundhead Stag - 7 months",
      price: 18000,
    },
  },
  {
    id: "4",
    imageUrl:
      "https://images.unsplash.com/photo-1622997882237-e24385e6ab4a?w=1200&q=80",
    username: "Lito Breeder",
    handle: "@lito_breeder_ph",
    farm: "Lito's Breeding Station",
    verified: true,
    caption:
      "Kelso pullet, ready for breeding. Sired by 2x Bakbakan champion. Limited stocks na lang!",
    hashtags: ["#Kelso", "#Pullet", "#Breeding", "#Batangas"],
    likes: 892,
    comments: 45,
    shares: 21,
    location: "Lipa City, Batangas",
  },
  {
    id: "5",
    imageUrl:
      "https://images.unsplash.com/photo-1545251765-6aad90d25972?w=1200&q=80",
    username: "Boss Rommel",
    handle: "@aseel_king_ph",
    farm: "Aseel King Philippines",
    verified: true,
    caption:
      "Aseel brood hens. 5 hens pack deal. Deep heritage bloodline, imported from Pakistan 3 generations ago.",
    hashtags: ["#Aseel", "#Imported", "#BreedingStock"],
    likes: 3210,
    comments: 256,
    shares: 145,
    location: "Cebu City",
    hasListing: {
      title: "Aseel Brood Stock - 5 Hens",
      price: 45000,
    },
  },
  {
    id: "6",
    imageUrl:
      "https://images.unsplash.com/photo-1709751797406-7e657b0a3897?w=1200&q=80",
    username: "Tita Bella",
    handle: "@bella_farmstead",
    farm: "Bella Farmstead",
    verified: false,
    caption:
      "Grey Kelso stag — show quality. Perfect for exhibition. Let me know if interested 🐓",
    hashtags: ["#GreyKelso", "#Show", "#ExhibitionQuality"],
    likes: 1587,
    comments: 94,
    shares: 56,
    location: "Davao City",
  },
];

export default function FeedScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <FlatList
        data={DUMMY_POSTS}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={SCREEN_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        renderItem={({ item, index }) => (
          <FeedCard
            post={item}
            isActive={index === activeIndex}
            totalCount={DUMMY_POSTS.length}
            currentIndex={index}
          />
        )}
        getItemLayout={(_, index) => ({
          length: SCREEN_H,
          offset: SCREEN_H * index,
          index,
        })}
      />
    </View>
  );
}

function FeedCard({
  post,
  isActive,
  totalCount,
  currentIndex,
}: {
  post: FeedPost;
  isActive: boolean;
  totalCount: number;
  currentIndex: number;
}) {
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);

  return (
    <View style={styles.card}>
      {/* Background image (simulates video keyframe) */}
      <Image
        source={{ uri: post.imageUrl }}
        style={styles.bgImage}
        resizeMode="cover"
      />

      {/* Dark gradient overlay top + bottom for text legibility */}
      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "transparent", "transparent", "rgba(0,0,0,0.85)"]}
        locations={[0, 0.2, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Play indicator (placeholder for video) */}
      {isActive ? (
        <View style={styles.playIndicator}>
          <View style={styles.playIndicatorInner}>
            <Ionicons name="play" size={32} color="rgba(255,255,255,0.9)" />
          </View>
          <Text style={styles.videoStub}>Video placeholder</Text>
        </View>
      ) : null}

      {/* Top bar — Feed / Following tabs (TikTok-style) */}
      <View style={styles.topBar}>
        <Text style={styles.topTabInactive}>Following</Text>
        <View style={styles.topTabSeparator} />
        <Text style={styles.topTabActive}>For You</Text>
        <View style={{ flex: 1 }} />
        <Ionicons name="search" size={22} color={colors.white} />
      </View>

      {/* Pagination dots (right side, small) */}
      <View style={styles.pageIndicator}>
        <Text style={styles.pageText}>
          {currentIndex + 1} / {totalCount}
        </Text>
      </View>

      {/* Right-side action column — like, comment, share, follow seller */}
      <View style={styles.actions}>
        <ActionButton
          icon="heart"
          iconActive="heart"
          active={liked}
          activeColor={colors.primary}
          label={formatCount(post.likes + (liked ? 1 : 0))}
          onPress={() => setLiked((p) => !p)}
        />
        <ActionButton
          icon="chatbubble-ellipses-outline"
          iconActive="chatbubble-ellipses"
          label={formatCount(post.comments)}
          onPress={() => {}}
        />
        <ActionButton
          icon="arrow-redo-outline"
          iconActive="arrow-redo"
          label={formatCount(post.shares)}
          onPress={() => {}}
        />
        <ActionButton
          icon="bookmark-outline"
          iconActive="bookmark"
          label=""
          onPress={() => {}}
        />

        {/* Avatar with follow button */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {post.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Pressable
            onPress={() => setFollowing((p) => !p)}
            style={[styles.followBadge, following && styles.followingBadge]}
          >
            <Ionicons
              name={following ? "checkmark" : "add"}
              size={14}
              color={colors.white}
            />
          </Pressable>
        </View>
      </View>

      {/* Bottom overlay — user info + caption + listing card */}
      <View style={styles.bottomOverlay}>
        <View style={styles.userRow}>
          <Text style={styles.username}>{post.username}</Text>
          {post.verified ? (
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={colors.info}
              style={{ marginLeft: 4 }}
            />
          ) : null}
          <Text style={styles.handle}> {post.handle}</Text>
        </View>

        <Text style={styles.caption} numberOfLines={2}>
          {post.caption}
        </Text>

        <View style={styles.hashtagRow}>
          {post.hashtags.map((tag) => (
            <Text key={tag} style={styles.hashtag}>
              {tag}
            </Text>
          ))}
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={colors.white} />
          <Text style={styles.metaText}>{post.location}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Ionicons name="business-outline" size={12} color={colors.white} />
          <Text style={styles.metaText}>{post.farm}</Text>
        </View>

        {/* If post is tied to a listing, show a small marketplace card */}
        {post.hasListing ? (
          <Pressable style={styles.listingCard}>
            <View style={styles.listingIcon}>
              <Ionicons name="cart" size={14} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listingLabel}>FOR SALE</Text>
              <Text style={styles.listingTitle} numberOfLines={1}>
                {post.hasListing.title}
              </Text>
            </View>
            <Text style={styles.listingPrice}>
              ₱
              {post.hasListing.price.toLocaleString("en-PH", {
                maximumFractionDigits: 0,
              })}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  iconActive,
  active,
  activeColor,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  activeColor?: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionButton} hitSlop={6}>
      <Ionicons
        name={active ? iconActive : icon}
        size={30}
        color={active ? activeColor ?? colors.white : colors.white}
      />
      {label ? <Text style={styles.actionLabel}>{label}</Text> : null}
    </Pressable>
  );
}

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return (n / 1000).toFixed(1) + "K";
  if (n < 1_000_000) return Math.round(n / 1000) + "K";
  return (n / 1_000_000).toFixed(1) + "M";
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.black,
  },
  card: {
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: colors.black,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  playIndicator: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 8,
  },
  playIndicatorInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoStub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    fontWeight: fontWeight.semibold,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  topBar: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  topTabInactive: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: "rgba(255,255,255,0.7)",
  },
  topTabActive: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  topTabSeparator: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  pageIndicator: {
    position: "absolute",
    top: 60,
    right: 50,
  },
  pageText: {
    fontSize: fontSize.xs,
    color: "rgba(255,255,255,0.5)",
  },
  actions: {
    position: "absolute",
    right: spacing[3],
    bottom: 180,
    alignItems: "center",
    gap: 18,
  },
  actionButton: {
    alignItems: "center",
    gap: 3,
  },
  actionLabel: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  avatarWrap: {
    marginTop: 6,
    alignItems: "center",
    position: "relative",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },
  followBadge: {
    position: "absolute",
    bottom: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.white,
  },
  followingBadge: {
    backgroundColor: colors.emerald,
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 90, // leave space for tab bar
    left: 0,
    right: 70, // leave space for right actions
    paddingHorizontal: spacing[4],
    gap: 6,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  username: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  handle: {
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.7)",
  },
  caption: {
    fontSize: fontSize.sm,
    color: colors.white,
    lineHeight: 20,
  },
  hashtagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  hashtag: {
    fontSize: fontSize.sm,
    color: colors.gold,
    fontWeight: fontWeight.semibold,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: fontSize.xs,
    color: "rgba(255,255,255,0.85)",
  },
  metaDot: {
    fontSize: fontSize.xs,
    color: "rgba(255,255,255,0.5)",
    marginHorizontal: 2,
  },
  listingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.4)",
    marginTop: 6,
  },
  listingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(251,191,36,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  listingLabel: {
    fontSize: 9,
    fontWeight: fontWeight.bold,
    color: colors.gold,
    letterSpacing: 0.5,
  },
  listingTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  listingPrice: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.black,
    color: colors.gold,
  },
});
