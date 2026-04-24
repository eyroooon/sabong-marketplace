/**
 * Hold-to-record mic button for the chat composer.
 *
 * - Press & hold  → start recording
 * - Release       → stop + fire onRecorded (if duration >= 1 s)
 * - < 1 s clip    → silently discarded (accidental-tap guard)
 *
 * This component owns only the audio-capture concern. Uploading and
 * sending are delegated to the parent via `onRecorded`.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AudioModule, RecordingPresets, useAudioRecorder } from "expo-audio";
import { Ionicons } from "@expo/vector-icons";

import { colors, fontSize, fontWeight, radii, spacing } from "@/lib/theme";

const MIN_DURATION_MS = 1000;

export interface RecordedClip {
  uri: string;
  mimeType: string;
  durationSec: number;
}

export interface VoiceRecorderProps {
  onRecorded: (clip: RecordedClip) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onRecorded, disabled }: VoiceRecorderProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Pulse animation while recording
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.3,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
    }
  }, [isRecording, pulse]);

  const startRecording = async () => {
    if (isRecording || disabled) return;
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Microphone access needed",
          "Please allow microphone access in Settings to record voice notes.",
        );
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAtRef.current = Date.now();
      setElapsed(0);
      setIsRecording(true);
      intervalRef.current = setInterval(() => {
        if (startedAtRef.current !== null) {
          setElapsed(Date.now() - startedAtRef.current);
        }
      }, 100);
    } catch {
      Alert.alert(
        "Couldn't start recording",
        "Please try again. If this keeps happening, restart the app.",
      );
    }
  };

  const stopRecording = async (cancel: boolean) => {
    if (!isRecording) return;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const durationMs =
      startedAtRef.current !== null ? Date.now() - startedAtRef.current : 0;
    startedAtRef.current = null;
    setIsRecording(false);
    setElapsed(0);

    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (cancel || !uri) return;
      if (durationMs < MIN_DURATION_MS) {
        // Silently discard — user probably tapped by accident
        return;
      }
      onRecorded({
        uri,
        mimeType: "audio/m4a",
        durationSec: Math.round(durationMs / 1000),
      });
    } catch {
      // Swallow — recorder may already be stopped
    }
  };

  const displaySeconds = Math.floor(elapsed / 1000);
  const displayTenth = String(Math.floor((elapsed % 1000) / 100));

  return (
    <View style={styles.root}>
      {isRecording ? (
        <View style={styles.hint} pointerEvents="none">
          <View style={styles.liveDot} />
          <Text style={styles.hintText}>
            {displaySeconds}.{displayTenth}s · release to send
          </Text>
        </View>
      ) : null}

      <Pressable
        onPressIn={startRecording}
        onPressOut={() => stopRecording(false)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Hold to record voice note"
        style={[styles.btn, isRecording && styles.btnRecording]}
        hitSlop={10}
      >
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Ionicons
            name={isRecording ? "mic" : "mic-outline"}
            size={20}
            color={isRecording ? colors.white : colors.primary}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.mutedBg,
  },
  btnRecording: {
    backgroundColor: colors.primary,
  },
  hint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md,
    backgroundColor: "#fef2f2",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  hintText: {
    fontSize: fontSize.xs,
    color: colors.primaryDark,
    fontWeight: fontWeight.semibold,
  },
});
