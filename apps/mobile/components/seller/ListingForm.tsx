// apps/mobile/components/seller/ListingForm.tsx
/**
 * Shared form used by Create (/seller/listings/new) and Edit
 * (/seller/listings/[id]) screens. Holds all local form state and
 * emits onChange. Parent decides whether to call the create or update
 * hook on submit.
 */
import React, { useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BREEDS, CATEGORIES, PROVINCES } from "@sabong/shared";
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

export interface ListingFormState {
  title: string;
  description: string;
  category: string; // CATEGORIES[].slug
  breed: string; // BREEDS[].name or ""
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
  const toFiniteNumber = (s: string): number | undefined => {
    if (!s) return undefined;
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };

  const priceNum = Number(form.price);
  const body: CreateListingInput = {
    title: form.title.trim(),
    category: form.category,
    price: Number.isFinite(priceNum) ? priceNum : 0,
    locationProvince: form.locationProvince,
    locationCity: form.locationCity.trim(),
    priceType: form.priceType,
    shippingAreas: form.shippingAreas,
    shippingAvailable: true,
  };
  const description = form.description.trim();
  if (description) body.description = description;
  if (form.breed) body.breed = form.breed;
  const bloodline = form.bloodline.trim();
  if (bloodline) body.bloodline = bloodline;
  const ageMonths = toFiniteNumber(form.ageMonths);
  if (ageMonths !== undefined) body.ageMonths = ageMonths;
  const weightKg = toFiniteNumber(form.weightKg);
  if (weightKg !== undefined) body.weightKg = weightKg;
  const color = form.color.trim();
  if (color) body.color = color;
  const legColor = form.legColor.trim();
  if (legColor) body.legColor = legColor;
  const fightingStyle = form.fightingStyle.trim();
  if (fightingStyle) body.fightingStyle = fightingStyle;
  const sireInfo = form.sireInfo.trim();
  if (sireInfo) body.sireInfo = sireInfo;
  const damInfo = form.damInfo.trim();
  if (damInfo) body.damInfo = damInfo;
  const vaccinationStatus = form.vaccinationStatus.trim();
  if (vaccinationStatus) body.vaccinationStatus = vaccinationStatus;
  const shippingFee = toFiniteNumber(form.shippingFee);
  if (shippingFee !== undefined) body.shippingFee = shippingFee;
  return body;
}

export function isListingFormValid(form: ListingFormState): string | null {
  if (!form.title.trim()) return "Title is required.";
  if (!form.category) return "Category is required.";
  // API requires description to be 20–5000 characters (class-validator
  // on the backend DTO). Match that here so the user gets a friendly
  // error instead of a 400 from the server.
  const description = form.description.trim();
  if (!description) return "Description is required.";
  if (description.length < 20)
    return "Description must be at least 20 characters.";
  if (description.length > 5000)
    return "Description must be 5000 characters or fewer.";
  const priceNum = Number(form.price);
  if (!form.price || !Number.isFinite(priceNum) || priceNum <= 0)
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
  /** Optional remote-hosted images already on the listing (edit screen). */
  existingImages?: { id: string; url: string }[];
  onRemoveExistingImage?: (imageId: string) => void;
  /** AI description generator button (create screen only). */
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

  const pickerImagesRemaining = Math.max(
    0,
    5 - (existingImages?.length ?? 0),
  );

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
          max={pickerImagesRemaining}
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
              accessibilityRole="button"
              accessibilityLabel="Generate description with AI"
              style={[
                styles.aiBtn,
                isGeneratingDescription && styles.aiBtnDisabled,
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
          options={CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
          onSelect={(v) => setField("category", v)}
        />
        <Picker
          label="Breed"
          value={form.breed}
          options={[
            { value: "", label: "— none —" },
            ...BREEDS.map((b) => ({ value: b.name, label: b.name })),
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

      {/* Specs */}
      <FieldGroup title="Specs" icon="fitness-outline">
        <View style={styles.row}>
          <Input
            label="Age (months)"
            placeholder="12"
            keyboardType="numeric"
            value={form.ageMonths}
            onChangeText={(v) => setField("ageMonths", v)}
            style={styles.rowItem}
          />
          <Input
            label="Weight (kg)"
            placeholder="2.1"
            keyboardType="decimal-pad"
            value={form.weightKg}
            onChangeText={(v) => setField("weightKg", v)}
            style={styles.rowItem}
          />
        </View>
        <View style={styles.row}>
          <Input
            label="Color"
            placeholder="Red"
            value={form.color}
            onChangeText={(v) => setField("color", v)}
            style={styles.rowItem}
          />
          <Input
            label="Leg Color"
            placeholder="Yellow"
            value={form.legColor}
            onChangeText={(v) => setField("legColor", v)}
            style={styles.rowItem}
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
              accessibilityRole="button"
              accessibilityState={{ selected: form.priceType === pt }}
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
              accessibilityRole="button"
              accessibilityState={{ selected: form.shippingAreas === sa }}
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

// ───── Sub-components ─────

type InputExtraProps = {
  label: string;
  minHeight?: number;
  /** Container (View) style — kept separate from TextInput's own style prop. */
  style?: ViewStyle;
};

function Input({
  label,
  style,
  minHeight,
  multiline,
  ...rest
}: Omit<React.ComponentProps<typeof TextInput>, "style"> & InputExtraProps) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...rest}
        multiline={multiline}
        style={[
          styles.input,
          multiline && {
            minHeight: minHeight ?? 80,
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
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text
          style={[
            styles.pickerValue,
            !current && styles.pickerPlaceholder,
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
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={styles.modalSheet}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>{label}</Text>
            <ScrollView style={styles.modalList}>
              {options.map((opt) => (
                <Pressable
                  key={opt.value || "none"}
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
                      opt.value === value && styles.dropdownItemTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
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
            <Image
              source={{ uri: img.url }}
              style={styles.existingImg}
              resizeMode="cover"
            />
            {onRemove ? (
              <Pressable
                onPress={() => onRemove(img.id)}
                style={styles.removeBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
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

// ───── Styles ─────

const styles = StyleSheet.create({
  root: { gap: spacing[4] },
  row: { flexDirection: "row", gap: spacing[2] },
  rowItem: { flex: 1 },
  field: { gap: 4 },
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
  pickerPlaceholder: {
    color: colors.muted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: "70%",
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  modalTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalList: {
    maxHeight: 400,
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
    backgroundColor: colors.mutedBg,
  },
  aiBtnDisabled: {
    opacity: 0.5,
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
    backgroundColor: colors.mutedBg,
  },
  existingImg: {
    width: "100%",
    height: "100%",
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
