import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getSiteContentGroup } from "@/lib/site-content";
import { getServerLocale } from "@/lib/locale-server";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { CITY_BENEFITS, cityFaqs } from "@/lib/localized-marketing";
import { loadPlatformConfig } from "@/lib/platform-content";
import { categoryDisplayName } from "@/lib/locale";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

const SUPPORTED_CITIES = ["darbhanga", "laheriasarai", "benipur", "baheri", "jale", "samastipur", "mohali", "patna", "muzaffarpur"];

const CITY_CATEGORY_SLUGS: Record<string, string[]> = {
  darbhanga: ["salon", "clinic", "coaching", "home_service", "spa"],
  laheriasarai: ["salon", "clinic", "coaching", "home_service"],
  mohali: ["salon", "clinic", "spa", "home_service"],
  default: ["salon", "clinic", "coaching", "home_service"],
};

function capitalize(s: string) {
  if (s === "laheriasarai") return "Laheriasarai";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const locale = await getServerLocale();
  const [content, contentEn] = await Promise.all([
    getSiteContentGroup("city", locale),
    getSiteContentGroup("city", "en"),
  ]);
  const cityName = capitalize(city);
  const headline =
    content[`city.${city}.headline`] ??
    contentEn[`city.${city}.headline`] ??
    `WhatsApp Booking System for ${cityName} Businesses`;
  const subtext =
    content[`city.${city}.subtext`] ??
    contentEn[`city.${city}.subtext`] ??
    `Salons, clinics, coaching centers in ${cityName} use BookNow for bookings and WhatsApp reminders.`;
  const base = siteUrl();
  const pageUrl = `${base}/city/${city}`;

  return {
    title: `${headline} | BookNow`,
    description: subtext,
    keywords: [`${cityName} salon booking`, `${cityName} clinic booking`, `${cityName} WhatsApp booking`, "BookNow"],
    alternates: { canonical: pageUrl },
    openGraph: {
      title: headline,
      description: subtext,
      url: pageUrl,
      type: "website",
      siteName: "BookNow",
    },
  };
}

export default async function CityPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;

  if (!SUPPORTED_CITIES.includes(city)) {
    return (
      <MarketingShell>
        <div className="shell py-20 text-center text-zinc-500">City page not found.</div>
      </MarketingShell>
    );
  }

  const locale = await getServerLocale();
  const t = await getTranslations("cityPage");
  const tm = await getTranslations("marketing");
  const [content, contentEn, platform] = await Promise.all([
    getSiteContentGroup("city", locale),
    getSiteContentGroup("city", "en"),
    loadPlatformConfig(locale),
  ]);

  const cityName = capitalize(city);
  const webUrl = siteUrl();
  const waNumber = platform.whatsappNumber;

  const headline =
    content[`city.${city}.headline`] ??
    contentEn[`city.${city}.headline`] ??
    (locale === "hi"
      ? `${cityName} के businesses के लिए WhatsApp Booking`
      : `WhatsApp Booking System for ${cityName} Businesses`);
  const subtext =
    content[`city.${city}.subtext`] ??
    contentEn[`city.${city}.subtext`] ??
    (locale === "en"
      ? `Salons, clinics, coaching centers in ${cityName} use BookNow.`
      : `${cityName} के salons, clinics, coaching centers BookNow use कर रहे हैं।`);

  const slugKeys = CITY_CATEGORY_SLUGS[city] ?? CITY_CATEGORY_SLUGS.default;
  const categories = slugKeys
    .map((key) => platform.categories.find((c) => c.key === key))
    .filter(Boolean)
    .map((cat) => ({
      icon: cat!.icon,
      name: categoryDisplayName(cat!, locale),
      slug: cat!.key,
    }));

  const faqs = cityFaqs(locale, city);
  const benefits = CITY_BENEFITS[locale];

  return (
    <>
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
            inLanguage: ["en", "hi"],
            areaServed: { "@type": "City", name: cityName },
          }),
        }}
      />
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

      <MarketingShell>
        <div className="bg-gradient-to-b from-emerald-50 to-white">
          <div className="shell pt-8 pb-6">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
              {t("forCity", { city: cityName })}
            </div>
            <h1 className="mt-2 text-[26px] font-bold leading-tight text-zinc-900">{headline}</h1>
            <p className="mt-3 text-[14px] leading-7 text-zinc-700">{subtext}</p>
            <div className="mt-5 grid gap-3">
              <a
                href="/signup"
                className="grid place-items-center rounded-2xl bg-emerald-600 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
              >
                {t("startFreeInCity", { city: cityName })}
              </a>
              <a
                href="/business-success"
                className="grid h-11 place-items-center rounded-2xl border border-zinc-200 bg-white text-[14px] font-medium text-zinc-700"
              >
                {t("moreAbout")}
              </a>
            </div>
          </div>
        </div>

        <div className="shell py-8">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400">
            {t("whichBusiness", { city: cityName })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((cat) => (
              <a
                key={cat.slug}
                href="/signup"
                className="flex items-center gap-2.5 rounded-2xl border border-zinc-100 bg-white p-3.5 shadow-sm transition hover:border-emerald-200"
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-[13px] font-semibold text-zinc-800">{cat.name}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="bg-zinc-50 py-8">
          <div className="shell">
            <h2 className="text-[18px] font-bold text-zinc-900">{t("whyUse", { city: cityName })}</h2>
            <div className="mt-4 grid gap-3">
              {benefits.map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
                  <span className="mt-0.5 shrink-0 text-xl">{icon}</span>
                  <div>
                    <div className="text-[14px] font-bold text-zinc-900">{title}</div>
                    <div className="mt-0.5 text-[12px] leading-5 text-zinc-600">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="shell py-8">
          <h2 className="text-[18px] font-bold text-zinc-900">{t("faqTitle", { city: cityName })}</h2>
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

        <div className="bg-emerald-600 py-8">
          <div className="shell text-center">
            <h2 className="text-[20px] font-bold text-white">{t("ctaTitle", { city: cityName })}</h2>
            <p className="mt-1 text-[13px] text-emerald-100">{t("ctaSub")}</p>
            <a
              href="/signup"
              className="mt-4 inline-flex h-12 items-center rounded-2xl bg-white px-8 text-[15px] font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              {t("createAccount")}
            </a>
          </div>
        </div>

        <div className="shell py-6">
          <div className="text-center text-[12px] font-medium text-zinc-400">{t("otherCities")}</div>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {SUPPORTED_CITIES.filter((c) => c !== city).map((c) => (
              <a
                key={c}
                href={`/city/${c}`}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-[12px] font-semibold text-zinc-600 hover:border-emerald-300 hover:text-emerald-700"
              >
                {capitalize(c)}
              </a>
            ))}
          </div>
          <p className="mt-4 text-center text-[11px] text-zinc-400">
            {tm("footerTagline", { year: new Date().getFullYear() })} ·{" "}
            <a href="/" className="hover:underline">
              {t("home")}
            </a>
          </p>
        </div>
      </MarketingShell>

      <a
        href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Hi! I want to know about BookNow for " + cityName)}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg"
        aria-label="WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </a>
    </>
  );
}
