/** Curated demo simulator data — isolated from LIVE tenants. */

export type SuccessCard = {
  key: string;
  name: string;
  nameHi: string;
  icon: string;
  simulatorKey: string;
};

export type SimulatorPayload = {
  key: string;
  businessName: string;
  businessNameHi: string;
  categoryLabel: string;
  categoryLabelHi: string;
  demoSlug: string;
  stats: Array<{ label: string; labelHi: string; value: string; tone?: 'warn' | 'good' | 'neutral' }>;
  healthScore: number;
  healthLevel: 'excellent' | 'good' | 'needs_attention' | 'critical';
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

export const SUCCESS_CARDS: SuccessCard[] = [
  { key: 'coaching', name: 'Coaching Center', nameHi: 'कोचिंग सेंटर', icon: '📚', simulatorKey: 'coaching' },
  { key: 'tutor', name: 'Home Tutor', nameHi: 'होम ट्यूटर', icon: '✏️', simulatorKey: 'tutor' },
  { key: 'clinic', name: 'Clinic', nameHi: 'क्लिनिक', icon: '🏥', simulatorKey: 'clinic' },
  { key: 'doctor', name: 'Doctor', nameHi: 'डॉक्टर', icon: '👨‍⚕️', simulatorKey: 'clinic' },
  { key: 'salon', name: 'Salon', nameHi: 'सैलून', icon: '💈', simulatorKey: 'salon' },
  { key: 'beauty', name: 'Beauty Parlour', nameHi: 'ब्यूटी पार्लर', icon: '💅', simulatorKey: 'salon' },
  { key: 'tattoo', name: 'Tattoo Studio', nameHi: 'टैटू स्टूडियो', icon: '🎨', simulatorKey: 'tattoo' },
  { key: 'spa', name: 'Spa', nameHi: 'स्पा', icon: '🧖', simulatorKey: 'spa' },
  { key: 'home_service', name: 'Home Service', nameHi: 'होम सर्विस', icon: '🔧', simulatorKey: 'home_service' },
  { key: 'consultant', name: 'Consultant', nameHi: 'कंसल्टेंट', icon: '💼', simulatorKey: 'consultant' },
  { key: 'ca', name: 'CA', nameHi: 'CA', icon: '📊', simulatorKey: 'consultant' },
  { key: 'advocate', name: 'Advocate', nameHi: 'वकील', icon: '⚖️', simulatorKey: 'consultant' },
  { key: 'other', name: 'Other', nameHi: 'अन्य', icon: '🏪', simulatorKey: 'generic' },
];

const SIMULATORS: Record<string, SimulatorPayload> = {
  coaching: {
    key: 'coaching',
    businessName: 'Darbhanga Career Academy',
    businessNameHi: 'दरभंगा करियर एकेडमी',
    categoryLabel: 'Coaching Center',
    categoryLabelHi: 'कोचिंग सेंटर',
    demoSlug: 'demo-darbhanga-career-academy',
    stats: [
      { label: 'Students', labelHi: 'Students', value: '185', tone: 'good' },
      { label: 'Pending fees', labelHi: 'Pending fees', value: '₹92,000', tone: 'warn' },
      { label: 'Present today', labelHi: 'Present today', value: '143', tone: 'good' },
      { label: 'Parent follow-ups', labelHi: 'Parent follow-ups', value: '18', tone: 'warn' },
    ],
    healthScore: 62,
    healthLevel: 'needs_attention',
    leakage: {
      missedAppointments: 0,
      pendingPayments: 18,
      unconfirmedBookings: 6,
      inactiveCustomers: 24,
      lostFollowups: 18,
      estimatedLossInr: 92000,
    },
    psychology: {
      problems: [
        { title: 'Fee collection delay', titleHi: 'Fee late aati hai', why: 'Manual registers & WhatsApp reminders miss ho jaate hain', whyHi: 'Register aur WhatsApp par reminder bhool jaate hain' },
        { title: 'Attendance tracking', titleHi: 'Attendance track nahi hoti', why: 'Paper sheets se parent ko update dena mushkil', whyHi: 'Kagaz se parent ko batana mushkil' },
        { title: 'Parent communication', titleHi: 'Parent se baat nahi hoti', why: 'Har parent ko alag message — time khatam', whyHi: 'Har parent ko alag message — time khatam' },
        { title: 'Student dropouts', titleHi: 'Students chhod dete hain', why: 'Inactive students pe follow-up nahi hota', whyHi: 'Jo nahi aate unpe follow-up nahi' },
      ],
      helps: [
        { title: 'Fee due alerts', titleHi: 'Fee due alert', benefit: 'Pending fees ek screen par — WhatsApp reminder ek click', benefitHi: 'Pending fees ek jagah — WhatsApp reminder ek click' },
        { title: 'Attendance module', titleHi: 'Attendance module', benefit: 'Daily attendance + parent notification', benefitHi: 'Roz attendance + parent ko message' },
        { title: 'Batch management', titleHi: 'Batch manage', benefit: 'NEET/JEE batches alag track', benefitHi: 'NEET/JEE batch alag track' },
        { title: 'Reactivation', titleHi: 'Purane students wapas', benefit: '30/60/90 din inactive — auto reminder', benefitHi: '30/60/90 din inactive — auto reminder' },
      ],
      timeSaved: '2–3 hours daily on fees & parent calls',
      timeSavedHi: 'Roz 2–3 ghanta bachta hai fees aur parent call par',
    },
    sampleSchedule: [
      { time: '8:00 AM', title: 'NEET Batch — Attendance', titleHi: 'NEET Batch — Attendance', status: 'done' },
      { time: '10:30 AM', title: 'Fee reminder — 12 parents', titleHi: 'Fee reminder — 12 parents', status: 'pending' },
      { time: '2:00 PM', title: 'Demo class — new admission', titleHi: 'Demo class — naya admission', status: 'confirmed' },
    ],
  },
  clinic: {
    key: 'clinic',
    businessName: 'City Care Clinic',
    businessNameHi: 'सिटी केयर क्लिनिक',
    categoryLabel: 'Clinic',
    categoryLabelHi: 'क्लिनिक',
    demoSlug: 'demo-city-care-clinic',
    stats: [
      { label: 'Patients', labelHi: 'Patients', value: '300', tone: 'good' },
      { label: 'Appointments', labelHi: 'Appointments', value: '500/mo', tone: 'good' },
      { label: 'Follow-ups due', labelHi: 'Follow-ups due', value: '30', tone: 'warn' },
      { label: 'Reception staff', labelHi: 'Reception staff', value: '2', tone: 'neutral' },
    ],
    healthScore: 58,
    healthLevel: 'needs_attention',
    leakage: {
      missedAppointments: 14,
      pendingPayments: 8,
      unconfirmedBookings: 11,
      inactiveCustomers: 22,
      lostFollowups: 30,
      estimatedLossInr: 45000,
    },
    psychology: {
      problems: [
        { title: 'Missed appointments', titleHi: 'Appointment miss ho jaati hai', why: 'Reminder nahi gaya ya patient bhool gaya', whyHi: 'Reminder nahi gaya ya patient bhool gaya' },
        { title: 'Lost follow-ups', titleHi: 'Follow-up chhoot jaata hai', why: 'Reception register se track nahi hota', whyHi: 'Register se follow-up track nahi' },
        { title: 'Reception overload', titleHi: 'Reception par load zyada', why: 'Phone + walk-in + WhatsApp ek saath', whyHi: 'Phone + walk-in + WhatsApp ek saath' },
      ],
      helps: [
        { title: 'WhatsApp reminders', titleHi: 'WhatsApp reminder', benefit: '24h pehle auto reminder — no-show kam', benefitHi: '24 ghante pehle auto reminder' },
        { title: 'Queue dashboard', titleHi: 'Queue dashboard', benefit: 'Reception ko live queue dikhe', benefitHi: 'Reception ko live queue dikhe' },
        { title: 'Patient history', titleHi: 'Patient history', benefit: 'Purani visit ek click par', benefitHi: 'Purani visit ek click par' },
      ],
      timeSaved: '1–2 hours daily for reception',
      timeSavedHi: 'Reception ka 1–2 ghanta bachta hai',
    },
    sampleSchedule: [
      { time: '9:00 AM', title: 'Dr. Sharma — 6 patients', titleHi: 'Dr. Sharma — 6 patients', status: 'in_progress' },
      { time: '11:00 AM', title: 'Follow-up — 4 pending', titleHi: 'Follow-up — 4 pending', status: 'pending' },
      { time: '4:00 PM', title: 'Physio session', titleHi: 'Physio session', status: 'confirmed' },
    ],
  },
  salon: {
    key: 'salon',
    businessName: 'Modern Men Salon',
    businessNameHi: 'मॉडर्न मेन सैलून',
    categoryLabel: 'Salon',
    categoryLabelHi: 'सैलून',
    demoSlug: 'demo-modern-men-salon',
    stats: [
      { label: 'Customers', labelHi: 'Customers', value: '200', tone: 'good' },
      { label: 'Bookings', labelHi: 'Bookings', value: '450/mo', tone: 'good' },
      { label: 'Repeat customers', labelHi: 'Repeat customers', value: '61%', tone: 'good' },
      { label: 'Empty slots today', labelHi: 'Empty slots today', value: '3', tone: 'warn' },
    ],
    healthScore: 74,
    healthLevel: 'good',
    leakage: {
      missedAppointments: 9,
      pendingPayments: 4,
      unconfirmedBookings: 7,
      inactiveCustomers: 38,
      lostFollowups: 12,
      estimatedLossInr: 28000,
    },
    psychology: {
      problems: [
        { title: 'Inactive customers', titleHi: 'Purane customer nahi aate', why: '45 din baad koi reminder nahi', whyHi: '45 din baad koi reminder nahi' },
        { title: 'Empty slots', titleHi: 'Khali slot reh jaate hain', why: 'Last-minute cancel par refill nahi hota', whyHi: 'Cancel par naya booking nahi aata' },
        { title: 'Repeat tracking', titleHi: 'Repeat customer track nahi', why: 'Kaun regular hai — pata nahi', whyHi: 'Kaun regular hai — pata nahi' },
      ],
      helps: [
        { title: 'Reactivation campaigns', titleHi: 'Purane customer wapas', benefit: '30/60/90 din inactive — offer bhejo', benefitHi: 'Inactive par offer bhejo' },
        { title: 'Online booking link', titleHi: 'Online booking link', benefit: 'Customer khud slot book kare', benefitHi: 'Customer khud slot book kare' },
        { title: 'Staff utilization', titleHi: 'Staff utilization', benefit: 'Kaun busy hai — dashboard par', benefitHi: 'Kaun busy hai — dashboard par' },
      ],
      timeSaved: '1 hour daily on phone bookings',
      timeSavedHi: 'Phone booking par 1 ghanta bachta hai',
    },
    sampleSchedule: [
      { time: '10:00 AM', title: 'Haircut — Ravi (regular)', titleHi: 'Haircut — Ravi (regular)', status: 'confirmed' },
      { time: '12:30 PM', title: 'Empty slot — send offer', titleHi: 'Khali slot — offer bhejo', status: 'warn' },
      { time: '5:00 PM', title: 'Facial — new customer', titleHi: 'Facial — naya customer', status: 'confirmed' },
    ],
  },
  home_service: {
    key: 'home_service',
    businessName: 'Bihar Home Services',
    businessNameHi: 'बिहार होम सर्विसेज',
    categoryLabel: 'Home Service',
    categoryLabelHi: 'होम सर्विस',
    demoSlug: 'demo-bihar-home-services',
    stats: [
      { label: 'Jobs', labelHi: 'Jobs', value: '300/mo', tone: 'good' },
      { label: 'Technicians', labelHi: 'Technicians', value: '8', tone: 'neutral' },
      { label: 'Pending payments', labelHi: 'Pending payments', value: '₹14,200', tone: 'warn' },
      { label: 'Unassigned today', labelHi: 'Unassigned today', value: '2', tone: 'warn' },
    ],
    healthScore: 65,
    healthLevel: 'needs_attention',
    leakage: {
      missedAppointments: 6,
      pendingPayments: 9,
      unconfirmedBookings: 5,
      inactiveCustomers: 15,
      lostFollowups: 8,
      estimatedLossInr: 14200,
    },
    psychology: {
      problems: [
        { title: 'Job tracking', titleHi: 'Job track nahi hoti', why: 'Technician ko call karke puchna padta hai', whyHi: 'Technician ko call karke puchna padta hai' },
        { title: 'Scheduling chaos', titleHi: 'Schedule gadbad', why: 'Ek technician do jagah book ho jaata hai', whyHi: 'Ek technician do jagah book' },
        { title: 'Payment follow-up', titleHi: 'Payment late', why: 'Kaam ho gaya, payment pending', whyHi: 'Kaam ho gaya, payment pending' },
      ],
      helps: [
        { title: 'Technician schedule', titleHi: 'Technician schedule', benefit: 'Har technician ka din clear', benefitHi: 'Har technician ka din clear' },
        { title: 'WhatsApp updates', titleHi: 'WhatsApp update', benefit: 'Customer ko auto status message', benefitHi: 'Customer ko auto status' },
        { title: 'Payment reminders', titleHi: 'Payment reminder', benefit: 'Pending payment ek click par', benefitHi: 'Pending payment ek click par' },
      ],
      timeSaved: '2 hours daily coordinating technicians',
      timeSavedHi: 'Technician coordinate par 2 ghanta bachta hai',
    },
    sampleSchedule: [
      { time: '9:00 AM', title: 'AC repair — Laheriasarai', titleHi: 'AC repair — Laheriasarai', status: 'in_progress' },
      { time: '1:00 PM', title: 'Plumber — Benipur', titleHi: 'Plumber — Benipur', status: 'confirmed' },
      { time: '4:30 PM', title: 'Payment pending — follow up', titleHi: 'Payment pending — follow up', status: 'pending' },
    ],
  },
  coaching_elite: {
    key: 'coaching_elite',
    businessName: 'Elite IAS Academy',
    businessNameHi: 'एलीट IAS एकेडमी',
    categoryLabel: 'Coaching Center',
    categoryLabelHi: 'कोचिंग सेंटर',
    demoSlug: 'demo-elite-ias-academy',
    stats: [
      { label: 'Students', labelHi: 'Students', value: '250', tone: 'good' },
      { label: 'Batches', labelHi: 'Batches', value: '10', tone: 'good' },
      { label: 'Attendance records', labelHi: 'Attendance records', value: '800', tone: 'good' },
      { label: 'Fees due', labelHi: 'Fees due', value: '₹1.2L', tone: 'warn' },
    ],
    healthScore: 68,
    healthLevel: 'good',
    leakage: {
      missedAppointments: 0,
      pendingPayments: 22,
      unconfirmedBookings: 4,
      inactiveCustomers: 18,
      lostFollowups: 14,
      estimatedLossInr: 120000,
    },
    psychology: {
      problems: [
        { title: 'Batch coordination', titleHi: 'Batch manage mushkil', why: '10 batches — alag schedule', whyHi: '10 batches — alag schedule' },
        { title: 'Exam reminders', titleHi: 'Exam reminder miss', why: 'Manual list se bhool jaate hain', whyHi: 'Manual list se bhool jaate hain' },
        { title: 'Retention tracking', titleHi: 'Dropout pata late', why: 'Attendance girne par late action', whyHi: 'Attendance girne par late action' },
      ],
      helps: [
        { title: 'Batch management', titleHi: 'Batch management', benefit: 'Har batch alag track', benefitHi: 'Har batch alag track' },
        { title: 'Exam reminders', titleHi: 'Exam reminder', benefit: 'Auto WhatsApp before test', benefitHi: 'Test se pehle auto WhatsApp' },
        { title: 'Retention dashboard', titleHi: 'Retention dashboard', benefit: 'Attendance % aur dropout alert', benefitHi: 'Attendance % aur dropout alert' },
      ],
      timeSaved: '3 hours weekly on batch admin',
      timeSavedHi: 'Batch admin par hafte mein 3 ghanta bachta hai',
    },
    sampleSchedule: [
      { time: '7:00 AM', title: 'UPSC Batch — 45 students', titleHi: 'UPSC Batch — 45 students', status: 'done' },
      { time: '3:00 PM', title: 'Mock test reminder', titleHi: 'Mock test reminder', status: 'pending' },
      { time: '6:00 PM', title: 'Parent meeting — 3 due', titleHi: 'Parent meeting — 3 due', status: 'pending' },
    ],
  },
};

// Aliases for card types without dedicated demo tenant
SIMULATORS.tutor = {
  ...SIMULATORS.coaching,
  key: 'tutor',
  businessName: 'Home Tuition — Priya Classes',
  businessNameHi: 'होम ट्यूशन — प्रिया क्लासेस',
  categoryLabel: 'Home Tutor',
  categoryLabelHi: 'होम ट्यूटर',
  demoSlug: 'demo-home-tuition-priya',
  stats: [
    { label: 'Students', labelHi: 'Students', value: '32', tone: 'good' },
    { label: 'Sessions/week', labelHi: 'Sessions/week', value: '48', tone: 'good' },
    { label: 'Fees pending', labelHi: 'Fees pending', value: '₹8,400', tone: 'warn' },
    { label: 'Parent updates', labelHi: 'Parent updates', value: '5 due', tone: 'warn' },
  ],
};

SIMULATORS.spa = { ...SIMULATORS.salon, key: 'spa', businessName: 'Serene Spa & Wellness', businessNameHi: 'सेरene स्पा', categoryLabel: 'Spa', categoryLabelHi: 'स्पा', demoSlug: 'demo-serene-spa' };
SIMULATORS.tattoo = { ...SIMULATORS.salon, key: 'tattoo', businessName: 'Ink Studio Darbhanga', businessNameHi: 'इंक स्टूडियो', categoryLabel: 'Tattoo Studio', categoryLabelHi: 'टैटू स्टूडियो', demoSlug: 'demo-ink-studio' };
SIMULATORS.consultant = {
  ...SIMULATORS.clinic,
  key: 'consultant',
  businessName: 'Sharma & Associates',
  businessNameHi: 'शर्मा एंड असोसिएट्स',
  categoryLabel: 'Consultant',
  categoryLabelHi: 'कंसल्टेंट',
  demoSlug: 'demo-sharma-associates',
  stats: [
    { label: 'Clients', labelHi: 'Clients', value: '85', tone: 'good' },
    { label: 'Meetings/month', labelHi: 'Meetings/month', value: '120', tone: 'good' },
    { label: 'Follow-ups due', labelHi: 'Follow-ups due', value: '12', tone: 'warn' },
    { label: 'Pending invoices', labelHi: 'Pending invoices', value: '₹32,000', tone: 'warn' },
  ],
};
SIMULATORS.generic = { ...SIMULATORS.salon, key: 'generic', businessName: 'Your Business', businessNameHi: 'आपका व्यवसाय', categoryLabel: 'Service Business', categoryLabelHi: 'सर्विस बिज़नेस', demoSlug: 'demo-modern-men-salon' };

export function listSuccessCards() {
  return SUCCESS_CARDS;
}

export function getSimulator(typeKey: string): SimulatorPayload | null {
  return SIMULATORS[typeKey] ?? SIMULATORS.generic ?? null;
}

export function resolveSimulatorKey(cardKey: string): string {
  const card = SUCCESS_CARDS.find((c) => c.key === cardKey);
  return card?.simulatorKey ?? cardKey;
}
