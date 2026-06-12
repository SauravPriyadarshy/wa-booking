import type { AppLocale } from "@/lib/locale";

/** Legacy Maithili copy kept in file; UI switcher is EN · HI only. */
type MarketingLocale = AppLocale | "mai";

export type FaqItem = { q: string; a: string };
export type PricingPlan = {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
  highlighted: boolean;
};
export type PricingSection = { headline: string; plans: PricingPlan[] };
export type BenefitItem = { icon: string; title: string; desc: string };

export const LANDING_FAQ: Record<MarketingLocale, FaqItem[]> = {
  en: [
    { q: "Do customers need to download an app?", a: "No. Customers book via link or QR in the browser — no app, no login." },
    { q: "How does WhatsApp connect work?", a: "Scan QR once in the app. WhatsApp links and booking confirmations and reminders go out automatically." },
    { q: "Is it free?", a: "Yes — start free. No credit card needed." },
    { q: "Does it work for clinics and coaching too?", a: "Yes — salons, clinics, spas, coaching centers, tutors — any appointment-based business." },
  ],
  hi: [
    { q: "क्या customers को कोई app download करना होगा?", a: "नहीं। Customer browser में link या QR से book करते हैं। कोई app नहीं, कोई login नहीं।" },
    { q: "WhatsApp connect कैसे काम करता है?", a: "App में एक बार QR scan करें। फिर WhatsApp link हो जाता है और booking confirmation और reminders automatically जाते हैं।" },
    { q: "क्या यह free है?", a: "हाँ, free में शुरू करें। कोई credit card नहीं चाहिए।" },
    { q: "क्या यह clinic और coaching के लिए भी काम करता है?", a: "हाँ — salons, clinics, spas, coaching centers, tutors — कोई भी appointment-based business।" },
  ],
  mai: [
    { q: "Customer क' कोनो app download करय पड़त?", a: "नहि। Customer browser मे link या QR सँ book करैत अछि — कोनो app नहि, कोनो login नहि।" },
    { q: "WhatsApp connect क' क' काम करैत अछि?", a: "App मe एक बेर QR scan करू। फेर WhatsApp link भ' जायत आ booking confirmation आ reminder automatic जात अछि।" },
    { q: "ई free अछि?", a: "हँ — free मe शुरू करू। कोनो credit card नहि चाही।" },
    { q: "Clinic आ coaching लेल से काम करैत अछि?", a: "हँ — salon, clinic, spa, coaching, tutor — कोनो appointment-based business।" },
  ],
};

export const LANDING_PRICING: Record<MarketingLocale, PricingSection> = {
  en: {
    headline: "Simple plans. Start free.",
    plans: [
      {
        name: "Free",
        price: "₹0",
        period: "forever",
        features: ["1 business · 1 staff", "50 customers / month", "WhatsApp booking", "Basic CRM", "Hindi interface"],
        cta: "Start free",
        href: "/signup",
        highlighted: false,
      },
      {
        name: "Plus",
        price: "₹499",
        period: "per month",
        features: ["Unlimited bookings", "Health score", "Revenue leakage", "Follow-ups", "Fee tracking", "WA templates"],
        cta: "Try Plus",
        href: "/signup",
        highlighted: true,
      },
      {
        name: "Pro",
        price: "₹999",
        period: "per month",
        features: ["Everything in Plus", "Advanced analytics", "Multi-staff scheduling", "Priority support", "API access"],
        cta: "Contact sales",
        href: "/signup",
        highlighted: false,
      },
    ],
  },
  hi: {
    headline: "Simple plans — Free se shuru karo",
    plans: [
      {
        name: "Free",
        price: "₹0",
        period: "hamesha",
        features: ["1 business · 1 staff", "50 customers / month", "WhatsApp booking", "Basic CRM", "Hindi interface"],
        cta: "Free shuru karo",
        href: "/signup",
        highlighted: false,
      },
      {
        name: "Plus",
        price: "₹499",
        period: "mahina",
        features: ["Unlimited booking", "Health score", "Revenue leakage", "Follow-ups", "Fee tracking", "WA templates"],
        cta: "Plus try karo",
        href: "/signup",
        highlighted: true,
      },
      {
        name: "Pro",
        price: "₹999",
        period: "mahina",
        features: ["Plus me sab", "Advanced analytics", "Multi-staff", "Priority support", "API access"],
        cta: "Sales se baat karo",
        href: "/signup",
        highlighted: false,
      },
    ],
  },
  mai: {
    headline: "Simple plans — Free सँ शुरू करू",
    plans: [
      {
        name: "Free",
        price: "₹0",
        period: "हमेशा",
        features: ["1 business · 1 staff", "50 customers / month", "WhatsApp booking", "Basic CRM", "Hindi interface"],
        cta: "Free शुरू करू",
        href: "/signup",
        highlighted: false,
      },
      {
        name: "Plus",
        price: "₹499",
        period: "महीना",
        features: ["Unlimited booking", "Health score", "Revenue leakage", "Follow-ups", "Fee tracking", "WA templates"],
        cta: "Plus try करू",
        href: "/signup",
        highlighted: true,
      },
      {
        name: "Pro",
        price: "₹999",
        period: "महीना",
        features: ["Plus मe सब", "Advanced analytics", "Multi-staff", "Priority support", "API access"],
        cta: "Sales सँ बात करू",
        href: "/signup",
        highlighted: false,
      },
    ],
  },
};

export const CITY_BENEFITS: Record<MarketingLocale, BenefitItem[]> = {
  en: [
    { icon: "📱", title: "Booking on WhatsApp", desc: "Customers book via your link. You get WhatsApp notifications." },
    { icon: "🔔", title: "Automatic reminders", desc: "Customers get a reminder 24 hours before their appointment." },
    { icon: "👥", title: "Customer list", desc: "Every customer's history, payments and notes in one place." },
    { icon: "⚡", title: "5-minute setup", desc: "Sign up with mobile, pick business type, share your booking link." },
  ],
  hi: [
    { icon: "📱", title: "WhatsApp पर Booking", desc: "Customers booking link से book करते हैं। आपको WhatsApp पर notification आता है।" },
    { icon: "🔔", title: "Automatic Reminders", desc: "Appointment से 24 घंटे पहले customer को automatic reminder जाता है।" },
    { icon: "👥", title: "Customer CRM", desc: "हर customer का history, payment और notes एक जगह।" },
    { icon: "⚡", title: "5 मिनट में setup", desc: "Mobile number से sign up करें। Business type choose करें। Booking link ready।" },
  ],
  mai: [
    { icon: "📱", title: "WhatsApp पर Booking", desc: "Customer booking link सँ book करैत अछि। अहाँक WhatsApp पर notification आयत।" },
    { icon: "🔔", title: "Automatic Reminder", desc: "Appointment सँ 24 घंटा पहिने customer क' automatic reminder जात अछि।" },
    { icon: "👥", title: "Customer List", desc: "हर customer क' history, payment आ notes एक जगह।" },
    { icon: "⚡", title: "5 मिनट मe setup", desc: "Mobile सँ sign up करू। Business type चुनू। Booking link ready।" },
  ],
};

export const CITY_FAQ: Record<MarketingLocale, Record<string, FaqItem[]>> = {
  en: {
    darbhanga: [
      { q: "How does WhatsApp booking work in Darbhanga?", a: "Your customer gets a link or QR. They book in the browser — no app. You get a WhatsApp notification." },
      { q: "Best booking system for Darbhanga salon/clinic?", a: "BookNow is built for Indian businesses — Hindi, Maithili, WhatsApp reminders, mobile-first. Start free." },
      { q: "Does it work for coaching centers in Darbhanga?", a: "Yes — student list, fee reminders, and attendance in one place." },
    ],
    laheriasarai: [
      { q: "How to set up online booking in Laheriasarai?", a: "5 minutes. Sign up with mobile, pick business type, share your booking link on WhatsApp." },
      { q: "Are all features on the free plan?", a: "Yes — unlimited bookings, WhatsApp connect, and basic CRM on free." },
    ],
    default: [
      { q: "Do customers need an app?", a: "No. They book via browser link. No app download." },
      { q: "Are WhatsApp reminders automatic?", a: "Yes — on confirm and 24 hours before the appointment." },
    ],
  },
  hi: {
    darbhanga: [
      { q: "Darbhanga में WhatsApp booking कैसे काम करती है?", a: "आपके customer को एक link या QR code मिलता है। वो browser में open करके book करते हैं — कोई app नहीं। आपको WhatsApp पर notification आता है।" },
      { q: "Darbhanga के salon/clinic के लिए best booking system?", a: "BookNow Indian businesses के लिए बना है — Hindi support, WhatsApp notifications, mobile-first। Free में शुरू करें।" },
      { q: "Darbhanga में coaching center के लिए भी?", a: "हाँ — student attendance, fee tracking और WhatsApp reminders सब मिलते हैं।" },
    ],
    laheriasarai: [
      { q: "Laheriasarai में online booking कैसे set up करें?", a: "5 मिनट में। Mobile number से sign up करें, business type चुनें, booking link WhatsApp पर share करें।" },
      { q: "Free plan में सब features?", a: "हाँ — unlimited bookings, WhatsApp connect, basic CRM free में।" },
    ],
    default: [
      { q: "Customers को app download करना होगा?", a: "नहीं। Browser link से book करते हैं।" },
      { q: "WhatsApp reminder automatic?", a: "हाँ — confirm पर और appointment से 24 घंटे पहले।" },
    ],
  },
  mai: {
    darbhanga: [
      { q: "दरभंगा मे WhatsApp booking क' क' काम करैत अछि?", a: "Customer क' link या QR मिलत। Browser मe book करैत अछi — कोनो app नहि। अहाँक WhatsApp पर notification आयत।" },
      { q: "दरभंगा क' salon/clinic लेल best system?", a: "BookNow Indian business लेल बनल अछi — Hindi, Maithili, WhatsApp reminder। Free मe शुरू करू।" },
      { q: "दरभंगा मe coaching center लेल?", a: "हँ — student list, fee reminder, attendance सब एक जगह।" },
    ],
    laheriasarai: [
      { q: "लहेरियासराय मe online booking क' setup करब?", a: "5 मिनट मe। Mobile सँ sign up, business type चुनू, link WhatsApp पर share करू।" },
      { q: "Free plan मe सब feature?", a: "हँ — unlimited booking, WhatsApp connect, basic CRM free मe।" },
    ],
    default: [
      { q: "Customer क' app download करय पड़त?", a: "नहि। Browser link सँ book करैत अछi।" },
      { q: "WhatsApp reminder automatic?", a: "हँ — confirm पर आ appointment सँ 24 घंटा पहिने।" },
    ],
  },
};

export const WA_INTRO_MESSAGES: Record<MarketingLocale, { hero: string; float: string }> = {
  en: {
    hero: "Hi! I want to know about BookNow",
    float: "Hi! I want to talk about BookNow",
  },
  hi: {
    hero: "Namaste! Mujhe BookNow ke baare mein janna hai",
    float: "Namaste! BookNow ke baare mein baat karna chahta hoon",
  },
  mai: {
    hero: "नमस्कार! BookNow के बारे मे जानय चाहैत छी",
    float: "नमस्कार! BookNow के बारे मe बात करय चाहैत छी",
  },
};

export function cityFaqs(locale: AppLocale, city: string): FaqItem[] {
  const bucket = CITY_FAQ[locale][city] ?? CITY_FAQ[locale].default;
  return bucket ?? CITY_FAQ.en.default;
}
