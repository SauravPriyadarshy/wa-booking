import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_WEB_URL ?? "https://wa-booking-web.vercel.app";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "BookNow — WhatsApp Business Assistant",
    short_name: "BookNow",
    description: "Booking, WhatsApp reminders, and customer list for Indian businesses.",
    lang: "hi",
    dir: "ltr",
    start_url: "/app?source=installed",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait-primary",
    background_color: "#fafafa",
    theme_color: "#059669",
    categories: ["business", "productivity"],
    prefer_related_applications: false,
    icons: [
      {
        src: `${BASE}/icon`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${BASE}/icon`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: `${BASE}/apple-icon`,
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      { name: "Today", short_name: "Hub", url: "/app", icons: [{ src: `${BASE}/icon`, sizes: "512x512" }] },
      { name: "Bookings", url: "/app/bookings", icons: [{ src: `${BASE}/icon`, sizes: "512x512" }] },
      { name: "Darbhanga Pack", url: "/darbhanga", icons: [{ src: `${BASE}/icon`, sizes: "512x512" }] },
    ],
  };
}
