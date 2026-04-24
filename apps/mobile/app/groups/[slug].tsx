/**
 * Group detail — header card with cover + emoji + join CTA, post composer
 * for members, and post feed below.
 */
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  useGroup,
  useGroupPosts,
  useJoinGroup,
  useLeaveGroup,
  useCreateGroupPost,
  type GroupPost,
} from "@/lib/groups";
import { useAuth } from "@/lib/auth";
import { colors, fontSize, fontWeight, radii, spacing } from "@/lib/theme";

export default function GroupDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const group = useGroup(slug ?? null);
  const posts = useGroupPosts(group.data?.id ?? null);
  const join = useJoinGroup();
  const leave = useLeaveGroup();
  const createPost = useCreateGroupPost();

  const [composerBody, setComposerBody] = useState("");

  if (group.isLoading) {
    return (
      <SafeAreaView style={[styles.root, styles.centerChild]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (group.isError || !group.data) {
    return (
      <SafeAreaView style={[styles.root, styles.centerChild]}>
        <Text style={styles.errorTitle}>Can&apos;t load group</Text>
        <Text style={styles.errorSub}>{group.error?.message || "Not found"}</Text>
        <Pressable style={styles.btnBack} onPress={() => router.back()}>
          <Text style={styles.btnBackText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const g = group.data;
  const postList = posts.data ?? [];

  function handlePost() {
    if (!g || !composerBody.trim()) return;
    createPost.mutate(
      { groupId: g.id, body: composerBody.trim() },
      {
        onSuccess: () => {
          setComposerBody("");
        },
      },
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: g.name, headerBackTitle: "Groups" }} />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={80}
      >
        <SafeAreaView style={styles.root} edges={["bottom"]}>
          <FlatList
            data={postList}
            keyExtractor={(p) => p.id}
            refreshControl={
              <RefreshControl
                refreshing={posts.isRefetching}
                onRefresh={() => {
                  group.refetch();
                  posts.refetch();
                }}
                tintColor={colors.primary}
              />
            }
            ListHeaderComponent={
              <GroupHeader
                group={g}
                busy={join.isPending || leave.isPending}
                onJoin={() => join.mutate({ groupId: g.id })}
                onLeave={() => leave.mutate({ groupId: g.id })}
                composerBody={composerBody}
                setComposerBody={setComposerBody}
                onPost={handlePost}
                posting={createPost.isPending}
                userInitial={user?.firstName?.[0]?.toUpperCase() || "?"}
              />
            }
            ListEmptyComponent={
              posts.isLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                <View style={styles.emptyPosts}>
                  <Text style={styles.emptyPostsText}>
                    No posts yet.
                    {g.isMember ? " Be the first to post!" : ""}
                  </Text>
                </View>
              )
            }
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <PostCard post={item} />}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </>
  );
}

function GroupHeader({
  group,
  busy,
  onJoin,
  onLeave,
  composerBody,
  setComposerBody,
  onPost,
  posting,
  userInitial,
}: {
  group: ReturnType<typeof useGroup>["data"] & {};
  busy: boolean;
  onJoin: () => void;
  onLeave: () => void;
  composerBody: string;
  setComposerBody: (v: string) => void;
  onPost: () => void;
  posting: boolean;
  userInitial: string;
}) {
  return (
    <View>
      {/* Cover + avatar */}
      <View style={styles.headerCard}>
        <LinearGradient
          colors={["#fbbf24", "#f97316", "#ef4444"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cover}
        />
        <View style={styles.avatarWrap}>
          <LinearGradient
            colors={["#fbbf24", "#ef4444"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerAvatar}
          >
            <Text style={styles.headerAvatarEmoji}>
              {group.iconEmoji || "👥"}
            </Text>
          </LinearGradient>
        </View>
        <View style={styles.headerBody}>
          <Text style={styles.headerTitle}>{group.name}</Text>
          <View style={styles.headerMeta}>
            <Text style={styles.headerCatPill}>
              {String(group.category)}
            </Text>
            <Text style={styles.headerMetaText}>
              · {group.memberCount} members · {group.postCount} posts
            </Text>
          </View>
          {group.description && (
            <Text style={styles.headerDesc}>{group.description}</Text>
          )}

          <View style={styles.headerActions}>
            {group.isMember ? (
              <>
                <View style={styles.memberPill}>
                  <Text style={styles.memberPillText}>
                    ✓ {group.role === "owner" ? "Owner" : "Member"}
                  </Text>
                </View>
                {group.role !== "owner" && (
                  <Pressable
                    style={styles.btnLeave}
                    disabled={busy}
                    onPress={onLeave}
                  >
                    <Text style={styles.btnLeaveText}>Leave</Text>
                  </Pressable>
                )}
              </>
            ) : group.pendingApproval ? (
              <View style={styles.pendingPill}>
                <Text style={styles.pendingPillText}>Pending approval</Text>
              </View>
            ) : (
              <Pressable
                style={styles.btnJoin}
                disabled={busy}
                onPress={onJoin}
              >
                <Text style={styles.btnJoinText}>
                  {busy ? "…" : "+ Join Group"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Composer */}
      {group.isMember && (
        <View style={styles.composer}>
          <View style={styles.composerAvatar}>
            <Text style={styles.composerAvatarText}>{userInitial}</Text>
          </View>
          <View style={styles.composerBody}>
            <TextInput
              value={composerBody}
              onChangeText={setComposerBody}
              placeholder={`Share something with ${group.name}…`}
              placeholderTextColor={colors.muted}
              multiline
              style={styles.composerInput}
              maxLength={5000}
            />
            <View style={styles.composerActions}>
              <Text style={styles.composerCount}>
                {composerBody.length}/5000
              </Text>
              <Pressable
                style={[
                  styles.btnPost,
                  (!composerBody.trim() || posting) && styles.btnPostDisabled,
                ]}
                onPress={onPost}
                disabled={!composerBody.trim() || posting}
              >
                <Text style={styles.btnPostText}>
                  {posting ? "Posting…" : "Post"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function PostCard({ post }: { post: GroupPost }) {
  const name =
    post.author.displayName ||
    `${post.author.firstName} ${post.author.lastName}`.trim();

  return (
    <View style={styles.postCard}>
      {post.pinnedAt && (
        <Text style={styles.pinnedLabel}>📌 Pinned</Text>
      )}
      <View style={styles.postHeader}>
        <LinearGradient
          colors={["#fbbf24", "#ef4444"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.postAvatar}
        >
          {post.author.avatarUrl ? (
            <Image
              source={{ uri: post.author.avatarUrl }}
              style={styles.postAvatarImg}
            />
          ) : (
            <Text style={styles.postAvatarText}>
              {name.charAt(0).toUpperCase()}
            </Text>
          )}
        </LinearGradient>
        <View style={styles.postHeaderBody}>
          <View style={styles.postHeaderRow}>
            <Text style={styles.postAuthor} numberOfLines={1}>
              {name}
            </Text>
            {post.author.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={8} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.postDate}>
            {formatRelativeTime(post.createdAt)}
          </Text>
        </View>
      </View>
      <Text style={styles.postBody}>{post.body}</Text>
      {post.images && post.images.length > 0 && (
        <View style={styles.postImages}>
          {post.images.slice(0, 4).map((url, i) => (
            <Image
              key={i}
              source={{ uri: url }}
              style={styles.postImage}
            />
          ))}
        </View>
      )}
      <View style={styles.postFooter}>
        <Text style={styles.postFooterItem}>❤️ {post.likesCount}</Text>
        <Text style={styles.postFooterItem}>💬 {post.commentsCount}</Text>
      </View>
    </View>
  );
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  centerChild: { alignItems: "center", justifyContent: "center" },
  list: { padding: spacing[3], flexGrow: 1 },
  loadingBox: { paddingVertical: spacing[8], alignItems: "center" },

  errorTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  errorSub: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 4,
    marginBottom: spacing[4],
  },
  btnBack: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  btnBackText: {
    color: "#fff",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  headerCard: {
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
  },
  cover: { height: 80 },
  avatarWrap: {
    position: "absolute",
    top: 40,
    left: spacing[4],
    width: 72,
    height: 72,
    borderRadius: radii.lg,
    padding: 3,
    backgroundColor: colors.background,
  },
  headerAvatar: {
    flex: 1,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarEmoji: { fontSize: 32 },
  headerBody: {
    paddingTop: spacing[8],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    gap: spacing[2],
  },
  headerTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: colors.foreground,
  },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  headerCatPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.mutedBg,
    color: colors.muted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: "capitalize",
    overflow: "hidden",
  },
  headerMetaText: { fontSize: fontSize.xs, color: colors.muted },
  headerDesc: {
    fontSize: fontSize.sm,
    color: colors.muted,
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: spacing[2],
  },
  btnJoin: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  btnJoinText: {
    color: "#fff",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  btnLeave: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: colors.mutedBg,
  },
  btnLeaveText: {
    color: colors.muted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  memberPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: "#d1fae5",
  },
  memberPillText: {
    color: "#065f46",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  pendingPill: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: "#fef3c7",
  },
  pendingPillText: {
    color: "#b45309",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },

  composer: {
    flexDirection: "row",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing[4],
  },
  composerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  composerAvatarText: {
    color: "#fff",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
  },
  composerBody: { flex: 1 },
  composerInput: {
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing[2],
    fontSize: fontSize.sm,
    color: colors.foreground,
    textAlignVertical: "top",
  },
  composerActions: {
    marginTop: spacing[2],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  composerCount: { fontSize: fontSize.xs, color: colors.muted },
  btnPost: {
    paddingHorizontal: spacing[4],
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  btnPostDisabled: { opacity: 0.5 },
  btnPostText: {
    color: "#fff",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },

  postCard: {
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[2],
  },
  pinnedLabel: {
    fontSize: fontSize.xs,
    color: "#b45309",
    fontWeight: fontWeight.semibold,
  },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  postAvatarImg: { width: "100%", height: "100%" },
  postAvatarText: {
    color: "#fff",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
  },
  postHeaderBody: { flex: 1 },
  postHeaderRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  postAuthor: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  verifiedBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  postDate: { fontSize: 11, color: colors.muted, marginTop: 2 },
  postBody: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    lineHeight: 20,
  },
  postImages: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  postImage: {
    width: "49%",
    aspectRatio: 1,
    borderRadius: radii.md,
  },
  postFooter: {
    flexDirection: "row",
    gap: spacing[4],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  postFooterItem: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },

  emptyPosts: {
    padding: spacing[6],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    alignItems: "center",
  },
  emptyPostsText: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: "center",
  },
});
