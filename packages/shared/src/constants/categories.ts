export const CATEGORIES = [
  { slug: "rooster", name: "Rooster", nameFil: "Tandang", sortOrder: 1 },
  { slug: "hen", name: "Hen", nameFil: "Inahin", sortOrder: 2 },
  { slug: "stag", name: "Stag", nameFil: "Talisayin", sortOrder: 3 },
  { slug: "pullet", name: "Pullet", nameFil: "Dumalaga", sortOrder: 4 },
  { slug: "pair", name: "Pair", nameFil: "Pares", sortOrder: 5 },
  { slug: "brood", name: "Brood", nameFil: "Pangpisa", sortOrder: 6 },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];
