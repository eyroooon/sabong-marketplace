import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useRouter } from "expo-router";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";
import {
  useVideoFeed,
  useLikeVideo,
  useShareVideo,
  useFollowStatus,
  useFollow,
  useTaggedListings,
  trackShopClick,
  formatVideoPrice,
  type Video,
} from "@/lib/videos";
import { CommentSheet } from "@/components/feed/CommentSheet";
import { ShopSheet } from "@/components/feed/ShopSheet";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type FeedTab = "foryou" | "marketplace";

export default function FeedScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<FeedTab>("foryou");
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentsOpenFor, setCommentsOpenFor] = useState<string | null>(null);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useVideoFeed(tab === "marketplace" ? "marketplace" : undefined);

  const videos = data?.pages.flatMap((p) => p.data) ?? [];

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Top tab selector */}
      <View style={styles.topBar}>
        <Pressable onPress={() => setTab("foryou")} hitSlop={8}>
          <Text
            style={tab === "foryou" ? styles.topTabActive : styles.topTabInactive}
          >
            For You
          </Text>
        </Pressable>
        <View style={styles.topTabSeparator} />
        <Pressable onPress={() => setTab("marketplace")} hitSlop={8}>
          <Text
            style={
              tab === "marketplace" ? styles.topTabActive : styles.topTabInactive
            }
          >
            Marketplace
          </Text>
        </Pressable>
      </View>

      {/* Upload FAB */}
      <Pressable
        onPress={() => router.push("/feed/new")}
        style={({ pressed }) => [
          styles.uploadFab,
          pressed && { opacity: 0.85 },
        ]}
        hitSlop={8}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      {isLoading && videos.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.white} size="large" />
        </View>
      ) : videos.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="videocam-outline" size={48} color="rgba(255,255,255,0.4)" />
          <Text style={styles.emptyTitle}>No videos yet</Text>
          <Text style={styles.emptySub}>
            Sellers haven't posted here yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(v) => v.id}
          pagingEnabled
          snapToInterval={SCREEN_H}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.7}
          renderItem={({ item, index }) => (
            <FeedCard
              video={item}
              isActive={index === activeIndex}
              currentIndex={index}
              totalCount={videos.length}
              onOpenComments={() => setCommentsOpenFor(item.id)}
            />
          )}
          getItemLayout={(_, index) => ({
            length: SCREEN_H,
            offset: SCREEN_H * index,
            index,
          })}
        />
      )}

      <CommentSheet
        videoId={commentsOpenFor}
        visible={!!commentsOpenFor}
        onClose={() => setCommentsOpenFor(null)}
      />
    </View>
  );
}

function FeedCard({
  video,
  isActive,
  currentIndex,
  totalCount,
  onOpenComments,
}: {
  video: Video;
  isActive: boolean;
  currentIndex: number;
  totalCount: number;
  onOpenComments: () => void;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(video.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [shopOpen, setShopOpen] = useState(false);

  const like = useLikeVideo(video.id);
  const share = useShareVideo(video.id);
  const follow = useFollow(video.user.id);
  const { data: followStatus } = useFollowStatus(video.user.id);
  const isFollowing = followStatus?.following ?? false;
  const { data: taggedListings = [], isLoading: taggedLoading } =
    useTaggedListings(shopOpen ? video.id : null);

  // Video player (expo-video). Play only when card is active.
  const player = useVideoPlayer(video.videoUrl, (p) => {
    p.loop = true;
    p.muted = false;
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    like.mutate(
      { like: next },
      {
        onError: () => {
          setLiked(!next);
          setLikeCount((c) => c + (next ? -1 : 1));
        },
      },
    );
  };

  const handleFollow = () => {
    follow.mutate({ follow: !isFollowing });
  };

  const handleShare = async () => {
    const url = `https://bloodlineph.com/feed?v=${video.id}`;
    try {
      await Share.share({
        message: `${video.caption.slice(0, 80)}\n\n${url}`,
        url,
      });
      share.mutate();
    } catch {
      // user cancelled
    }
  };

  const handleShopBird = () => {
    if (!video.listing) return;
    router.push(`/listing/${video.listing.slug}?ref=feed&v=${video.id}`);
  };

  const creatorName =
    video.user.displayName || `${video.user.firstName} ${video.user.lastName}`;
  const initials =
    (video.user.firstName[0] || "") + (video.user.lastName[0] || "");

  return (
    <View style={styles.card}>
      {/* Video player */}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Dark gradients for text legibility */}
      <LinearGradient
        colors={["rgba(0,0,0,0.5)", "transparent", "transparent", "rgba(0,0,0,0.85)"]}
        locations={[0, 0.2, 0.6, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Pagination */}
      <View style={styles.pageIndicator}>
        <Text style={styles.pageText}>
          {currentIndex + 1} / {totalCount}
        </Text>
      </View>

      {/* Shop pill — tap to open tagged listings sheet */}
      {(video.taggedListingCount ?? 0) > 0 && (
        <Pressable style={styles.shopPill} onPress={() => setShopOpen(true)}>
          <LinearGradient
            colors={["#fbbf24", "#f97316", "#ef4444"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shopPillGradient}
          >
            <Ionicons name="cart" size={14} color="#fff" />
            <Text style={styles.shopPillText}>🛒 {video.taggedListingCount}</Text>
          </LinearGradient>
        </Pressable>
      )}

      {/* Shop sheet */}
      <ShopSheet
        visible={shopOpen}
        onClose={() => setShopOpen(false)}
        listings={taggedListings}
        loading={taggedLoading}
        onPick={(listing) => {
          trackShopClick(video.id, listing.id);
          setShopOpen(false);
          router.push(`/listing/${listing.slug}?ref=feed&v=${video.id}`);
        }}
      />

      {/* Right-side actions */}
      <View style={styles.actions}>
        <ActionButton
          icon="heart-outline"
          iconActive="heart"
          active={liked}
          activeColor={colors.primary}
          label={formatCount(likeCount)}
          onPress={handleLike}
        />
        <ActionButton
          icon="chatbubble-ellipses-outline"
          iconActive="chatbubble-ellipses"
          label={formatCount(video.commentCount)}
          onPress={onOpenComments}
        />
        <ActionButton
          icon="arrow-redo-outline"
          iconActive="arrow-redo"
          label={formatCount(video.shareCount)}
          onPress={handleShare}
        />

        {/* Avatar + follow badge */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            {video.user.avatarUrl ? (
              <Image
                source={{ uri: video.user.avatarUrl }}
                style={StyleSheet.absoluteFillObject}
              />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          <Pressable
            onPress={handleFollow}
            style={[styles.followBadge, isFollowing && styles.followingBadge]}
            hitSlop={8}
            disabled={follow.isPending}
          >
            <Ionicons
              name={isFollowing ? "checkmark" : "add"}
              size={14}
              color={colors.white}
            />
          </Pressable>
        </View>
      </View>

      {/* Bottom overlay */}
      <View style={styles.bottomOverlay}>
        <View style={styles.userRow}>
          <Text style={styles.username}>{creatorName}</Text>
          <Ionicons
            name="checkmark-circle"
            size={14}
            color={colors.info}
            style={{ marginLeft: 4 }}
          />
        </View>

        <Text style={styles.caption} numberOfLines={3}>
          {video.caption}
        </Text>

        {/* Shop This Bird CTA — only on marketplace videos */}
        {video.listing ? (
          <Pressable
            style={styles.listingCard}
            onPress={handleShopBird}
          >
            <View style={styles.listingIcon}>
              <Ionicons name="cart" size={14} color={colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listingLabel}>SHOP THIS BIRD</Text>
              <Text style={styles.listingTitle} numberOfLines={1}>
                {video.listing.title}
              </Text>
            </View>
            <Text style={styles.listingPrice}>
              {formatVideoPrice(video.listing.price)}
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
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: 8,
  },
  emptySub: {
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.6)",
  },
  topBar: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: spacing[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
  uploadFab: {
    position: "absolute",
    top: 52,
    right: spacing[3],
    zIndex: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pageIndicator: {
    position: "absolute",
    top: 64,
    right: spacing[3],
  },
  shopPill: {
    position: "absolute",
    top: 64,
    alignSelf: "center",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  shopPillGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  shopPillText: {
    color: "#fff",
    fontWeight: fontWeight.bold,
    fontSize: fontSize.xs,
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
    overflow: "hidden",
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
    bottom: 100,
    left: 0,
    right: 70,
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
  caption: {
    fontSize: fontSize.sm,
    color: colors.white,
    lineHeight: 20,
  },
  listingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.5)",
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
    letterSpacing: 0.8,
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
