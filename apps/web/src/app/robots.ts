import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_WEB_URL ?? "https://booknow.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/signup", "/login", "/city/"],
        disallow: ["/app/", "/api/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
