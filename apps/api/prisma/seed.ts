import "dotenv/config";
import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seedCategories() {
  const templates = [
    {
      key: "clinic",
      name: "Clinic",
      templateJson: {
        services: [
          { name: "Consultation", durationMin: 15 },
          { name: "Follow-up", durationMin: 10 },
          { name: "Vaccination", durationMin: 20, bufferAfterMin: 5 },
        ],
      },
    },
    {
      key: "salon",
      name: "Salon",
      templateJson: {
        services: [
          { name: "Haircut", durationMin: 20 },
          { name: "Beard", durationMin: 15 },
          { name: "Facial", durationMin: 45, bufferAfterMin: 10 },
        ],
      },
    },
    {
      key: "spa",
      name: "Spa",
      templateJson: {
        services: [
          { name: "Massage", durationMin: 60, bufferAfterMin: 10 },
          { name: "Therapy", durationMin: 45, bufferAfterMin: 10 },
        ],
      },
    },
    {
      key: "home_service",
      name: "Home Service",
      templateJson: {
        services: [
          { name: "AC Repair", durationMin: 60, bufferAfterMin: 10 },
          { name: "Plumbing", durationMin: 45, bufferAfterMin: 10 },
          { name: "Electrician", durationMin: 45, bufferAfterMin: 10 },
        ],
      },
    },
  ];

  for (const item of templates) {
    await prisma.businessCategory.upsert({
      where: { key: item.key },
      create: {
        key: item.key,
        name: item.name,
        templateJson: item.templateJson as any,
        isActive: true,
      },
      update: {
        name: item.name,
        templateJson: item.templateJson as any,
        isActive: true,
      },
    });
  }
}

async function seedSuperAdmin() {
  const username = process.env.SUPERADMIN_USERNAME;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!username || !password) return;

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { username },
    create: {
      username,
      passwordHash,
      passwordUpdatedAt: new Date(),
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
    update: {
      passwordHash,
      passwordUpdatedAt: new Date(),
    },
  });
}

async function seedDemoBusiness() {
  const businessSlug = "demo-salon";
  const businessName = "Demo Salon & Spa";
  const adminUsername = "demo_admin";
  const adminPassword = "password123";

  const salonCategory = await prisma.businessCategory.findUnique({
    where: { key: "salon" },
  });

  if (!salonCategory) {
    console.error("Salon category not found, skipping demo business seed");
    return;
  }

  const business = await prisma.business.upsert({
    where: { slug: businessSlug },
    create: {
      slug: businessSlug,
      name: businessName,
      categoryId: salonCategory.id,
      isActive: true,
      timezone: "Asia/Kolkata",
    },
    update: {
      name: businessName,
      categoryId: salonCategory.id,
    },
  });

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const adminUser = await prisma.user.create({
      data: {
        username: adminUsername,
        passwordHash,
        passwordUpdatedAt: new Date(),
        role: UserRole.BUSINESS_ADMIN,
        businessId: business.id,
        isActive: true,
        name: "Demo Admin",
      },
    });

    await prisma.staffProfile.upsert({
      where: { userId: adminUser.id },
      create: {
        userId: adminUser.id,
        businessId: business.id,
        title: "Owner",
        isAvailable: true,
      },
      update: {},
    });
  }

  const superAdminUsername = process.env.SUPERADMIN_USERNAME;
  if (superAdminUsername) {
    await prisma.user.updateMany({
      where: { username: superAdminUsername },
      data: { businessId: business.id },
    });
  }

  const serviceCount = await prisma.service.count({
    where: { businessId: business.id },
  });

  if (serviceCount === 0) {
    await prisma.service.createMany({
      data: [
        {
          businessId: business.id,
          name: "Classic Haircut",
          durationMin: 30,
          priceCents: 50000,
          isActive: true,
        },
        {
          businessId: business.id,
          name: "Beard Trim",
          durationMin: 15,
          priceCents: 20000,
          isActive: true,
        },
        {
          businessId: business.id,
          name: "Luxury Facial",
          durationMin: 60,
          priceCents: 120000,
          isActive: true,
        },
      ],
    });
  }

  console.log(`Demo business "${businessName}" seeded successfully.`);
  console.log(`Admin login: ${adminUsername} / ${adminPassword}`);
}

// Default SiteContent values — all user-facing text editable by Super Admin
async function seedSiteContent() {
  const defaults: Array<{
    key: string;
    locale: string;
    group: string;
    label: string;
    value: string;
  }> = [
    // ── Landing page ──────────────────────────────────────────────────────
    {
      key: "landing.hero.title",
      locale: "en",
      group: "landing",
      label: "Hero Title (English)",
      value: "Run bookings on WhatsApp — without the chaos.",
    },
    {
      key: "landing.hero.title",
      locale: "hi",
      group: "landing",
      label: "Hero Title (Hindi)",
      value: "WhatsApp से booking, reminder और customer — सब एक जगह।",
    },
    {
      key: "landing.hero.subtitle",
      locale: "en",
      group: "landing",
      label: "Hero Subtitle (English)",
      value:
        "Built for Indian salons, clinics, spas, and home services. Big buttons, Hindi-friendly flows, minimal typing. Your customers book from a link or QR; you confirm from your phone.",
    },
    {
      key: "landing.hero.subtitle",
      locale: "hi",
      group: "landing",
      label: "Hero Subtitle (Hindi)",
      value:
        "Salons, clinics, spas और home services के लिए बना है। Customer booking link से book करें, आप phone से confirm करें।",
    },
    {
      key: "landing.cta.primary",
      locale: "en",
      group: "landing",
      label: "Primary CTA Button",
      value: "Start free with mobile",
    },
    {
      key: "landing.cta.primary",
      locale: "hi",
      group: "landing",
      label: "Primary CTA Button (Hindi)",
      value: "Mobile से शुरू करें — Free",
    },
    {
      key: "landing.cta.secondary",
      locale: "en",
      group: "landing",
      label: "Secondary CTA Button",
      value: "I already have an account",
    },
    {
      key: "landing.cta.secondary",
      locale: "hi",
      group: "landing",
      label: "Secondary CTA Button (Hindi)",
      value: "पहले से account है? Login करें",
    },
    {
      key: "landing.features",
      locale: "en",
      group: "landing",
      label: "Feature Bullets (JSON array)",
      value: JSON.stringify([
        "Same-day setup — category, services, timings auto-suggested",
        "Start with your mobile — no password to remember (OTP)",
        "Booking link + printable QR for your shop board",
        "WhatsApp reminders sent automatically to customers",
        "Full CRM — customer history, payments, notes in one place",
      ]),
    },
    {
      key: "landing.features",
      locale: "hi",
      group: "landing",
      label: "Feature Bullets (Hindi JSON array)",
      value: JSON.stringify([
        "Same day setup — category और services auto-suggest होते हैं",
        "Mobile OTP से शुरू करें — कोई password याद नहीं",
        "Booking link और printable QR shop board के लिए",
        "WhatsApp reminders automatically customers को जाते हैं",
        "पूरा CRM — customer history, payments, notes एक जगह",
      ]),
    },
    {
      key: "landing.trust",
      locale: "en",
      group: "landing",
      label: "Trust Strip Text",
      value: "Trusted by 100+ businesses across Darbhanga, Laheriasarai & Mohali",
    },
    {
      key: "landing.trust",
      locale: "hi",
      group: "landing",
      label: "Trust Strip Text (Hindi)",
      value: "Darbhanga, Laheriasarai और Mohali के 100+ businesses का भरोसा",
    },
    {
      key: "landing.faq",
      locale: "en",
      group: "landing",
      label: "FAQ Items (JSON array of {q,a})",
      value: JSON.stringify([
        {
          q: "Do my customers need to download an app?",
          a: "No. Customers book from a simple link or QR code in their browser. No app, no login.",
        },
        {
          q: "How does WhatsApp connect work?",
          a: "You scan a QR code once in the app. Your WhatsApp is then linked and we can send booking confirmations and reminders automatically.",
        },
        {
          q: "Is it free?",
          a: "Yes, start for free. No credit card needed. Premium features available as your business grows.",
        },
        {
          q: "Does it work for clinics and coaching centers?",
          a: "Yes — it works for any appointment-based business: salons, clinics, spas, tutors, repair shops, and more.",
        },
      ]),
    },
    {
      key: "landing.faq",
      locale: "hi",
      group: "landing",
      label: "FAQ Items (Hindi JSON array of {q,a})",
      value: JSON.stringify([
        {
          q: "क्या customers को कोई app download करना होगा?",
          a: "नहीं। Customer browser में link या QR code से book करते हैं। कोई app नहीं, कोई login नहीं।",
        },
        {
          q: "WhatsApp connect कैसे काम करता है?",
          a: "App में एक बार QR scan करें। फिर WhatsApp link हो जाता है और booking confirmation और reminders automatically जाते हैं।",
        },
        {
          q: "क्या यह free है?",
          a: "हाँ, free में शुरू करें। कोई credit card नहीं चाहिए। Business बढ़ने पर premium features लें।",
        },
        {
          q: "क्या यह clinic और coaching के लिए भी काम करता है?",
          a: "हाँ — salons, clinics, spas, tutors, repair shops — कोई भी appointment-based business।",
        },
      ]),
    },
    {
      key: "landing.pricing",
      locale: "en",
      group: "landing",
      label: "Pricing Section (JSON)",
      value: JSON.stringify({
        headline: "Simple pricing. No surprises.",
        plans: [
          {
            name: "Free",
            price: "₹0",
            period: "forever",
            features: ["Unlimited bookings", "WhatsApp connect", "Public booking page", "Basic CRM"],
            cta: "Start free",
            href: "/signup",
            highlighted: false,
          },
          {
            name: "Pro",
            price: "₹499",
            period: "per month",
            features: [
              "Everything in Free",
              "Auto WhatsApp reminders",
              "Customer retention automation",
              "Analytics & reports",
              "Priority support",
            ],
            cta: "Start 14-day trial",
            href: "/signup",
            highlighted: true,
          },
        ],
      }),
    },

    // ── SEO metadata ────────────────────────────────────────────────────
    {
      key: "seo.landing.title",
      locale: "en",
      group: "seo",
      label: "Landing Page — SEO Title",
      value: "WhatsApp Booking System for Indian Businesses | BookNow",
    },
    {
      key: "seo.landing.description",
      locale: "en",
      group: "seo",
      label: "Landing Page — Meta Description",
      value:
        "Manage bookings, customers, and WhatsApp reminders in one place. Free for salons, clinics, and home services. Setup in 5 minutes.",
    },
    {
      key: "seo.login.title",
      locale: "en",
      group: "seo",
      label: "Login Page — SEO Title",
      value: "Login | WhatsApp Booking System",
    },
    {
      key: "seo.signup.title",
      locale: "en",
      group: "seo",
      label: "Signup Page — SEO Title",
      value: "Start Free — WhatsApp Booking for Your Business",
    },
    {
      key: "seo.signup.description",
      locale: "en",
      group: "seo",
      label: "Signup Page — Meta Description",
      value: "Sign up with your mobile number. No password needed. Setup your booking page in minutes.",
    },
    {
      key: "seo.slug.title_template",
      locale: "en",
      group: "seo",
      label: "Public Booking Page — Title Template (use {businessName})",
      value: "Book {businessName} | Online Appointment",
    },
    {
      key: "seo.slug.description_template",
      locale: "en",
      group: "seo",
      label: "Public Booking Page — Description Template (use {businessName})",
      value:
        "Book appointments at {businessName} instantly. No app needed. WhatsApp confirmation sent automatically.",
    },

    // ── WhatsApp message templates ───────────────────────────────────────
    {
      key: "wa.booking_new_customer",
      locale: "en",
      group: "wa_templates",
      label: "New Booking — Customer Acknowledgement",
      value:
        "Hi {customerName}! 👋\n\nYour booking request has been received at *{businessName}*.\n\n📅 {date}\n⏰ {time}\n💇 Service: {service}\n\nWe'll confirm shortly. Thank you!",
    },
    {
      key: "wa.booking_new_provider",
      locale: "en",
      group: "wa_templates",
      label: "New Booking — Provider Notification (use {bookingId} for confirm/cancel)",
      value:
        "📋 *New Booking Request!*\n\n👤 Customer: {customerName}\n💇 Service: {service}\n📅 {date} at {time}\n📞 Phone: {customerPhone}\n\nReply to take action:\n✅ *CONFIRM {bookingId}*\n❌ *CANCEL {bookingId}*",
    },
    {
      key: "wa.booking_confirm",
      locale: "en",
      group: "wa_templates",
      label: "Booking Confirmed Message",
      value:
        "Hi {customerName}! Your appointment at *{businessName}* is confirmed.\n\n📅 {date}\n⏰ {time}\n💇 {service}\n\nSee you soon! Reply CANCEL to cancel.",
    },
    {
      key: "wa.reminder_24h",
      locale: "en",
      group: "wa_templates",
      label: "24h Before Reminder",
      value:
        "Hi {customerName}! Reminder: Your *{service}* appointment at *{businessName}* is tomorrow at {time}.\n\nReply CANCEL if you can't make it.",
    },
    {
      key: "wa.post_visit",
      locale: "en",
      group: "wa_templates",
      label: "Post-Visit Follow-up (sent 24h after appointment)",
      value:
        "Hope you loved your *{service}* at {businessName}! ⭐\n\nHow was your experience? Your feedback helps us improve.\n\nBook again: {bookingLink}",
    },
    {
      key: "wa.inactive_recovery",
      locale: "en",
      group: "wa_templates",
      label: "Inactive Customer Recovery (sent after 45 days)",
      value:
        "Hi {customerName}! We miss you at *{businessName}* 😊\n\nIt's been a while — ready for your next {service}?\n\nBook in one tap: {bookingLink}",
    },
    {
      key: "wa.booking_confirm",
      locale: "hi",
      group: "wa_templates",
      label: "Booking Confirmed Message (Hindi)",
      value:
        "नमस्ते {customerName}! आपकी appointment confirm हो गई है।\n\n📅 {date}\n⏰ {time}\n💇 {service}\n\nMilte hain! CANCEL reply karein agar cancel karna ho.",
    },
    {
      key: "wa.reminder_24h",
      locale: "hi",
      group: "wa_templates",
      label: "24h Before Reminder (Hindi)",
      value:
        "Reminder: Kal {time} baje *{businessName}* mein aapka *{service}* appointment hai। Cancel karna ho toh CANCEL likhen।",
    },

    // ── City landing pages ────────────────────────────────────────────────
    {
      key: "city.darbhanga.headline",
      locale: "en",
      group: "city",
      label: "Darbhanga Page — Headline",
      value: "WhatsApp Booking System for Darbhanga Businesses",
    },
    {
      key: "city.darbhanga.headline",
      locale: "hi",
      group: "city",
      label: "Darbhanga Page — Headline (Hindi)",
      value: "Darbhanga के businesses के लिए WhatsApp Booking System",
    },
    {
      key: "city.darbhanga.subtext",
      locale: "en",
      group: "city",
      label: "Darbhanga Page — Subtext",
      value:
        "Salons, clinics, coaching centers and home services in Darbhanga are using BookNow to manage bookings, send WhatsApp reminders, and grow their customer base.",
    },
    {
      key: "city.darbhanga.subtext",
      locale: "hi",
      group: "city",
      label: "Darbhanga Page — Subtext (Hindi)",
      value:
        "Darbhanga के salons, clinics, coaching centers और home services BookNow use कर रहे हैं — bookings manage करने, WhatsApp reminders भेजने और customers बढ़ाने के लिए।",
    },
    {
      key: "city.laheriasarai.headline",
      locale: "en",
      group: "city",
      label: "Laheriasarai Page — Headline",
      value: "WhatsApp Booking for Laheriasarai Businesses",
    },
    {
      key: "city.mohali.headline",
      locale: "en",
      group: "city",
      label: "Mohali Page — Headline",
      value: "WhatsApp Booking System for Mohali Businesses",
    },

    // ── Onboarding ────────────────────────────────────────────────────────
    {
      key: "onboarding.welcome.title",
      locale: "en",
      group: "onboarding",
      label: "Onboarding Welcome Title",
      value: "Set up your booking page",
    },
    {
      key: "onboarding.welcome.title",
      locale: "hi",
      group: "onboarding",
      label: "Onboarding Welcome Title (Hindi)",
      value: "अपना booking page बनाएं",
    },
    {
      key: "onboarding.welcome.subtitle",
      locale: "en",
      group: "onboarding",
      label: "Onboarding Welcome Subtitle",
      value: "Takes less than 5 minutes. We'll pre-fill services based on your business type.",
    },
    {
      key: "onboarding.welcome.subtitle",
      locale: "hi",
      group: "onboarding",
      label: "Onboarding Welcome Subtitle (Hindi)",
      value: "5 minutes से कम लगेंगे। Business type के हिसाब से services auto-fill होंगी।",
    },
  ];

  for (const item of defaults) {
    await prisma.siteContent.upsert({
      where: { key_locale: { key: item.key, locale: item.locale } },
      create: item,
      update: { label: item.label }, // only update label on re-seed; preserve admin edits to value
    });
  }

  console.log(`Site content seeded: ${defaults.length} keys`);
}

async function main() {
  await seedCategories();
  await seedSuperAdmin();
  await seedDemoBusiness();
  await seedSiteContent();
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
