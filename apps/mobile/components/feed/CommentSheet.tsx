import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  useVideoComments,
  useCreateComment,
  useDeleteComment,
  type VideoComment,
} from "@/lib/videos";
import { useAuth } from "@/lib/auth";
import { colors, fontSize, fontWeight, radii, spacing } from "@/lib/theme";

interface Props {
  videoId: string | null;
  visible: boolean;
  onClose: () => void;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

function displayName(u: VideoComment["user"]) {
  return u.displayName || `${u.firstName} ${u.lastName}`;
}

function countTotal(nodes: VideoComment[]): number {
  return nodes.reduce((acc, n) => acc + 1 + countTotal(n.replies), 0);
}

export function CommentSheet({ videoId, visible, onClose }: Props) {
  const { user } = useAuth();
  const { data, isLoading } = useVideoComments(visible ? videoId : null);
  const create = useCreateComment(videoId ?? "");
  const del = useDeleteComment(videoId ?? "");

  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<VideoComment | null>(null);

  const comments = data?.data ?? [];
  const total = countTotal(comments);

  const handleSubmit = () => {
    const content = input.trim();
    if (!content || !videoId) return;
    create.mutate(
      { content, parentId: replyTo?.id },
      {
        onSuccess: () => {
          setInput("");
          setReplyTo(null);
        },
        onError: (err) => Alert.alert("Failed to post", err.message),
      },
    );
  };

  const handleDelete = (commentId: string) => {
    Alert.alert("Delete comment?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          del.mutate(commentId, {
            onError: (err) => Alert.alert("Failed to delete", err.message),
          }),
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheet}
        >
          <SafeAreaView edges={["bottom"]} style={{ backgroundColor: colors.white }}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerTitle}>Comments</Text>
                <View style={styles.countPill}>
                  <Text style={styles.countPillText}>
                    {isLoading ? "…" : total}
                  </Text>
                </View>
              </View>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={48}
                  color={colors.border}
                />
                <Text style={styles.emptyTitle}>No comments yet</Text>
                <Text style={styles.emptySub}>Be the first to comment!</Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(c) => c.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <View style={{ marginBottom: spacing[3] }}>
                    <CommentRow
                      comment={item}
                      currentUserId={user?.id}
                      onReply={setReplyTo}
                      onDelete={handleDelete}
                    />
                    {item.replies.length > 0 && (
                      <View style={styles.repliesBox}>
                        {item.replies.map((r) => (
                          <CommentRow
                            key={r.id}
                            comment={r}
                            currentUserId={user?.id}
                            isReply
                            onReply={() => {}}
                            onDelete={handleDelete}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                )}
              />
            )}

            {replyTo ? (
              <View style={styles.replyToChip}>
                <Text style={styles.replyToText}>
                  Replying to{" "}
                  <Text style={{ fontWeight: fontWeight.bold }}>
                    {displayName(replyTo.user)}
                  </Text>
                </Text>
                <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
                  <Ionicons name="close" size={16} color={colors.muted} />
                </Pressable>
              </View>
            ) : null}

            {user ? (
              <View style={styles.composer}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder={replyTo ? "Write a reply…" : "Add a comment…"}
                  placeholderTextColor={colors.muted}
                  maxLength={1000}
                  multiline
                  style={styles.composerInput}
                />
                <Pressable
                  onPress={handleSubmit}
                  disabled={!input.trim() || create.isPending}
                  style={({ pressed }) => [
                    styles.sendBtn,
                    (!input.trim() || create.isPending) && { opacity: 0.5 },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {create.isPending ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Ionicons name="send" size={18} color={colors.white} />
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.signInBox}>
                <Text style={styles.signInText}>
                  Sign in to join the conversation.
                </Text>
              </View>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function CommentRow({
  comment,
  currentUserId,
  isReply,
  onReply,
  onDelete,
}: {
  comment: VideoComment;
  currentUserId?: string;
  isReply?: boolean;
  onReply: (c: VideoComment) => void;
  onDelete: (id: string) => void;
}) {
  const isMine = currentUserId === comment.user.id;
  const initials =
    (comment.user.firstName[0] || "") + (comment.user.lastName[0] || "");

  return (
    <View style={styles.commentRow}>
      <View
        style={[
          styles.avatar,
          isReply && styles.avatarSmall,
        ]}
      >
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.commentMeta}>
          <Text style={styles.commentName}>{displayName(comment.user)}</Text>
          <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
        </View>
        <Text style={styles.commentContent}>{comment.content}</Text>
        <View style={styles.commentActions}>
          {!isReply && (
            <Pressable onPress={() => onReply(comment)} hitSlop={6}>
              <Text style={styles.commentActionText}>Reply</Text>
            </Pressable>
          )}
          {isMine && (
            <Pressable onPress={() => onDelete(comment.id)} hitSlop={6}>
              <Text style={[styles.commentActionText, { color: colors.destructive }]}>
                Delete
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    maxHeight: "75%",
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  countPill: {
    backgroundColor: colors.mutedBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  countPillText: {
    fontSize: fontSize.xs,
    color: colors.muted,
    fontWeight: fontWeight.semibold,
  },
  loadingBox: {
    padding: spacing[6],
    alignItems: "center",
  },
  emptyBox: {
    padding: spacing[6],
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginTop: 8,
  },
  emptySub: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  commentRow: {
    flexDirection: "row",
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.xs,
  },
  commentMeta: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  commentName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  commentTime: {
    fontSize: 10,
    color: colors.muted,
  },
  commentContent: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    lineHeight: 18,
    marginTop: 2,
  },
  commentActions: {
    flexDirection: "row",
    gap: 14,
    marginTop: 4,
  },
  commentActionText: {
    fontSize: fontSize.xs,
    color: colors.muted,
    fontWeight: fontWeight.semibold,
  },
  repliesBox: {
    marginLeft: 42,
    marginTop: 8,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    gap: 10,
  },
  replyToChip: {
    marginHorizontal: spacing[4],
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.mutedBg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  replyToText: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  composerInput: {
    flex: 1,
    maxHeight: 100,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  signInBox: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  signInText: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: "center",
  },
});
