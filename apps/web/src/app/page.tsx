import type { Metadata } from "next";
import { getSiteContentGroup, parseJson } from "@/lib/site-content";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteContentGroup("seo", "en");
  return {
    title: seo["seo.landing.title"] ?? "WhatsApp Business Assistant for Indian Businesses | BookNow",
    description:
      seo["seo.landing.description"] ??
      "अब Booking, Reminder और Customer Management सब WhatsApp से। Salon, Clinic, Coaching के लिए। Free setup in 5 minutes.",
    openGraph: {
      title: seo["seo.landing.title"] ?? "BookNow — WhatsApp Business Assistant",
      description: seo["seo.landing.description"],
      url: "/",
      type: "website",
    },
  };
}

type FaqItem = { q: string; a: string };
type PricingPlan = { name: string; price: string; period: string; features: string[]; cta: string; href: string; highlighted: boolean };
type PricingSection = { headline: string; plans: PricingPlan[] };
type Testimonial = { name: string; business: string; city: string; text: string };
type Category = { key: string; name: string; icon: string; nameHi: string };

const DEFAULT_PRICING: PricingSection = {
  headline: "Simple pricing. No surprises.",
  plans: [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      features: ["Unlimited bookings", "WhatsApp connect", "Public booking page", "Basic CRM"],
      cta: "Start free",
      href: "/signup",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "₹499",
      period: "per month",
      features: [
        "Everything in Free",
        "Auto WhatsApp reminders",
        "Customer retention automation",
        "Analytics & reports",
        "Priority support",
      ],
      cta: "Start 14-day trial",
      href: "/signup",
      highlighted: true,
    },
  ],
};

const DEFAULT_FAQS: FaqItem[] = [
  { q: "क्या customers को कोई app download करना होगा?", a: "नहीं। Customer browser में link या QR से book करते हैं। कोई app नहीं, कोई login नहीं।" },
  { q: "WhatsApp connect कैसे काम करता है?", a: "App में एक बार QR scan करें। फिर WhatsApp link हो जाता है और booking confirmation और reminders automatically जाते हैं।" },
  { q: "क्या यह free है?", a: "हाँ, free में शुरू करें। कोई credit card नहीं चाहिए।" },
  { q: "क्या यह clinic और coaching के लिए भी काम करता है?", a: "हाँ — salons, clinics, spas, coaching centers, tutors — कोई भी appointment-based business।" },
];

const CATEGORIES: Category[] = [
  { key: "salon", name: "Salon & Barber", nameHi: "सैलून / बाल कटाई", icon: "💈" },
  { key: "clinic", name: "Clinic & Doctor", nameHi: "क्लिनिक / डॉक्टर", icon: "🏥" },
  { key: "coaching", name: "Coaching Center", nameHi: "कोचिंग सेंटर", icon: "📚" },
  { key: "spa", name: "Spa & Wellness", nameHi: "स्पा / वेलनेस", icon: "🧖" },
  { key: "home_service", name: "Home Services", nameHi: "होम सर्विस", icon: "🔧" },
  { key: "other", name: "Any Business", nameHi: "कोई भी बिज़नेस", icon: "🏪" },
];

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Rakesh Kumar",
    business: "Raj Hair Studio",
    city: "Darbhanga",
    text: "पहले WhatsApp पर manually booking लेता था, बहुत confusion होती थी। अब सब system में है, missed bookings बंद हो गए।",
  },
  {
    name: "Dr. Priya Singh",
    business: "Singh Clinic",
    city: "Laheriasarai",
    text: "Patients को automatically reminder जाता है। No-show 60% कम हो गए। बहुत अच्छा system है।",
  },
  {
    name: "Amit Jha",
    business: "Success Coaching Center",
    city: "Darbhanga",
    text: "Students की fees और attendance दोनों एक जगह। Parents को WhatsApp reminders automatically जाते हैं।",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Business बनाएं", desc: "अपनी category चुनें — services automatically सुझाई जाती हैं। 2 मिनट में setup।", icon: "🏪" },
  { step: "2", title: "Booking link share करें", desc: "QR code print करें या WhatsApp पर link भेजें। Customers easily book करते हैं।", icon: "📱" },
  { step: "3", title: "WhatsApp से manage करें", desc: "Confirmations, reminders और customer messages — सब automatic।", icon: "✅" },
];

const CITIES = ["Darbhanga", "Laheriasarai", "Benipur", "Baheri", "Jale", "Mohali", "Patna"];

export default async function Home() {
  const landing = await getSiteContentGroup("landing", "hi");
  const landingEn = await getSiteContentGroup("landing", "en");

  const heroTitleHi = landing["landing.hero.title"] ?? "अब Booking, Reminder और Customer Management सब WhatsApp से";
  const heroSubtitleHi = landing["landing.hero.subtitle"] ?? "Salon, Clinic, Coaching और Service Business के लिए आसान सिस्टम। Setup में सिर्फ 5 मिनट।";
  const ctaPrimary = landing["landing.cta.primary"] ?? "Free Demo शुरू करें";
  const ctaSecondary = landingEn["landing.cta.secondary"] ?? "Login करें";
  const trustText = landing["landing.trust"] ?? "Darbhanga, Laheriasarai और Mohali के 100+ businesses का भरोसा";
  const pricing = parseJson<PricingSection>(landingEn["landing.pricing"], DEFAULT_PRICING);
  const faqs = parseJson<FaqItem[]>(landing["landing.faq"] ?? landingEn["landing.faq"], DEFAULT_FAQS);
  const waNumber = landingEn["landing.whatsapp_number"] ?? "919122000751";

  return (
    <div className="min-h-screen bg-white">
      {/* ── Sticky nav ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-sm font-bold text-white">WA</div>
            <span className="text-[15px] font-semibold text-zinc-900">BookNow</span>
          </div>
          <a href="/login" className="h-9 rounded-xl border border-zinc-200 px-4 text-[13px] font-semibold text-zinc-700 leading-9">
            Login
          </a>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="mx-auto max-w-lg px-4 pt-10 pb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[12px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            WhatsApp Business Assistant
          </div>

          <h1 className="mt-4 text-[28px] font-bold leading-tight tracking-tight text-zinc-900">
            {heroTitleHi}
          </h1>
          <p className="mt-3 text-[15px] leading-7 text-zinc-600">{heroSubtitleHi}</p>

          <div className="mt-6 grid gap-3">
            <a
              href="/signup"
              className="grid h-14 place-items-center rounded-2xl bg-emerald-600 text-[16px] font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 active:scale-[0.99]"
            >
              {ctaPrimary}
            </a>
            <a
              href={`https://wa.me/${waNumber}?text=Namaste!%20Mujhe%20BookNow%20ke%20baare%20mein%20janna%20hai`}
              target="_blank"
              rel="noreferrer"
              className="grid h-12 place-items-center rounded-2xl bg-[#25D366] text-[15px] font-semibold text-white transition hover:bg-[#20ba59] active:scale-[0.99]"
            >
              💬 WhatsApp पर बात करें
            </a>
            <a
              href="/login"
              className="grid h-11 place-items-center rounded-2xl border border-zinc-200 bg-white text-[14px] font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              {ctaSecondary}
            </a>
          </div>

          {/* Trust strip */}
          <p className="mt-4 text-center text-[12px] text-zinc-500">{trustText}</p>
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────────── */}
      <div className="border-y border-zinc-100 bg-zinc-50 py-5">
        <div className="mx-auto max-w-lg px-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { n: "100+", label: "Businesses" },
              { n: "5000+", label: "Bookings/month" },
              { n: "6", label: "Cities" },
            ].map(({ n, label }) => (
              <div key={label}>
                <div className="text-[22px] font-bold text-emerald-600">{n}</div>
                <div className="text-[11px] font-medium text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category showcase ─────────────────────────────────────── */}
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="text-center">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">किसके लिए बना है?</div>
          <h2 className="mt-2 text-[22px] font-bold text-zinc-900">हर type के business के लिए</h2>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.key}
              href="/signup"
              className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md active:scale-[0.99]"
            >
              <span className="text-2xl">{cat.icon}</span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-zinc-900">{cat.nameHi}</div>
                <div className="truncate text-[11px] text-zinc-400">{cat.name}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── How it works ──────────────────────────────────────────── */}
      <div className="bg-emerald-50 py-10">
        <div className="mx-auto max-w-lg px-4">
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">कैसे काम करता है?</div>
            <h2 className="mt-2 text-[22px] font-bold text-zinc-900">3 steps में शुरू करें</h2>
          </div>
          <div className="mt-6 grid gap-4">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="flex items-start gap-4 rounded-2xl bg-white p-4 shadow-sm">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-xl font-bold text-white">
                  {step.icon}
                </div>
                <div>
                  <div className="text-[14px] font-bold text-zinc-900">
                    <span className="mr-1 text-emerald-600">Step {step.step}:</span>
                    {step.title}
                  </div>
                  <div className="mt-1 text-[13px] leading-relaxed text-zinc-600">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <a
              href="/signup"
              className="inline-flex h-12 items-center rounded-2xl bg-emerald-600 px-6 text-[15px] font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              अभी शुरू करें — Free
            </a>
          </div>
        </div>
      </div>

      {/* ── Before / After ────────────────────────────────────────── */}
      <div className="mx-auto max-w-lg px-4 py-10">
        <div className="text-center">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">पहले vs अब</div>
          <h2 className="mt-2 text-[22px] font-bold text-zinc-900">BookNow से क्या बदलता है?</h2>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <div className="mb-3 text-[12px] font-bold uppercase tracking-wide text-red-500">पहले 😰</div>
            {[
              "WhatsApp पर हर booking manually",
              "Reminder भूल जाते थे",
              "Customer का record नहीं",
              "Payment track नहीं होती",
              "Staff को काम याद दिलाना",
            ].map((t) => (
              <div key={t} className="flex items-start gap-1.5 py-1">
                <span className="mt-0.5 text-[11px] text-red-400">✗</span>
                <span className="text-[12px] leading-snug text-red-700">{t}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="mb-3 text-[12px] font-bold uppercase tracking-wide text-emerald-600">अब 😊</div>
            {[
              "Online booking link से auto",
              "WhatsApp reminders automatic",
              "पूरा CRM एक जगह",
              "Payment verify हो जाती है",
              "Staff को notifications",
            ].map((t) => (
              <div key={t} className="flex items-start gap-1.5 py-1">
                <span className="mt-0.5 text-[11px] text-emerald-500">✓</span>
                <span className="text-[12px] leading-snug text-emerald-700">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <div className="bg-zinc-50 py-10">
        <div className="mx-auto max-w-lg px-4">
          <div className="text-center">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">लोग क्या कहते हैं</div>
            <h2 className="mt-2 text-[22px] font-bold text-zinc-900">Real businesses, real results</h2>
          </div>
          <div className="mt-6 grid gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex text-amber-400">
                  {"★★★★★".split("").map((s, i) => <span key={i} className="text-[14px]">{s}</span>)}
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-zinc-700">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-[13px] font-bold text-emerald-700">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-zinc-900">{t.name}</div>
                    <div className="text-[11px] text-zinc-500">{t.business} · {t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Trusted cities ────────────────────────────────────────── */}
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="text-center text-[13px] font-semibold text-zinc-500">इन शहरों में active है</div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {CITIES.map((city) => (
            <a
              key={city}
              href={`/city/${city.toLowerCase()}`}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-[13px] font-semibold text-zinc-700 transition hover:border-emerald-300 hover:text-emerald-700"
            >
              {city}
            </a>
          ))}
        </div>
      </div>

      {/* ── Pricing ───────────────────────────────────────────────── */}
      <div className="bg-zinc-50 py-10">
        <div className="mx-auto max-w-lg px-4">
          <h2 className="text-center text-[22px] font-bold text-zinc-900">{pricing.headline}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {pricing.plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-5 ${plan.highlighted ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "border border-zinc-200 bg-white text-zinc-900"}`}
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-[32px] font-bold">{plan.price}</span>
                  <span className={`text-[13px] ${plan.highlighted ? "text-emerald-100" : "text-zinc-500"}`}>/{plan.period}</span>
                </div>
                <div className="mt-1 text-[15px] font-bold">{plan.name}</div>
                <ul className={`mt-3 space-y-1.5 text-[13px] ${plan.highlighted ? "text-emerald-50" : "text-zinc-600"}`}>
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className={plan.highlighted ? "text-white" : "text-emerald-600"}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.href}
                  className={`mt-5 grid h-11 w-full place-items-center rounded-xl text-[14px] font-bold transition active:scale-[0.98] ${
                    plan.highlighted ? "bg-white text-emerald-700 hover:bg-emerald-50" : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-lg px-4 py-10">
        <h2 className="text-center text-[22px] font-bold text-zinc-900">अक्सर पूछे जाने वाले सवाल</h2>
        <div className="mt-5 space-y-3">
          {faqs.map((item, i) => (
            <details key={i} className="group rounded-2xl border border-zinc-100 bg-white shadow-sm">
              <summary className="flex cursor-pointer items-start justify-between gap-2 p-4 text-[14px] font-semibold text-zinc-900 marker:content-none">
                {item.q}
                <span className="mt-0.5 shrink-0 text-zinc-400 transition group-open:rotate-180">↓</span>
              </summary>
              <div className="border-t border-zinc-100 px-4 pb-4 pt-3 text-[13px] leading-6 text-zinc-600">{item.a}</div>
            </details>
          ))}
        </div>
      </div>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <div className="bg-emerald-600 py-10">
        <div className="mx-auto max-w-lg px-4 text-center">
          <h2 className="text-[22px] font-bold text-white">आज ही शुरू करें — बिल्कुल Free</h2>
          <p className="mt-2 text-[14px] text-emerald-100">5 मिनट में setup। कोई credit card नहीं चाहिए।</p>
          <a
            href="/signup"
            className="mt-5 inline-flex h-12 items-center rounded-2xl bg-white px-8 text-[15px] font-bold text-emerald-700 shadow transition hover:bg-emerald-50"
          >
            Free शुरू करें →
          </a>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-100 py-8">
        <div className="mx-auto max-w-lg px-4">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[12px] text-zinc-500">
            {CITIES.map((city) => (
              <a key={city} href={`/city/${city.toLowerCase()}`} className="hover:text-emerald-600">
                {city}
              </a>
            ))}
          </div>
          <p className="mt-4 text-center text-[12px] text-zinc-400">
            © {new Date().getFullYear()} BookNow · WhatsApp Business Assistant for India
          </p>
        </div>
      </footer>

      {/* ── Floating WhatsApp CTA ─────────────────────────────────── */}
      <a
        href={`https://wa.me/${waNumber}?text=Namaste!%20BookNow%20ke%20baare%20mein%20baat%20karna%20chahta%20hoon`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-green-300/50 transition hover:bg-[#20ba59] hover:scale-110 active:scale-95"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "BookNow",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
            description: heroSubtitleHi,
            url: process.env.NEXT_PUBLIC_WEB_URL ?? "https://wa-booking-web.vercel.app",
            inLanguage: ["en", "hi"],
            areaServed: { "@type": "Country", name: "India" },
          }),
        }}
      />
    </div>
  );
}
