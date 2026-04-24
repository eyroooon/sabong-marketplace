// apps/mobile/components/seller/FieldGroup.tsx
/**
 * Section container for seller forms. Renders an optional title + icon
 * followed by a card of fields. Used by the Create/Edit listing form
 * and the Verification form to keep visual rhythm consistent.
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

interface FieldGroupProps {
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  subtitle?: string;
  children: React.ReactNode;
}

export function FieldGroup({
  title,
  icon,
  subtitle,
  children,
}: FieldGroupProps) {
  return (
    <View style={styles.group}>
      {title ? (
        <View style={styles.header}>
          {icon ? (
            <Ionicons name={icon} size={16} color={colors.primary} />
          ) : null}
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing[2],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  card: {
    padding: spacing[3],
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing[3],
  },
});
