import type { Metadata } from "next";
import { DarbhangaBundleLanding } from "@/components/darbhanga/darbhanga-bundle-landing";

export const metadata: Metadata = {
  title: "दरभंगा WhatsApp Pack — Booking + Reminder + Customer List | BookNow",
  description:
    "Darbhanga ke salon, clinic, coaching ke liye ek bundle: booking link, WhatsApp reminder, customer list. ₹0, 5 minute setup, phone pe kaam.",
  keywords: [
    "Darbhanga salon booking",
    "Darbhanga clinic WhatsApp",
    "Darbhanga coaching fees",
    "WhatsApp booking Darbhanga",
  ],
  openGraph: {
    title: "दरभंगा WhatsApp Pack | BookNow",
    description: "Teen cheez. Paanch minute. Phone pe kaam.",
    url: "/darbhanga",
    type: "website",
  },
  alternates: { canonical: "/darbhanga" },
};

export default function DarbhangaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "BookNow — Darbhanga WhatsApp Pack",
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
