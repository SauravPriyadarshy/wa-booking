import type { Metadata } from "next";
import { getSiteContentGroup } from "@/lib/site-content";
import BookingClient from "./booking-client";

const apiBase = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

async function fetchBusiness(slug: string) {
  try {
    const res = await fetch(`${apiBase()}/public/business/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as { id: string; name: string; slug: string; description?: string; phone?: string; address?: string };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [business, seo] = await Promise.all([fetchBusiness(slug), getSiteContentGroup("seo", "en")]);

  const businessName = business?.name ?? slug;
  const titleTemplate = seo["seo.slug.title_template"] ?? "Book {businessName} | Online Appointment";
  const descTemplate =
    seo["seo.slug.description_template"] ??
    "Book appointments at {businessName} instantly. WhatsApp confirmation sent automatically.";

  const title = titleTemplate.replace("{businessName}", businessName);
  const description = descTemplate.replace("{businessName}", businessName);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${slug}`,
      type: "website",
    },
  };
}

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await fetchBusiness(slug);

  const webUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "https://booknow.app";

  return (
    <>
      {/* JSON-LD: LocalBusiness schema */}
      {business && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              name: business.name,
              url: `${webUrl}/${slug}`,
              telephone: business.phone ?? undefined,
              address: business.address
                ? { "@type": "PostalAddress", streetAddress: business.address }
                : undefined,
              description: `Book appointments at ${business.name} online. WhatsApp confirmation sent automatically.`,
              hasMap: undefined,
              potentialAction: {
                "@type": "ReserveAction",
                target: `${webUrl}/${slug}`,
                result: { "@type": "Reservation", name: "Appointment" },
              },
            }),
          }}
        />
      )}
      <BookingClient params={params} />
    </>
  );
}
