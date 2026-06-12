# WhatsApp Business Assistant — Product & Demo Guide

Comprehensive overview of platform functionality, user flows, and design philosophy. For non-technical users, stakeholders, and demo presentations.

**Related:** [README](./README.md) · [PLANS.md](./PLANS.md) · [Demo credentials](./User_Test_credential.md) · [UAT checklist](./docs/USER_TEST.md)

> **LIVE:** [wa-booking-web.vercel.app](https://wa-booking-web.vercel.app) · [wa-booking-api.vercel.app](https://wa-booking-api.vercel.app)

---

## 1. Product Overview

**WhatsApp Business Assistant** — a Business Growth Assistant for Indian service businesses: coaching centers, clinics, salons, home services, consultants, and more.

### Core Value Proposition
- **WhatsApp Integration** — Booking confirmations and reminders sent automatically.
- **Self-Service Booking** — Customers book from a link or QR — no app download.
- **Unified CRM** — Every interaction (chats, bookings, payments) in one timeline.
- **Mobile-First** — Optimised for business owners on budget Android phones.
- **Bilingual** — English and Hindi/Hinglish (EN · हिं switcher).
- **Try Before Signup** — `/business-success` interactive demo with API + offline fallback.

---

## 2. User Roles

### Customer (External)
- Scans QR or clicks link → selects service → picks time → confirms → gets WhatsApp message.
- No account required.

### New Business Owner
- **Signup:** Mobile OTP on `/signup` (WhatsApp) → set password → **5-step onboarding** → Hub.
- **Login:** Mobile + password on `/login` (OTP not needed daily).
- **Forgot password:** `/forgot-password` — WhatsApp OTP + new password.
- **Fast path (Darbhanga):** `/signup?ref=darbhanga&pack=salon` — 2-step setup.
- **Activation code:** Enter `PLUS90` during onboarding to unlock Plus features.
- **Specializations:** Category dropdown auto-loads subcategories; reload syncs via API if empty.

### Business Admin
- **Hub** is the command center — today's bookings, health score (Plus+), revenue leakage (Plus+).
- **Reactivation** (`/app/reactivation`) — one-click WhatsApp to inactive customers (Plus+).
- **Coaching** — students, fees, attendance when category = coaching and plan = Plus+.

### Super Admin
- Manages all businesses, feature flags, site content, and **activation codes** at `/app/superadmin/plans`.

---

## 3. Key Features

### Business Success Demo (`/business-success`)
- **No signup required.** Pick business type (coaching, clinic, salon, etc.).
- Interactive simulator: stats, health score, revenue leakage, psychology engine, today's preview.
- Powered by isolated demo tenant data — never mixed with live businesses.
- **Offline fallback:** static simulators if API is unreachable (local dev without API).
- **AI Business Guide** (💬 floating button) answers plan/setup questions instantly.

### Landing Page (`/`)
- Compact mobile-first layout: Hero → Categories → Benefits → Business Success CTA → Pricing → Testimonials → FAQ.
- Primary CTA: **Start free** · Secondary: **See How This Helps My Business** → `/business-success`.
- 3-tier pricing: Free / Plus / Pro.

### Hub (Today's Overview)
- KPI cards with deep links to bookings, payments, customers.
- **Plan usage bars** on Free plan (customers, staff, bookings/month).
- **Health Score** widget (Plus+) — व्यवसाय स्थिति रिपोर्ट.
- **Revenue Leakage** widget (Plus+) — संभावित छूटी हुई कमाई.
- Booking link card: copy, share, print QR.

### Customer Reactivation (`/app/reactivation`) — Plus+
- 30 / 60 / 90 day inactive customer buckets.
- One-click WhatsApp reminder, offer, or follow-up scheduling.

### Coaching Module — Plus+
- `/app/students` — student list with attendance % and fee badges.
- `/app/fees` — fee dashboard with overdue tracking.
- `/app/students/attendance` — bulk attendance marking.

### Clinic Module
- `/app/queue` — reception queue (current, waiting, completed).
- Patient CRM, follow-ups, WhatsApp reminders.

### Retention Automation (WhatsApp)
1. Booking confirmed → instant WhatsApp to customer.
2. 24h reminder → queued at booking creation.
3. Post-visit follow-up → 24h after COMPLETED.
4. Inactive recovery → daily cron for 45+ day inactive customers.

All templates editable via Super Admin → Content Editor.

---

## 4. Pricing Plans

| Plan | Price | Includes |
|------|-------|----------|
| **Free** | ₹0 | 1 staff · 50 customers · 50 bookings/mo · basic CRM · Hindi |
| **Plus** | Paid | Unlimited customers/bookings · health score · reactivation · coaching · fees |
| **Pro** | Paid | Everything Plus · advanced analytics · AI guide · exports · API |

Upgrade via activation codes (`PLUS90`, `PRO60`) or Super Admin assignment.

---

## 5. Demo Script (15 minutes)

1. **Business Success:** Open [wa-booking-web.vercel.app/business-success](https://wa-booking-web.vercel.app/business-success) → pick Coaching → show simulator.
2. **AI Guide:** Tap 💬 → ask "Which plan should I choose?" → instant answer.
3. **Signup:** `/signup` → OTP `1234` → 7-step onboarding with category + subcategory.
4. **Hub:** Show KPI cards, usage bars (Free), upgrade banner for health score.
5. **Booking link:** Copy URL → open in incognito → complete a test booking.
6. **WhatsApp:** `/app/whatsapp` → connect QR → show CONNECTED status.
7. **Reactivation:** Redeem `PLUS90` → open `/app/reactivation` → show 30-day bucket.
8. **Super Admin:** Login `admin`/`Test@123` → `/app/superadmin/plans` → create activation code.

---

## 6. Design Philosophy

- **Mobile-first:** Bottom nav, 44px tap targets, one-thumb reachable.
- **TAP, don't TYPE:** Dropdowns preferred over text inputs.
- **Date on line 1, time on line 2** — Hub and schedule pattern.
- **Emerald + Zinc palette** — trust and professionalism.
- **Natural language** — Bihar-friendly Hindi/Hinglish, not machine-translated.
