import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useVideoPlayer, VideoView } from "expo-video";
import { colors, fontSize, fontWeight, radii, spacing } from "@/lib/theme";
import { apiPost } from "@/lib/api";

/**
 * Upload video screen — lets the seller pick a video from their camera
 * roll (or record one), see an instant in-place preview, type a caption,
 * and post it to the community feed.
 */
export default function NewVideoScreen() {
  const router = useRouter();
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);

  const player = useVideoPlayer(videoUri ?? "", (p) => {
    p.loop = true;
    p.muted = true;
  });

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to pick a video.",
      );
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.7,
      videoMaxDuration: 60,
    });

    if (!res.canceled && res.assets[0]) {
      setVideoUri(res.assets[0].uri);
      setTimeout(() => player.play(), 250);
    }
  };

  const recordVideo = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Camera access required to record.");
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.7,
      videoMaxDuration: 60,
    });

    if (!res.canceled && res.assets[0]) {
      setVideoUri(res.assets[0].uri);
      setTimeout(() => player.play(), 250);
    }
  };

  const post = async () => {
    if (!videoUri || !caption.trim()) {
      Alert.alert("Missing info", "Pick a video and add a caption first.");
      return;
    }
    setPosting(true);
    try {
      // Build multipart form data — matches API's POST /videos
      const formData = new FormData();
      formData.append("video", {
        uri: videoUri,
        name: "upload.mp4",
        type: "video/mp4",
      } as any);
      formData.append("caption", caption.trim());
      formData.append("type", "community");

      await apiPost("/videos", formData);
      Alert.alert("Posted!", "Your video is now live on the feed.");
      router.replace("/(tabs)/feed");
    } catch (err: any) {
      Alert.alert(
        "Upload failed",
        err?.message || "Please try again in a bit.",
      );
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>New Video</Text>
        <Pressable
          onPress={post}
          disabled={!videoUri || !caption.trim() || posting}
          style={({ pressed }) => [
            styles.postBtn,
            (!videoUri || !caption.trim() || posting) && { opacity: 0.5 },
            pressed && { opacity: 0.85 },
          ]}
        >
          {posting ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Preview area */}
        <View style={styles.previewBox}>
          {videoUri ? (
            <VideoView
              player={player}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              nativeControls={false}
            />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Ionicons
                name="videocam-outline"
                size={48}
                color={colors.muted}
              />
              <Text style={styles.previewHint}>No video yet</Text>
            </View>
          )}
        </View>

        {/* Picker buttons */}
        <View style={styles.pickerRow}>
          <Pressable
            onPress={pickVideo}
            style={({ pressed }) => [
              styles.pickerBtn,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="images-outline" size={20} color={colors.primary} />
            <Text style={styles.pickerBtnText}>Choose</Text>
          </Pressable>
          <Pressable
            onPress={recordVideo}
            style={({ pressed }) => [
              styles.pickerBtn,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="videocam" size={20} color={colors.primary} />
            <Text style={styles.pickerBtnText}>Record</Text>
          </Pressable>
        </View>

        {/* Caption */}
        <View style={styles.captionBox}>
          <Text style={styles.label}>Caption</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Maglagay ng caption sa Taglish..."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            style={styles.captionInput}
          />
          <Text style={styles.counter}>{caption.length}/500</Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>Tips for great videos</Text>
          <Text style={styles.tipsLine}>• Keep it under 60 seconds</Text>
          <Text style={styles.tipsLine}>• Vertical orientation works best</Text>
          <Text style={styles.tipsLine}>• Good natural lighting</Text>
          <Text style={styles.tipsLine}>• Show the bird clearly</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.black,
    color: colors.foreground,
  },
  postBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[4],
    paddingVertical: 8,
    borderRadius: radii.full,
  },
  postBtnText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  previewBox: {
    aspectRatio: 9 / 16,
    backgroundColor: colors.ink,
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  previewHint: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
  pickerRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  pickerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: "rgba(220,38,38,0.05)",
  },
  pickerBtnText: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.sm,
  },
  captionBox: {
    gap: 6,
  },
  label: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  counter: {
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: "right",
  },
  tipsBox: {
    padding: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: colors.mutedBg,
    gap: 4,
  },
  tipsTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginBottom: 4,
  },
  tipsLine: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
});
