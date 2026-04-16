import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, fontWeight } from "@/lib/theme";

export default function BrowseScreen() {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Browse Listings</Text>
      </View>
      <View style={styles.empty}>
        <Ionicons name="search-outline" size={48} color={colors.muted} />
        <Text style={styles.emptyTitle}>Coming in Phase 2</Text>
        <Text style={styles.emptyText}>
          Marketplace browse with filters, search, and infinite scroll will land
          here next.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.mutedBg,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: colors.foreground,
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
    color: colors.foreground,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },
});
