import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSiteContentGroup, parseJson } from "@/lib/site-content";
import { loadPlatformConfig } from "@/lib/platform-content";
import { categoryDisplayName } from "@/lib/locale";
import { getServerLocale } from "@/lib/locale-server";
import { CITY_BENEFITS, LANDING_FAQ, LANDING_PRICING, WA_INTRO_MESSAGES, type PricingSection } from "@/lib/localized-marketing";
import type { AppLocale } from "@/lib/locale";
import { MarketingShell } from "@/components/layout/marketing-shell";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const seo = await getSiteContentGroup("seo", locale);
  return {
    title: seo["seo.landing.title"] ?? "WhatsApp Business Assistant | BookNow",
    description:
      seo["seo.landing.description"] ??
      "The easiest way to run your business on WhatsApp — booking, customers, reminders.",
    openGraph: {
      title: seo["seo.landing.title"] ?? "WhatsApp Business Assistant",
      description: seo["seo.landing.description"],
      url: "/",
      type: "website",
    },
  };
}

type FaqItem = { q: string; a: string };

function resolvePricing(raw: string | undefined, locale: AppLocale): PricingSection {
  const fallback = LANDING_PRICING[locale];
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as PricingSection;
    if (Array.isArray(parsed.plans) && parsed.plans.length >= 3) {
      return { headline: parsed.headline ?? fallback.headline, plans: parsed.plans };
    }
  } catch {
    /* use fallback */
  }
  return fallback;
}

const CITIES = ["Darbhanga", "Laheriasarai", "Benipur", "Baheri", "Jale", "Samastipur", "Muzaffarpur", "Patna"];

export default async function Home() {
  const locale = await getServerLocale();
  const t = await getTranslations("marketing");
  const [landing, landingEn, platform] = await Promise.all([
    getSiteContentGroup("landing", locale),
    getSiteContentGroup("landing", "en"),
    loadPlatformConfig(locale),
  ]);

  const heroDefaults =
    locale === "en"
      ? {
          title: "The easiest way to run your business on WhatsApp",
          subtitle: "Booking, customers, payments, follow-ups and support — all in one place.",
          ctaPrimary: "Start free",
          ctaDemo: "See How This Helps My Business",
          ctaBusinessSuccess: "See how it helps your business →",
          trust: "Trusted by salons, clinics, coaching & home services across Bihar",
        }
      : {
          title: "WhatsApp से अपना व्यवसाय चलाइए",
          subtitle: "बुकिंग, ग्राहक, भुगतान, फॉलोअप और सपोर्ट — सब एक जगह",
          ctaPrimary: "Free शुरू करें",
          ctaDemo: "देखें यह आपके व्यवसाय में कैसे मदद करेगा",
          ctaBusinessSuccess: "देखें यह कैसे मदद करेगा →",
          trust: "Salon, clinic, coaching — Darbhanga se Patna tak",
        };

  const heroTitle = landing["landing.hero.title"] ?? heroDefaults.title;
  const heroSubtitle = landing["landing.hero.subtitle"] ?? heroDefaults.subtitle;
  const ctaPrimary = landing["landing.cta.primary"] ?? heroDefaults.ctaPrimary;
  const trustText = landing["landing.trust"] ?? heroDefaults.trust;
  const pricing = resolvePricing(landingEn["landing.pricing"], locale);
  const faqs = parseJson<FaqItem[]>(landing["landing.faq"] ?? landingEn["landing.faq"], LANDING_FAQ[locale]);
  const waIntro = WA_INTRO_MESSAGES[locale];
  const waNumber = platform.whatsappNumber;
  const { categories, testimonials } = platform;
  const benefits = CITY_BENEFITS[locale];

  return (
    <MarketingShell>
      {/* Hero — above the fold */}
      <section className="bg-gradient-to-b from-emerald-600 via-emerald-600 to-emerald-700 text-white">
        <div className="shell py-10 md:py-12">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-100">
            WhatsApp Business Assistant
          </p>
          <h1 className="mt-3 text-[26px] font-black leading-tight tracking-tight md:text-[34px]">{heroTitle}</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-7 text-emerald-50">{heroSubtitle}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <a
              href="/signup"
              className="flex h-12 items-center justify-center rounded-2xl bg-white px-6 text-[15px] font-bold text-emerald-700 shadow-lg transition hover:bg-emerald-50 active:scale-[0.99]"
            >
              {ctaPrimary}
            </a>
            <a
              href="/business-success"
              className="flex h-12 items-center justify-center rounded-2xl border-2 border-white/40 px-6 text-[15px] font-semibold text-white transition hover:bg-white/10"
            >
              {heroDefaults.ctaDemo}
            </a>
          </div>
          <p className="mt-4 text-[12px] text-emerald-100/90">{trustText}</p>
        </div>
      </section>

      {/* Categories — compact grid */}
      <section className="shell py-8">
        <h2 className="text-center text-[18px] font-bold text-zinc-900">{t("everyBusinessType")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {categories.map((cat) => (
            <a
              key={cat.key}
              href="/signup"
              className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-white p-3 shadow-sm transition hover:border-emerald-200 active:scale-[0.99]"
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="truncate text-[12px] font-semibold text-zinc-800">{categoryDisplayName(cat, locale)}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Key benefits — 4 cards */}
      <section className="bg-zinc-50 py-8">
        <div className="shell">
          <h2 className="text-center text-[18px] font-bold text-zinc-900">{t("howItWorks")}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {benefits.map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-3 rounded-xl bg-white p-3 shadow-sm">
                <span className="text-xl">{icon}</span>
                <div>
                  <div className="text-[13px] font-bold text-zinc-900">{title}</div>
                  <div className="mt-0.5 text-[12px] leading-5 text-zinc-600">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Success CTA */}
      <section className="shell py-6">
        <a
          href="/business-success"
          className="flex flex-col items-center rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 text-center shadow-sm transition hover:border-emerald-400 active:scale-[0.99]"
        >
          <span className="text-3xl">📈</span>
          <span className="mt-2 text-[17px] font-black text-zinc-900">{t("businessSuccessTitle")}</span>
          <span className="mt-1 max-w-sm text-[13px] leading-relaxed text-zinc-600">{t("businessSuccessSub")}</span>
          <span className="mt-3 text-[14px] font-bold text-emerald-700">{heroDefaults.ctaBusinessSuccess}</span>
        </a>
      </section>

      {/* Pricing — 3 plans */}
      <section className="bg-zinc-50 py-8">
        <div className="shell">
          <h2 className="text-center text-[20px] font-bold text-zinc-900">{pricing.headline}</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {pricing.plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-4 ${plan.highlighted ? "bg-emerald-600 text-white shadow-lg" : "border border-zinc-200 bg-white"}`}
              >
                <div className="text-[24px] font-black">{plan.price}</div>
                <div className={`text-[13px] ${plan.highlighted ? "text-emerald-100" : "text-zinc-500"}`}>/{plan.period}</div>
                <div className="mt-1 text-[15px] font-bold">{plan.name}</div>
                <ul className={`mt-3 space-y-1 text-[12px] ${plan.highlighted ? "text-emerald-50" : "text-zinc-600"}`}>
                  {plan.features.slice(0, 5).map((f) => (
                    <li key={f}>✓ {f}</li>
                  ))}
                </ul>
                <a
                  href={plan.href}
                  className={`mt-4 flex h-10 items-center justify-center rounded-xl text-[13px] font-bold ${
                    plan.highlighted ? "bg-white text-emerald-700" : "bg-emerald-600 text-white"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — horizontal scroll on mobile */}
      <section className="shell py-8">
        <h2 className="text-[18px] font-bold text-zinc-900">{t("testimonials")}</h2>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="min-w-[260px] max-w-[280px] shrink-0 snap-start rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm"
            >
              <p className="text-[13px] leading-relaxed text-zinc-700">&ldquo;{item.text}&rdquo;</p>
              <div className="mt-3 text-[12px] font-semibold text-zinc-900">{item.name}</div>
              <div className="text-[11px] text-zinc-500">{item.business} · {item.city}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ — compact */}
      <section className="shell py-8">
        <h2 className="text-[18px] font-bold text-zinc-900">{t("faqTitle")}</h2>
        <div className="mt-3 space-y-2">
          {faqs.slice(0, 4).map((item, i) => (
            <details key={i} className="rounded-xl border border-zinc-100 bg-white">
              <summary className="cursor-pointer p-3 text-[13px] font-semibold marker:content-none">{item.q}</summary>
              <div className="border-t border-zinc-50 px-3 pb-3 pt-2 text-[12px] leading-6 text-zinc-600">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-6">
        <div className="shell">
          <div className="flex flex-wrap justify-center gap-2">
            {CITIES.map((city) => (
              <a
                key={city}
                href={`/city/${city.toLowerCase()}`}
                className="rounded-full border border-zinc-200 px-3 py-1 text-[11px] font-semibold text-zinc-600 hover:border-emerald-300"
              >
                {city}
              </a>
            ))}
          </div>
          <p className="mt-4 text-center text-[11px] text-zinc-400">
            {t("footerTagline", { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>

      <a
        href={`https://wa.me/${waNumber}?text=${encodeURIComponent(waIntro.float)}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg"
        aria-label="WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>
    </MarketingShell>
  );
}
