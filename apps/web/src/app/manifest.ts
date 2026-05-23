import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WhatsApp Booking CRM",
    short_name: "BookingCRM",
    description: "WhatsApp-first bookings + CRM for small businesses",
    start_url: "/app",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#059669",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/icon", sizes: "192x192", type: "image/png" },
    ],
  };
}

