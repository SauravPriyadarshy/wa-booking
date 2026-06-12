/** Offline fallback when API is unavailable — keeps /business-success usable in dev. */

export type SimulatorData = {
  businessName: string;
  businessNameHi: string;
  categoryLabel: string;
  categoryLabelHi: string;
  stats: Array<{ label: string; labelHi: string; value: string; tone?: string }>;
  healthScore: number;
  healthLevel: string;
  leakage: {
    missedAppointments: number;
    pendingPayments: number;
    unconfirmedBookings: number;
    inactiveCustomers: number;
    lostFollowups: number;
    estimatedLossInr: number;
  };
  psychology: {
    problems: Array<{ title: string; titleHi: string; why: string; whyHi: string }>;
    helps: Array<{ title: string; titleHi: string; benefit: string; benefitHi: string }>;
    timeSaved: string;
    timeSavedHi: string;
  };
  sampleSchedule: Array<{ time: string; title: string; titleHi: string; status: string }>;
};

const BASE: SimulatorData = {
  businessName: "Demo Business",
  businessNameHi: "डेमो व्यवसाय",
  categoryLabel: "Service Business",
  categoryLabelHi: "सर्विस बिज़नेस",
  stats: [
    { label: "Bookings today", labelHi: "आज की booking", value: "8", tone: "good" },
    { label: "Pending confirm", labelHi: "Pending confirm", value: "3", tone: "warn" },
    { label: "Customers", labelHi: "Customers", value: "120", tone: "good" },
    { label: "Inactive 30d+", labelHi: "Inactive 30d+", value: "14", tone: "warn" },
  ],
  healthScore: 72,
  healthLevel: "good",
  leakage: {
    missedAppointments: 4,
    pendingPayments: 2,
    unconfirmedBookings: 3,
    inactiveCustomers: 14,
    lostFollowups: 5,
    estimatedLossInr: 18500,
  },
  psychology: {
    problems: [
      {
        title: "Missed WhatsApp messages",
        titleHi: "WhatsApp messages miss ho jaate hain",
        why: "Busy hours mein customers ka reply late hota hai",
        whyHi: "Busy time par customer ka reply late hota hai",
      },
      {
        title: "No customer history",
        titleHi: "Customer history nahi milti",
        why: "Purane customers wapas nahi aate",
        whyHi: "Purane customer wapas nahi aate",
      },
    ],
    helps: [
      {
        title: "Automatic WhatsApp reminders",
        titleHi: "Automatic WhatsApp reminder",
        benefit: "Booking confirm aur 24h reminder automatic — no-shows kam hote hain",
        benefitHi: "Booking confirm aur reminder automatic — no-show kam hota hai",
      },
      {
        title: "Customer list in one place",
        titleHi: "Customer list ek jagah",
        benefit: "Har visit, payment, note ek timeline mein — follow-up easy ho jata hai",
        benefitHi: "Har visit aur payment ek jagah — follow-up easy ho jata hai",
      },
    ],
    timeSaved: "Saves ~2 hours/day on manual follow-ups",
    timeSavedHi: "Roz ~2 ghante bachte hain manual follow-up par",
  },
  sampleSchedule: [
    { time: "10:00", title: "Walk-in customer", titleHi: "Walk-in customer", status: "ok" },
    { time: "11:30", title: "Pending confirm", titleHi: "Pending confirm", status: "warn" },
    { time: "14:00", title: "Regular client", titleHi: "Regular client", status: "ok" },
  ],
};

function sim(
  overrides: Partial<SimulatorData> & Pick<SimulatorData, "businessName" | "businessNameHi" | "categoryLabel" | "categoryLabelHi">,
): SimulatorData {
  return {
    ...BASE,
    ...overrides,
    stats: overrides.stats ?? BASE.stats,
    leakage: overrides.leakage ?? BASE.leakage,
    psychology: overrides.psychology ?? BASE.psychology,
    sampleSchedule: overrides.sampleSchedule ?? BASE.sampleSchedule,
  };
}

export const FALLBACK_SIMULATORS: Record<string, SimulatorData> = {
  salon: sim({
    businessName: "Modern Men Salon",
    businessNameHi: "मॉडर्न मेन सैलून",
    categoryLabel: "Salon & Barber",
    categoryLabelHi: "सैलून और नाई",
    healthScore: 68,
    healthLevel: "good",
  }),
  clinic: sim({
    businessName: "City Care Clinic",
    businessNameHi: "सिटी केयर क्लिनिक",
    categoryLabel: "Clinic",
    categoryLabelHi: "क्लिनिक",
    healthScore: 74,
    healthLevel: "good",
    leakage: { ...BASE.leakage, missedAppointments: 6, estimatedLossInr: 24000 },
  }),
  coaching: sim({
    businessName: "Darbhanga Career Academy",
    businessNameHi: "दरभंगा करियर एकेडमी",
    categoryLabel: "Coaching Center",
    categoryLabelHi: "कोचिंग सेंटर",
    healthScore: 62,
    healthLevel: "needs_attention",
    leakage: { ...BASE.leakage, pendingPayments: 18, estimatedLossInr: 92000 },
  }),
  home_service: sim({
    businessName: "QuickFix Home Services",
    businessNameHi: "क्विकफिक्स होम सर्विस",
    categoryLabel: "Home Services",
    categoryLabelHi: "होम सर्विस",
    healthScore: 70,
    healthLevel: "good",
  }),
  spa: sim({
    businessName: "Serene Spa",
    businessNameHi: "सेरेन स्पा",
    categoryLabel: "Spa & Wellness",
    categoryLabelHi: "स्पा और वेलनेस",
    healthScore: 75,
    healthLevel: "good",
  }),
  generic: sim({
    businessName: "Your Business",
    businessNameHi: "आपका व्यवसाय",
    categoryLabel: "Any Business",
    categoryLabelHi: "कोई भी व्यवसाय",
  }),
};

export function resolveSimulatorKey(cardKey: string): string {
  const map: Record<string, string> = {
    salon: "salon",
    clinic: "clinic",
    doctor: "clinic",
    coaching: "coaching",
    tutor: "coaching",
    home_service: "home_service",
    spa: "spa",
    beauty: "salon",
    tattoo: "salon",
    consultant: "generic",
    ca: "generic",
    advocate: "generic",
    other: "generic",
    generic: "generic",
  };
  return map[cardKey] ?? cardKey;
}

export function isValidSimulator(payload: unknown): payload is SimulatorData {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as SimulatorData;
  return (
    Array.isArray(p.stats) &&
    p.stats.length > 0 &&
    typeof p.healthScore === "number" &&
    !!p.leakage &&
    !!p.psychology &&
    Array.isArray(p.psychology.problems) &&
    Array.isArray(p.sampleSchedule)
  );
}

export function normalizeSimulatorPayload(payload: Record<string, unknown>): SimulatorData | null {
  if (isValidSimulator(payload)) return payload;
  const { ok: _ok, cardKey: _ck, simulatorKey: _sk, ...rest } = payload;
  if (isValidSimulator(rest)) return rest as SimulatorData;
  return null;
}

export function getFallbackSimulator(cardKey: string): SimulatorData {
  const key = resolveSimulatorKey(cardKey);
  return FALLBACK_SIMULATORS[key] ?? FALLBACK_SIMULATORS.generic;
}
