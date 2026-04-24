// apps/mobile/components/seller/ImagePicker.tsx
/**
 * Multi-image picker with preview grid + "add more" + remove.
 * Wraps `expo-image-picker` and produces `LocalImage[]` ready for
 * useUploadListingImages / useSubmitSellerVerification.
 */
import React from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import type { LocalImage } from "@/lib/listings";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

interface ImagePickerProps {
  images: LocalImage[];
  onChange: (next: LocalImage[]) => void;
  max?: number;
  /** Optional note shown under the picker, e.g. "JPEG or PNG · 5MB max" */
  hint?: string;
}

export function ImagePickerGrid({
  images,
  onChange,
  max = 5,
  hint,
}: ImagePickerProps) {
  const canAdd = images.length < max;

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to add images.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: max - images.length,
      quality: 0.85,
    });
    if (result.canceled) return;
    const picked: LocalImage[] = result.assets.map((a) => ({
      uri: a.uri,
      name: a.fileName || a.uri.split("/").pop() || "image.jpg",
      type: a.mimeType || (a.uri.endsWith(".png") ? "image/png" : "image/jpeg"),
    }));
    onChange([...images, ...picked].slice(0, max));
  };

  const remove = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <View>
      <View style={styles.grid}>
        {images.map((img, idx) => (
          <View key={`${img.uri}-${idx}`} style={styles.tile}>
            <Image source={{ uri: img.uri }} style={styles.tileImg} />
            {idx === 0 ? (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryBadgeText}>Primary</Text>
              </View>
            ) : null}
            <Pressable
              onPress={() => remove(idx)}
              hitSlop={8}
              style={styles.removeBtn}
            >
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
        ))}
        {canAdd ? (
          <Pressable style={[styles.tile, styles.addTile]} onPress={pick}>
            <Ionicons
              name="add"
              size={28}
              color={colors.muted}
            />
            <Text style={styles.addLabel}>Add photo</Text>
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <Text style={styles.counter}>
        {images.length} / {max} photos
        {images.length > 0 ? " · first photo is primary" : ""}
      </Text>
    </View>
  );
}

const TILE = 96;
const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: radii.md,
    overflow: "hidden",
    position: "relative",
  },
  tileImg: {
    width: "100%",
    height: "100%",
  },
  addTile: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.mutedBg,
  },
  addLabel: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  primaryBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: fontWeight.bold,
  },
  removeBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 6,
  },
  hint: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 4,
    fontStyle: "italic",
  },
});
