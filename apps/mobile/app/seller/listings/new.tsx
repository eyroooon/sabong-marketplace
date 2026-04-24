// apps/mobile/app/seller/listings/new.tsx
/**
 * Create Listing — wraps ListingForm with create-specific wiring:
 *   - Two CTAs: "Save as Draft" (POST /listings, keeps status=draft) and
 *     "Publish Now" (POST /listings, then POST /listings/:id/publish)
 *   - Image upload happens after create (API requires listingId)
 *   - AI description generator via /ai-chat/generate-description
 *   - Loading overlay with stage messaging
 *   - Redirects to /seller/listings on success
 */
import React, { useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useRouter } from "expo-router";

import {
  EMPTY_LISTING_FORM,
  ListingForm,
  isListingFormValid,
  listingFormToPayload,
  type ListingFormState,
} from "@/components/seller/ListingForm";
import {
  useCreateListing,
  usePublishListing,
  useUploadListingImages,
  type LocalImage,
} from "@/lib/listings";
import { apiPost } from "@/lib/api";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

type SubmitMode = "draft" | "publish";

export default function CreateListingScreen() {
  const router = useRouter();
  const [form, setForm] = useState<ListingFormState>(EMPTY_LISTING_FORM);
  const [images, setImages] = useState<LocalImage[]>([]);
  const [submitting, setSubmitting] = useState<SubmitMode | null>(null);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [stage, setStage] = useState<string | null>(null);

  const createListing = useCreateListing();
  const publishListing = usePublishListing();
  const uploadImages = useUploadListingImages();

  const validationError = isListingFormValid(form);

  const generateDescription = async () => {
    if (!form.title.trim()) {
      Alert.alert(
        "Add a title first",
        "The AI needs a title to write a good description.",
      );
      return;
    }
    setGeneratingDesc(true);
    try {
      const res = await apiPost<{ description: string }>(
        "/ai-chat/generate-description",
        {
          title: form.title,
          breed: form.breed || undefined,
          bloodline: form.bloodline || undefined,
          category: form.category || undefined,
          ageMonths: form.ageMonths ? Number(form.ageMonths) : undefined,
          weightKg: form.weightKg || undefined,
          color: form.color || undefined,
          legColor: form.legColor || undefined,
          fightingStyle: form.fightingStyle || undefined,
          sireInfo: form.sireInfo || undefined,
          damInfo: form.damInfo || undefined,
          price: form.price || undefined,
        },
      );
      setForm({ ...form, description: res.description });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Please try again in a bit.";
      Alert.alert("AI couldn't generate", msg);
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleSubmit = async (mode: SubmitMode) => {
    if (validationError) {
      Alert.alert("Fix the form", validationError);
      return;
    }
    setSubmitting(mode);
    try {
      setStage("Creating listing…");
      const payload = listingFormToPayload(form);
      const created = await createListing.mutateAsync(payload);

      if (images.length > 0) {
        setStage(
          `Uploading ${images.length} photo${images.length > 1 ? "s" : ""}…`,
        );
        await uploadImages.mutateAsync({
          listingId: created.id,
          images,
        });
      }

      if (mode === "publish") {
        setStage("Publishing…");
        await publishListing.mutateAsync({ id: created.id });
      }

      // Keep the overlay visible until the user dismisses the alert.
      // Resetting is deferred to the alert's onPress callback.
      Alert.alert(
        mode === "publish" ? "Published!" : "Saved as draft",
        mode === "publish"
          ? "Your listing is now live on the marketplace."
          : "You can continue editing and publish later.",
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
      Alert.alert("Save failed", msg);
      setSubmitting(null);
      setStage(null);
    }
    // NOTE: no finally block — we want the overlay to persist past the
    // end of this async function on success, and dismissed state is
    // handled inline in each branch.
  };

  const busy = submitting !== null;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "New Listing",
          headerTitleStyle: { fontWeight: "800" },
        }}
      />
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <ListingForm
            form={form}
            onChange={setForm}
            images={images}
            onImagesChange={setImages}
            onGenerateDescription={generateDescription}
            isGeneratingDescription={generatingDesc}
          />

          {validationError ? (
            <Text style={styles.validationError}>{validationError}</Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={() => handleSubmit("draft")}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Save as draft"
              style={[styles.draftBtn, busy && styles.btnDisabled]}
            >
              <Text style={styles.draftBtnText}>
                {submitting === "draft" ? "Saving…" : "Save as Draft"}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => handleSubmit("publish")}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Publish listing"
              style={[styles.publishBtn, busy && styles.btnDisabled]}
            >
              <LinearGradient
                colors={["#fbbf24", "#ef4444"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.publishBtnInner}
              >
                <Text style={styles.publishBtnText}>
                  {submitting === "publish" ? "Publishing…" : "Publish Now"}
                </Text>
              </LinearGradient>
            </Pressable>
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
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing[4],
    paddingBottom: spacing[10],
    gap: spacing[4],
  },
  validationError: {
    fontSize: fontSize.sm,
    color: "#dc2626",
    marginTop: spacing[2],
  },
  actions: {
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[3],
  },
  draftBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.background,
  },
  draftBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
  },
  publishBtn: {
    flex: 1.5,
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  publishBtnInner: {
    paddingVertical: 14,
    alignItems: "center",
  },
  publishBtnText: {
    color: "#fff",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  btnDisabled: {
    opacity: 0.5,
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
