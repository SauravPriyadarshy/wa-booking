import "dotenv/config";
import {
  PrismaClient,
  UserRole,
  SubscriptionPlan,
  BookingType,
  QueueStatus,
  ClinicPaymentStatus,
  AppointmentStatus,
  CoachingStreamKey,
  EnrollmentStatus,
  StudentStatus,
} from "@prisma/client";
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
          { name: "Follow-up Visit", durationMin: 10 },
          { name: "Health Check", durationMin: 20, bufferAfterMin: 5 },
        ],
      },
    },
    {
      key: "salon",
      name: "Salon",
      templateJson: {
        services: [
          { name: "Hair Cut", durationMin: 20 },
          { name: "Shaving", durationMin: 15 },
          { name: "Facial", durationMin: 45, bufferAfterMin: 10 },
          { name: "Hair Color", durationMin: 60, bufferAfterMin: 10 },
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
          { name: "Electrician", durationMin: 45, bufferAfterMin: 10 },
          { name: "Plumber", durationMin: 45, bufferAfterMin: 10 },
          { name: "AC Repair", durationMin: 60, bufferAfterMin: 10 },
          { name: "Appliance Repair", durationMin: 45, bufferAfterMin: 10 },
        ],
      },
    },
    {
      key: "barber",
      name: "Barber Shop",
      templateJson: {
        services: [
          { name: "Hair Cut", durationMin: 20 },
          { name: "Shaving", durationMin: 15 },
          { name: "Facial", durationMin: 30, bufferAfterMin: 5 },
          { name: "Hair Color", durationMin: 45, bufferAfterMin: 10 },
        ],
      },
    },
    {
      key: "tutor",
      name: "Tutor",
      templateJson: {
        services: [
          { name: "Demo Class", durationMin: 45 },
          { name: "Regular Session", durationMin: 60 },
          { name: "Doubt Session", durationMin: 30 },
        ],
      },
    },
    {
      key: "consultant",
      name: "Consultant",
      templateJson: {
        services: [
          { name: "Initial Consultation", durationMin: 30 },
          { name: "Follow-up Session", durationMin: 20 },
        ],
      },
    },
    {
      key: "tattoo",
      name: "Tattoo Studio",
      templateJson: {
        services: [
          { name: "Consultation", durationMin: 20 },
          { name: "Small Tattoo", durationMin: 60, bufferAfterMin: 15 },
          { name: "Large Tattoo Session", durationMin: 120, bufferAfterMin: 30 },
        ],
      },
    },
    {
      key: "coaching",
      name: "Coaching Center",
      templateJson: {
        services: [
          { name: "Demo Class", durationMin: 60 },
          { name: "Regular Class", durationMin: 60 },
          { name: "Doubt Session", durationMin: 30 },
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

async function seedSubcategories() {
  const { SUBCATEGORY_SEEDS } = await import("../src/common/subcategory-seeds");
  let count = 0;
  for (const [categoryKey, items] of Object.entries(SUBCATEGORY_SEEDS)) {
    const category = await prisma.businessCategory.findUnique({ where: { key: categoryKey } });
    if (!category) continue;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await prisma.businessSubcategory.upsert({
        where: { categoryId_key: { categoryId: category.id, key: item.key } },
        create: {
          categoryId: category.id,
          key: item.key,
          name: item.name,
          nameHi: item.nameHi ?? item.name,
          sortOrder: i,
          isOther: item.isOther ?? false,
          isActive: true,
        },
        update: {
          name: item.name,
          nameHi: item.nameHi ?? item.name,
          sortOrder: i,
          isOther: item.isOther ?? false,
          isActive: true,
        },
      });
      count++;
    }
  }
  console.log(`Subcategories seeded: ${count}`);
}

async function seedActivationCodes() {
  const codes = [
    { code: "FREE30", plan: "FREE" as const, validityDays: 30, maxUses: 1000, note: "Free plan extension — 30 days" },
    { code: "PLUS30", plan: "PLUS" as const, validityDays: 30, maxUses: 500, note: "Plus plan — 30 days" },
    { code: "PLUS90", plan: "PLUS" as const, validityDays: 90, maxUses: 500, note: "Plus plan — 90 days" },
    { code: "PRO30", plan: "PRO" as const, validityDays: 30, maxUses: 200, note: "Pro plan — 30 days" },
    { code: "PRO60", plan: "PRO" as const, validityDays: 60, maxUses: 200, note: "Pro plan — 60 days" },
    { code: "PRO90", plan: "PRO" as const, validityDays: 90, maxUses: 200, note: "Pro plan — 90 days" },
  ];
  for (const c of codes) {
    await prisma.activationCode.upsert({
      where: { code: c.code },
      create: { ...c, isActive: true },
      update: { ...c, isActive: true },
    });
  }
  console.log(`Activation codes seeded: ${codes.map((c) => c.code).join(", ")}`);
}

/** Read-only demo tenants for Business Success simulator — never mixed with LIVE data in app flows. */
async function seedDemoTenants() {
  const demos: Array<{ slug: string; name: string; categoryKey: string }> = [
    { slug: "demo-darbhanga-career-academy", name: "Darbhanga Career Academy", categoryKey: "coaching" },
    { slug: "demo-city-care-clinic", name: "City Care Clinic", categoryKey: "clinic" },
    { slug: "demo-modern-men-salon", name: "Modern Men Salon", categoryKey: "salon" },
    { slug: "demo-bihar-home-services", name: "Bihar Home Services", categoryKey: "home_service" },
    { slug: "demo-elite-ias-academy", name: "Elite IAS Academy", categoryKey: "coaching" },
    { slug: "demo-home-tuition-priya", name: "Home Tuition — Priya Classes", categoryKey: "tutor" },
    { slug: "demo-serene-spa", name: "Serene Spa & Wellness", categoryKey: "spa" },
    { slug: "demo-ink-studio", name: "Ink Studio Darbhanga", categoryKey: "tattoo" },
    { slug: "demo-sharma-associates", name: "Sharma & Associates", categoryKey: "consultant" },
  ];

  let count = 0;
  for (const d of demos) {
    const cat = await prisma.businessCategory.findUnique({ where: { key: d.categoryKey } });
    if (!cat) continue;
    await prisma.business.upsert({
      where: { slug: d.slug },
      create: {
        slug: d.slug,
        name: d.name,
        categoryId: cat.id,
        tenantType: "DEMO",
        isActive: true,
        timezone: "Asia/Kolkata",
        referralCode: d.slug.replace(/-/g, "").slice(0, 8).toUpperCase(),
      },
      update: {
        name: d.name,
        categoryId: cat.id,
        tenantType: "DEMO",
      },
    });
    count++;
  }
  console.log(`Demo tenants seeded: ${count}`);
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
  console.log(`OTP_WA_BUSINESS_ID=${business.id}  # set on Vercel for WhatsApp OTP delivery`);
  console.log(`Admin login: phone 9876543210 / ${adminPassword} (or username ${adminUsername})`);
}

async function ensureBusinessHours(businessId: string) {
  for (let weekday = 0; weekday <= 6; weekday++) {
    const isClosed = weekday === 0;
    await prisma.businessHours.upsert({
      where: { businessId_weekday: { businessId, weekday } },
      create: {
        businessId,
        weekday,
        isClosed,
        startMin: 540,
        endMin: 1080,
      },
      update: { isClosed, startMin: 540, endMin: 1080 },
    });
  }
}

async function ensureDemoUser(args: {
  username: string;
  phone?: string;
  password: string;
  businessId: string;
  name: string;
  role?: UserRole;
}) {
  const passwordHash = await bcrypt.hash(args.password, 10);
  return prisma.user.upsert({
    where: { username: args.username },
    create: {
      username: args.username,
      phone: args.phone,
      passwordHash,
      passwordUpdatedAt: new Date(),
      role: args.role ?? UserRole.BUSINESS_ADMIN,
      businessId: args.businessId,
      isActive: true,
      name: args.name,
    },
    update: {
      phone: args.phone,
      passwordHash,
      passwordUpdatedAt: new Date(),
      businessId: args.businessId,
      name: args.name,
      isActive: true,
    },
  });
}

async function ensureStaffDoctor(
  businessId: string,
  username: string,
  name: string,
  title: string,
  specialization: string,
  feeCents: number,
) {
  const user = await ensureDemoUser({
    username,
    password: "staff-only",
    businessId,
    name,
    role: UserRole.STAFF,
  });
  return prisma.staffProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      businessId,
      title,
      specialization,
      consultationFeeCents: feeCents,
      consultationDurationMin: 15,
      isAvailable: true,
    },
    update: {
      title,
      specialization,
      consultationFeeCents: feeCents,
      consultationDurationMin: 15,
      isAvailable: true,
    },
  });
}

/** Live demo tenants for sales demos — bookable public pages + full vertical data. */
async function seedLiveDemoAccounts() {
  const password = "password123";
  const month = new Date().toISOString().slice(0, 7);
  const todayISO = new Date().toISOString().slice(0, 10);
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  // ── Upgrade salon demo (demo_admin) ─────────────────────────────────────
  const salonCat = await prisma.businessCategory.findUnique({ where: { key: "salon" } });
  if (salonCat) {
    const salon = await prisma.business.upsert({
      where: { slug: "demo-salon" },
      create: {
        slug: "demo-salon",
        name: "Demo Salon & Spa",
        categoryId: salonCat.id,
        isActive: true,
        timezone: "Asia/Kolkata",
        plan: SubscriptionPlan.FREE,
        planExpiresAt: null,
      },
      update: {
        plan: SubscriptionPlan.FREE,
        planExpiresAt: null,
        isActive: true,
      },
    });
    await ensureBusinessHours(salon.id);
    await ensureDemoUser({
      username: "demo_admin",
      phone: "+919876543210",
      password,
      businessId: salon.id,
      name: "Demo Admin",
    });
  }

  // ── Clinic demo ───────────────────────────────────────────────────────────
  const clinicCat = await prisma.businessCategory.findUnique({ where: { key: "clinic" } });
  if (clinicCat) {
    const clinic = await prisma.business.upsert({
      where: { slug: "demo-clinic" },
      create: {
        slug: "demo-clinic",
        name: "Singh Family Clinic",
        categoryId: clinicCat.id,
        isActive: true,
        timezone: "Asia/Kolkata",
        plan: SubscriptionPlan.FREE,
        planExpiresAt: null,
        phone: "+919876543211",
      },
      update: {
        name: "Singh Family Clinic",
        plan: SubscriptionPlan.FREE,
        planExpiresAt: null,
        isActive: true,
      },
    });
    await ensureBusinessHours(clinic.id);

    await ensureDemoUser({
      username: "demo_clinic",
      phone: "+919876543211",
      password,
      businessId: clinic.id,
      name: "Clinic Reception",
    });

    const drMishra = await ensureStaffDoctor(
      clinic.id,
      "dr_mishra",
      "Dr. R.K. Mishra",
      "Dr.",
      "General Physician",
      50000,
    );
    await ensureStaffDoctor(
      clinic.id,
      "dr_singh",
      "Dr. Priya Singh",
      "Dr.",
      "Pediatrician",
      40000,
    );

    let consultSvc = await prisma.service.findFirst({
      where: { businessId: clinic.id, name: "Consultation" },
    });
    if (!consultSvc) {
      consultSvc = await prisma.service.create({
        data: {
          businessId: clinic.id,
          name: "Consultation",
          durationMin: 15,
          priceCents: 50000,
          isActive: true,
        },
      });
    }

    const patients = [
      { name: "Amit Kumar", phone: "919811110001" },
      { name: "Sunita Devi", phone: "919811110002" },
      { name: "Rahul Sharma", phone: "919811110003" },
      { name: "Pooja Yadav", phone: "919811110004" },
    ];

    const queueSpec = [
      { idx: 0, status: QueueStatus.COMPLETED, payment: ClinicPaymentStatus.PAID_CASH },
      { idx: 1, status: QueueStatus.IN_CONSULTATION, payment: ClinicPaymentStatus.PENDING },
      { idx: 2, status: QueueStatus.WAITING, payment: ClinicPaymentStatus.PENDING },
      { idx: 3, status: QueueStatus.WAITING, payment: ClinicPaymentStatus.PENDING },
    ] as const;

    for (let i = 0; i < patients.length; i++) {
      const p = patients[i];
      const spec = queueSpec[i];
      let customer = await prisma.customer.findFirst({
        where: { businessId: clinic.id, phone: p.phone },
      });
      if (!customer) {
        customer = await prisma.customer.create({
          data: { businessId: clinic.id, name: p.name, phone: p.phone },
        });
      }
      const tokenNumber = i + 1;
      const startAt = new Date(dayStart.getTime() + (9 * 60 + i * 20) * 60_000);
      const endAt = new Date(startAt.getTime() + 15 * 60_000);
      const existingAppt = await prisma.appointment.findFirst({
        where: {
          businessId: clinic.id,
          customerId: customer.id,
          startAt: { gte: dayStart },
          tokenNumber,
        },
      });
      if (!existingAppt) {
        await prisma.appointment.create({
          data: {
            businessId: clinic.id,
            customerId: customer.id,
            serviceId: consultSvc.id,
            staffId: drMishra.id,
            status:
              spec.status === QueueStatus.COMPLETED
                ? AppointmentStatus.COMPLETED
                : AppointmentStatus.CONFIRMED,
            startAt,
            endAt,
            tokenNumber,
            bookingType: i === 0 ? BookingType.WALK_IN : BookingType.WALK_IN,
            queueStatus: spec.status,
            paymentStatus: spec.payment,
            source: "APP",
          },
        });
      }
    }

    console.log("Clinic demo: phone 9876543211 / password123 → /demo-clinic");
  }

  // ── Coaching demo ─────────────────────────────────────────────────────────
  const coachingCat = await prisma.businessCategory.findUnique({ where: { key: "coaching" } });
  if (coachingCat) {
    const coaching = await prisma.business.upsert({
      where: { slug: "demo-coaching" },
      create: {
        slug: "demo-coaching",
        name: "Darbhanga Career Academy",
        categoryId: coachingCat.id,
        isActive: true,
        timezone: "Asia/Kolkata",
        plan: SubscriptionPlan.FREE,
        planExpiresAt: null,
        phone: "+919876543212",
      },
      update: {
        plan: SubscriptionPlan.FREE,
        planExpiresAt: null,
        isActive: true,
      },
    });
    await ensureBusinessHours(coaching.id);

    const admin = await ensureDemoUser({
      username: "demo_coaching",
      phone: "+919876543212",
      password,
      businessId: coaching.id,
      name: "Academy Admin",
    });

    await prisma.staffProfile.upsert({
      where: { userId: admin.id },
      create: { userId: admin.id, businessId: coaching.id, title: "Director", isAvailable: true },
      update: { isAvailable: true },
    });

    const stream = await prisma.stream.upsert({
      where: { businessId_key: { businessId: coaching.id, key: CoachingStreamKey.JEE } },
      create: {
        businessId: coaching.id,
        key: CoachingStreamKey.JEE,
        name: "IIT-JEE",
        sortOrder: 0,
        isActive: true,
      },
      update: { isActive: true },
    });

    let course = await prisma.course.findFirst({
      where: { businessId: coaching.id, streamId: stream.id, name: "Class 12 Integrated" },
    });
    if (!course) {
      course = await prisma.course.create({
        data: {
          businessId: coaching.id,
          streamId: stream.id,
          name: "Class 12 Integrated",
          isActive: true,
        },
      });
    }

    let batch = await prisma.batch.findFirst({
      where: { businessId: coaching.id, courseId: course.id, name: "Morning Batch A" },
    });
    if (!batch) {
      batch = await prisma.batch.create({
        data: {
          businessId: coaching.id,
          courseId: course.id,
          name: "Morning Batch A",
          roomNumber: "101",
          feesAmountCents: 250000,
          startTime: "08:00",
          endTime: "10:00",
          daysOfWeek: ["MON", "TUE", "WED", "THU", "FRI", "SAT"],
          isActive: true,
        },
      });
    }

    const roster = [
      { name: "Aditya Kumar", parentPhone: "919822220001", paid: true },
      { name: "Neha Singh", parentPhone: "919822220002", paid: false },
      { name: "Rohan Das", parentPhone: "919822220003", paid: false },
      { name: "Kavya Mishra", parentPhone: "919822220004", paid: true },
      { name: "Vikash Jha", parentPhone: "919822220005", paid: false },
    ];

    for (const s of roster) {
      let student = await prisma.student.findFirst({
        where: { businessId: coaching.id, name: s.name },
      });
      if (!student) {
        student = await prisma.student.create({
          data: {
            businessId: coaching.id,
            name: s.name,
            parentPhone: s.parentPhone,
            parentName: "Parent",
            classGrade: "12",
            batchId: batch.id,
            batch: batch.name,
            course: course.name,
            status: StudentStatus.ACTIVE,
            isActive: true,
          },
        });
      } else {
        await prisma.student.update({
          where: { id: student.id },
          data: { batchId: batch.id, parentPhone: s.parentPhone },
        });
      }

      await prisma.batchEnrollment.upsert({
        where: { studentId_batchId: { studentId: student.id, batchId: batch.id } },
        create: {
          studentId: student.id,
          batchId: batch.id,
          status: EnrollmentStatus.ACTIVE,
        },
        update: { status: EnrollmentStatus.ACTIVE },
      });

      const dueDate = new Date();
      dueDate.setDate(10);
      const feeExisting = await prisma.feeRecord.findFirst({
        where: { studentId: student.id, month, batchId: batch.id },
      });
      if (!feeExisting) {
        await prisma.feeRecord.create({
          data: {
            businessId: coaching.id,
            studentId: student.id,
            batchId: batch.id,
            amountCents: batch.feesAmountCents ?? 250000,
            paidAmountCents: s.paid ? batch.feesAmountCents ?? 250000 : 0,
            isFullyPaid: s.paid,
            month,
            dueDate,
            courseName: course.name,
          },
        });
      }

      await prisma.studentAttendance.upsert({
        where: { studentId_dateISO: { studentId: student.id, dateISO: todayISO } },
        create: { studentId: student.id, dateISO: todayISO, present: s.paid },
        update: { present: s.paid },
      });
    }

    console.log("Coaching demo: phone 9876543212 / password123 → /demo-coaching");
  }

  await prisma.business.updateMany({
    data: { plan: SubscriptionPlan.FREE, planExpiresAt: null },
  });

  console.log("Live demo accounts seeded (clinic, coaching, salon). All tenants set to active Free.");
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
            features: ["Unlimited bookings", "Health score", "Reactivation", "Coaching module", "Fee tracking", "WA templates"],
            cta: "Try Plus",
            href: "/signup",
            highlighted: true,
          },
          {
            name: "Pro",
            price: "₹999",
            period: "per month",
            features: ["Everything in Plus", "Advanced analytics", "AI guide", "Export tools", "API access", "Priority support"],
            cta: "Go Pro",
            href: "/signup",
            highlighted: false,
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
      key: "wa.clinic_followup",
      locale: "en",
      group: "wa_templates",
      label: "Clinic Follow-up Reminder (7/15/30/90 days)",
      value:
        "Hi {customerName}! 👋\n\nIt has been {days} days since your visit at *{businessName}*.\n\n{doctorLine}Please book your follow-up visit:\n{bookingLink}",
    },
    {
      key: "wa.clinic_followup",
      locale: "hi",
      group: "wa_templates",
      label: "Clinic Follow-up (Hindi)",
      value:
        "नमस्ते {customerName}! 👋\n\n*{businessName}* में visit को {days} din ho gaye.\n\n{doctorLine}Follow-up ke liye book karein:\n{bookingLink}",
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

    // ── Landing extra keys ───────────────────────────────────────────────
    {
      key: "landing.whatsapp_number",
      locale: "en",
      group: "landing",
      label: "WhatsApp CTA phone number (digits only, with country code)",
      value: "917500002221",
    },

    // ── Platform (Super Admin — global settings) ───────────────────────
    {
      key: "platform.contact_phone",
      locale: "en",
      group: "platform",
      label: "Support / demo call number (10 digits, no +91)",
      value: "7500002221",
    },
    {
      key: "platform.whatsapp_number",
      locale: "en",
      group: "platform",
      label: "WhatsApp number (digits with country code, e.g. 917500002221)",
      value: "917500002221",
    },
    {
      key: "platform.darbhanga_banner",
      locale: "en",
      group: "platform",
      label: "Home page Darbhanga banner text",
      value: "📍 Darbhanga? → WhatsApp Pack — teen cheez, paanch minute, ₹0",
    },
    {
      key: "platform.share_template",
      locale: "en",
      group: "platform",
      label: "Onboarding share message ({shopName}, {link})",
      value:
        "नमस्ते! {shopName} पर online booking शुरू हो गई है।\n\nLink: {link}\n\nQR scan करके book करें — कोई app नहीं चाहिए।",
    },
    {
      key: "platform.stats",
      locale: "en",
      group: "platform",
      label: "Landing stats bar (JSON [{n,label}])",
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
      label: "Landing categories (JSON array)",
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
      label: "Landing testimonials (JSON array)",
      value: JSON.stringify([
        {
          name: "Rakesh Kumar",
          business: "Raj Hair Studio",
          city: "Darbhanga",
          text: "पहले WhatsApp पर manually booking लेता था, बहुत confusion होती थी। अब सब system में है, missed bookings बंद हो गए।",
        },
        {
          name: "Dr. Priya Singh",
          business: "Singh Clinic",
          city: "Laheriasarai",
          text: "Patients को automatically reminder जातa है। No-show 60% कम हो गए।",
        },
        {
          name: "Amit Jha",
          business: "Success Coaching Center",
          city: "Darbhanga",
          text: "Students की fees और attendance दोनों एक जगह। Parents को WhatsApp reminders automatically जाते हैं।",
        },
      ]),
    },
    {
      key: "platform.how_it_works",
      locale: "en",
      group: "platform",
      label: "Landing how-it-works steps (JSON array)",
      value: JSON.stringify([
        { step: "1", title: "Business बनाएं", desc: "Category चुनें — 2 minute setup।", icon: "🏪" },
        { step: "2", title: "Booking link share करें", desc: "QR print या WhatsApp link।", icon: "📱" },
        { step: "3", title: "WhatsApp से manage करें", desc: "Confirmations और reminders automatic।", icon: "✅" },
      ]),
    },
    {
      key: "platform.before_after",
      locale: "en",
      group: "platform",
      label: "Landing before/after lists (JSON {before[], after[]})",
      value: JSON.stringify({
        before: [
          "WhatsApp पर हर booking manually",
          "Reminder भूल जाते थे",
          "Customer का record नहीं",
          "Payment track नहीं होती",
          "Staff को काम याद दिलाना",
        ],
        after: [
          "Online booking link से auto",
          "WhatsApp reminders automatic",
          "पूरा CRM एक जगह",
          "Payment verify हो जाती है",
          "Staff को notifications",
        ],
      }),
    },

    // ── Darbhanga launch pack (Super Admin) ─────────────────────────────
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
      value:
        "CRM नहीं। ERP नहीं। सिर्फ booking link, WhatsApp reminder, aur customer list — ek bundle mein।",
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
      label: "Bundle packs (JSON — salon/clinic/coaching)",
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
      label: "How it works steps (JSON [{n,t,d}])",
      value: JSON.stringify([
        { n: "1", t: "Mobile se signup", d: "OTP aayega। Shop ka naam aur pack chuno।" },
        { n: "2", t: "Link share karo", d: "WhatsApp group, shop board, ya QR print।" },
        { n: "3", t: "Booking aati hai", d: "Confirm + reminder automatic। Customer list ready।" },
      ]),
    },
    {
      key: "darbhanga.testimonial.quote",
      locale: "hi",
      group: "darbhanga",
      label: "Testimonial quote",
      value:
        "Pehle WhatsApp pe manually booking leta tha। Ab link share karta hoon — sab system mein। Missed booking band।",
    },
    {
      key: "darbhanga.testimonial.author",
      locale: "en",
      group: "darbhanga",
      label: "Testimonial author line",
      value: "— Rakesh, Raj Hair Studio, Darbhanga",
    },
    {
      key: "darbhanga.wa_demo_message",
      locale: "en",
      group: "darbhanga",
      label: "WhatsApp demo prefill message",
      value: "नमस्ते, Darbhanga WhatsApp Pack demo chahiye — salon/clinic/coaching. Kaise shuru karun?",
    },
    {
      key: "darbhanga.seo.title",
      locale: "en",
      group: "darbhanga",
      label: "SEO title",
      value: "दरभंगा WhatsApp Pack — Booking + Reminder + Customer List | BookNow",
    },
    {
      key: "darbhanga.seo.description",
      locale: "en",
      group: "darbhanga",
      label: "SEO description",
      value:
        "Darbhanga ke salon, clinic, coaching ke liye ek bundle: booking link, WhatsApp reminder, customer list. ₹0, 5 minute setup.",
    },

    // ── PWA / app wrapper (Super Admin) ────────────────────────────────
    {
      key: "pwa.name",
      locale: "en",
      group: "pwa",
      label: "App full name (manifest)",
      value: "BookNow — WhatsApp Business Assistant",
    },
    {
      key: "pwa.short_name",
      locale: "en",
      group: "pwa",
      label: "App short name (home screen)",
      value: "BookNow",
    },
    {
      key: "pwa.description",
      locale: "en",
      group: "pwa",
      label: "App description",
      value: "Booking, WhatsApp reminders, and customer list for Indian businesses.",
    },
    {
      key: "pwa.theme_color",
      locale: "en",
      group: "pwa",
      label: "Theme color (hex)",
      value: "#059669",
    },
    {
      key: "pwa.background_color",
      locale: "en",
      group: "pwa",
      label: "Splash background (hex)",
      value: "#fafafa",
    },
    {
      key: "pwa.start_url",
      locale: "en",
      group: "pwa",
      label: "App start URL path",
      value: "/app?source=installed",
    },

    {
      key: "city.laheriasarai.subtext",
      locale: "en",
      group: "city",
      label: "Laheriasarai Page — Subtext",
      value:
        "Salons, clinics, and coaching centers in Laheriasarai are using BookNow to manage bookings and send WhatsApp reminders automatically.",
    },
    {
      key: "city.laheriasarai.subtext",
      locale: "hi",
      group: "city",
      label: "Laheriasarai Page — Subtext (Hindi)",
      value:
        "Laheriasarai के salons, clinics और coaching centers BookNow use कर रहे हैं — bookings manage करने और WhatsApp reminders भेजने के लिए।",
    },
    {
      key: "city.mohali.subtext",
      locale: "en",
      group: "city",
      label: "Mohali Page — Subtext",
      value:
        "Businesses in Mohali are using BookNow for appointment scheduling, WhatsApp automation, and customer retention.",
    },
    {
      key: "city.mohali.headline",
      locale: "hi",
      group: "city",
      label: "Mohali Page — Headline (Hindi)",
      value: "Mohali के businesses के लिए WhatsApp Booking System",
    },
    {
      key: "city.laheriasarai.headline",
      locale: "hi",
      group: "city",
      label: "Laheriasarai Page — Headline (Hindi)",
      value: "Laheriasarai के businesses के लिए WhatsApp Booking System",
    },
    {
      key: "city.patna.headline",
      locale: "en",
      group: "city",
      label: "Patna Page — Headline",
      value: "WhatsApp Booking System for Patna Businesses",
    },
    {
      key: "city.patna.headline",
      locale: "hi",
      group: "city",
      label: "Patna Page — Headline (Hindi)",
      value: "पटना के व्यवसायों के लिए WhatsApp Booking",
    },
    {
      key: "city.patna.subtext",
      locale: "en",
      group: "city",
      label: "Patna Page — Subtext",
      value:
        "Salons, clinics, coaching centers and home services in Patna use BookNow for WhatsApp bookings and automated reminders.",
    },
    {
      key: "city.patna.subtext",
      locale: "hi",
      group: "city",
      label: "Patna Page — Subtext (Hindi)",
      value:
        "पटना के salons, clinics, coaching centers BookNow use कर रहे हैं — WhatsApp booking और automatic reminders के लिए।",
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
  await seedSubcategories();
  await seedActivationCodes();
  await seedDemoTenants();
  await seedSuperAdmin();
  await seedDemoBusiness();
  await seedLiveDemoAccounts();
  await seedSiteContent();
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
