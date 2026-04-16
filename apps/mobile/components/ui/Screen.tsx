import React from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  dark?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function Screen({
  children,
  scroll = false,
  dark = false,
  padded = true,
  style,
  contentStyle,
}: ScreenProps) {
  const bg = dark ? colors.ink : colors.mutedBg;

  const body = (
    <View style={[padded && styles.padded, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }, style]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  padded: {
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
