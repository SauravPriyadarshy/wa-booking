import type { Metadata } from "next";
import { getSiteContentGroup } from "@/lib/site-content";

export const dynamic = "force-dynamic";

const SUPPORTED_CITIES = ["darbhanga", "laheriasarai", "mohali", "patna", "muzaffarpur"];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const content = await getSiteContentGroup("city", "en");
  const cityName = capitalize(city);

  const headline =
    content[`city.${city}.headline`] ??
    `WhatsApp Booking System for ${cityName} Businesses`;
  const subtext =
    content[`city.${city}.subtext`] ??
    `Salons, clinics, home services and coaching centers in ${cityName} are using BookNow to manage bookings and send WhatsApp reminders.`;

  return {
    title: `${headline} | BookNow`,
    description: subtext,
    openGraph: { title: headline, description: subtext, url: `/city/${city}`, type: "website" },
  };
}

const SERVICES_BY_CITY: Record<string, string[]> = {
  darbhanga: ["Salons", "Clinics", "Home services", "Coaching centers", "Spas"],
  laheriasarai: ["Salons", "Clinics", "Home services", "Beauty parlours"],
  mohali: ["Salons", "Clinics", "Fitness centers", "Home services"],
  patna: ["Salons", "Clinics", "Spas", "Coaching centers", "Home services"],
  muzaffarpur: ["Salons", "Clinics", "Home services", "Coaching centers"],
};

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const content = await getSiteContentGroup("city", "en");
  const cityName = capitalize(city);

  const headline =
    content[`city.${city}.headline`] ??
    `WhatsApp Booking System for ${cityName} Businesses`;
  const subtext =
    content[`city.${city}.subtext`] ??
    `Salons, clinics, home services and coaching centers in ${cityName} are using BookNow to manage bookings and send WhatsApp reminders.`;

  const services = SERVICES_BY_CITY[city] ?? ["Salons", "Clinics", "Home services"];
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "https://booknow.app";

  return (
    <>
      {/* JSON-LD: LocalBusiness / Service schema for the city */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: `BookNow — ${cityName}`,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            description: subtext,
            url: `${webUrl}/city/${city}`,
            areaServed: {
              "@type": "City",
              name: cityName,
              "@id": `https://www.wikidata.org/wiki/${cityName}`,
            },
          }),
        }}
      />

      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="mx-auto max-w-xl px-4 py-10">
          {/* Hero */}
          <div className="rounded-3xl bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 font-semibold text-white">
                WA
              </div>
              <div>
                <div className="text-sm text-zinc-500">BookNow for {cityName}</div>
                <div className="text-base font-semibold">WhatsApp Booking + CRM</div>
              </div>
            </div>

            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900">{headline}</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{subtext}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {services.map((s) => (
                <span key={s} className="rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-800">
                  {s}
                </span>
              ))}
            </div>

            <div className="mt-6 grid gap-3">
              <a
                href="/signup"
                className="grid h-12 place-items-center rounded-2xl bg-emerald-600 text-[15px] font-semibold text-white transition hover:bg-emerald-700"
              >
                Start free for your {cityName} business
              </a>
              <a
                href="/login"
                className="grid h-12 place-items-center rounded-2xl border border-zinc-200 bg-white text-[15px] font-medium text-zinc-900 transition hover:bg-zinc-50"
              >
                I already have an account
              </a>
            </div>
          </div>

          {/* Why BookNow */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-zinc-900">Why {cityName} businesses love BookNow</h2>
            <div className="mt-4 grid gap-3">
              {[
                {
                  icon: "📱",
                  title: "Works on any mobile",
                  body: "No app download needed. Customers book from a WhatsApp link or QR on your shop board.",
                },
                {
                  icon: "⚡",
                  title: "Setup in 5 minutes",
                  body: "Sign up with your phone number, pick your services, and share your booking link. Done.",
                },
                {
                  icon: "🔔",
                  title: "Auto WhatsApp reminders",
                  body: "Customers get a confirmation and a reminder 24h before. Fewer no-shows, more revenue.",
                },
                {
                  icon: "📊",
                  title: "Full customer history",
                  body: "See every booking, payment, and note for each customer in one place. Works like a mini CRM.",
                },
              ].map(({ icon, title, body }) => (
                <div key={title} className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 text-2xl">{icon}</span>
                    <div>
                      <div className="font-semibold text-zinc-900">{title}</div>
                      <div className="mt-0.5 text-[13px] leading-5 text-zinc-600">{body}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA strip */}
          <div className="mt-10 rounded-2xl bg-emerald-600 p-6 text-center text-white">
            <div className="text-xl font-semibold">Ready to grow your {cityName} business?</div>
            <p className="mt-1 text-[13px] text-emerald-100">Free forever. No credit card.</p>
            <a
              href="/signup"
              className="mt-4 inline-block rounded-xl bg-white px-6 py-2.5 text-[15px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Start free today
            </a>
          </div>

          {/* Explore other cities */}
          <div className="mt-8 text-center text-[12px] text-zinc-400">
            <div className="mb-2 font-medium">Also serving:</div>
            <div className="flex flex-wrap justify-center gap-3">
              {SUPPORTED_CITIES.filter((c) => c !== city).map((c) => (
                <a key={c} href={`/city/${c}`} className="hover:text-zinc-600 hover:underline">
                  {capitalize(c)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
