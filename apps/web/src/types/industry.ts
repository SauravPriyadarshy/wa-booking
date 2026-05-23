/**
 * Industry-specific dashboard module keys (master prompt).
 * categoryKey matches BusinessCategory.key from API (e.g. salon, clinic).
 */
export const INDUSTRY_MODULES = {
  salon: [
    "bookings_today",
    "staff_queue",
    "walk_ins",
    "repeat_customers",
    "pending_payments",
    "peak_hours",
  ],
  clinic: [
    "patient_queue",
    "appointments",
    "follow_ups",
    "missed_revisits",
    "doctor_availability",
  ],
  home_service: ["technician_dispatch", "upcoming_visits", "delayed_visits"],
  tattoo: ["session_pipeline", "consultation_queue", "aftercare_reminders"],
  spa: ["bookings_today", "staff_queue", "treatment_rooms", "pending_payments"],
  barber: ["bookings_today", "staff_queue", "walk_ins", "repeat_customers"],
} as const;

export type IndustryKey = keyof typeof INDUSTRY_MODULES;

export const INDUSTRY_MODULE_LABELS: Record<string, string> = {
  bookings_today: "Today’s bookings",
  staff_queue: "Staff queue",
  walk_ins: "Walk-ins",
  repeat_customers: "Repeat guests",
  pending_payments: "Pending payments",
  peak_hours: "Peak hours",
  patient_queue: "Patient queue",
  appointments: "Appointments",
  follow_ups: "Follow-ups",
  missed_revisits: "Missed revisits",
  doctor_availability: "Doctor availability",
  technician_dispatch: "Technician dispatch",
  upcoming_visits: "Upcoming visits",
  delayed_visits: "Delayed visits",
  session_pipeline: "Session pipeline",
  consultation_queue: "Consultation queue",
  aftercare_reminders: "Aftercare reminders",
  treatment_rooms: "Treatment rooms",
};

export function getIndustryModuleKeys(categoryKey: string | null | undefined): readonly string[] {
  if (!categoryKey) return INDUSTRY_MODULES.salon;
  const k = categoryKey.toLowerCase() as IndustryKey;
  if (k in INDUSTRY_MODULES) return INDUSTRY_MODULES[k];
  return INDUSTRY_MODULES.salon;
}

export function hrefForIndustryModule(key: string): string {
  const routes: Record<string, string> = {
    bookings_today: "/app/bookings",
    staff_queue: "/app/staff",
    walk_ins: "/app/bookings",
    repeat_customers: "/app/customers",
    pending_payments: "/app/payments",
    peak_hours: "/app/analytics",
    patient_queue: "/app/bookings",
    appointments: "/app/bookings",
    follow_ups: "/app/customers",
    missed_revisits: "/app/customers?filter=inactive",
    doctor_availability: "/app/staff",
    technician_dispatch: "/app/staff",
    upcoming_visits: "/app/bookings",
    delayed_visits: "/app/bookings",
    session_pipeline: "/app/bookings",
    consultation_queue: "/app/leads",
    aftercare_reminders: "/app/whatsapp",
    treatment_rooms: "/app/bookings",
  };
  return routes[key] ?? "/app/bookings";
}
