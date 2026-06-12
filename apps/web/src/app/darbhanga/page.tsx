import type { Metadata } from "next";
import { DarbhangaBundleLanding } from "@/components/darbhanga/darbhanga-bundle-landing";
import { loadDarbhangaConfig } from "@/lib/platform-content";
import { getServerLocale } from "@/lib/locale-server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const config = await loadDarbhangaConfig(locale);
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
  const locale = await getServerLocale();
  const config = await loadDarbhangaConfig(locale);
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
            inLanguage: ["en", "hi", "mai"],
            areaServed: { "@type": "City", name: "Darbhanga" },
          }),
        }}
      />
      <DarbhangaBundleLanding />
    </>
  );
}
