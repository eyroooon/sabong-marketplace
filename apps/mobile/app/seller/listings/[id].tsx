// apps/mobile/app/seller/listings/[id].tsx
/**
 * Edit Listing — cousin of the Create screen, preloaded from API.
 *
 * Loading strategy: look up slug from useMyListings cache, then load
 * full detail via useListingBySlug (which includes images).
 *
 * Status-aware secondary CTA in addition to "Save Changes":
 *   - draft     → Publish
 *   - active    → Archive
 *   - archived  → Republish
 *   - reserved  → (none — buyer locked)
 *   - sold      → (none — final)
 *
 * Delete button in header is only shown for drafts.
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import {
  EMPTY_LISTING_FORM,
  ListingForm,
  isListingFormValid,
  listingFormToPayload,
  type ListingFormState,
} from "@/components/seller/ListingForm";
import {
  useArchiveListing,
  useDeleteListing,
  useDeleteListingImage,
  useListingBySlug,
  useMyListings,
  usePublishListing,
  useUpdateListing,
  useUploadListingImages,
  type Listing,
  type LocalImage,
} from "@/lib/listings";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

type BusyMode = "save" | "publish" | "archive" | "republish" | "delete";

export default function EditListingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const myListings = useMyListings();
  const slug = useMemo(
    () => myListings.data?.data.find((l) => l.id === id)?.slug,
    [myListings.data, id],
  );
  const detail = useListingBySlug(slug);
  const existing = detail.data;

  const [form, setForm] = useState<ListingFormState>(EMPTY_LISTING_FORM);
  const [newImages, setNewImages] = useState<LocalImage[]>([]);
  const [submitting, setSubmitting] = useState<BusyMode | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [initialised, setInitialised] = useState(false);

  const updateListing = useUpdateListing();
  const publishListing = usePublishListing();
  const archiveListing = useArchiveListing();
  const deleteListing = useDeleteListing();
  const uploadImages = useUploadListingImages();
  const deleteImage = useDeleteListingImage();

  useEffect(() => {
    if (!existing || initialised) return;
    setForm({
      title: existing.title ?? "",
      description: existing.description ?? "",
      category: existing.category ?? "",
      breed: existing.breed ?? "",
      bloodline: existing.bloodline ?? "",
      ageMonths:
        existing.ageMonths !== null && existing.ageMonths !== undefined
          ? String(existing.ageMonths)
          : "",
      weightKg: existing.weightKg ?? "",
      color: existing.color ?? "",
      legColor: existing.legColor ?? "",
      fightingStyle: existing.fightingStyle ?? "",
      sireInfo: existing.sireInfo ?? "",
      damInfo: existing.damInfo ?? "",
      vaccinationStatus: existing.vaccinationStatus ?? "",
      price: existing.price ?? "",
      priceType:
        (existing.priceType as ListingFormState["priceType"]) ?? "fixed",
      locationProvince: existing.locationProvince ?? "",
      locationCity: existing.locationCity ?? "",
      shippingAreas:
        (existing.shippingAreas as ListingFormState["shippingAreas"]) ??
        "local",
      shippingFee: existing.shippingFee ?? "",
    });
    setInitialised(true);
  }, [existing, initialised]);

  const existingImages = useMemo(
    () =>
      existing?.images
        ?.slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((img) => ({ id: img.id, url: img.url })) ?? [],
    [existing?.images],
  );

  const status: Listing["status"] | undefined = existing?.status;
  const validationError = isListingFormValid(form);
  const busy = submitting !== null;

  // ─── Early return: loading / not found ────────────────────────────────
  if (myListings.isLoading || (slug && detail.isLoading)) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!slug || (detail.isFetched && !existing)) {
    return (
      <View style={styles.centred}>
        <Text style={styles.notFound}>Listing not found.</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // ─── Action handlers ────────────────────────────────────────────────
  const doSave = async () => {
    if (validationError) {
      Alert.alert("Fix the form", validationError);
      return;
    }
    setSubmitting("save");
    try {
      setStage("Saving…");
      await updateListing.mutateAsync({
        id: id!,
        patch: listingFormToPayload(form),
      });
      if (newImages.length > 0) {
        setStage(
          `Uploading ${newImages.length} photo${newImages.length > 1 ? "s" : ""}…`,
        );
        await uploadImages.mutateAsync({
          listingId: id!,
          images: newImages,
        });
        setNewImages([]);
      }
      Alert.alert(
        "Saved",
        "Your changes have been saved.",
        [
          {
            text: "OK",
            onPress: () => {
              setSubmitting(null);
              setStage(null);
            },
          },
        ],
        { cancelable: false },
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Please try again.";
      Alert.alert("Save failed", msg);
      setSubmitting(null);
      setStage(null);
    }
  };

  const doPublish = async () => {
    if (validationError) {
      Alert.alert("Fix the form before publishing", validationError);
      return;
    }
    setSubmitting("publish");
    try {
      setStage("Saving changes…");
      await updateListing.mutateAsync({
        id: id!,
        patch: listingFormToPayload(form),
      });
      if (newImages.length > 0) {
        setStage("Uploading photos…");
        await uploadImages.mutateAsync({
          listingId: id!,
          images: newImages,
        });
        setNewImages([]);
      }
      setStage("Publishing…");
      await publishListing.mutateAsync({ id: id! });
      Alert.alert(
        "Published!",
        "Your listing is now live.",
        [
          {
            text: "View My Listings",
            onPress: () => {
              setSubmitting(null);
              setStage(null);
              router.replace("/seller/listings");
            },
          },
        ],
        { cancelable: false },
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Please try again.";
      Alert.alert("Publish failed", msg);
      setSubmitting(null);
      setStage(null);
    }
  };

  const doArchive = () => {
    Alert.alert(
      "Archive this listing?",
      "It will be hidden from the marketplace. You can republish anytime.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            setSubmitting("archive");
            try {
              await archiveListing.mutateAsync({ id: id! });
              router.replace("/seller/listings");
            } catch (err: unknown) {
              const msg =
                err instanceof Error ? err.message : "Try again.";
              Alert.alert("Archive failed", msg);
            } finally {
              setSubmitting(null);
            }
          },
        },
      ],
    );
  };

  const doRepublish = async () => {
    setSubmitting("republish");
    try {
      await publishListing.mutateAsync({ id: id! });
      Alert.alert(
        "Republished!",
        "Your listing is active again.",
        [
          {
            text: "OK",
            onPress: () => setSubmitting(null),
          },
        ],
        { cancelable: false },
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Try again.";
      Alert.alert("Republish failed", msg);
      setSubmitting(null);
    }
  };

  const doDelete = () => {
    Alert.alert(
      "Delete this draft?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setSubmitting("delete");
            try {
              await deleteListing.mutateAsync({ id: id! });
              router.replace("/seller/listings");
            } catch (err: unknown) {
              const msg =
                err instanceof Error ? err.message : "Try again.";
              Alert.alert("Delete failed", msg);
              setSubmitting(null);
            }
          },
        },
      ],
    );
  };

  const doDeleteImage = (imageId: string) => {
    Alert.alert("Remove this photo?", "This removes it permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          deleteImage
            .mutateAsync({ listingId: id!, imageId })
            .catch((err: unknown) => {
              const msg =
                err instanceof Error ? err.message : "Try again.";
              Alert.alert("Remove failed", msg);
            });
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Edit Listing",
          headerTitleStyle: { fontWeight: "800" },
          headerRight:
            status === "draft"
              ? () => (
                  <Pressable
                    onPress={doDelete}
                    disabled={busy}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Delete draft"
                    style={({ pressed }) =>
                      pressed ? styles.headerBtnPressed : undefined
                    }
                  >
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color="#dc2626"
                    />
                  </Pressable>
                )
              : undefined,
        }}
      />
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {status ? (
            <View style={styles.statusBanner}>
              <Ionicons
                name={
                  status === "active"
                    ? "checkmark-circle"
                    : status === "archived"
                      ? "archive"
                      : status === "reserved"
                        ? "lock-closed"
                        : status === "sold"
                          ? "ribbon"
                          : "time-outline"
                }
                size={16}
                color={colors.muted}
              />
              <Text style={styles.statusBannerText}>
                Status:{" "}
                <Text style={styles.statusBannerValue}>{status}</Text>
              </Text>
            </View>
          ) : null}

          <ListingForm
            form={form}
            onChange={setForm}
            images={newImages}
            onImagesChange={setNewImages}
            existingImages={existingImages}
            onRemoveExistingImage={doDeleteImage}
          />

          {validationError ? (
            <Text style={styles.validationError}>{validationError}</Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={doSave}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Save changes"
              style={[styles.saveBtn, busy && styles.btnDisabled]}
            >
              <Text style={styles.saveBtnText}>
                {submitting === "save" ? "Saving…" : "Save Changes"}
              </Text>
            </Pressable>

            {status === "draft" ? (
              <Pressable
                onPress={doPublish}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Publish listing"
                style={[styles.publishBtn, busy && styles.btnDisabled]}
              >
                <LinearGradient
                  colors={["#fbbf24", "#ef4444"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.secondaryBtnInner}
                >
                  <Text style={styles.secondaryBtnText}>
                    {submitting === "publish" ? "Publishing…" : "Publish"}
                  </Text>
                </LinearGradient>
              </Pressable>
            ) : status === "active" ? (
              <Pressable
                onPress={doArchive}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Archive listing"
                style={[styles.archiveBtn, busy && styles.btnDisabled]}
              >
                <Text style={styles.archiveBtnText}>
                  {submitting === "archive" ? "Archiving…" : "Archive"}
                </Text>
              </Pressable>
            ) : status === "archived" ? (
              <Pressable
                onPress={doRepublish}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel="Republish listing"
                style={[styles.publishBtn, busy && styles.btnDisabled]}
              >
                <LinearGradient
                  colors={["#10b981", "#14b8a6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.secondaryBtnInner}
                >
                  <Text style={styles.secondaryBtnText}>
                    {submitting === "republish"
                      ? "Republishing…"
                      : "Republish"}
                  </Text>
                </LinearGradient>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>

        {busy ? (
          <View
            style={styles.overlay}
            accessibilityLiveRegion="polite"
            accessibilityLabel={stage ?? "Working…"}
          >
            <ActivityIndicator color="#fff" size="large" />
            {stage ? <Text style={styles.stageText}>{stage}</Text> : null}
          </View>
        ) : null}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  centred: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: spacing[3],
  },
  notFound: {
    fontSize: fontSize.base,
    color: colors.muted,
  },
  backLink: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[10],
    gap: spacing[4],
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.mutedBg,
    alignSelf: "flex-start",
  },
  statusBannerText: {
    fontSize: fontSize.xs,
    color: colors.muted,
    textTransform: "capitalize",
  },
  statusBannerValue: {
    fontWeight: fontWeight.bold,
  },
  validationError: {
    fontSize: fontSize.sm,
    color: "#dc2626",
  },
  actions: {
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[2],
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  saveBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  publishBtn: {
    flex: 1.2,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  secondaryBtnInner: {
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#fff",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  archiveBtn: {
    flex: 1.2,
    paddingVertical: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.mutedBg,
    alignItems: "center",
  },
  archiveBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.muted,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  headerBtnPressed: {
    opacity: 0.6,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
  },
  stageText: {
    color: "#fff",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});
