import type { Metadata } from "next";
import { getSiteContentGroup, parseJson } from "@/lib/site-content";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteContentGroup("seo", "en");
  return {
    title: seo["seo.landing.title"] ?? "WhatsApp Booking System for Indian Businesses | BookNow",
    description:
      seo["seo.landing.description"] ??
      "Manage bookings, customers, and WhatsApp reminders in one place. Free for salons, clinics, and home services. Setup in 5 minutes.",
    openGraph: {
      title: seo["seo.landing.title"] ?? "BookNow — WhatsApp Booking for Indian Businesses",
      description: seo["seo.landing.description"],
      url: "/",
      type: "website",
    },
  };
}

const DEFAULT_FEATURES = [
  "Same-day setup — category, services, timings auto-suggested",
  "Start with your mobile — no password to remember (OTP)",
  "Booking link + printable QR for your shop board",
  "WhatsApp reminders sent automatically to customers",
  "Full CRM — customer history, payments, notes in one place",
];

type FaqItem = { q: string; a: string };
type PricingPlan = { name: string; price: string; period: string; features: string[]; cta: string; href: string; highlighted: boolean };
type PricingSection = { headline: string; plans: PricingPlan[] };

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
  {
    q: "Do my customers need to download an app?",
    a: "No. Customers book from a simple link or QR code in their browser. No app, no login.",
  },
  {
    q: "How does WhatsApp connect work?",
    a: "You scan a QR code once in the app. We then send booking confirmations and reminders automatically.",
  },
  {
    q: "Is it free?",
    a: "Yes, start for free. No credit card needed. Premium features available as your business grows.",
  },
];

export default async function Home() {
  const [landing] = await Promise.all([getSiteContentGroup("landing", "en")]);

  const heroTitle = landing["landing.hero.title"] ?? "Run bookings on WhatsApp — without the chaos.";
  const heroSubtitle =
    landing["landing.hero.subtitle"] ??
    "Built for Indian salons, clinics, spas, and home services. Your customers book from a link or QR; you confirm from your phone.";
  const ctaPrimary = landing["landing.cta.primary"] ?? "Start free with mobile";
  const ctaSecondary = landing["landing.cta.secondary"] ?? "I already have an account";
  const trust = landing["landing.trust"] ?? "Trusted by 100+ businesses across Darbhanga, Laheriasarai & Mohali";
  const features = parseJson<string[]>(landing["landing.features"], DEFAULT_FEATURES);
  const faqs = parseJson<FaqItem[]>(landing["landing.faq"], DEFAULT_FAQS);
  const pricing = parseJson<PricingSection>(landing["landing.pricing"], DEFAULT_PRICING);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-lg px-4 pt-8 pb-10">
        <div className="rounded-3xl bg-white/80 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 font-semibold text-white">
              WA
            </div>
            <div className="leading-tight">
              <div className="text-sm text-zinc-500">WhatsApp-first</div>
              <div className="text-base font-semibold">Booking + CRM</div>
            </div>
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900">{heroTitle}</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{heroSubtitle}</p>

          {/* Features */}
          <ul className="mt-4 space-y-2 text-[13px] text-zinc-700">
            {features.map((f, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-emerald-600">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="mt-6 grid gap-3">
            <a
              href="/signup"
              className="grid h-12 place-items-center rounded-2xl bg-emerald-600 text-[15px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99]"
            >
              {ctaPrimary}
            </a>
            <a
              href="/login"
              className="grid h-12 place-items-center rounded-2xl border border-zinc-200 bg-white text-[15px] font-medium text-zinc-900 transition hover:bg-zinc-50 active:scale-[0.99]"
            >
              {ctaSecondary}
            </a>
          </div>
        </div>

        {/* Trust strip */}
        <p className="mt-4 text-center text-[12px] text-zinc-500">{trust}</p>

        {/* Status colour legend */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            ["Confirmed", "bg-emerald-600"],
            ["Pending", "bg-yellow-400"],
            ["Cancelled", "bg-red-500"],
            ["Completed", "bg-blue-600"],
          ].map(([label, color]) => (
            <div key={label} className="rounded-2xl bg-white/80 p-4 shadow-[0_6px_18px_rgba(0,0,0,0.06)]">
              <div className={`h-2.5 w-12 rounded-full ${color}`} />
              <div className="mt-3 text-sm font-medium">{label}</div>
              <div className="text-xs text-zinc-500">Card-based status</div>
            </div>
          ))}
        </div>

        {/* ── Pricing ───────────────────────────────────────────────── */}
        <div className="mt-10">
          <h2 className="text-center text-xl font-semibold text-zinc-900">{pricing.headline}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {pricing.plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-5 ${plan.highlighted ? "bg-emerald-600 text-white shadow-lg" : "bg-white text-zinc-900 shadow-[0_4px_14px_rgba(0,0,0,0.07)]"}`}
              >
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? "text-emerald-100" : "text-zinc-500"}`}>
                    /{plan.period}
                  </span>
                </div>
                <div className="mt-1 font-semibold">{plan.name}</div>
                <ul className={`mt-3 space-y-1.5 text-[13px] ${plan.highlighted ? "text-emerald-50" : "text-zinc-600"}`}>
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <span className={plan.highlighted ? "text-white" : "text-emerald-600"}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.href}
                  className={`mt-5 grid h-10 w-full place-items-center rounded-xl text-[14px] font-semibold transition active:scale-[0.98] ${
                    plan.highlighted
                      ? "bg-white text-emerald-700 hover:bg-emerald-50"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-zinc-900">Frequently asked questions</h2>
          <div className="mt-4 space-y-4">
            {faqs.map((item, i) => (
              <div key={i} className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
                <div className="font-medium text-zinc-900">{item.q}</div>
                <div className="mt-1.5 text-[13px] leading-6 text-zinc-600">{item.a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 border-t border-zinc-100 pt-6 text-center text-[12px] text-zinc-400">
          <div className="space-x-4">
            <a href="/city/darbhanga" className="hover:text-zinc-600">Darbhanga</a>
            <a href="/city/laheriasarai" className="hover:text-zinc-600">Laheriasarai</a>
            <a href="/city/mohali" className="hover:text-zinc-600">Mohali</a>
            <a href="/city/patna" className="hover:text-zinc-600">Patna</a>
          </div>
          <div className="mt-3">© {new Date().getFullYear()} BookNow · WhatsApp Booking for India</div>
        </div>
      </div>

      {/* JSON-LD: SoftwareApplication schema for landing page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "BookNow",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "INR",
            },
            description: heroSubtitle,
            url: process.env.NEXT_PUBLIC_WEB_URL ?? "https://booknow.app",
            inLanguage: ["en", "hi"],
          }),
        }}
      />
    </div>
  );
}
