import type { Metadata } from "next";
import { DarbhangaBundleLanding } from "@/components/darbhanga/darbhanga-bundle-landing";
import { loadDarbhangaConfig } from "@/lib/platform-content";

export async function generateMetadata(): Promise<Metadata> {
  const config = await loadDarbhangaConfig();
  return {
    title: config.seoTitle,
    description: config.seoDescription,
    keywords: [
      "Darbhanga salon booking",
      "Darbhanga clinic WhatsApp",
      "Darbhanga coaching fees",
      "WhatsApp booking Darbhanga",
    ],
    openGraph: {
      title: config.heroTitle,
      description: config.heroTagline,
      url: "/darbhanga",
      type: "website",
    },
    alternates: { canonical: "/darbhanga" },
  };
}

export default async function DarbhangaPage() {
  const config = await loadDarbhangaConfig();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: config.heroTitle,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            inLanguage: ["hi", "en"],
            areaServed: { "@type": "City", name: "Darbhanga" },
          }),
        }}
      />
      <DarbhangaBundleLanding />
    </>
  );
}
