import type { MetadataRoute } from "next";
import { loadPwaConfig } from "@/lib/platform-content";

const BASE = process.env.NEXT_PUBLIC_WEB_URL ?? "https://wa-booking-web.vercel.app";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const pwa = await loadPwaConfig();

  return {
    id: "/",
    name: pwa.name,
    short_name: pwa.shortName,
    description: pwa.description,
    lang: "hi",
    dir: "ltr",
    start_url: pwa.startUrl,
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait-primary",
    background_color: pwa.backgroundColor,
    theme_color: pwa.themeColor,
    categories: ["business", "productivity"],
    prefer_related_applications: false,
    icons: [
      { src: `${BASE}/icon`, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: `${BASE}/icon`, sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: `${BASE}/apple-icon`, sizes: "180x180", type: "image/png", purpose: "any" },
    ],
    shortcuts: [
      { name: "Today", short_name: "Hub", url: "/app", icons: [{ src: `${BASE}/icon`, sizes: "512x512" }] },
      { name: "Bookings", url: "/app/bookings", icons: [{ src: `${BASE}/icon`, sizes: "512x512" }] },
      { name: "Darbhanga Pack", url: "/darbhanga", icons: [{ src: `${BASE}/icon`, sizes: "512x512" }] },
    ],
  };
}
