/**
 * Bottom-sheet reaction picker. Shows 6 emoji options in a row; tapping
 * one calls onPick with the emoji and closes the sheet.
 */
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

export const REACTION_EMOJIS = ["❤️", "🔥", "💎", "👊", "🏆", "😂"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
}

export function ReactionPicker({
  visible,
  onClose,
  onPick,
}: ReactionPickerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.sheet}
          onPress={(e) => e.stopPropagation()}
        >
          <SafeAreaView edges={["bottom"]}>
            <View style={styles.handle} />
            <Text style={styles.title}>React</Text>
            <View style={styles.emojiRow}>
              {REACTION_EMOJIS.map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => {
                    onPick(emoji);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`React with ${emoji}`}
                  style={({ pressed }) => [
                    styles.emojiBtn,
                    pressed && styles.emojiBtnPressed,
                  ]}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing[3],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.muted,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingVertical: spacing[3],
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[5],
  },
  emojiBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mutedBg,
  },
  emojiBtnPressed: {
    backgroundColor: colors.border,
    transform: [{ scale: 0.92 }],
  },
  emoji: {
    fontSize: 28,
  },
});
