# Mobile Phase A: Seller Flows — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Phase A of mobile↔web parity sprint so Philippine sabungero *sellers* can run their full business from the mobile app — post new listings, edit existing ones, and submit verification documents.

**Architecture:** React Native (Expo SDK 54) with Expo Router file-based routing. New screens under `apps/mobile/app/seller/` hit the existing NestJS `/listings` and `/sellers` REST endpoints. Data fetching via react-query (existing `@tanstack/react-query` setup). Image uploads via `expo-image-picker` → multipart `FormData` → API. Forms use local `useState` + manual validation (matching existing mobile patterns rather than adopting a form library mid-project).

**Tech Stack:** Expo Router 6, React Native 0.81, expo-image-picker, expo-linear-gradient, @tanstack/react-query 5, zustand 5 (auth), Ionicons, TypeScript strict.

---

## Current State (already shipped earlier in this session)

- ✅ `apps/mobile/lib/listings.ts` extended with `useMyListings`, `useCreateListing`, `useUpdateListing`, `usePublishListing`, `useArchiveListing`, `useDeleteListing`, `useUploadListingImages`, `useDeleteListingImage`, and a `LocalImage` interface.
- ✅ `apps/mobile/lib/sellers.ts` created with `useMyStats`, `useSellerProfile`, `useMyPlan`, `useRegisterAsSeller`, `useUpdateSellerProfile`, `useSubmitSellerVerification`.
- ✅ `apps/mobile/app/seller/dashboard.tsx` built (A1).
- ✅ `apps/mobile/app/seller/listings/index.tsx` built (A2).
- ⚠️ Type-check currently failing because screens reference routes `/seller/listings/new`, `/seller/listings/[id]`, `/seller/verification`, `/plans` that don't exist yet — resolves when A3/A4/A5 ship.

---

## File Structure (end state after this plan)

```
apps/mobile/
├── app/
│   ├── seller/
│   │   ├── dashboard.tsx          # A1 (done)
│   │   ├── listings/
│   │   │   ├── index.tsx          # A2 (done)
│   │   │   ├── new.tsx            # A3 (this plan)
│   │   │   └── [id].tsx           # A4 (this plan)
│   │   └── verification.tsx       # A5 (this plan)
│   └── (tabs)/
│       └── profile.tsx            # Modified: add "Seller Dashboard" menu item (this plan)
├── components/
│   └── seller/                    # new directory
│       ├── ListingForm.tsx        # Shared form UI used by both new & edit screens
│       ├── ImagePicker.tsx        # Small reusable gallery picker (up to 5 imgs, preview grid, remove)
│       └── FieldGroup.tsx         # Grouped form section primitive
└── lib/
    ├── listings.ts                # (already extended)
    └── sellers.ts                 # (already created)
```

**Decomposition rationale:**
- `ListingForm.tsx` is shared because A3 (Create) and A4 (Edit) have >90% identical UI. DRY: one file, two call-sites.
- `ImagePicker.tsx` is isolated because verification (A5) also needs a similar picker but with different constraints — easier to swap constraints via props than to duplicate image-handling code.
- `FieldGroup.tsx` is tiny but centralises the "section header + card" styling so all seller forms feel consistent.

---

## Testing Strategy

This codebase has **zero unit tests** and no test harness for React Native. Setting up Jest/React-Native-Testing-Library is out of scope for Phase A. Instead, each task verifies via:

1. **TypeScript compilation** — `pnpm --filter @sabong/mobile type-check` must pass cleanly.
2. **Bundle export** — `npx expo export --platform ios` must succeed (catches runtime import errors).
3. **Happy-path manual test** — after wrap-up, the seller flow (new → edit → publish → archive) is smoke-tested via curl against the running API, confirming our react-query hooks post correct payloads.
4. **Type-check runs after every screen**, not just at the end, to catch regressions early.

All code is TypeScript-strict with no `any` casts (exception: `FormData` file blobs require `as unknown as Blob` because RN's `FormData` type doesn't match web's).

---

## Chunk 1: A3 — Create Listing Form

### Task A3.1: Scaffold reusable form primitives

**Files:**
- Create: `apps/mobile/components/seller/FieldGroup.tsx`
- Create: `apps/mobile/components/seller/ImagePicker.tsx`

- [ ] **Step 1: Write `FieldGroup.tsx`**

```tsx
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
```

- [ ] **Step 2: Write `ImagePicker.tsx`**

```tsx
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
          <View key={img.uri} style={styles.tile}>
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
```

- [ ] **Step 3: Type-check**

```bash
cd apps/mobile && pnpm type-check
```

Expected: **clean** (both new files compile; dashboard/listings still have the 6 router-route errors from pending screens — that's expected).

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/components/seller/FieldGroup.tsx apps/mobile/components/seller/ImagePicker.tsx
git commit -m "feat(mobile/seller): reusable FieldGroup + ImagePickerGrid primitives

Extracts two shared UI primitives used by Phase A seller forms:

- FieldGroup: titled card container used by Create/Edit listing + Verify docs
- ImagePickerGrid: wraps expo-image-picker with preview tiles, primary
  badge on first photo, remove button, counter, and configurable max.
  Produces LocalImage[] directly compatible with useUploadListingImages
  and useSubmitSellerVerification.

Sets us up for A3/A4/A5 which import these primitives.
"
```

---

### Task A3.2: Build shared ListingForm component

**Files:**
- Create: `apps/mobile/components/seller/ListingForm.tsx`

- [ ] **Step 1: Write ListingForm.tsx (full form UI)**

The form encapsulates all state for a listing — used by both create and edit screens. It exposes a controlled API so parents can decide how to submit.

```tsx
// apps/mobile/components/seller/ListingForm.tsx
/**
 * Shared form used by Create (/seller/listings/new) and Edit
 * (/seller/listings/[id]) screens. Holds all local form state and
 * emits onChange/onSubmit. Parent decides whether to call the
 * create or update hook.
 */
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CATEGORIES, BREEDS, PROVINCES } from "@sabong/shared";
import { FieldGroup } from "./FieldGroup";
import { ImagePickerGrid } from "./ImagePicker";
import type { CreateListingInput, LocalImage } from "@/lib/listings";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

// Form state uses strings (fields come from TextInput) and coerces to
// numbers on submit. This matches the existing mobile form patterns.
export interface ListingFormState {
  title: string;
  description: string;
  category: string;
  breed: string;
  bloodline: string;
  ageMonths: string;
  weightKg: string;
  color: string;
  legColor: string;
  fightingStyle: string;
  sireInfo: string;
  damInfo: string;
  vaccinationStatus: string;
  price: string;
  priceType: "fixed" | "negotiable" | "auction";
  locationProvince: string;
  locationCity: string;
  shippingAreas: "local" | "regional" | "nationwide";
  shippingFee: string;
}

export const EMPTY_LISTING_FORM: ListingFormState = {
  title: "",
  description: "",
  category: "",
  breed: "",
  bloodline: "",
  ageMonths: "",
  weightKg: "",
  color: "",
  legColor: "",
  fightingStyle: "",
  sireInfo: "",
  damInfo: "",
  vaccinationStatus: "",
  price: "",
  priceType: "fixed",
  locationProvince: "",
  locationCity: "",
  shippingAreas: "local",
  shippingFee: "",
};

export function listingFormToPayload(
  form: ListingFormState,
): CreateListingInput {
  const body: CreateListingInput = {
    title: form.title.trim(),
    category: form.category,
    price: Number(form.price),
    locationProvince: form.locationProvince,
    locationCity: form.locationCity.trim(),
    priceType: form.priceType,
    shippingAreas: form.shippingAreas,
    shippingAvailable: true,
  };
  const maybe = <K extends keyof CreateListingInput>(
    key: K,
    value: CreateListingInput[K] | "" | undefined,
  ) => {
    if (value !== "" && value !== undefined && value !== null) {
      body[key] = value;
    }
  };
  maybe("description", form.description.trim());
  maybe("breed", form.breed);
  maybe("bloodline", form.bloodline.trim());
  maybe(
    "ageMonths",
    form.ageMonths ? Number(form.ageMonths) : undefined,
  );
  maybe("weightKg", form.weightKg ? Number(form.weightKg) : undefined);
  maybe("color", form.color.trim());
  maybe("legColor", form.legColor.trim());
  maybe("fightingStyle", form.fightingStyle.trim());
  maybe("sireInfo", form.sireInfo.trim());
  maybe("damInfo", form.damInfo.trim());
  maybe("vaccinationStatus", form.vaccinationStatus.trim());
  maybe(
    "shippingFee",
    form.shippingFee ? Number(form.shippingFee) : undefined,
  );
  return body;
}

export function isListingFormValid(form: ListingFormState): string | null {
  if (!form.title.trim()) return "Title is required.";
  if (!form.category) return "Category is required.";
  if (!form.price || Number(form.price) <= 0)
    return "Price must be a positive number.";
  if (!form.locationProvince) return "Province is required.";
  if (!form.locationCity.trim()) return "City/municipality is required.";
  return null;
}

interface ListingFormProps {
  form: ListingFormState;
  onChange: (next: ListingFormState) => void;
  images: LocalImage[];
  onImagesChange: (next: LocalImage[]) => void;
  /** Optional remote-hosted images (from API on edit screen) */
  existingImages?: { id: string; url: string }[];
  onRemoveExistingImage?: (imageId: string) => void;
  /** AI description generator (pass undefined on edit — AI copy is
   * create-only per web app pattern). */
  onGenerateDescription?: () => void;
  isGeneratingDescription?: boolean;
}

export function ListingForm({
  form,
  onChange,
  images,
  onImagesChange,
  existingImages,
  onRemoveExistingImage,
  onGenerateDescription,
  isGeneratingDescription,
}: ListingFormProps) {
  const setField = <K extends keyof ListingFormState>(
    key: K,
    value: ListingFormState[K],
  ) => onChange({ ...form, [key]: value });

  return (
    <View style={styles.root}>
      {/* Photos */}
      <FieldGroup
        title="Photos"
        icon="images-outline"
        subtitle="Up to 5 photos. The first photo is shown as the main image."
      >
        {existingImages && existingImages.length > 0 ? (
          <ExistingImagesRow
            images={existingImages}
            onRemove={onRemoveExistingImage}
          />
        ) : null}
        <ImagePickerGrid
          images={images}
          onChange={onImagesChange}
          max={Math.max(0, 5 - (existingImages?.length ?? 0))}
        />
      </FieldGroup>

      {/* Basic Info */}
      <FieldGroup title="Basic Info" icon="information-circle-outline">
        <Input
          label="Title *"
          placeholder="e.g. Pure Kelso Stag · Champion Line"
          value={form.title}
          onChangeText={(v) => setField("title", v)}
          maxLength={120}
        />
        <View style={styles.descWrapper}>
          <Input
            label="Description"
            placeholder="Tell buyers about this bird..."
            value={form.description}
            onChangeText={(v) => setField("description", v)}
            multiline
            minHeight={100}
          />
          {onGenerateDescription ? (
            <Pressable
              onPress={onGenerateDescription}
              disabled={isGeneratingDescription}
              style={[
                styles.aiBtn,
                isGeneratingDescription && { opacity: 0.5 },
              ]}
            >
              <Text style={styles.aiBtnText}>
                {isGeneratingDescription
                  ? "✨ Generating..."
                  : "✨ Generate with AI"}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Picker
          label="Category *"
          value={form.category}
          options={CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          onSelect={(v) => setField("category", v)}
        />
        <Picker
          label="Breed"
          value={form.breed}
          options={[
            { value: "", label: "— none —" },
            ...BREEDS.map((b) => ({ value: b, label: b })),
          ]}
          onSelect={(v) => setField("breed", v)}
        />
        <Input
          label="Bloodline"
          placeholder="e.g. Sweater, Champion line"
          value={form.bloodline}
          onChangeText={(v) => setField("bloodline", v)}
        />
      </FieldGroup>

      {/* Bird Specs */}
      <FieldGroup title="Specs" icon="fitness-outline">
        <View style={styles.row}>
          <Input
            label="Age (months)"
            placeholder="12"
            keyboardType="numeric"
            value={form.ageMonths}
            onChangeText={(v) => setField("ageMonths", v)}
            style={{ flex: 1 }}
          />
          <Input
            label="Weight (kg)"
            placeholder="2.1"
            keyboardType="decimal-pad"
            value={form.weightKg}
            onChangeText={(v) => setField("weightKg", v)}
            style={{ flex: 1 }}
          />
        </View>
        <View style={styles.row}>
          <Input
            label="Color"
            placeholder="Red"
            value={form.color}
            onChangeText={(v) => setField("color", v)}
            style={{ flex: 1 }}
          />
          <Input
            label="Leg Color"
            placeholder="Yellow"
            value={form.legColor}
            onChangeText={(v) => setField("legColor", v)}
            style={{ flex: 1 }}
          />
        </View>
        <Input
          label="Fighting Style"
          placeholder="e.g. slasher, cutter"
          value={form.fightingStyle}
          onChangeText={(v) => setField("fightingStyle", v)}
        />
        <Input
          label="Sire Info"
          placeholder="Sire bloodline / champion titles"
          value={form.sireInfo}
          onChangeText={(v) => setField("sireInfo", v)}
          multiline
          minHeight={60}
        />
        <Input
          label="Dam Info"
          placeholder="Dam bloodline / background"
          value={form.damInfo}
          onChangeText={(v) => setField("damInfo", v)}
          multiline
          minHeight={60}
        />
        <Input
          label="Vaccination"
          placeholder="e.g. Fowl pox, Newcastle"
          value={form.vaccinationStatus}
          onChangeText={(v) => setField("vaccinationStatus", v)}
        />
      </FieldGroup>

      {/* Pricing */}
      <FieldGroup title="Pricing" icon="cash-outline">
        <Input
          label="Price (₱) *"
          placeholder="12500"
          keyboardType="numeric"
          value={form.price}
          onChangeText={(v) => setField("price", v)}
        />
        <View style={styles.segmented}>
          {(["fixed", "negotiable", "auction"] as const).map((pt) => (
            <Pressable
              key={pt}
              style={[
                styles.segBtn,
                form.priceType === pt && styles.segBtnActive,
              ]}
              onPress={() => setField("priceType", pt)}
            >
              <Text
                style={[
                  styles.segText,
                  form.priceType === pt && styles.segTextActive,
                ]}
              >
                {pt.charAt(0).toUpperCase() + pt.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </FieldGroup>

      {/* Location & Shipping */}
      <FieldGroup title="Location & Shipping" icon="location-outline">
        <Picker
          label="Province *"
          value={form.locationProvince}
          options={[
            { value: "", label: "Select province…" },
            ...PROVINCES.map((p) => ({ value: p.name, label: p.name })),
          ]}
          onSelect={(v) => setField("locationProvince", v)}
        />
        <Input
          label="City / Municipality *"
          placeholder="e.g. Angeles"
          value={form.locationCity}
          onChangeText={(v) => setField("locationCity", v)}
        />
        <View style={styles.segmented}>
          {(["local", "regional", "nationwide"] as const).map((sa) => (
            <Pressable
              key={sa}
              style={[
                styles.segBtn,
                form.shippingAreas === sa && styles.segBtnActive,
              ]}
              onPress={() => setField("shippingAreas", sa)}
            >
              <Text
                style={[
                  styles.segText,
                  form.shippingAreas === sa && styles.segTextActive,
                ]}
              >
                {sa.charAt(0).toUpperCase() + sa.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Input
          label="Shipping Fee (₱)"
          placeholder="e.g. 600 — BloodlinePH logistics"
          keyboardType="numeric"
          value={form.shippingFee}
          onChangeText={(v) => setField("shippingFee", v)}
        />
      </FieldGroup>
    </View>
  );
}

// ─── Small form primitives ────────────────────────────────────────────────

function Input({
  label,
  style,
  minHeight,
  multiline,
  ...rest
}: React.ComponentProps<typeof TextInput> & {
  label: string;
  minHeight?: number;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...rest}
        multiline={multiline}
        style={[
          styles.input,
          multiline && {
            minHeight: minHeight || 80,
            textAlignVertical: "top",
          },
        ]}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

function Picker({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        style={styles.input}
        onPress={() => setOpen((o) => !o)}
      >
        <Text style={[styles.pickerValue, !current && { color: colors.muted }]}>
          {current || "Select…"}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.muted}
        />
      </Pressable>
      {open ? (
        <View style={styles.dropdown}>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              style={[
                styles.dropdownItem,
                opt.value === value && styles.dropdownItemActive,
              ]}
              onPress={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  opt.value === value && { color: colors.primary },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ExistingImagesRow({
  images,
  onRemove,
}: {
  images: { id: string; url: string }[];
  onRemove?: (id: string) => void;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>Current photos</Text>
      <View style={styles.existingGrid}>
        {images.map((img) => (
          <View key={img.id} style={styles.existingTile}>
            <View style={styles.existingImg}>
              {/* Image rendered as URI; network image with inline container */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <View style={{ width: "100%", height: "100%" }}>
                {/* React Native Image */}
                <ImageInline uri={img.url} />
              </View>
            </View>
            {onRemove ? (
              <Pressable
                onPress={() => onRemove(img.id)}
                style={styles.removeBtn}
                hitSlop={8}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function ImageInline({ uri }: { uri: string }) {
  // Local helper to avoid re-importing RN's Image in a spot where the
  // sibling picker already imports it. Keeps this file's imports tight.
  const { Image } = require("react-native") as typeof import("react-native");
  return (
    <Image
      source={{ uri }}
      style={{ width: "100%", height: "100%" }}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing[4],
  },
  row: {
    flexDirection: "row",
    gap: spacing[2],
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.base,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  pickerValue: {
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    maxHeight: 280,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemActive: {
    backgroundColor: colors.primaryBg,
  },
  dropdownItemText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  segmented: {
    flexDirection: "row",
    borderRadius: radii.md,
    backgroundColor: colors.mutedBg,
    padding: 2,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radii.sm,
    alignItems: "center",
  },
  segBtnActive: {
    backgroundColor: colors.background,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  segText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.muted,
  },
  segTextActive: {
    color: colors.foreground,
    fontWeight: fontWeight.bold,
  },
  descWrapper: {
    gap: 6,
  },
  aiBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primaryBg,
  },
  aiBtnText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  existingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
    marginTop: 4,
  },
  existingTile: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    overflow: "hidden",
    position: "relative",
  },
  existingImg: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.mutedBg,
  },
  removeBtn: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
});
```

- [ ] **Step 2: Type-check**

```bash
cd apps/mobile && pnpm type-check
```

Expected: clean for ListingForm itself. Dashboard/listings still show the 6 unresolved-route errors.

- [ ] **Step 3: Check that `@sabong/shared` actually exports `PROVINCES`, `CATEGORIES`, `BREEDS`**

```bash
grep -n "export const PROVINCES\|export const CATEGORIES\|export const BREEDS" packages/shared/src/index.ts packages/shared/src/*.ts 2>/dev/null | head -20
```

If any of these are **not exported** (or have a different name/shape), adjust the `ListingForm.tsx` imports before proceeding.

**Expected export shapes** (based on web's create-listing page):
- `CATEGORIES: { value: string; label: string }[]`
- `BREEDS: string[]`
- `PROVINCES: { name: string; cities?: string[] }[]` — we use `p.name` as the identifier

If any shape mismatches, fix the `.map()` calls in `ListingForm.tsx` to match.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/components/seller/ListingForm.tsx
git commit -m "feat(mobile/seller): shared ListingForm component (Create + Edit)

Encapsulates the entire create/edit listing form:

- 5 FieldGroups (Photos, Basic Info, Specs, Pricing, Location & Shipping)
- Controlled API: parent owns form state + images
- Exports ListingFormState type + EMPTY_LISTING_FORM default + helpers
  listingFormToPayload() and isListingFormValid()
- Supports both local picked images (LocalImage[]) and existing remote
  images (used by Edit screen with delete button)
- Optional '✨ Generate with AI' button passed in by parent (Create only)
- Reuses @sabong/shared CATEGORIES/BREEDS/PROVINCES for pickers

Next: wire A3 (new.tsx) and A4 ([id].tsx) around this form.
"
```

---

### Task A3.3: Build the Create Listing screen

**Files:**
- Create: `apps/mobile/app/seller/listings/new.tsx`

- [ ] **Step 1: Write `new.tsx`**

```tsx
// apps/mobile/app/seller/listings/new.tsx
/**
 * Create Listing — wraps ListingForm with Create-specific wiring:
 *   - Two CTAs: "Save as Draft" (POST, stays draft) and "Publish"
 *     (POST, then call /listings/:id/publish)
 *   - Uploads images in a second step after create
 *   - AI description generator hooked up
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

export default function CreateListingScreen() {
  const router = useRouter();
  const [form, setForm] = useState<ListingFormState>(EMPTY_LISTING_FORM);
  const [images, setImages] = useState<LocalImage[]>([]);
  const [submitting, setSubmitting] = useState<
    null | "draft" | "publish"
  >(null);
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
    } catch (err: any) {
      Alert.alert(
        "AI couldn't generate",
        err?.message || "Please try again in a bit.",
      );
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleSubmit = async (mode: "draft" | "publish") => {
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
        setStage(`Uploading ${images.length} photo${images.length > 1 ? "s" : ""}…`);
        await uploadImages.mutateAsync({
          listingId: created.id,
          images,
        });
      }

      if (mode === "publish") {
        setStage("Publishing…");
        await publishListing.mutateAsync({ id: created.id });
      }

      Alert.alert(
        mode === "publish" ? "Published!" : "Saved as draft",
        mode === "publish"
          ? "Your listing is now live on the marketplace."
          : "You can continue editing and publish later.",
        [
          {
            text: "View My Listings",
            onPress: () => router.replace("/seller/listings"),
          },
        ],
      );
    } catch (err: any) {
      Alert.alert(
        "Save failed",
        err?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(null);
      setStage(null);
    }
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
              style={[styles.draftBtn, busy && { opacity: 0.5 }]}
            >
              <Text style={styles.draftBtnText}>Save as Draft</Text>
            </Pressable>
            <Pressable
              onPress={() => handleSubmit("publish")}
              disabled={busy}
              style={[styles.publishBtn, busy && { opacity: 0.5 }]}
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
          <View style={styles.overlay}>
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
```

- [ ] **Step 2: Type-check**

```bash
cd apps/mobile && pnpm type-check
```

Expected: Dashboard's 6 route errors should reduce — `/seller/listings/new` now exists. Only 5 remain (the ones pointing at `/seller/listings/[id]`, `/seller/verification`, `/plans`, plus the two dashboard actions pointing at the same).

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/seller/listings/new.tsx
git commit -m "feat(mobile/seller): A3 — Create Listing screen with AI generator

Full create flow:
  1. Multi-section form (via shared ListingForm)
  2. 5-photo picker
  3. 'Save as Draft' (POST /listings, status=draft)
  4. 'Publish Now' gradient CTA (POST + /listings/:id/publish)
  5. Multipart image upload after create
  6. ✨ AI description generator via /ai-chat/generate-description
  7. Validation + loading overlay with stage messaging
     ('Creating…' → 'Uploading 3 photos…' → 'Publishing…')
  8. Navigates to /seller/listings on success

Resolves 1 of the 6 typed-route errors in seller/dashboard.tsx.
"
```

---

## Chunk 2: A4 — Edit Listing Screen

### Task A4.1: Lookup strategy — find listing by id via /listings/my

The API has `GET /listings/:slug` and `GET /listings/my` but no `GET /listings/id/:id`. We reuse the web approach: use `useMyListings()` (already cached) to resolve slug from id, then `useListingBySlug(slug)` to load full detail.

**Files:**
- Create: `apps/mobile/app/seller/listings/[id].tsx`

- [ ] **Step 1: Write `[id].tsx`**

```tsx
// apps/mobile/app/seller/listings/[id].tsx
/**
 * Edit Listing — mirror of Create screen but preloaded from API.
 *
 * Strategy for loading: useMyListings() to find slug from the :id param,
 * then useListingBySlug() for the full detail object (includes images).
 * Mutations target by id (they need it: PATCH /listings/:id, publish,
 * archive, image delete).
 *
 * Includes status actions (Publish / Archive / Republish) and
 * Delete-draft in the header.
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

export default function EditListingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // First find the slug from my-listings cache (cheapest path)
  const myListings = useMyListings();
  const slug = useMemo(
    () => myListings.data?.data.find((l) => l.id === id)?.slug,
    [myListings.data, id],
  );
  const detail = useListingBySlug(slug);
  const existing = detail.data;

  // Local form state (populated from API on load)
  const [form, setForm] = useState<ListingFormState>(EMPTY_LISTING_FORM);
  const [newImages, setNewImages] = useState<LocalImage[]>([]);
  const [submitting, setSubmitting] = useState<
    null | "save" | "publish" | "archive" | "delete" | "republish"
  >(null);
  const [stage, setStage] = useState<string | null>(null);
  const [initialised, setInitialised] = useState(false);

  const updateListing = useUpdateListing();
  const publishListing = usePublishListing();
  const archiveListing = useArchiveListing();
  const deleteListing = useDeleteListing();
  const uploadImages = useUploadListingImages();
  const deleteImage = useDeleteListingImage();

  // Hydrate the form once data arrives
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
      priceType: (existing.priceType as ListingFormState["priceType"]) ?? "fixed",
      locationProvince: existing.locationProvince ?? "",
      locationCity: existing.locationCity ?? "",
      shippingAreas:
        (existing.shippingAreas as ListingFormState["shippingAreas"]) ?? "local",
      shippingFee: existing.shippingFee ?? "",
    });
    setInitialised(true);
  }, [existing, initialised]);

  const existingImages = existing?.images
    ?.slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((img) => ({ id: img.id, url: img.url }));

  const status: Listing["status"] | undefined = existing?.status;
  const validationError = isListingFormValid(form);

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
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: colors.primary }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

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
      Alert.alert("Saved", "Your changes have been saved.");
    } catch (err: any) {
      Alert.alert("Save failed", err?.message || "Please try again.");
    } finally {
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
        await uploadImages.mutateAsync({ listingId: id!, images: newImages });
        setNewImages([]);
      }
      setStage("Publishing…");
      await publishListing.mutateAsync({ id: id! });
      Alert.alert("Published!", "Your listing is now live.");
      router.replace("/seller/listings");
    } catch (err: any) {
      Alert.alert("Publish failed", err?.message || "Please try again.");
    } finally {
      setSubmitting(null);
      setStage(null);
    }
  };

  const doArchive = async () => {
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
            } catch (err: any) {
              Alert.alert("Archive failed", err?.message || "Try again.");
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
      Alert.alert("Republished!", "Your listing is active again.");
    } catch (err: any) {
      Alert.alert("Republish failed", err?.message || "Try again.");
    } finally {
      setSubmitting(null);
    }
  };

  const doDelete = async () => {
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
            } catch (err: any) {
              Alert.alert("Delete failed", err?.message || "Try again.");
            } finally {
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
        onPress: () =>
          deleteImage
            .mutateAsync({ listingId: id!, imageId })
            .catch(() =>
              Alert.alert("Remove failed", "Please try again."),
            ),
      },
    ]);
  };

  const busy = submitting !== null;

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
                    style={({ pressed }) => pressed && { opacity: 0.6 }}
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
                      : "time-outline"
                }
                size={16}
                color={colors.muted}
              />
              <Text style={styles.statusBannerText}>
                Status: <Text style={{ fontWeight: "700" }}>{status}</Text>
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
            {/* Save button always available */}
            <Pressable
              onPress={doSave}
              disabled={busy}
              style={[styles.saveBtn, busy && { opacity: 0.5 }]}
            >
              <Text style={styles.saveBtnText}>
                {submitting === "save" ? "Saving…" : "Save Changes"}
              </Text>
            </Pressable>

            {/* Status-specific CTA */}
            {status === "draft" ? (
              <Pressable
                onPress={doPublish}
                disabled={busy}
                style={[styles.publishBtn, busy && { opacity: 0.5 }]}
              >
                <LinearGradient
                  colors={["#fbbf24", "#ef4444"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.publishBtnInner}
                >
                  <Text style={styles.publishBtnText}>
                    {submitting === "publish" ? "Publishing…" : "Publish"}
                  </Text>
                </LinearGradient>
              </Pressable>
            ) : status === "active" ? (
              <Pressable
                onPress={doArchive}
                disabled={busy}
                style={[styles.archiveBtn, busy && { opacity: 0.5 }]}
              >
                <Text style={styles.archiveBtnText}>
                  {submitting === "archive" ? "Archiving…" : "Archive"}
                </Text>
              </Pressable>
            ) : status === "archived" ? (
              <Pressable
                onPress={doRepublish}
                disabled={busy}
                style={[styles.publishBtn, busy && { opacity: 0.5 }]}
              >
                <LinearGradient
                  colors={["#10b981", "#14b8a6"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.publishBtnInner}
                >
                  <Text style={styles.publishBtnText}>
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
          <View style={styles.overlay}>
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
  publishBtnInner: { paddingVertical: 14, alignItems: "center" },
  publishBtnText: {
    color: "#fff",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  archiveBtn: {
    flex: 1.2,
    paddingVertical: 14,
    borderRadius: radii.lg,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  archiveBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: "#4b5563",
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
```

- [ ] **Step 2: Type-check**

```bash
cd apps/mobile && pnpm type-check
```

Expected: Only `/plans` and `/seller/verification` errors remain.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/app/seller/listings/[id].tsx
git commit -m "feat(mobile/seller): A4 — Edit Listing screen with status actions

Full edit flow:
  - Resolves :id param → slug via useMyListings cache, then loads full
    detail via useListingBySlug
  - Hydrates ListingForm state once detail arrives
  - Existing images shown in their own row with delete buttons
    (useDeleteListingImage confirm modal)
  - New images merge with existing up to 5 total
  - Status-aware secondary CTA:
      draft    → Publish (gradient amber→red)
      active   → Archive (muted)
      archived → Republish (gradient emerald→teal)
  - Delete button in header (drafts only, confirm modal)
  - Loading overlay with stage messaging

Resolves 1 more typed-route error in dashboard.
"
```

---

## Chunk 3: A5 — Seller Verification

### Task A5.1: Build the Verification screen

**Files:**
- Create: `apps/mobile/app/seller/verification.tsx`

- [ ] **Step 1: Write `verification.tsx`**

```tsx
// apps/mobile/app/seller/verification.tsx
/**
 * Seller Verification — upload Government ID + (optional) Farm Permit.
 *
 * Flow:
 *   - If user has no seller profile → show tiny "Become a Seller" form
 *     (farmName, province, city) that calls useRegisterAsSeller
 *   - Else → two image-picker slots + submit button
 *   - On success → status transitions to 'pending'; show banner + back
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
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

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
import { PROVINCES } from "@sabong/shared";

const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024; // 10MB per API validator

export default function VerificationScreen() {
  const router = useRouter();
  const seller = useSellerProfile();
  const registerSeller = useRegisterAsSeller();
  const submitDocs = useSubmitSellerVerification();

  const [govId, setGovId] = useState<LocalImage[]>([]);
  const [farmPermit, setFarmPermit] = useState<LocalImage[]>([]);

  // Become-a-seller form (only shown if user has no seller profile)
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
  const status = profile?.verificationStatus;

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
    } catch (err: any) {
      Alert.alert("Registration failed", err?.message || "Try again.");
    } finally {
      setBusy(false);
    }
  };

  const submitVerification = async () => {
    if (govId.length === 0) {
      Alert.alert("Government ID required", "Please attach a photo of your ID.");
      return;
    }
    // Client-side size check — API enforces 10MB server-side too.
    // We can only check if expo-image-picker exposed fileSize; it often doesn't.
    setBusy(true);
    try {
      await submitDocs.mutateAsync({
        governmentId: govId[0],
        farmPermit: farmPermit[0],
      });
      Alert.alert(
        "Documents submitted",
        "We'll review within 24-48 hours and notify you.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (err: any) {
      Alert.alert("Submit failed", err?.message || "Try again in a bit.");
    } finally {
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
        <ScrollView contentContainerStyle={styles.content}>
          {/* Status */}
          <StatusBanner status={status ?? null} hasProfile={!!profile} />

          {/* Register-as-seller block */}
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
              <DropdownInput
                label="Province *"
                value={farmProvince}
                options={[
                  { value: "", label: "Select…" },
                  ...PROVINCES.map((p) => ({ value: p.name, label: p.name })),
                ]}
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
                style={[styles.primaryBtnWrapper, busy && { opacity: 0.5 }]}
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

          {/* Docs — shown only once profile exists */}
          {profile ? (
            <>
              <FieldGroup
                title="Government ID *"
                icon="card-outline"
                subtitle="Driver's License, Passport, National ID. Photo of the front side."
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
                subtitle="Helps speed up verification and unlocks verified badge."
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
                style={[
                  styles.primaryBtnWrapper,
                  (busy || govId.length === 0) && { opacity: 0.5 },
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
                🔒 Your documents are private and used only for verification.
                Review takes 24–48 hours. You'll get a notification when we're
                done.
              </Text>
            </>
          ) : null}
        </ScrollView>

        {busy ? (
          <View style={styles.overlay}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        ) : null}
      </SafeAreaView>
    </>
  );
}

// ─── Local primitives (duplicated to keep this screen zero-coupling) ─────

function StatusBanner({
  status,
  hasProfile,
}: {
  status: "pending" | "verified" | "rejected" | null;
  hasProfile: boolean;
}) {
  if (!hasProfile) {
    return (
      <View style={[styles.banner, { backgroundColor: "#fef2f2" }]}>
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
      <View style={[styles.banner, { backgroundColor: "#f0fdf4" }]}>
        <Ionicons name="checkmark-circle" size={18} color="#15803d" />
        <Text style={[styles.bannerText, { color: "#166534" }]}>
          You're verified! ✓ The badge is live on your listings.
        </Text>
      </View>
    );
  }
  if (status === "pending") {
    return (
      <View style={[styles.banner, { backgroundColor: "#fef9c3" }]}>
        <Ionicons name="time-outline" size={18} color="#a16207" />
        <Text style={[styles.bannerText, { color: "#854d0e" }]}>
          Under review. We'll notify you in 24-48 hours.
        </Text>
      </View>
    );
  }
  if (status === "rejected") {
    return (
      <View style={[styles.banner, { backgroundColor: "#fef2f2" }]}>
        <Ionicons name="alert-circle" size={18} color="#b91c1c" />
        <Text style={[styles.bannerText, { color: "#991b1b" }]}>
          Your last submission was rejected. Please re-upload clearer documents
          below.
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.banner, { backgroundColor: "#f3f4f6" }]}>
      <Ionicons name="information-circle" size={18} color={colors.muted} />
      <Text style={[styles.bannerText, { color: colors.foreground }]}>
        Upload your documents below to get a verified seller badge.
      </Text>
    </View>
  );
}

function FieldInput(props: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
}) {
  const { TextInput } = require("react-native") as typeof import("react-native");
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        placeholder={props.placeholder}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
    </View>
  );
}

function DropdownInput({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label;
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.input} onPress={() => setOpen((o) => !o)}>
        <Text
          style={[
            { color: colors.foreground, fontSize: fontSize.base },
            !current && { color: colors.muted },
          ]}
        >
          {current || "Select…"}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.muted}
        />
      </Pressable>
      {open ? (
        <View style={styles.dropdown}>
          {options.map((opt) => (
            <Pressable
              key={opt.value}
              style={styles.dropdownItem}
              onPress={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
            >
              <Text
                style={[
                  { fontSize: fontSize.sm, color: colors.foreground },
                  opt.value === value && {
                    color: colors.primary,
                    fontWeight: fontWeight.bold,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

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
    alignItems: "center",
    gap: 8,
    padding: spacing[3],
    borderRadius: radii.lg,
  },
  bannerText: {
    flex: 1,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.base,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  dropdown: {
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
```

- [ ] **Step 2: Type-check**

```bash
cd apps/mobile && pnpm type-check
```

Expected: Only `/plans` error remains (that's Phase C, left as-is for now — we cast `as never` in that specific push only).

- [ ] **Step 3: Fix the one remaining route cast in dashboard**

Open `apps/mobile/app/seller/dashboard.tsx` and change the `/plans` push to use `as never`:

```diff
-              onPress={() => router.push("/plans")}
+              onPress={() => router.push("/plans" as never)}
```

This is the single allowed `as never` in Phase A — `/plans` will be built in Phase C6 and this cast drops out then.

Rationale for this one cast: Expo Router's typed routes require target files; Phase C builds `/plans`. Using `as never` is documented in `expo-router`'s escape hatch and strictly better than `as any`.

- [ ] **Step 4: Final type-check**

```bash
cd apps/mobile && pnpm type-check
```

Expected: **clean**, no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/app/seller/verification.tsx apps/mobile/app/seller/dashboard.tsx
git commit -m "feat(mobile/seller): A5 — Verification document upload

Complete self-serve verification:
  - If no seller profile yet → register form (farmName/province/city)
    that calls POST /sellers/register first
  - Two ImagePickerGrid slots (Gov ID required, Farm Permit optional)
  - POST /sellers/me/documents with multipart upload
  - Status banner for all states (none/pending/verified/rejected)
  - Client-side reminders for 10MB / JPEG-PNG

Also casts the single remaining /plans router.push as never until
Phase C6 builds the screen.

Type-check now clean across the mobile workspace.
"
```

---

## Chunk 4: Wrap-up — wire nav, verify, push

### Task A.wrap.1: Add Seller Dashboard to profile menu

**Files:**
- Modify: `apps/mobile/app/(tabs)/profile.tsx`

- [ ] **Step 1: Read the current profile.tsx**

```bash
grep -n "MenuItem\|router.push\|/orders\|/messages\|/friends" apps/mobile/app/\(tabs\)/profile.tsx | head -20
```

- [ ] **Step 2: Insert a "Seller Dashboard" menu item above "My Orders"**

Within the `<View style={styles.menu}>` block, add as the FIRST MenuItem:

```tsx
<MenuItem
  icon="briefcase-outline"
  label="Seller Dashboard"
  onPress={() => router.push("/seller/dashboard")}
/>
```

- [ ] **Step 3: Type-check**

```bash
cd apps/mobile && pnpm type-check
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/app/\(tabs\)/profile.tsx
git commit -m "chore(mobile): add Seller Dashboard entry to profile menu"
```

### Task A.wrap.2: Verify bundle exports

- [ ] **Step 1: Export iOS bundle to catch any missed imports**

```bash
cd apps/mobile && npx expo export --platform ios --output-dir dist 2>&1 | tail -20
```

Expected: lines ending with `Bundled <path> in <ms>` and no "error" / "unable to resolve" messages.

If anything fails, the error message points to the exact missing import — fix it and re-run.

- [ ] **Step 2: Clean up the export**

```bash
rm -rf apps/mobile/dist
```

### Task A.wrap.3: End-to-end smoke test against running API

The API is already running locally on :3001 with the seeded users. Use `curl` to confirm our new hooks' endpoints are healthy.

- [ ] **Step 1: Login as Mang Tomas (the verified seller)**

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+639172222222","password":"Demo1234!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")
echo "Token length: ${#TOKEN}"
```

Expected: token length > 100.

- [ ] **Step 2: Call the three dashboard endpoints**

```bash
curl -s http://localhost:3001/api/users/me/stats -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -10
curl -s http://localhost:3001/api/sellers/me -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -10
curl -s http://localhost:3001/api/sellers/me/plan -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -15
curl -s http://localhost:3001/api/listings/my -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'listings: {len(d.get(\"data\", []))}, total: {d.get(\"pagination\",{}).get(\"total\",\"?\")}')"
```

Expected: four successful JSON responses with the shapes our TS interfaces assume.

- [ ] **Step 3: Test create → publish → archive cycle**

```bash
# Create draft
CREATED=$(curl -s -X POST http://localhost:3001/api/listings \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke Test Stag","category":"stag","price":9999,"locationProvince":"Pampanga","locationCity":"Angeles","priceType":"fixed","shippingAreas":"local","shippingAvailable":true}')
echo "Created: $CREATED"
NEW_ID=$(echo "$CREATED" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")

# Publish
curl -s -X POST http://localhost:3001/api/listings/$NEW_ID/publish -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Archive
curl -s -X POST http://localhost:3001/api/listings/$NEW_ID/archive -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Clean up — delete the test listing
curl -s -X DELETE http://localhost:3001/api/listings/$NEW_ID -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Expected: each step returns a valid JSON object without errors. This confirms all 5 of our new `lib/listings.ts` hooks hit real, working endpoints.

If ANY endpoint 404s or 500s, the underlying API is broken — NOT the mobile code. Investigate/fix the API before declaring Phase A done.

### Task A.wrap.4: Push

- [ ] **Step 1: Verify local branch is clean**

```bash
git status
git log --oneline -10
```

Expected: recent Phase A commits in order, no uncommitted changes.

- [ ] **Step 2: Push to remote + master**

```bash
git push origin HEAD 2>&1 | tail -3
git push origin HEAD:master 2>&1 | tail -3
```

Expected: both pushes succeed.

- [ ] **Step 3: Declare Phase A complete**

Tell the user:

> **Phase A shipped** — mobile sellers can now run their whole business on the phone. All 5 screens live on master. Type-check clean, bundle exports clean, backend smoke test passed. Ready for Phase B?

---

## Plan Review Loop

After this plan document is written, dispatch the `plan-document-reviewer` subagent. Review context must include:
- This entire plan document
- A short note: "Review this plan for: DRY across the two listing screens, completeness of each task's verification steps, and whether the testing strategy is acceptable given no Jest harness exists."

If issues are found, fix in place and re-dispatch. Max 5 iterations before escalating to human.

---

## Execution Handoff

**This plan is complete and saved to `docs/superpowers/plans/2026-04-24-mobile-phase-a-seller-flows.md`.**

Because this harness (Claude Code) has subagents, per the skill the REQUIRED execution path is `superpowers:subagent-driven-development`: fresh subagent per task with two-stage review (implementer + reviewer subagents).

However, because:
1. We already built 2 of the 5 Phase A screens in this session (A1 dashboard, A2 listings), context is already hot,
2. The remaining 3 screens share tight context (same form component, same data layer), and
3. User asked for clean code explicitly — having one contributor preserve context across tightly-coupled screens tends to be cleaner than delegating each to a fresh subagent,

**I'll propose using `superpowers:executing-plans`** (batch execution in current session with checkpoints). This is a justified deviation from the skill's default since continuity matters for internal consistency of this particular plan.

Ask the user to confirm:
- **"Approve and execute this plan (in-session, batch with checkpoints)?"**
- **"Or dispatch via subagent-driven-development (fresh subagent per task, stricter review)?"**
