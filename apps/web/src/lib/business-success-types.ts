/** Static business types for SSR fallback on /business-success */
export const STATIC_BUSINESS_TYPES = [
  { key: "salon", name: "Salon & Barber", nameHi: "सैलून और नाई", icon: "💈" },
  { key: "clinic", name: "Clinic & Doctor", nameHi: "क्लिनिक और डॉक्टर", icon: "🏥" },
  { key: "coaching", name: "Coaching Center", nameHi: "कोचिंग सेंटर", icon: "📚" },
  { key: "home_service", name: "Home Services", nameHi: "होम सर्विस", icon: "🔧" },
  { key: "spa", name: "Spa & Wellness", nameHi: "स्पा और वेलनेस", icon: "🧖" },
  { key: "generic", name: "Any Business", nameHi: "कोई भी व्यवसाय", icon: "🏪" },
] as const;

export type StaticBusinessType = (typeof STATIC_BUSINESS_TYPES)[number];
