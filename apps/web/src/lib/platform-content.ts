import { getSiteContentGroup, parseJson } from "@/lib/site-content";
import {
  DARBHANGA_PACKS,
  type DarbhangaPack,
  type DarbhangaPackKey,
} from "@/lib/darbhanga-pack";

export type PlatformStat = { n: string; label: string };
export type PlatformCategory = { key: string; name: string; nameHi: string; icon: string };
export type PlatformTestimonial = { name: string; business: string; city: string; text: string };
export type PlatformStep = { step: string; title: string; desc: string; icon: string };
export type DarbhangaStep = { n: string; t: string; d: string };

const DEFAULT_STATS: PlatformStat[] = [
  { n: "100+", label: "Businesses" },
  { n: "5000+", label: "Bookings/month" },
  { n: "6", label: "Cities" },
];

const DEFAULT_CATEGORIES: PlatformCategory[] = [
  { key: "salon", name: "Salon & Barber", nameHi: "सैलून / बाल कटाई", icon: "💈" },
  { key: "clinic", name: "Clinic & Doctor", nameHi: "क्लिनिक / डॉक्टर", icon: "🏥" },
  { key: "coaching", name: "Coaching Center", nameHi: "कोचिंग सेंटर", icon: "📚" },
  { key: "spa", name: "Spa & Wellness", nameHi: "स्पा / वेलनेस", icon: "🧖" },
  { key: "home_service", name: "Home Services", nameHi: "होम सर्विस", icon: "🔧" },
  { key: "other", name: "Any Business", nameHi: "कोई भी बिज़नेस", icon: "🏪" },
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

export async function loadPlatformConfig(locale = "en"): Promise<PlatformConfig> {
  const [platform, landing] = await Promise.all([
    getSiteContentGroup("platform", locale),
    getSiteContentGroup("landing", locale),
  ]);

  return {
    contactPhone: platform["platform.contact_phone"] ?? "7500002221",
    whatsappNumber:
      platform["platform.whatsapp_number"] ??
      landing["landing.whatsapp_number"] ??
      "917500002221",
    darbhangaBanner:
      platform["platform.darbhanga_banner"] ??
      "📍 Darbhanga? → WhatsApp Pack — teen cheez, paanch minute, ₹0",
    shareTemplate:
      platform["platform.share_template"] ??
      "नमस्ते! {shopName} पर online booking शुरू हो गई है।\n\nLink: {link}\n\nQR scan करके book करें — कोई app नहीं चाहिए।",
    stats: parseJson(platform["platform.stats"], DEFAULT_STATS),
    categories: parseJson(platform["platform.categories"], DEFAULT_CATEGORIES),
    testimonials: parseJson(platform["platform.testimonials"], DEFAULT_TESTIMONIALS),
    howItWorks: parseJson(platform["platform.how_it_works"], DEFAULT_HOW_IT_WORKS),
    beforeAfter: parseJson(platform["platform.before_after"], DEFAULT_BEFORE_AFTER),
  };
}

export async function loadDarbhangaConfig(locale = "en"): Promise<DarbhangaConfig> {
  const [darbhanga, cityHi] = await Promise.all([
    getSiteContentGroup("darbhanga", locale),
    getSiteContentGroup("darbhanga", "hi"),
  ]);
  const hi = locale === "hi" ? darbhanga : { ...darbhanga, ...cityHi };

  return {
    heroTitle: hi["darbhanga.hero.title"] ?? "दरभंगा WhatsApp Pack",
    heroTagline: hi["darbhanga.hero.tagline"] ?? "तीन चीज़। पाँच मिनट। Phone pe kaam।",
    heroSubtitle:
      hi["darbhanga.hero.subtitle"] ??
      "CRM नहीं। ERP नहीं। सिर्फ booking link, WhatsApp reminder, aur customer list — ek bundle mein।",
    badge: hi["darbhanga.hero.badge"] ?? "Darbhanga Launch",
    packs: parseJson<DarbhangaPack[]>(darbhanga["darbhanga.packs"], DARBHANGA_PACKS),
    steps: parseJson(darbhanga["darbhanga.steps"], DEFAULT_DARBHANGA_STEPS),
    testimonialQuote:
      hi["darbhanga.testimonial.quote"] ??
      "Pehle WhatsApp pe manually booking leta tha। Ab link share karta hoon — sab system mein। Missed booking band।",
    testimonialAuthor: hi["darbhanga.testimonial.author"] ?? "— Rakesh, Raj Hair Studio, Darbhanga",
    waDemoMessage:
      darbhanga["darbhanga.wa_demo_message"] ??
      "नमस्ते, Darbhanga WhatsApp Pack demo chahiye — salon/clinic/coaching. Kaise shuru karun?",
    seoTitle:
      darbhanga["darbhanga.seo.title"] ??
      "दरभंगा WhatsApp Pack — Booking + Reminder + Customer List | BookNow",
    seoDescription:
      darbhanga["darbhanga.seo.description"] ??
      "Darbhanga ke salon, clinic, coaching ke liye ek bundle: booking link, WhatsApp reminder, customer list.",
  };
}

export async function loadPwaConfig(): Promise<PwaConfig> {
  const pwa = await getSiteContentGroup("pwa", "en");
  return {
    name: pwa["pwa.name"] ?? "BookNow — WhatsApp Business Assistant",
    shortName: pwa["pwa.short_name"] ?? "BookNow",
    description:
      pwa["pwa.description"] ??
      "Booking, WhatsApp reminders, and customer list for Indian businesses.",
    themeColor: pwa["pwa.theme_color"] ?? "#059669",
    backgroundColor: pwa["pwa.background_color"] ?? "#fafafa",
    startUrl: pwa["pwa.start_url"] ?? "/app?source=installed",
  };
}

export function formatShareTemplate(template: string, shopName: string, link: string) {
  return template.replace(/\{shopName\}/g, shopName).replace(/\{link\}/g, link);
}

export function packByKeyFromList(packs: DarbhangaPack[], key: string | null | undefined) {
  return packs.find((p) => p.key === key);
}

export type { DarbhangaPackKey };
