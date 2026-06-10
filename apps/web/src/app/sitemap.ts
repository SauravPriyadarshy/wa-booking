import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_WEB_URL ?? "https://wa-booking-web.vercel.app";

const CITIES = ["darbhanga", "laheriasarai", "benipur", "baheri", "jale", "mohali", "patna", "muzaffarpur"];
const CATEGORIES = ["salon", "clinic", "coaching", "spa", "home_service"];

async function getBusinessSlugs(): Promise<Array<{ slug: string; updatedAt?: string }>> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
    const res = await fetch(`${apiUrl}/public/businesses?take=100`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const businesses = Array.isArray(data) ? data : data?.items ?? [];
    return businesses.map((b: { slug: string; updatedAt?: string }) => ({
      slug: b.slug,
      updatedAt: b.updatedAt,
    }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/darbhanga`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const cityRoutes: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${BASE}/city/${city}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // City + category landing pages e.g. /city/darbhanga (categories via anchor)
  const categoryRoutes: MetadataRoute.Sitemap = CITIES.flatMap((city) =>
    CATEGORIES.map((cat) => ({
      url: `${BASE}/city/${city}#${cat}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  );

  // Business booking pages e.g. /book/my-salon
  const businesses = await getBusinessSlugs();
  const businessRoutes: MetadataRoute.Sitemap = businesses.map((b) => ({
    url: `${BASE}/book/${b.slug}`,
    lastModified: b.updatedAt ? new Date(b.updatedAt) : now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  return [...staticRoutes, ...cityRoutes, ...categoryRoutes, ...businessRoutes];
}
