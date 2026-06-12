import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";

const BASE = siteUrl();

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
