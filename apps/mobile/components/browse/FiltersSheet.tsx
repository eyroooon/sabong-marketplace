// apps/mobile/components/browse/FiltersSheet.tsx
/**
 * Advanced filters bottom-sheet modal for the browse screen.
 *
 * Controlled component — parent owns the filters state and passes in
 * the initial value; sheet applies changes on "Apply" and emits them
 * via onApply. "Reset" returns everything to defaults.
 */
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BREEDS, CATEGORIES, PROVINCES } from "@sabong/shared";

import type { BrowseFilters } from "@/lib/listings";
import {
  colors,
  fontSize,
  fontWeight,
  radii,
  spacing,
} from "@/lib/theme";

type SortOption = Required<BrowseFilters>["sort"];
const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "popular", label: "Most Popular" },
];

interface FiltersSheetProps {
  visible: boolean;
  initial: BrowseFilters;
  onClose: () => void;
  onApply: (next: BrowseFilters) => void;
}

export function FiltersSheet({
  visible,
  initial,
  onClose,
  onApply,
}: FiltersSheetProps) {
  const [draft, setDraft] = useState<BrowseFilters>(initial);

  // Reset draft when the sheet reopens with new upstream filters
  useEffect(() => {
    if (visible) setDraft(initial);
  }, [visible, initial]);

  const countActive = [
    draft.category,
    draft.breed,
    draft.province,
    draft.minPrice !== undefined ? "min" : undefined,
    draft.maxPrice !== undefined ? "max" : undefined,
  ].filter(Boolean).length;

  const handleReset = () => {
    setDraft({ search: draft.search, sort: "newest" });
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <SafeAreaView edges={["bottom"]} style={styles.sheetInner}>
            <View style={styles.header}>
              <Text style={styles.title}>Filters</Text>
              <View style={styles.headerRight}>
                {countActive > 0 ? (
                  <Pressable
                    onPress={handleReset}
                    accessibilityRole="button"
                    accessibilityLabel="Reset filters"
                    style={styles.resetBtn}
                  >
                    <Text style={styles.resetText}>Reset</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={onClose}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={24} color={colors.foreground} />
                </Pressable>
              </View>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Section title="Category">
                <Chips
                  options={CATEGORIES.map((c) => ({
                    value: c.slug,
                    label: c.name,
                  }))}
                  selected={draft.category}
                  onSelect={(v) =>
                    setDraft((d) => ({
                      ...d,
                      category: d.category === v ? undefined : v,
                    }))
                  }
                />
              </Section>

              <Section title="Breed">
                <Chips
                  options={BREEDS.slice(0, 12).map((b) => ({
                    value: b.name,
                    label: b.name,
                  }))}
                  selected={draft.breed}
                  onSelect={(v) =>
                    setDraft((d) => ({
                      ...d,
                      breed: d.breed === v ? undefined : v,
                    }))
                  }
                />
                <Text style={styles.subHint}>
                  Showing popular breeds. More in full search.
                </Text>
              </Section>

              <Section title="Province">
                <Chips
                  options={PROVINCES.slice(0, 12).map((p) => ({
                    value: p.name,
                    label: p.name,
                  }))}
                  selected={draft.province}
                  onSelect={(v) =>
                    setDraft((d) => ({
                      ...d,
                      province: d.province === v ? undefined : v,
                    }))
                  }
                />
              </Section>

              <Section title="Price Range (₱)">
                <View style={styles.priceRow}>
                  <View style={styles.priceField}>
                    <Text style={styles.priceLabel}>Min</Text>
                    <TextInput
                      value={draft.minPrice?.toString() ?? ""}
                      onChangeText={(v) => {
                        const n = v ? Number(v.replace(/\D/g, "")) : undefined;
                        setDraft((d) => ({
                          ...d,
                          minPrice: n && Number.isFinite(n) ? n : undefined,
                        }));
                      }}
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                      keyboardType="numeric"
                      style={styles.priceInput}
                      accessibilityLabel="Minimum price"
                    />
                  </View>
                  <Text style={styles.priceSep}>—</Text>
                  <View style={styles.priceField}>
                    <Text style={styles.priceLabel}>Max</Text>
                    <TextInput
                      value={draft.maxPrice?.toString() ?? ""}
                      onChangeText={(v) => {
                        const n = v ? Number(v.replace(/\D/g, "")) : undefined;
                        setDraft((d) => ({
                          ...d,
                          maxPrice: n && Number.isFinite(n) ? n : undefined,
                        }));
                      }}
                      placeholder="Any"
                      placeholderTextColor={colors.muted}
                      keyboardType="numeric"
                      style={styles.priceInput}
                      accessibilityLabel="Maximum price"
                    />
                  </View>
                </View>
              </Section>

              <Section title="Sort">
                <Chips
                  options={SORT_OPTIONS}
                  selected={draft.sort ?? "newest"}
                  onSelect={(v) =>
                    setDraft((d) => ({ ...d, sort: v as SortOption }))
                  }
                />
              </Section>
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                onPress={handleApply}
                accessibilityRole="button"
                accessibilityLabel="Apply filters"
                style={styles.applyBtn}
              >
                <Text style={styles.applyText}>
                  Apply {countActive > 0 ? `(${countActive})` : ""}
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Chips<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: Array<{ value: T; label: string }>;
  selected: T | undefined;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={styles.chipsRow}>
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.chip,
              isSelected && styles.chipSelected,
            ]}
          >
            <Text
              style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: "85%",
    minHeight: "50%",
  },
  sheetInner: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: colors.foreground,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  resetBtn: {
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
  },
  resetText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
  },
  section: {
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  sectionBody: {
    gap: spacing[2],
  },
  subHint: {
    fontSize: fontSize.xs,
    color: colors.muted,
    fontStyle: "italic",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    fontWeight: fontWeight.medium,
  },
  chipTextSelected: {
    color: "#fff",
    fontWeight: fontWeight.bold,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing[3],
  },
  priceField: {
    flex: 1,
    gap: 4,
  },
  priceLabel: {
    fontSize: fontSize.xs,
    color: colors.muted,
    fontWeight: fontWeight.semibold,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSize.base,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  priceSep: {
    fontSize: fontSize.base,
    color: colors.muted,
    paddingBottom: 10,
  },
  footer: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyBtn: {
    paddingVertical: 14,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  applyText: {
    color: "#fff",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
});
