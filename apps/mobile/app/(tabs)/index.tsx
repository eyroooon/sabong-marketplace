import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { ListingCard } from "@/components/listings/ListingCard";
import { useFeaturedListings } from "@/lib/listings";
import { colors, fontSize, fontWeight, gradients, radii, spacing } from "@/lib/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { data: featured, isLoading: featuredLoading } = useFeaturedListings();
  const featuredListings = featured?.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.ink }}>
      <StatusBar style="light" />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo + header */}
          <View style={styles.header}>
            <Text style={styles.logoRed}>Bloodline</Text>
            <LinearGradient
              colors={gradients.flame}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.phBadge}
            >
              <Text style={styles.phText}>PH</Text>
            </LinearGradient>
          </View>

          {/* Compliance banner */}
          <View style={styles.complianceBanner}>
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={colors.emeraldLight}
            />
            <Text style={styles.complianceText}>
              100% Legal · Walang Betting · Walang E-Sabong · Pure Marketplace
            </Text>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>
                Ang Unang Trusted Gamefowl Marketplace sa Pinas
              </Text>
            </View>

            <Text style={styles.heroTitle}>Bumili. Magbenta.</Text>
            <LinearGradient
              colors={gradients.flame}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroTitleGradient}
            >
              <Text style={styles.heroTitleGradientText}>
                Ligtas na ngayon.
              </Text>
            </LinearGradient>

            <Text style={styles.heroSubtitle}>
              Walang hassle. Walang middleman. Verified breeders,
              escrow-protected payments, at real-time messaging — lahat nasa
              isang app.
            </Text>

            <View style={styles.ctaRow}>
              <Button
                variant="gold"
                onPress={() => router.push("/browse")}
                fullWidth
              >
                Mag-browse Ngayon
              </Button>
            </View>

            {/* Trust row */}
            <View style={styles.trustRow}>
              <TrustChip
                icon={<Ionicons name="shield-checkmark" size={14} color={colors.emeraldLight} />}
                text="Escrow Protected"
              />
              <TrustChip
                icon={<Ionicons name="ribbon" size={14} color={colors.gold} />}
                text="Verified Sellers"
              />
              <TrustChip
                icon={<Ionicons name="lock-closed" size={14} color={colors.info} />}
                text="Safe Payments"
              />
            </View>
          </View>

          {/* Featured listings rail */}
          {(featuredLoading || featuredListings.length > 0) && (
            <View style={styles.featuredSection}>
              <View style={styles.featuredHeader}>
                <View>
                  <Text style={styles.featuredEyebrow}>FEATURED</Text>
                  <Text style={styles.featuredTitle}>Mga pinaka-hot ngayon</Text>
                </View>
                <Text
                  style={styles.seeAllLink}
                  onPress={() => router.push("/browse")}
                  suppressHighlighting
                >
                  See all
                </Text>
              </View>

              {featuredLoading ? (
                <View style={styles.featuredLoading}>
                  <ActivityIndicator color={colors.gold} />
                </View>
              ) : (
                <FlatList
                  data={featuredListings}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredList}
                  ItemSeparatorComponent={() => (
                    <View style={{ width: 12 }} />
                  )}
                  renderItem={({ item }) => (
                    <ListingCard listing={item} style="row" />
                  )}
                />
              )}
            </View>
          )}

          {/* Feature cards */}
          <View style={styles.featureGrid}>
            <FeatureCard
              icon="videocam"
              tag="FEED"
              title="Sabungero Feed"
              desc="Social platform para sa sabungero — mag-post ng videos"
            />
            <FeatureCard
              icon="ribbon"
              tag="VERIFIED"
              title="Gov ID + Farm Permit"
              desc="Tunay na breeders lang"
            />
            <FeatureCard
              icon="sparkles"
              tag="AI"
              title="24/7 AI Support"
              desc="Tanong? May sagot agad."
            />
          </View>

          {/* Coming soon callout */}
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonTag}>COMING SOON</Text>
            <Text style={styles.comingSoonTitle}>
              Mobile app, <Text style={styles.textGold}>parating na.</Text>
            </Text>
            <Text style={styles.comingSoonText}>
              Ito ang early access preview. Mag-login para subukan ang app o
              i-browse muna ang listings.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function TrustChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={styles.trustChip}>
      {icon}
      <Text style={styles.trustText}>{text}</Text>
    </View>
  );
}

function FeatureCard({
  icon,
  tag,
  title,
  desc,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tag: string;
  title: string;
  desc: string;
}) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIconRow}>
        <Ionicons name={icon} size={14} color={colors.muted} />
        <Text style={styles.featureTag}>{tag}</Text>
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  logoRed: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.primary,
  },
  phBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.md,
  },
  phText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.black,
    color: colors.white,
  },
  complianceBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderDark,
  },
  complianceText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    textAlign: "center",
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderDark,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    marginBottom: 16,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emeraldLight,
  },
  badgeText: {
    fontSize: fontSize.xs,
    color: "rgba(255,255,255,0.8)",
    fontWeight: fontWeight.medium,
  },
  heroTitle: {
    fontSize: fontSize["4xl"],
    fontWeight: fontWeight.black,
    color: colors.white,
    textAlign: "center",
    lineHeight: 48,
    letterSpacing: -1,
  },
  heroTitleGradient: {
    marginTop: 4,
    borderRadius: radii.sm,
  },
  heroTitleGradientText: {
    fontSize: fontSize["4xl"],
    fontWeight: fontWeight.black,
    color: "transparent",
    textAlign: "center",
    lineHeight: 48,
    letterSpacing: -1,
    // Hack: mobile can't do true gradient text without extra libs.
    // Here we show it in gold solid tone which is close to the flame gradient.
  },
  heroSubtitle: {
    fontSize: fontSize.base,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 20,
    maxWidth: 340,
  },
  ctaRow: {
    marginTop: 28,
    alignSelf: "stretch",
  },
  trustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    marginTop: 28,
  },
  trustChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trustText: {
    fontSize: fontSize.xs,
    color: "rgba(255,255,255,0.5)",
    fontWeight: fontWeight.medium,
  },
  featureGrid: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 16,
  },
  featureCard: {
    padding: 20,
    borderRadius: radii["2xl"],
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.borderDark,
  },
  featureIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featureTag: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.muted,
    letterSpacing: 1,
  },
  featureTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    color: colors.white,
    marginTop: 8,
  },
  featureDesc: {
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.6)",
    marginTop: 4,
    lineHeight: 18,
  },
  comingSoon: {
    margin: 20,
    padding: 24,
    borderRadius: radii["2xl"],
    backgroundColor: "rgba(251,191,36,0.08)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.3)",
    alignItems: "center",
  },
  comingSoonTag: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.gold,
    letterSpacing: 1,
  },
  comingSoonTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.black,
    color: colors.white,
    marginTop: 10,
    textAlign: "center",
  },
  comingSoonText: {
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  textGold: {
    color: colors.gold,
  },
  featuredSection: {
    marginTop: spacing[8],
    paddingBottom: spacing[4],
  },
  featuredHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: spacing[5],
    marginBottom: spacing[3],
  },
  featuredEyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.gold,
    letterSpacing: 1,
  },
  featuredTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    color: colors.white,
    marginTop: 2,
  },
  seeAllLink: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gold,
  },
  featuredList: {
    paddingHorizontal: spacing[5],
  },
  featuredLoading: {
    paddingVertical: spacing[6],
    alignItems: "center",
  },
});
