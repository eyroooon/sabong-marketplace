import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://bloodlineph.com";

  const staticRoutes = [
    "",
    "/listings",
    "/feed",
    "/login",
    "/register",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  try {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const res = await fetch(`${apiUrl}/listings?limit=100`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    const listingRoutes = (data.data || []).map((l: any) => ({
      url: `${baseUrl}/listings/${l.slug}`,
      lastModified: new Date(l.updatedAt || l.createdAt),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
    return [...staticRoutes, ...listingRoutes];
  } catch {
    return staticRoutes;
  }
}
