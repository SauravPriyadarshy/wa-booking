import { SubscriptionPlan } from '@prisma/client';

/** Plan feature keys — extend-only; do not rename existing keys. */
export type PlanFeature =
  | 'health_score'
  | 'revenue_leakage'
  | 'reactivation'
  | 'follow_up_automation'
  | 'wa_templates'
  | 'coaching_module'
  | 'fee_tracking'
  | 'attendance'
  | 'staff_management'
  | 'advanced_analytics'
  | 'ai_guide'
  | 'multi_staff_scheduling'
  | 'branch_management'
  | 'custom_branding'
  | 'advanced_reports'
  | 'api_access'
  | 'export_tools';

export type PlanLimits = {
  maxStaff: number | null;
  maxCustomers: number | null;
  maxBookingsPerMonth: number | null;
};

export type PlanSnapshot = {
  plan: SubscriptionPlan;
  effectivePlan: SubscriptionPlan;
  planExpiresAt: Date | null;
  expired: boolean;
  limits: PlanLimits;
  features: PlanFeature[];
};

const UNLIMITED: PlanLimits = {
  maxStaff: null,
  maxCustomers: null,
  maxBookingsPerMonth: null,
};

const PLUS_FEATURES: PlanFeature[] = [
  'health_score',
  'revenue_leakage',
  'reactivation',
  'follow_up_automation',
  'wa_templates',
  'coaching_module',
  'fee_tracking',
  'attendance',
  'staff_management',
];

const PRO_FEATURES: PlanFeature[] = [
  ...PLUS_FEATURES,
  'advanced_analytics',
  'ai_guide',
  'multi_staff_scheduling',
  'branch_management',
  'custom_branding',
  'advanced_reports',
  'api_access',
  'export_tools',
];

export function featuresForPlan(plan: SubscriptionPlan): PlanFeature[] {
  if (plan === SubscriptionPlan.PRO) return PRO_FEATURES;
  if (plan === SubscriptionPlan.PLUS) return PLUS_FEATURES;
  // Launch mode: Free includes full product until paid tiers are enforced again.
  return PRO_FEATURES;
}

export function limitsForPlan(plan: SubscriptionPlan): PlanLimits {
  return UNLIMITED;
}

export function effectivePlan(
  plan: SubscriptionPlan,
  planExpiresAt: Date | null,
  now = new Date(),
): { effective: SubscriptionPlan; expired: boolean } {
  if (plan === SubscriptionPlan.FREE) return { effective: SubscriptionPlan.FREE, expired: false };
  if (planExpiresAt && planExpiresAt < now) {
    return { effective: SubscriptionPlan.FREE, expired: true };
  }
  return { effective: plan, expired: false };
}

export function hasFeature(snapshot: PlanSnapshot, feature: PlanFeature): boolean {
  return snapshot.features.includes(feature);
}

export const UPGRADE_MESSAGES: Record<PlanFeature, { en: string; hi: string }> = {
  health_score: {
    en: 'Business Health Score is available on Plus and Pro plans.',
    hi: 'Business Health Score Plus ya Pro plan par available hai.',
  },
  revenue_leakage: {
    en: 'Revenue Leakage dashboard requires Plus or Pro.',
    hi: 'Revenue Leakage dashboard Plus ya Pro plan par hai.',
  },
  reactivation: {
    en: 'Customer reactivation tools require Plus or Pro.',
    hi: 'Customer reactivation Plus ya Pro plan par hai.',
  },
  follow_up_automation: {
    en: 'Follow-up automation requires Plus or Pro.',
    hi: 'Follow-up automation Plus ya Pro par hai.',
  },
  wa_templates: {
    en: 'WhatsApp templates pack requires Plus or Pro.',
    hi: 'WhatsApp templates Plus ya Pro par hai.',
  },
  coaching_module: {
    en: 'Coaching module (students, fees, attendance) requires Plus or Pro.',
    hi: 'Coaching module Plus ya Pro plan par hai.',
  },
  fee_tracking: {
    en: 'Fee tracking requires Plus or Pro.',
    hi: 'Fee tracking Plus ya Pro par hai.',
  },
  attendance: {
    en: 'Attendance module requires Plus or Pro.',
    hi: 'Attendance module Plus ya Pro par hai.',
  },
  staff_management: {
    en: 'Multiple staff members require Plus or Pro. Free plan includes 1 staff.',
    hi: 'Zyada staff ke liye Plus ya Pro chahiye. Free mein 1 staff.',
  },
  advanced_analytics: {
    en: 'Advanced analytics requires Pro plan.',
    hi: 'Advanced analytics Pro plan par hai.',
  },
  ai_guide: {
    en: 'In-app AI Business Guide requires Pro plan.',
    hi: 'AI Business Guide Pro plan par hai.',
  },
  multi_staff_scheduling: {
    en: 'Multi-staff scheduling requires Pro plan.',
    hi: 'Multi-staff scheduling Pro par hai.',
  },
  branch_management: {
    en: 'Branch management requires Pro plan.',
    hi: 'Branch management Pro par hai.',
  },
  custom_branding: {
    en: 'Custom branding requires Pro plan.',
    hi: 'Custom branding Pro par hai.',
  },
  advanced_reports: {
    en: 'Advanced reports require Pro plan.',
    hi: 'Advanced reports Pro par hain.',
  },
  api_access: {
    en: 'API access requires Pro plan.',
    hi: 'API access Pro plan par hai.',
  },
  export_tools: {
    en: 'Export tools require Pro plan.',
    hi: 'Export tools Pro par hain.',
  },
};
