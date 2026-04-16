import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight } from "@/lib/theme";

export default function FeedScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.empty}>
        <Ionicons name="play-circle-outline" size={48} color={colors.white} />
        <Text style={styles.emptyTitle}>Sabungero Feed</Text>
        <Text style={styles.emptyText}>
          Vertical video feed coming in Phase 4. Mag-post, mag-like, mag-follow.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 22,
  },
});
