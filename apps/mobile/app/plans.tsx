/**
 * Plans & Billing — browse plan tiers, see current plan, upgrade/downgrade.
 *
 * Current plan is highlighted with a green border + "Current" chip.
 * Upgrade path shows a confirm alert + 30-day expiry notice.
 * Non-sellers are redirected to /seller/verification.
 */
import React from "react";
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
import { Stack, useRouter } from "expo-router";

import {
  useMyPlan,
  usePlansList,
  useUpgradePlan,
  type PlanCatalogItem,
  type PlanTier,
} from "@/lib/sellers";
import { colors, fontSize, fontWeight, radii, spacing } from "@/lib/theme";

const PLAN_ORDER: PlanTier[] = ["free", "basic", "pro"];

export default function PlansScreen() {
  const router = useRouter();
  const myPlan = useMyPlan();
  const plansList = usePlansList();
  const upgrade = useUpgradePlan();

  const loading = myPlan.isLoading || plansList.isLoading;

  if (loading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Not a seller yet — redirect to verification
  if (!myPlan.data && !myPlan.isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: true, title: "Plans" }} />
        <View style={styles.centred}>
          <Text style={styles.notSellerTitle}>Become a seller first</Text>
          <Text style={styles.notSellerText}>
            Plans apply to verified sellers. Register as a seller to unlock.
          </Text>
          <Pressable
            onPress={() => router.replace("/seller/verification")}
            accessibilityRole="button"
            accessibilityLabel="Go to verification"
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnLabel}>Get started</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const currentPlan = myPlan.data!.plan;

  const handleSelect = (planKey: PlanTier) => {
    if (planKey === currentPlan) return;

    const planItem = plansList.data?.find((p) => p.id === planKey);
    const planName = planItem?.name ?? planKey;
    const isDowngrade =
      PLAN_ORDER.indexOf(planKey) < PLAN_ORDER.indexOf(currentPlan);

    Alert.alert(
      isDowngrade ? `Downgrade to ${planName}?` : `Upgrade to ${planName}?`,
      isDowngrade
        ? `Your ${planName} plan will be active for 30 days starting today.`
        : `${planName} plan activates immediately for 30 days. After that, billing will be automated (coming soon — MVP uses simulated billing).`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isDowngrade ? "Downgrade" : "Upgrade",
          style: isDowngrade ? "destructive" : "default",
          onPress: () => {
            upgrade.mutate(
              { plan: planKey },
              {
                onSuccess: () => {
                  Alert.alert(
                    "Plan updated",
                    `You're now on the ${planName} plan.`,
                  );
                },
                onError: (err: Error) => {
                  Alert.alert(
                    "Update failed",
                    err.message || "Please try again.",
                  );
                },
              },
            );
          },
        },
      ],
    );
  };

  // Build an ordered list from the catalog array
  const orderedPlans: (PlanCatalogItem | undefined)[] = PLAN_ORDER.map(
    (key) => plansList.data?.find((p) => p.id === key),
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Plans & Billing",
          headerTitleStyle: { fontWeight: "700" },
        }}
      />
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Current-plan summary */}
          {myPlan.data ? (
            <View style={styles.currentSummary}>
              <Text style={styles.summaryLabel}>Your current plan</Text>
              <Text style={styles.summaryName}>
                {myPlan.data.planDetails.name}
              </Text>
              {myPlan.data.planExpiresAt ? (
                <Text style={styles.summaryExpiry}>
                  {myPlan.data.expired
                    ? "Expired — now on Free"
                    : `Renews ${new Date(myPlan.data.planExpiresAt).toLocaleDateString()}`}
                </Text>
              ) : null}
            </View>
          ) : null}

          {orderedPlans.map((plan, idx) => {
            if (!plan) return null;
            const planKey = PLAN_ORDER[idx];
            return (
              <PlanCard
                key={planKey}
                planKey={planKey}
                plan={plan}
                isCurrent={planKey === currentPlan}
                busy={upgrade.isPending}
                onSelect={() => handleSelect(planKey)}
              />
            );
          })}

          <Text style={styles.footnote}>
            Billing is handled by BloodlinePH. Cancel or switch any time. MVP
            plans use simulated billing; production will use PayMongo.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// ─── Plan card ─────────────────────────────────────────────────────────────

function PlanCard({
  planKey,
  plan,
  isCurrent,
  busy,
  onSelect,
}: {
  planKey: PlanTier;
  plan: PlanCatalogItem;
  isCurrent: boolean;
  busy: boolean;
  onSelect: () => void;
}) {
  const isPro = planKey === "pro";
  const isProOnGradient = isPro && !isCurrent;

  const card = (
    <>
      <View style={styles.planHeader}>
        <View style={styles.planHeaderLeft}>
          <Text
            style={[
              styles.planName,
              isCurrent && styles.planNameCurrent,
              isProOnGradient && styles.planNameOnGradient,
            ]}
          >
            {plan.name}
          </Text>
          <View style={styles.priceRow}>
            <Text
              style={[
                styles.planPrice,
                isCurrent && styles.planNameCurrent,
                isProOnGradient && styles.planNameOnGradient,
              ]}
            >
              ₱{plan.price.toLocaleString("en-PH")}
            </Text>
            {plan.price > 0 ? (
              <Text
                style={[
                  styles.perMonth,
                  isProOnGradient && styles.planNameOnGradient,
                ]}
              >
                {" / month"}
              </Text>
            ) : null}
          </View>
        </View>
        {isCurrent ? (
          <View style={styles.currentBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#166534" />
            <Text style={styles.currentBadgeText}>Current</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.bulletList}>
        <Bullet
          icon="pricetag-outline"
          text={
            plan.maxActiveListings === -1
              ? "Unlimited active listings"
              : `Up to ${plan.maxActiveListings} active listings`
          }
          onGradient={isProOnGradient}
        />
        <Bullet
          icon="star-outline"
          text={
            plan.featuredListingsPerMonth > 0
              ? `${plan.featuredListingsPerMonth} featured/month`
              : "No featured listings"
          }
          onGradient={isProOnGradient}
        />
        <Bullet
          icon="videocam-outline"
          text={
            plan.maxVideosPerMonth === -1
              ? "Unlimited videos"
              : `${plan.maxVideosPerMonth} videos/month`
          }
          onGradient={isProOnGradient}
        />
        <Bullet
          icon="cash-outline"
          text={`${(plan.commissionRate * 100).toFixed(0)}% platform fee`}
          onGradient={isProOnGradient}
        />
        {plan.verifiedBadge ? (
          <Bullet
            icon="shield-checkmark-outline"
            text="Verified badge"
            onGradient={isProOnGradient}
          />
        ) : null}
        {plan.prioritySupport ? (
          <Bullet
            icon="headset-outline"
            text="Priority support"
            onGradient={isProOnGradient}
          />
        ) : null}
        {plan.analyticsAccess ? (
          <Bullet
            icon="analytics-outline"
            text="Analytics dashboard"
            onGradient={isProOnGradient}
          />
        ) : null}
      </View>

      <Pressable
        onPress={onSelect}
        disabled={isCurrent || busy}
        accessibilityRole="button"
        accessibilityLabel={
          isCurrent ? `Current plan: ${plan.name}` : `Select ${plan.name} plan`
        }
        style={[
          styles.ctaBtn,
          isCurrent
            ? styles.ctaBtnCurrent
            : isProOnGradient
              ? styles.ctaBtnProOnGradient
              : styles.ctaBtnDefault,
        ]}
      >
        <Text
          style={[
            styles.ctaBtnText,
            isCurrent
              ? styles.ctaBtnTextCurrent
              : isProOnGradient
                ? styles.ctaBtnTextProOnGradient
                : styles.ctaBtnTextDefault,
          ]}
        >
          {isCurrent ? "Current Plan" : busy ? "…" : `Choose ${plan.name}`}
        </Text>
      </Pressable>
    </>
  );

  if (isProOnGradient) {
    return (
      <View style={styles.planCardWrapper}>
        <LinearGradient
          colors={["#fbbf24", "#ef4444"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.planCardGradient}
        >
          {card}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.planCard, isCurrent && styles.planCardCurrent]}>
      {card}
    </View>
  );
}

// ─── Bullet row ─────────────────────────────────────────────────────────────

function Bullet({
  icon,
  text,
  onGradient,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  onGradient: boolean;
}) {
  return (
    <View style={styles.bulletRow}>
      <Ionicons
        name={icon}
        size={14}
        color={onGradient ? "#fff" : colors.muted}
      />
      <Text
        style={[styles.bulletText, onGradient && styles.bulletTextOnGradient]}
      >
        {text}
      </Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mutedBg },
  centred: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[6],
    gap: spacing[3],
    backgroundColor: colors.background,
  },
  notSellerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  notSellerText: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: "center",
  },
  primaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
  },
  primaryBtnLabel: {
    color: "#fff",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  content: {
    padding: spacing[4],
    gap: spacing[4],
  },
  currentSummary: {
    padding: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.muted,
    fontWeight: fontWeight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  summaryName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.foreground,
  },
  summaryExpiry: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginTop: 2,
  },
  planCardWrapper: {
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  planCardGradient: {
    padding: spacing[4],
    gap: spacing[3],
  },
  planCard: {
    padding: spacing[4],
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[3],
  },
  planCardCurrent: {
    borderColor: "#16a34a",
    borderWidth: 2,
    backgroundColor: "#f0fdf4",
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  planHeaderLeft: { flex: 1 },
  planName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.foreground,
  },
  planNameCurrent: { color: "#166534" },
  planNameOnGradient: { color: "#fff" },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 2,
  },
  planPrice: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: colors.foreground,
  },
  perMonth: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  currentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#bbf7d0",
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: "#166534",
  },
  bulletList: { gap: 6 },
  bulletRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bulletText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  bulletTextOnGradient: { color: "#fff" },
  ctaBtn: {
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: "center",
  },
  ctaBtnCurrent: { backgroundColor: "#bbf7d0" },
  ctaBtnDefault: { backgroundColor: colors.primary },
  ctaBtnProOnGradient: { backgroundColor: "#fff" },
  ctaBtnText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  ctaBtnTextCurrent: { color: "#166534" },
  ctaBtnTextDefault: { color: "#fff" },
  ctaBtnTextProOnGradient: { color: colors.primary },
  footnote: {
    fontSize: fontSize.xs,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: spacing[2],
  },
});
