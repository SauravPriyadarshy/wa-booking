import type { Metadata } from "next";
import { getSiteContentGroup } from "@/lib/site-content";

export const dynamic = "force-dynamic";

const SUPPORTED_CITIES = ["darbhanga", "laheriasarai", "benipur", "mohali", "patna", "muzaffarpur"];

function capitalize(s: string) {
  if (s === "laheriasarai") return "Laheriasarai";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const CITY_CATEGORIES: Record<string, Array<{ icon: string; name: string; slug: string }>> = {
  darbhanga: [
    { icon: "💈", name: "Salon & Barber", slug: "salon" },
    { icon: "🏥", name: "Clinic & Doctor", slug: "clinic" },
    { icon: "📚", name: "Coaching Center", slug: "coaching" },
    { icon: "🏠", name: "Home Services", slug: "home_service" },
    { icon: "🧖", name: "Spa & Beauty", slug: "spa" },
  ],
  laheriasarai: [
    { icon: "💈", name: "Salon & Barber", slug: "salon" },
    { icon: "🏥", name: "Clinic & Doctor", slug: "clinic" },
    { icon: "📚", name: "Coaching Center", slug: "coaching" },
    { icon: "🏠", name: "Home Services", slug: "home_service" },
  ],
  mohali: [
    { icon: "💈", name: "Salon & Spa", slug: "salon" },
    { icon: "🏥", name: "Clinic", slug: "clinic" },
    { icon: "🏋️", name: "Fitness Center", slug: "spa" },
    { icon: "🏠", name: "Home Services", slug: "home_service" },
  ],
  default: [
    { icon: "💈", name: "Salon", slug: "salon" },
    { icon: "🏥", name: "Clinic", slug: "clinic" },
    { icon: "📚", name: "Coaching", slug: "coaching" },
    { icon: "🏠", name: "Home Services", slug: "home_service" },
  ],
};

const CITY_FAQ: Record<string, Array<{ q: string; a: string }>> = {
  darbhanga: [
    { q: "Darbhanga में WhatsApp booking कैसे काम करती है?", a: "आपके customer को एक link या QR code मिलता है। वो browser में open करके book करते हैं — कोई app नहीं, कोई login नहीं। आपको WhatsApp पर notification आता है।" },
    { q: "Darbhanga के salon/clinic के लिए best booking system कौन सा है?", a: "BookNow specially Indian businesses के लिए बना है — Hindi support, WhatsApp notifications, और mobile-first design। Free में शुरू करें।" },
    { q: "क्या Darbhanga में coaching center के लिए भी काम करता है?", a: "हाँ। Coaching center के लिए student attendance, fee tracking और WhatsApp reminders — सब मिलते हैं।" },
  ],
  laheriasarai: [
    { q: "Laheriasarai में online booking कैसे set up करें?", a: "5 मिनट में। Mobile number से sign up करें, business type चुनें, और booking link मिल जाता है। WhatsApp पर share करें।" },
    { q: "क्या free plan में सब features मिलते हैं?", a: "हाँ, free plan में unlimited bookings, WhatsApp connect, और basic CRM मिलता है।" },
  ],
  default: [
    { q: "Customers को app download करना होगा?", a: "नहीं। वो browser में link से book करते हैं। कोई app नहीं।" },
    { q: "WhatsApp reminder automatically जाता है?", a: "हाँ। Booking confirm होने पर और appointment से 24 घंटे पहले automatic reminder जाता है।" },
  ],
};


export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const contentEn = await getSiteContentGroup("city", "en");
  const cityName = capitalize(city);

  const headline =
    contentEn[`city.${city}.headline`] ??
    `WhatsApp Booking System for ${cityName} Businesses`;
  const subtext =
    contentEn[`city.${city}.subtext`] ??
    `Salons, clinics, coaching centers and home services in ${cityName} use BookNow to manage bookings and send WhatsApp reminders automatically.`;

  return {
    title: `${headline} | BookNow`,
    description: subtext,
    keywords: [`${cityName} salon booking`, `${cityName} clinic booking`, `${cityName} WhatsApp booking`, "online appointment", "BookNow"],
    openGraph: {
      title: headline,
      description: subtext,
      url: `/city/${city}`,
      type: "website",
    },
    alternates: { canonical: `/city/${city}` },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  const [contentEn, contentHi] = await Promise.all([
    getSiteContentGroup("city", "en"),
    getSiteContentGroup("city", "hi"),
  ]);
  const cityName = capitalize(city);
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "https://wa-booking-web.vercel.app";

  const headlineEn =
    contentEn[`city.${city}.headline`] ??
    `WhatsApp Booking System for ${cityName} Businesses`;
  const headlineHi =
    contentHi[`city.${city}.headline`] ??
    `${cityName} के businesses के लिए WhatsApp Booking System`;
  const subtextEn =
    contentEn[`city.${city}.subtext`] ??
    `Salons, clinics, coaching centers and home services in ${cityName} use BookNow to manage bookings and send WhatsApp reminders automatically.`;
  const subtextHi =
    contentHi[`city.${city}.subtext`] ??
    `${cityName} के salons, clinics, coaching centers और home services BookNow use कर रहे हैं।`;

  const categories = CITY_CATEGORIES[city] ?? CITY_CATEGORIES.default;
  const faqs = CITY_FAQ[city] ?? CITY_FAQ.default;

  return (
    <>
      {/* LocalBusiness JSON-LD */}
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
            description: subtextEn,
            url: `${webUrl}/city/${city}`,
            inLanguage: ["en", "hi"],
            areaServed: { "@type": "City", name: cityName },
          }),
        }}
      />

      {/* FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />

      <div className="min-h-screen bg-white">
        {/* ── Nav ── */}
        <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
            <a href="/" className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-xs font-bold text-white">WA</div>
              <span className="text-[14px] font-semibold text-zinc-900">BookNow</span>
            </a>
            <a href="/login" className="h-9 rounded-xl border border-zinc-200 px-4 text-[13px] font-semibold text-zinc-700 leading-9">Login</a>
          </div>
        </nav>

        {/* ── Hero ── */}
        <div className="bg-gradient-to-b from-emerald-50 to-white">
          <div className="mx-auto max-w-lg px-4 pt-8 pb-6">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">BookNow for {cityName}</div>
            <h1 className="mt-2 text-[26px] font-bold leading-tight text-zinc-900">{headlineHi}</h1>
            <p className="mt-2 text-[14px] text-zinc-500">{headlineEn}</p>
            <p className="mt-3 text-[14px] leading-7 text-zinc-700">{subtextHi}</p>

            <div className="mt-5 grid gap-3">
              <a href="/signup"
                className="grid h-13 place-items-center rounded-2xl bg-emerald-600 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700">
                {cityName} में Free शुरू करें →
              </a>
              <a href="/"
                className="grid h-11 place-items-center rounded-2xl border border-zinc-200 bg-white text-[14px] font-medium text-zinc-700">
                More about BookNow
              </a>
            </div>
          </div>
        </div>

        {/* ── Category cards ── */}
        <div className="mx-auto max-w-lg px-4 py-8">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400">{cityName} में किस business के लिए?</div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((cat) => (
              <a key={cat.slug} href="/signup"
                className="flex items-center gap-2.5 rounded-2xl border border-zinc-100 bg-white p-3.5 shadow-sm transition hover:border-emerald-200">
                <span className="text-xl">{cat.icon}</span>
                <span className="text-[13px] font-semibold text-zinc-800">{cat.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* ── Benefits ── */}
        <div className="bg-zinc-50 py-8">
          <div className="mx-auto max-w-lg px-4">
            <h2 className="text-[18px] font-bold text-zinc-900">{cityName} के businesses क्यों BookNow use करते हैं?</h2>
            <div className="mt-4 grid gap-3">
              {[
                { icon: "📱", title: "WhatsApp पर Booking", desc: "Customers booking link से book करते हैं। आपको WhatsApp पर notification आता है।" },
                { icon: "🔔", title: "Automatic Reminders", desc: "Appointment से 24 घंटे पहले customer को automatic reminder जाता है।" },
                { icon: "👥", title: "Customer CRM", desc: "हर customer का history, payment और notes एक जगह। Professional CRM system।" },
                { icon: "⚡", title: "5 मिनट में setup", desc: "Mobile number से sign up करें। Business type choose करें। Booking link ready।" },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
                  <span className="text-xl shrink-0 mt-0.5">{icon}</span>
                  <div>
                    <div className="text-[14px] font-bold text-zinc-900">{title}</div>
                    <div className="mt-0.5 text-[12px] leading-5 text-zinc-600">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="mx-auto max-w-lg px-4 py-8">
          <h2 className="text-[18px] font-bold text-zinc-900">अक्सर पूछे जाने वाले सवाल — {cityName}</h2>
          <div className="mt-4 space-y-2">
            {faqs.map((faq, i) => (
              <details key={i} className="group rounded-2xl border border-zinc-100 bg-white shadow-sm">
                <summary className="flex cursor-pointer items-start justify-between gap-2 p-4 text-[13px] font-semibold text-zinc-900 marker:content-none">
                  {faq.q}
                  <span className="mt-0.5 shrink-0 text-zinc-400 transition group-open:rotate-180">↓</span>
                </summary>
                <div className="border-t border-zinc-100 px-4 pb-4 pt-3 text-[13px] leading-6 text-zinc-600">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="bg-emerald-600 py-8">
          <div className="mx-auto max-w-lg px-4 text-center">
            <h2 className="text-[20px] font-bold text-white">{cityName} में अभी शुरू करें — Free</h2>
            <p className="mt-1 text-[13px] text-emerald-100">कोई credit card नहीं चाहिए।</p>
            <a href="/signup"
              className="mt-4 inline-flex h-12 items-center rounded-2xl bg-white px-8 text-[15px] font-bold text-emerald-700 transition hover:bg-emerald-50">
              Free Account बनाएं →
            </a>
          </div>
        </div>

        {/* ── Other cities ── */}
        <div className="mx-auto max-w-lg px-4 py-6">
          <div className="text-center text-[12px] font-medium text-zinc-400">और शहर</div>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {SUPPORTED_CITIES.filter((c) => c !== city).map((c) => (
              <a key={c} href={`/city/${c}`}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-[12px] font-semibold text-zinc-600 hover:border-emerald-300 hover:text-emerald-700">
                {capitalize(c)}
              </a>
            ))}
          </div>
          <p className="mt-4 text-center text-[11px] text-zinc-400">
            © {new Date().getFullYear()} BookNow · <a href="/" className="hover:underline">Home</a>
          </p>
        </div>
      </div>
    </>
  );
}
