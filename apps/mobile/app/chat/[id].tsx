import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  useConversationMessages,
  useSendMessage,
  uploadChatMedia,
  formatRelativeTime,
  type Message,
} from "@/lib/messages";
import {
  joinConversation,
  leaveConversation,
  useChatSocket,
  useTypingEmitter,
  usePeerTyping,
} from "@/lib/socket";
import { useAuth } from "@/lib/auth";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";
import {
  VoiceRecorder,
  type RecordedClip,
} from "@/components/chat/VoiceRecorder";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [voiceSending, setVoiceSending] = useState(false);

  useChatSocket(qc);

  const notifyTyping = useTypingEmitter(id);
  const peerTyping = usePeerTyping(id, user?.id);

  const { data, isLoading, error } = useConversationMessages(id);
  const sendMessage = useSendMessage(id!);

  // Join / leave the conversation room for real-time updates
  useEffect(() => {
    if (!id) return;
    joinConversation(id);
    return () => {
      leaveConversation(id);
    };
  }, [id]);

  const messages = useMemo<Message[]>(() => data?.data ?? [], [data]);
  const otherUser = data?.conversation?.otherUser;
  const otherName = otherUser
    ? `${otherUser.firstName} ${otherUser.lastName}`.trim() || "Seller"
    : "Seller";

  const handleSend = () => {
    const content = draft.trim();
    if (!content || sendMessage.isPending) return;
    sendMessage.mutate(
      { content },
      {
        onSuccess: () => setDraft(""),
      },
    );
  };

  const handleRecorded = async (clip: RecordedClip) => {
    if (!id) return;
    setVoiceSending(true);
    try {
      const uploaded = await uploadChatMedia({
        uri: clip.uri,
        name: `voice-${Date.now()}.m4a`,
        mimeType: clip.mimeType,
      });
      await sendMessage.mutateAsync({
        content: "",
        messageType: "voice",
        mediaUrl: uploaded.url,
        mediaDurationMs: clip.durationSec * 1000,
      });
    } catch (err) {
      Alert.alert(
        "Send failed",
        err instanceof Error ? err.message : "Could not send voice note. Please try again.",
      );
    } finally {
      setVoiceSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <SafeAreaView style={styles.root} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {otherName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.headerName} numberOfLines={1}>
              {otherName}
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Messages list */}
        {isLoading ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerBlock}>
            <Ionicons name="alert-circle" size={40} color={colors.destructive} />
            <Text style={styles.errorText}>
              {error.message || "Can't load messages"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={[...messages].reverse()} // newest at bottom when inverted
            inverted
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isMine={item.senderId === user?.id}
              />
            )}
          />
        )}

        {/* Composer */}
        {peerTyping ? (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>
              typing<AnimatedDots />
            </Text>
          </View>
        ) : null}
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={(v) => {
              setDraft(v);
              void notifyTyping(v.length > 0);
            }}
            onBlur={() => void notifyTyping(false)}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted}
            style={styles.composerInput}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          {draft.trim() ? (
            <Pressable
              onPress={handleSend}
              disabled={sendMessage.isPending}
              style={({ pressed }) => [
                styles.sendBtn,
                sendMessage.isPending && styles.sendBtnDisabled,
                pressed && { opacity: 0.7 },
              ]}
            >
              {sendMessage.isPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="send" size={18} color={colors.white} />
              )}
            </Pressable>
          ) : (
            voiceSending ? (
              <View style={styles.sendBtn}>
                <ActivityIndicator size="small" color={colors.white} />
              </View>
            ) : (
              <VoiceRecorder
                onRecorded={handleRecorded}
                disabled={sendMessage.isPending}
              />
            )
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({
  message,
  isMine,
}: {
  message: Message;
  isMine: boolean;
}) {
  const isOffer = message.messageType === "offer";
  const isVoice = message.messageType === "voice";
  const isSystem = message.messageType === "system";
  const hasReactions =
    message.reactions && Object.keys(message.reactions).length > 0;

  if (isSystem) {
    return (
      <View style={styles.systemRow}>
        <Text style={styles.systemText}>{message.content}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.bubbleRow,
        isMine ? styles.bubbleRowRight : styles.bubbleRowLeft,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
          isOffer && styles.bubbleOffer,
        ]}
      >
        {isOffer ? (
          <View style={styles.offerBadge}>
            <Ionicons name="pricetag" size={12} color={colors.gold} />
            <Text style={styles.offerBadgeText}>OFFER</Text>
          </View>
        ) : null}

        {isVoice ? (
          <View style={styles.voiceRow}>
            <Ionicons
              name="mic"
              size={18}
              color={isMine ? "#fff" : colors.primary}
            />
            <View
              style={[
                styles.voiceBar,
                { backgroundColor: isMine ? "rgba(255,255,255,0.3)" : "#d4d4d8" },
              ]}
            >
              <View
                style={[
                  styles.voiceBarFill,
                  { backgroundColor: isMine ? "#fff" : colors.primary },
                ]}
              />
            </View>
            <Text
              style={[
                styles.voiceDuration,
                { color: isMine ? "rgba(255,255,255,0.85)" : colors.muted },
              ]}
            >
              {message.mediaDurationMs
                ? `${Math.round(message.mediaDurationMs / 1000)}s`
                : ""}
            </Text>
          </View>
        ) : (
          <Text
            style={[
              styles.bubbleText,
              isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs,
            ]}
          >
            {message.content}
          </Text>
        )}

        {isOffer && message.offerAmount ? (
          <Text style={styles.offerAmount}>
            ₱
            {Number(message.offerAmount).toLocaleString("en-PH", {
              maximumFractionDigits: 0,
            })}
          </Text>
        ) : null}

        {hasReactions && (
          <View style={styles.reactionsRow}>
            {Object.entries(message.reactions!).map(([emoji, info]) => (
              <View key={emoji} style={styles.reactionPill}>
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text style={styles.reactionCount}>{info.count}</Text>
              </View>
            ))}
          </View>
        )}

        <Text
          style={[
            styles.bubbleTime,
            isMine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs,
          ]}
        >
          {formatRelativeTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },
  headerName: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  messagesList: {
    padding: spacing[3],
    gap: 8,
  },
  centerBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  bubbleRow: {
    flexDirection: "row",
    maxWidth: "100%",
  },
  bubbleRowLeft: {
    justifyContent: "flex-start",
  },
  bubbleRowRight: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.xl,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.mutedBg,
    borderBottomLeftRadius: 4,
  },
  bubbleOffer: {
    borderWidth: 2,
    borderColor: colors.gold,
  },
  bubbleText: {
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: colors.white,
  },
  bubbleTextTheirs: {
    color: colors.foreground,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
  },
  bubbleTimeMine: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },
  bubbleTimeTheirs: {
    color: colors.muted,
  },
  systemRow: {
    alignItems: "center",
    marginVertical: 6,
  },
  systemText: {
    fontSize: 11,
    fontStyle: "italic",
    color: colors.muted,
    textAlign: "center",
  },
  voiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 160,
    paddingVertical: 2,
  },
  voiceBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  voiceBarFill: {
    height: "100%",
    width: "35%",
    borderRadius: 2,
  },
  voiceDuration: {
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  reactionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  reactionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  reactionEmoji: {
    fontSize: 11,
  },
  reactionCount: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  offerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  offerBadgeText: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.gold,
    letterSpacing: 0.5,
  },
  offerAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: colors.gold,
    marginTop: 4,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: spacing[3],
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: colors.mutedBg,
    fontSize: fontSize.base,
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
  sendBtnDisabled: {
    opacity: 0.5,
  },
  typingIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  typingText: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: "italic",
  },
});

function AnimatedDots() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % 4), 300);
    return () => clearInterval(t);
  }, []);
  return <Text>{".".repeat(step)}</Text>;
}
