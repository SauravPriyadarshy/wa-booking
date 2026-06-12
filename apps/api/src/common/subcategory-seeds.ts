/** Subcategory seeds per BusinessCategory.key — synced in prisma seed. */

export type SubcategorySeed = {
  key: string;
  name: string;
  nameHi?: string;
  isOther?: boolean;
};

export const SUBCATEGORY_SEEDS: Record<string, SubcategorySeed[]> = {
  clinic: [
    { key: "general_physician", name: "General Physician", nameHi: "General Physician" },
    { key: "child_specialist", name: "Child Specialist", nameHi: "Child Specialist" },
    { key: "ent", name: "ENT", nameHi: "ENT" },
    { key: "orthopedic", name: "Orthopedic", nameHi: "Orthopedic" },
    { key: "gynecologist", name: "Gynecologist", nameHi: "Gynecologist" },
    { key: "dentist", name: "Dentist", nameHi: "Dentist" },
    { key: "physiotherapist", name: "Physiotherapist", nameHi: "Physiotherapist" },
    { key: "other", name: "Other", nameHi: "Other", isOther: true },
  ],
  coaching: [
    { key: "neet", name: "NEET", nameHi: "NEET" },
    { key: "jee", name: "JEE", nameHi: "JEE" },
    { key: "upsc", name: "UPSC", nameHi: "UPSC" },
    { key: "bpsc", name: "BPSC", nameHi: "BPSC" },
    { key: "ssc", name: "SSC", nameHi: "SSC" },
    { key: "railway", name: "Railway", nameHi: "Railway" },
    { key: "spoken_english", name: "Spoken English", nameHi: "Spoken English" },
    { key: "computer", name: "Computer Training", nameHi: "Computer Training" },
    { key: "school", name: "School Coaching", nameHi: "School Coaching" },
    { key: "tuition", name: "Tuition Center", nameHi: "Tuition Center" },
    { key: "other", name: "Other", nameHi: "Other", isOther: true },
  ],
  salon: [
    { key: "men", name: "Men Salon", nameHi: "Men Salon" },
    { key: "women", name: "Women Salon", nameHi: "Women Salon" },
    { key: "unisex", name: "Unisex Salon", nameHi: "Unisex Salon" },
    { key: "other", name: "Other", nameHi: "Other", isOther: true },
  ],
  barber: [
    { key: "barber_shop", name: "Barber Shop", nameHi: "Barber Shop" },
    { key: "men_salon", name: "Men Salon", nameHi: "Men Salon" },
    { key: "other", name: "Other", nameHi: "Other", isOther: true },
  ],
  spa: [
    { key: "spa", name: "Spa", nameHi: "Spa" },
    { key: "beauty_parlor", name: "Beauty Parlor", nameHi: "Beauty Parlor" },
    { key: "other", name: "Other", nameHi: "Other", isOther: true },
  ],
  home_service: [
    { key: "electrician", name: "Electrician", nameHi: "Electrician" },
    { key: "plumber", name: "Plumber", nameHi: "Plumber" },
    { key: "carpenter", name: "Carpenter", nameHi: "Carpenter" },
    { key: "ac_repair", name: "AC Repair", nameHi: "AC Repair" },
    { key: "ro_repair", name: "RO Repair", nameHi: "RO Repair" },
    { key: "appliance", name: "Appliance Repair", nameHi: "Appliance Repair" },
    { key: "painter", name: "Painter", nameHi: "Painter" },
    { key: "other", name: "Other", nameHi: "Other", isOther: true },
  ],
  tutor: [
    { key: "school", name: "School Tuition", nameHi: "School Tuition" },
    { key: "home_tuition", name: "Home Tuition", nameHi: "Home Tuition" },
    { key: "other", name: "Other", nameHi: "Other", isOther: true },
  ],
  consultant: [
    { key: "ca", name: "Chartered Accountant", nameHi: "CA" },
    { key: "advocate", name: "Advocate", nameHi: "Advocate" },
    { key: "business", name: "Business Consultant", nameHi: "Business Consultant" },
    { key: "other", name: "Other", nameHi: "Other", isOther: true },
  ],
  tattoo: [
    { key: "tattoo", name: "Tattoo Studio", nameHi: "Tattoo Studio" },
    { key: "other", name: "Other", nameHi: "Other", isOther: true },
  ],
};
