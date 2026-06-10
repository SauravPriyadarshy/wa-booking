import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  headers: async () => [
    {
      source: "/sw.js",
      headers: [
        { key: "Service-Worker-Allowed", value: "/" },
        { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
      ],
    },
    {
      source: "/.well-known/:path*",
      headers: [{ key: "Cache-Control", value: "public, max-age=3600" }],
    },
    {
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      ],
    },
  ],
};

export default withNextIntl(nextConfig);
