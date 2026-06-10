/** Defaults for platform / darbhanga / pwa groups — bootstrapped when missing in DB. */

export type ContentDefault = {
  key: string;
  locale: string;
  group: string;
  label: string;
  value: string;
};

export const BOOTSTRAP_DEFAULTS: ContentDefault[] = [
  {
    key: "platform.contact_phone",
    locale: "en",
    group: "platform",
    label: "Support call number",
    value: "7500002221",
  },
  {
    key: "platform.whatsapp_number",
    locale: "en",
    group: "platform",
    label: "WhatsApp number",
    value: "917500002221",
  },
  {
    key: "platform.darbhanga_banner",
    locale: "en",
    group: "platform",
    label: "Home Darbhanga banner",
    value: "📍 Darbhanga? → WhatsApp Pack — teen cheez, paanch minute, ₹0",
  },
  {
    key: "platform.share_template",
    locale: "en",
    group: "platform",
    label: "Share template ({shopName}, {link})",
    value:
      "नमस्ते! {shopName} पर online booking शुरू हो गई है।\n\nLink: {link}\n\nQR scan करके book करें — कोई app नहीं चाहिए।",
  },
  {
    key: "platform.stats",
    locale: "en",
    group: "platform",
    label: "Landing stats JSON",
    value: JSON.stringify([
      { n: "100+", label: "Businesses" },
      { n: "5000+", label: "Bookings/month" },
      { n: "6", label: "Cities" },
    ]),
  },
  {
    key: "platform.categories",
    locale: "en",
    group: "platform",
    label: "Landing categories JSON",
    value: JSON.stringify([
      { key: "salon", name: "Salon & Barber", nameHi: "सैलून / बाल कटाई", icon: "💈" },
      { key: "clinic", name: "Clinic & Doctor", nameHi: "क्लिनिक / डॉक्टर", icon: "🏥" },
      { key: "coaching", name: "Coaching Center", nameHi: "कोचिंग सेंटर", icon: "📚" },
      { key: "spa", name: "Spa & Wellness", nameHi: "स्पा / वेलनेस", icon: "🧖" },
      { key: "home_service", name: "Home Services", nameHi: "होम सर्विस", icon: "🔧" },
      { key: "other", name: "Any Business", nameHi: "कोई भी बिज़नेस", icon: "🏪" },
    ]),
  },
  {
    key: "platform.testimonials",
    locale: "en",
    group: "platform",
    label: "Testimonials JSON",
    value: JSON.stringify([
      {
        name: "Rakesh Kumar",
        business: "Raj Hair Studio",
        city: "Darbhanga",
        text: "पहले WhatsApp पर manually booking लेता था। अब sab system mein hai।",
      },
    ]),
  },
  {
    key: "platform.how_it_works",
    locale: "en",
    group: "platform",
    label: "How it works JSON",
    value: JSON.stringify([
      { step: "1", title: "Business बनाएं", desc: "Category chuno — 2 minute setup।", icon: "🏪" },
      { step: "2", title: "Link share karo", desc: "QR ya WhatsApp link।", icon: "📱" },
      { step: "3", title: "WhatsApp se manage", desc: "Reminders automatic।", icon: "✅" },
    ]),
  },
  {
    key: "platform.before_after",
    locale: "en",
    group: "platform",
    label: "Before/after JSON",
    value: JSON.stringify({
      before: ["WhatsApp par manual booking", "Reminder bhool jaate the"],
      after: ["Online link se auto", "WhatsApp reminders automatic"],
    }),
  },
  {
    key: "darbhanga.hero.title",
    locale: "hi",
    group: "darbhanga",
    label: "Hero title",
    value: "दरभंगा WhatsApp Pack",
  },
  {
    key: "darbhanga.hero.tagline",
    locale: "hi",
    group: "darbhanga",
    label: "Hero tagline",
    value: "तीन चीज़। पाँच मिनट। Phone pe kaam।",
  },
  {
    key: "darbhanga.hero.subtitle",
    locale: "hi",
    group: "darbhanga",
    label: "Hero subtitle",
    value: "CRM nahi. ERP nahi. Sirf booking link, reminder, customer list.",
  },
  {
    key: "darbhanga.hero.badge",
    locale: "en",
    group: "darbhanga",
    label: "Hero badge",
    value: "Darbhanga Launch",
  },
  {
    key: "darbhanga.packs",
    locale: "en",
    group: "darbhanga",
    label: "Packs JSON",
    value: JSON.stringify([
      {
        key: "salon",
        icon: "💈",
        titleHi: "Salon Pack",
        titleEn: "Salon & Barber",
        taglineHi: "बाल कटाई, beauty, barber",
        bulletsHi: ["Booking link + QR", "WhatsApp reminder", "Customer list"],
        categoryKeys: ["salon", "spa"],
      },
      {
        key: "clinic",
        icon: "🏥",
        titleHi: "Clinic Pack",
        titleEn: "Doctor & Clinic",
        taglineHi: "OPD, dental, pathology",
        bulletsHi: ["Booking + Queue", "WhatsApp reminder", "Patient list"],
        categoryKeys: ["clinic"],
      },
      {
        key: "coaching",
        icon: "📚",
        titleHi: "Coaching Pack",
        titleEn: "Coaching Center",
        taglineHi: "Tuition, classes, institute",
        bulletsHi: ["Student list", "Fee reminder", "Attendance"],
        categoryKeys: ["coaching"],
      },
    ]),
  },
  {
    key: "darbhanga.steps",
    locale: "en",
    group: "darbhanga",
    label: "Steps JSON",
    value: JSON.stringify([
      { n: "1", t: "Mobile se signup", d: "OTP aayega। Pack chuno।" },
      { n: "2", t: "Link share karo", d: "WhatsApp group ya QR print।" },
      { n: "3", t: "Booking aati hai", d: "Confirm + reminder automatic।" },
    ]),
  },
  {
    key: "darbhanga.testimonial.quote",
    locale: "hi",
    group: "darbhanga",
    label: "Testimonial quote",
    value: "Pehle WhatsApp pe manually booking leta tha। Ab link share karta hoon।",
  },
  {
    key: "darbhanga.testimonial.author",
    locale: "en",
    group: "darbhanga",
    label: "Testimonial author",
    value: "— Rakesh, Raj Hair Studio, Darbhanga",
  },
  {
    key: "darbhanga.wa_demo_message",
    locale: "en",
    group: "darbhanga",
    label: "WA demo message",
    value: "Darbhanga WhatsApp Pack demo chahiye — salon/clinic/coaching.",
  },
  {
    key: "darbhanga.seo.title",
    locale: "en",
    group: "darbhanga",
    label: "SEO title",
    value: "दरभंगा WhatsApp Pack | BookNow",
  },
  {
    key: "darbhanga.seo.description",
    locale: "en",
    group: "darbhanga",
    label: "SEO description",
    value: "Darbhanga ke salon, clinic, coaching ke liye ek bundle.",
  },
  {
    key: "pwa.name",
    locale: "en",
    group: "pwa",
    label: "App name",
    value: "BookNow — WhatsApp Business Assistant",
  },
  {
    key: "pwa.short_name",
    locale: "en",
    group: "pwa",
    label: "Short name",
    value: "BookNow",
  },
  {
    key: "pwa.description",
    locale: "en",
    group: "pwa",
    label: "Description",
    value: "Booking, WhatsApp reminders, and customer list.",
  },
  {
    key: "pwa.theme_color",
    locale: "en",
    group: "pwa",
    label: "Theme color",
    value: "#059669",
  },
  {
    key: "pwa.background_color",
    locale: "en",
    group: "pwa",
    label: "Background color",
    value: "#fafafa",
  },
  {
    key: "pwa.start_url",
    locale: "en",
    group: "pwa",
    label: "Start URL",
    value: "/app?source=installed",
  },
];
