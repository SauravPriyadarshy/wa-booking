import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_WEB_URL ?? "https://booknow.app";

const CITIES = ["darbhanga", "laheriasarai", "mohali", "patna", "muzaffarpur"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const cityRoutes: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${BASE}/city/${city}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...cityRoutes];
}
