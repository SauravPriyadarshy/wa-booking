import { getSiteContentGroup, parseJson } from "@/lib/site-content";
import type { AppLocale } from "@/lib/locale";
import {
  DARBHANGA_PACKS,
  type DarbhangaPack,
  type DarbhangaPackKey,
} from "@/lib/darbhanga-pack";

export type PlatformStat = { n: string; label: string };
export type PlatformCategory = { key: string; name: string; nameHi: string; nameMai?: string; icon: string };
export type PlatformTestimonial = { name: string; business: string; city: string; text: string };
export type PlatformStep = { step: string; title: string; desc: string; icon: string };
export type DarbhangaStep = { n: string; t: string; d: string };

const DEFAULT_STATS: PlatformStat[] = [
  { n: "100+", label: "Businesses" },
  { n: "5000+", label: "Bookings/month" },
  { n: "6", label: "Cities" },
];

const DEFAULT_CATEGORIES: PlatformCategory[] = [
  { key: "salon", name: "Salon & Barber", nameHi: "सैलून / बाल कटाई", nameMai: "सैलून / बाल कटाई", icon: "💈" },
  { key: "clinic", name: "Clinic & Doctor", nameHi: "क्लिनिक / डॉक्टर", nameMai: "क्लिनिक / डॉक्टर", icon: "🏥" },
  { key: "coaching", name: "Coaching Center", nameHi: "कोचिंग सेंटर", nameMai: "कोचिंग सेंटर", icon: "📚" },
  { key: "spa", name: "Spa & Wellness", nameHi: "स्पा / वेलनेस", nameMai: "स्पा / वेलनेस", icon: "🧖" },
  { key: "home_service", name: "Home Services", nameHi: "होम सर्विस", nameMai: "होम सर्विस", icon: "🔧" },
  { key: "other", name: "Any Business", nameHi: "कोई भी बिज़नेस", nameMai: "कोनो business", icon: "🏪" },
];

const DEFAULT_TESTIMONIALS: PlatformTestimonial[] = [
  {
    name: "Rakesh Kumar",
    business: "Raj Hair Studio",
    city: "Darbhanga",
    text: "पहले WhatsApp पर manually booking लेता थa, बहुत confusion होती थी। अब सब system में है।",
  },
  {
    name: "Dr. Priya Singh",
    business: "Singh Clinic",
    city: "Laheriasarai",
    text: "Patients को automatically reminder जातa है। No-show 60% कम हो गए।",
  },
  {
    name: "Amit Jha",
    business: "Success Coaching Center",
    city: "Darbhanga",
    text: "Students की fees और attendance दोनों एक जगह।",
  },
];

const DEFAULT_HOW_IT_WORKS: PlatformStep[] = [
  { step: "1", title: "Business बनाएं", desc: "Category चुनें — 2 minute setup।", icon: "🏪" },
  { step: "2", title: "Booking link share करें", desc: "QR print या WhatsApp link।", icon: "📱" },
  { step: "3", title: "WhatsApp से manage करें", desc: "Confirmations और reminders automatic।", icon: "✅" },
];

const DEFAULT_BEFORE_AFTER = {
  before: [
    "WhatsApp पर हर booking manually",
    "Reminder भूल जाते थे",
    "Customer का record नहीं",
    "Payment track नहीं होती",
    "Staff को काम याद दिलाना",
  ],
  after: [
    "Online booking link से auto",
    "WhatsApp reminders automatic",
    "पूरा CRM एक जगह",
    "Payment verify हो जाती है",
    "Staff को notifications",
  ],
};

const DEFAULT_DARBHANGA_STEPS: DarbhangaStep[] = [
  { n: "1", t: "Mobile se signup", d: "OTP aayega। Shop ka naam aur pack chuno।" },
  { n: "2", t: "Link share karo", d: "WhatsApp group, shop board, ya QR print।" },
  { n: "3", t: "Booking aati hai", d: "Confirm + reminder automatic। Customer list ready।" },
];

export type PlatformConfig = {
  contactPhone: string;
  whatsappNumber: string;
  darbhangaBanner: string;
  shareTemplate: string;
  stats: PlatformStat[];
  categories: PlatformCategory[];
  testimonials: PlatformTestimonial[];
  howItWorks: PlatformStep[];
  beforeAfter: { before: string[]; after: string[] };
};

export type DarbhangaConfig = {
  heroTitle: string;
  heroTagline: string;
  heroSubtitle: string;
  badge: string;
  packs: DarbhangaPack[];
  steps: DarbhangaStep[];
  testimonialQuote: string;
  testimonialAuthor: string;
  waDemoMessage: string;
  seoTitle: string;
  seoDescription: string;
};

export type PwaConfig = {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  startUrl: string;
};

export async function loadPlatformConfig(locale: AppLocale = "en"): Promise<PlatformConfig> {
  const [platform, landing, platformEn] = await Promise.all([
    getSiteContentGroup("platform", locale),
    getSiteContentGroup("landing", locale),
    getSiteContentGroup("platform", "en"),
  ]);
  const base = { ...platformEn, ...platform };

  const bannerFallback =
    locale === "hi"
      ? "📍 Darbhanga? → WhatsApp Pack — teen cheez, paanch minute, ₹0"
      : "📍 Darbhanga? → WhatsApp Pack — 3 tools, 5 minutes, ₹0";

  const shareFallback =
    locale === "en"
      ? "Hi! Online booking is live at {shopName}.\n\nLink: {link}\n\nScan QR to book — no app needed."
      : "नमस्ते! {shopName} पर online booking शुरू हो गई है।\n\nLink: {link}\n\nQR scan करके book करें — कोई app नहीं चाहिए।";

  return {
    contactPhone: base["platform.contact_phone"] ?? "7500002221",
    whatsappNumber:
      base["platform.whatsapp_number"] ??
      landing["landing.whatsapp_number"] ??
      "917500002221",
    darbhangaBanner: base["platform.darbhanga_banner"] ?? bannerFallback,
    shareTemplate: base["platform.share_template"] ?? shareFallback,
    stats: parseJson(base["platform.stats"], DEFAULT_STATS),
    categories: parseJson(base["platform.categories"], DEFAULT_CATEGORIES),
    testimonials: parseJson(base["platform.testimonials"], DEFAULT_TESTIMONIALS),
    howItWorks: parseJson(base["platform.how_it_works"], DEFAULT_HOW_IT_WORKS),
    beforeAfter: parseJson(base["platform.before_after"], DEFAULT_BEFORE_AFTER),
  };
}

const DARBHANGA_FALLBACKS: Record<
  AppLocale,
  Pick<DarbhangaConfig, "heroTitle" | "heroTagline" | "heroSubtitle" | "testimonialQuote" | "waDemoMessage" | "seoTitle" | "seoDescription">
> = {
  en: {
    heroTitle: "Darbhanga WhatsApp Pack",
    heroTagline: "Three things. Five minutes. Works on your phone.",
    heroSubtitle: "Not a CRM. Not an ERP. Just booking link, WhatsApp reminders, and customer list — one bundle.",
    testimonialQuote: "I used to take bookings manually on WhatsApp. Now I share a link — everything is in the system.",
    waDemoMessage: "Hi, I want a Darbhanga WhatsApp Pack demo — salon/clinic/coaching.",
    seoTitle: "Darbhanga WhatsApp Pack — Booking + Reminder + Customer List | BookNow",
    seoDescription: "One bundle for Darbhanga salons, clinics, and coaching: booking link, WhatsApp reminders, customer list.",
  },
  hi: {
    heroTitle: "दरभंगा WhatsApp Pack",
    heroTagline: "तीन चीज़। पाँच मिनट। Phone pe kaam।",
    heroSubtitle: "CRM nahi. ERP nahi. Sirf booking link, reminder, customer list.",
    testimonialQuote: "Pehle WhatsApp pe manually booking leta tha। Ab link share karta hoon।",
    waDemoMessage: "नमस्ते, Darbhanga WhatsApp Pack demo chahiye — salon/clinic/coaching.",
    seoTitle: "दरभंगा WhatsApp Pack | BookNow",
    seoDescription: "Darbhanga ke salon, clinic, coaching ke liye ek bundle.",
  },
};

export async function loadDarbhangaConfig(locale: AppLocale = "en"): Promise<DarbhangaConfig> {
  const [primary, hi, en] = await Promise.all([
    getSiteContentGroup("darbhanga", locale),
    getSiteContentGroup("darbhanga", "hi"),
    getSiteContentGroup("darbhanga", "en"),
  ]);
  const merged = { ...en, ...hi, ...primary };
  const fb = DARBHANGA_FALLBACKS[locale];

  return {
    heroTitle: merged["darbhanga.hero.title"] ?? fb.heroTitle,
    heroTagline: merged["darbhanga.hero.tagline"] ?? fb.heroTagline,
    heroSubtitle: merged["darbhanga.hero.subtitle"] ?? fb.heroSubtitle,
    badge: merged["darbhanga.hero.badge"] ?? "Darbhanga Launch",
    packs: parseJson<DarbhangaPack[]>(merged["darbhanga.packs"] ?? en["darbhanga.packs"], DARBHANGA_PACKS),
    steps: parseJson(merged["darbhanga.steps"] ?? en["darbhanga.steps"], DEFAULT_DARBHANGA_STEPS),
    testimonialQuote: merged["darbhanga.testimonial.quote"] ?? fb.testimonialQuote,
    testimonialAuthor: merged["darbhanga.testimonial.author"] ?? "— Rakesh, Raj Hair Studio, Darbhanga",
    waDemoMessage: merged["darbhanga.wa_demo_message"] ?? fb.waDemoMessage,
    seoTitle: merged["darbhanga.seo.title"] ?? fb.seoTitle,
    seoDescription: merged["darbhanga.seo.description"] ?? fb.seoDescription,
  };
}

export async function loadPwaConfig(locale: AppLocale = "en"): Promise<PwaConfig> {
  const [pwa, en] = await Promise.all([
    getSiteContentGroup("pwa", locale),
    getSiteContentGroup("pwa", "en"),
  ]);
  const merged = { ...en, ...pwa };
  return {
    name: merged["pwa.name"] ?? "BookNow — WhatsApp Business Assistant",
    shortName: merged["pwa.short_name"] ?? "BookNow",
    description:
      merged["pwa.description"] ??
      "Booking, WhatsApp reminders, and customer list for Indian businesses.",
    themeColor: merged["pwa.theme_color"] ?? "#059669",
    backgroundColor: merged["pwa.background_color"] ?? "#fafafa",
    startUrl: merged["pwa.start_url"] ?? "/app?source=installed",
  };
}

export function formatShareTemplate(template: string, shopName: string, link: string) {
  return template.replace(/\{shopName\}/g, shopName).replace(/\{link\}/g, link);
}

export function packByKeyFromList(packs: DarbhangaPack[], key: string | null | undefined) {
  return packs.find((p) => p.key === key);
}

export type { DarbhangaPackKey };
