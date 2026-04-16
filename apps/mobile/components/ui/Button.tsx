import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fontSize, fontWeight, gradients, radii } from "@/lib/theme";

export type ButtonVariant = "primary" | "gold" | "ghost" | "outline";

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  onPress,
  children,
  variant = "primary",
  disabled,
  loading,
  icon,
  fullWidth,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const inner = (
    <>
      {loading ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : (
        <>
          {icon}
          <Text style={textStyles[variant]}>{children}</Text>
        </>
      )}
    </>
  );

  if (variant === "gold") {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={[
          styles.base,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
        ]}
      >
        <LinearGradient
          colors={gradients.flame}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.base, styles.inner]}
        >
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        styles.inner,
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  inner: {
    minHeight: 48,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  disabled: {
    opacity: 0.5,
  },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: colors.primary,
  },
  gold: {
    // handled via LinearGradient branch above
  },
  ghost: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  outline: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.primary,
  },
};

const textStyles = StyleSheet.create({
  primary: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  gold: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  ghost: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  outline: {
    color: colors.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
