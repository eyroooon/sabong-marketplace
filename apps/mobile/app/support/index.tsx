// apps/mobile/app/support/index.tsx
/**
 * AI Support — ask questions about the marketplace, sabong, bloodlines,
 * etc. Powered by Claude (backend /ai-chat endpoint). Rate-limited per
 * user per day.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  useAiQuota,
  useSendAiMessage,
  type AiMessage,
} from "@/lib/ai-chat";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

const SUGGESTED_PROMPTS = [
  "Ano ang pinakamabuting bloodline para sa beginner?",
  "Paano ba mag-alaga ng Kelso?",
  "How does escrow work here?",
  "What's the platform fee?",
];

export default function AiSupportScreen() {
  const quota = useAiQuota();
  const sendMessage = useSendAiMessage();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<AiMessage>>(null);

  const canSend =
    draft.trim().length > 0 &&
    !sendMessage.isPending &&
    !(quota.data && !quota.data.isUnlimited && quota.data.remaining <= 0);

  const handleSend = async (override?: string) => {
    const userText = (override ?? draft).trim();
    if (!userText) return;
    setError(null);
    const next: AiMessage[] = [...messages, { role: "user", content: userText }];
    setMessages(next);
    setDraft("");
    try {
      const res = await sendMessage.mutateAsync({ messages: next });
      setMessages([
        ...next,
        { role: "assistant", content: res.text || "(no response)" },
      ]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      // Don't add an assistant turn on error
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  const quotaHint = !quota.data
    ? ""
    : quota.data.isUnlimited
      ? "Unlimited"
      : `${quota.data.remaining} of ${quota.data.limit} left today`;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "AI Support",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
        >
          {quotaHint ? (
            <View style={styles.quotaBar}>
              <Ionicons name="sparkles" size={14} color={colors.primary} />
              <Text style={styles.quotaText}>{quotaHint}</Text>
            </View>
          ) : null}

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyState onPick={handleSend} />}
            renderItem={({ item }) => <Bubble message={item} />}
            ListFooterComponent={
              sendMessage.isPending ? (
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={colors.muted} />
                  <Text style={styles.typingText}>Claude is thinking...</Text>
                </View>
              ) : null
            }
          />

          {error ? (
            <View style={styles.errorBar}>
              <Ionicons name="alert-circle" size={14} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Tanong ka lang — type here..."
              placeholderTextColor={colors.muted}
              style={styles.input}
              multiline
              maxLength={1000}
              editable={!sendMessage.isPending}
              accessibilityLabel="Message AI assistant"
            />
            <Pressable
              onPress={() => void handleSend()}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

// Sub-components

function Bubble({ message }: { message: AiMessage }) {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <View style={styles.bubbleUserWrap}>
        <LinearGradient
          colors={["#fbbf24", "#ef4444"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bubbleUser}
        >
          <Text style={styles.bubbleUserText}>{message.content}</Text>
        </LinearGradient>
      </View>
    );
  }
  return (
    <View style={styles.bubbleAssistantWrap}>
      <View style={styles.bubbleAssistant}>
        <Text style={styles.bubbleAssistantText}>{message.content}</Text>
      </View>
    </View>
  );
}

function EmptyState({ onPick }: { onPick: (q: string) => void }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>✨</Text>
      <Text style={styles.emptyTitle}>Ask me anything about sabong</Text>
      <Text style={styles.emptySubtitle}>
        I can help with bloodlines, care tips, how BloodlinePH works, and
        more. Sagot sa Taglish or English.
      </Text>
      <View style={styles.promptGrid}>
        {SUGGESTED_PROMPTS.map((prompt) => (
          <Pressable
            key={prompt}
            onPress={() => onPick(prompt)}
            accessibilityRole="button"
            accessibilityLabel={`Ask: ${prompt}`}
            style={styles.promptChip}
          >
            <Text style={styles.promptText} numberOfLines={2}>
              {prompt}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  kav: { flex: 1 },
  quotaBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    backgroundColor: colors.mutedBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quotaText: {
    fontSize: fontSize.xs,
    color: colors.muted,
    fontWeight: fontWeight.semibold,
  },
  list: {
    padding: spacing[3],
    gap: spacing[2],
    flexGrow: 1,
  },
  bubbleUserWrap: {
    alignItems: "flex-end",
  },
  bubbleUser: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.lg,
    borderBottomRightRadius: 4,
  },
  bubbleUserText: {
    color: "#fff",
    fontSize: fontSize.base,
    lineHeight: 22,
  },
  bubbleAssistantWrap: {
    alignItems: "flex-start",
  },
  bubbleAssistant: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.lg,
    borderBottomLeftRadius: 4,
    backgroundColor: colors.mutedBg,
  },
  bubbleAssistantText: {
    color: colors.foreground,
    fontSize: fontSize.base,
    lineHeight: 22,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.lg,
    backgroundColor: colors.mutedBg,
    alignSelf: "flex-start",
    marginTop: spacing[2],
  },
  typingText: {
    fontSize: fontSize.xs,
    color: colors.muted,
    fontStyle: "italic",
  },
  errorBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    backgroundColor: "#fef2f2",
  },
  errorText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: "#991b1b",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.base,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[4],
    gap: spacing[2],
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  promptGrid: {
    gap: 8,
    width: "100%",
    maxWidth: 360,
  },
  promptChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  promptText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    textAlign: "center",
  },
});
