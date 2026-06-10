/** Darbhanga field bundle — one pack = exactly 3 things, no SaaS vocabulary. */

export type DarbhangaPackKey = "salon" | "clinic" | "coaching";

export type DarbhangaPack = {
  key: DarbhangaPackKey;
  icon: string;
  titleHi: string;
  titleEn: string;
  taglineHi: string;
  bulletsHi: [string, string, string];
  categoryKeys: string[];
};

export const DARBHANGA_PACKS: DarbhangaPack[] = [
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
];

export function packByKey(key: string | null | undefined): DarbhangaPack | undefined {
  return DARBHANGA_PACKS.find((p) => p.key === key);
}

export function signupUrl(pack: DarbhangaPackKey) {
  return `/signup?ref=darbhanga&pack=${pack}`;
}

export const DARBHANGA_WHATSAPP_DEMO = "919122000751";

export const DARBHANGA_SHARE_TEMPLATE = (shopName: string, link: string) =>
  `नमस्ते! ${shopName} पर online booking शुरू हो गई है।\n\nLink: ${link}\n\nQR scan करके book करें — कोई app नहीं चाहिए।`;
