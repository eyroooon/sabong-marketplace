// apps/mobile/app/seller/verification.tsx
/**
 * Seller Verification — Gov ID + Farm Permit upload.
 *
 * Flow:
 *   - If user has no seller profile → show "Become a Seller" form first
 *     (POST /sellers/register), then reveal the upload section.
 *   - Else → two image-picker slots (Gov ID required, Farm Permit optional),
 *     submit calls POST /sellers/me/documents which transitions the
 *     verification status to "pending".
 *   - Status banner reflects current verification state.
 */
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
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";
import { PROVINCES } from "@sabong/shared";

import { FieldGroup } from "@/components/seller/FieldGroup";
import { ImagePickerGrid } from "@/components/seller/ImagePicker";
import {
  useRegisterAsSeller,
  useSellerProfile,
  useSubmitSellerVerification,
} from "@/lib/sellers";
import type { LocalImage } from "@/lib/listings";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

type VerificationStatus = "pending" | "verified" | "rejected" | null;

export default function VerificationScreen() {
  const router = useRouter();
  const seller = useSellerProfile();
  const registerSeller = useRegisterAsSeller();
  const submitDocs = useSubmitSellerVerification();

  const [govId, setGovId] = useState<LocalImage[]>([]);
  const [farmPermit, setFarmPermit] = useState<LocalImage[]>([]);

  // Become-a-seller form state (only used when profile is null)
  const [farmName, setFarmName] = useState("");
  const [farmProvince, setFarmProvince] = useState("");
  const [farmCity, setFarmCity] = useState("");
  const [busy, setBusy] = useState(false);

  if (seller.isLoading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const profile = seller.data;
  const status: VerificationStatus =
    (profile?.verificationStatus as VerificationStatus) ?? null;

  const becomeSellerAndContinue = async () => {
    if (!farmName.trim() || !farmProvince || !farmCity.trim()) {
      Alert.alert(
        "Fill in farm info",
        "We need your farm name and location to set up your seller profile.",
      );
      return;
    }
    setBusy(true);
    try {
      await registerSeller.mutateAsync({
        farmName: farmName.trim(),
        farmProvince,
        farmCity: farmCity.trim(),
        businessType: "individual",
      });
      Alert.alert(
        "Seller profile created",
        "Now upload your documents below to get verified.",
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Please try again.";
      Alert.alert("Registration failed", msg);
    } finally {
      setBusy(false);
    }
  };

  const submitVerification = async () => {
    if (govId.length === 0) {
      Alert.alert(
        "Government ID required",
        "Please attach a photo of your ID before submitting.",
      );
      return;
    }
    setBusy(true);
    try {
      await submitDocs.mutateAsync({
        governmentId: govId[0],
        farmPermit: farmPermit[0],
      });
      Alert.alert(
        "Documents submitted",
        "We'll review within 24-48 hours and notify you.",
        [
          {
            text: "OK",
            onPress: () => {
              setBusy(false);
              router.back();
            },
          },
        ],
        { cancelable: false },
      );
      return;
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Please try again in a bit.";
      Alert.alert("Submit failed", msg);
      setBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Verification",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <StatusBanner status={status} hasProfile={!!profile} />

          {!profile ? (
            <FieldGroup
              title="Step 1 — Create your seller profile"
              icon="person-outline"
              subtitle="Quick info about your farm. You can edit this anytime."
            >
              <FieldInput
                label="Farm Name *"
                placeholder="e.g. Mang Tomas Breeder"
                value={farmName}
                onChangeText={setFarmName}
              />
              <ProvinceDropdown
                value={farmProvince}
                onSelect={setFarmProvince}
              />
              <FieldInput
                label="City / Municipality *"
                placeholder="e.g. Angeles"
                value={farmCity}
                onChangeText={setFarmCity}
              />
              <Pressable
                onPress={becomeSellerAndContinue}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Create seller profile"
                style={[
                  styles.primaryBtnWrapper,
                  busy && styles.btnDisabled,
                ]}
              >
                <LinearGradient
                  colors={["#fbbf24", "#ef4444"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>
                    Create Seller Profile
                  </Text>
                </LinearGradient>
              </Pressable>
            </FieldGroup>
          ) : null}

          {profile ? (
            <>
              <FieldGroup
                title="Government ID *"
                icon="card-outline"
                subtitle="Driver's License, Passport, or National ID (front photo)."
              >
                <ImagePickerGrid
                  images={govId}
                  onChange={setGovId}
                  max={1}
                  hint="JPEG or PNG · up to 10 MB"
                />
              </FieldGroup>

              <FieldGroup
                title="Farm Permit (optional)"
                icon="document-text-outline"
                subtitle="Helps speed up verification and unlocks the verified badge."
              >
                <ImagePickerGrid
                  images={farmPermit}
                  onChange={setFarmPermit}
                  max={1}
                  hint="Optional · JPEG or PNG · up to 10 MB"
                />
              </FieldGroup>

              <Pressable
                onPress={submitVerification}
                disabled={busy || govId.length === 0}
                accessibilityRole="button"
                accessibilityLabel="Submit for verification"
                style={[
                  styles.primaryBtnWrapper,
                  (busy || govId.length === 0) && styles.btnDisabled,
                ]}
              >
                <LinearGradient
                  colors={["#fbbf24", "#ef4444"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>
                    {busy ? "Submitting…" : "Submit for Verification"}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Text style={styles.footNote}>
                Your documents are private and used only for verification.
                Review takes 24-48 hours. You'll get a notification when we're
                done.
              </Text>
            </>
          ) : null}
        </ScrollView>

        {busy ? (
          <View
            style={styles.overlay}
            accessibilityLiveRegion="polite"
            accessibilityLabel="Working…"
          >
            <ActivityIndicator color="#fff" size="large" />
          </View>
        ) : null}
      </SafeAreaView>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function StatusBanner({
  status,
  hasProfile,
}: {
  status: VerificationStatus;
  hasProfile: boolean;
}) {
  if (!hasProfile) {
    return (
      <View style={[styles.banner, styles.bannerNotStarted]}>
        <Ionicons name="alert-circle" size={18} color="#b91c1c" />
        <Text style={[styles.bannerText, { color: "#991b1b" }]}>
          You're not registered as a seller yet. Fill out the form below to
          start.
        </Text>
      </View>
    );
  }
  if (status === "verified") {
    return (
      <View style={[styles.banner, styles.bannerVerified]}>
        <Ionicons name="checkmark-circle" size={18} color="#15803d" />
        <Text style={[styles.bannerText, { color: "#166534" }]}>
          You're verified! The badge is live on your listings.
        </Text>
      </View>
    );
  }
  if (status === "pending") {
    return (
      <View style={[styles.banner, styles.bannerPending]}>
        <Ionicons name="time-outline" size={18} color="#a16207" />
        <Text style={[styles.bannerText, { color: "#854d0e" }]}>
          Under review. We'll notify you in 24-48 hours.
        </Text>
      </View>
    );
  }
  if (status === "rejected") {
    return (
      <View style={[styles.banner, styles.bannerRejected]}>
        <Ionicons name="alert-circle" size={18} color="#b91c1c" />
        <Text style={[styles.bannerText, { color: "#991b1b" }]}>
          Your last submission was rejected. Please re-upload clearer
          documents below.
        </Text>
      </View>
    );
  }
  // Not started
  return (
    <View style={[styles.banner, styles.bannerInfo]}>
      <Ionicons
        name="information-circle"
        size={18}
        color={colors.muted}
      />
      <Text style={[styles.bannerText, { color: colors.foreground }]}>
        Upload your documents below to get a verified seller badge.
      </Text>
    </View>
  );
}

function FieldInput({
  label,
  placeholder,
  value,
  onChangeText,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={colors.muted}
        style={styles.textInput}
      />
    </View>
  );
}

function ProvinceDropdown({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.fieldLabel}>Province *</Text>
      <Pressable
        style={styles.textInput}
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        accessibilityLabel="Province"
      >
        <View style={styles.dropdownTrigger}>
          <Text
            style={[
              styles.dropdownValue,
              !value && styles.dropdownPlaceholder,
            ]}
          >
            {value || "Select…"}
          </Text>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.muted}
          />
        </View>
      </Pressable>
      {open ? (
        <ScrollView
          style={styles.dropdownList}
          nestedScrollEnabled
        >
          {PROVINCES.map((p) => (
            <Pressable
              key={p.name}
              style={[
                styles.dropdownItem,
                p.name === value && styles.dropdownItemActive,
              ]}
              onPress={() => {
                onSelect(p.name);
                setOpen(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  p.name === value && styles.dropdownItemTextActive,
                ]}
              >
                {p.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  centred: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[10],
    gap: spacing[4],
  },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: spacing[3],
    borderRadius: radii.lg,
  },
  bannerNotStarted: { backgroundColor: "#fef2f2" },
  bannerVerified: { backgroundColor: "#f0fdf4" },
  bannerPending: { backgroundColor: "#fef9c3" },
  bannerRejected: { backgroundColor: "#fef2f2" },
  bannerInfo: { backgroundColor: colors.mutedBg },
  bannerText: {
    flex: 1,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
  fieldWrapper: { gap: 4 },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.base,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownValue: {
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  dropdownPlaceholder: {
    color: colors.muted,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    maxHeight: 240,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemActive: {
    backgroundColor: colors.mutedBg,
  },
  dropdownItemText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  primaryBtnWrapper: {
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  primaryBtn: {
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  footNote: {
    fontSize: fontSize.xs,
    color: colors.muted,
    lineHeight: 18,
    paddingHorizontal: spacing[2],
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
});
