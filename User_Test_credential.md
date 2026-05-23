# User Test Credentials (Demo)

This document provides **credentials** and quick **entry points** for testing the WhatsApp-first Booking + CRM platform.

For a **step-by-step QA checklist**, use **[`docs/USER_TEST.md`](./docs/USER_TEST.md)**.

---

## 🌐 Base URLs

| Environment | URL |
|-------------|-----|
| **Production (live)** | **[https://wa-booking-web.vercel.app](https://wa-booking-web.vercel.app)** |
| Local dev | `http://127.0.0.1:3001` |
| Production API | `https://wa-booking-api.vercel.app` |
| Local API | `http://localhost:3000` |

---

## 1. Super Admin (Global Dashboard)

Access all businesses, manage categories, edit all site content, and configure global feature flags.

| | Production | Local |
|-|------------|-------|
| **Login URL** | [https://wa-booking-web.vercel.app/login](https://wa-booking-web.vercel.app/login) | http://127.0.0.1:3001/login |
| **Username** | `admin` | `admin` |
| **Password** | `Test@123` | `Test@123` |

**What to test:**
- `/app/superadmin/businesses` — list, activate/deactivate businesses
- `/app/superadmin/features` — toggle feature flags per business
- `/app/superadmin/content` — **Content Editor** (landing page text, SEO metadata, WhatsApp templates, city pages, onboarding — all editable, changes live within 5 min)
  - Filter by group (Landing Page, SEO, WhatsApp Templates, City Pages, Onboarding) and language (EN, HI)
  - Edit a hero title → Save → visit `/` to confirm change

---

## 2. Business Admin (Demo Salon & Spa)

Manage services, staff, bookings, and customer relationships for a specific business.

| | Production | Local |
|-|------------|-------|
| **Login URL** | [https://wa-booking-web.vercel.app/login](https://wa-booking-web.vercel.app/login) | http://127.0.0.1:3001/login |
| **Username** | `demo_admin` | `demo_admin` |
| **Password** | `password123` | `password123` |

**What to test:**
- **Hub** (`/app`): KPI cards (tap to deep-link), schedule strip, Leads & tickets (date on line 1, time on line 2; **View** → scroll-highlight), booking link card.
- **Analytics** (`/app/analytics`): 7d/30d/90d toggle; daily bookings bar chart; revenue bar chart; top services pie chart; suggestion chips.
- **Bookings** (`/app/bookings`): Day / list view; confirm a booking → WhatsApp confirmation queued; URL params `?date`, `?view`, `?status`.
- **Inbox** (`/app/inbox`): WhatsApp conversation list; open a thread; use Quick Replies.
- **Customers** (`/app/customers`): List, filters, customer detail timeline.
- **Leads** (`/app/leads`): Pipeline view; change stage; tap **View** to scroll-highlight from Hub.
- **Support** (`/app/support`): Ticket list; assign staff; change status.
- **Payments** (`/app/payments`): Verify UPI or cash payments.
- **Services** (`/app/services`): Add / edit services and pricing.
- **Staff** (`/app/staff`): Add / edit staff members.
- **Templates** (`/app/templates`): Create quick-reply templates for WhatsApp.
- **Settings** (`/app/settings`): Business profile, working hours, notifications.
- **Booking link card** on Hub: Copy, Share, Print QR; **Create new booking link** (admin only) rotates slug.

---

## 3. Customer (Public Booking)

Self-service booking page. No login required.

| | Production | Local |
|-|------------|-------|
| **Public URL** | [https://wa-booking-web.vercel.app/demo-salon](https://wa-booking-web.vercel.app/demo-salon) | http://127.0.0.1:3001/demo-salon |

**What to test:**
- Select a service (e.g., "Classic Haircut" ₹500, "Beard Trim" ₹200, "Luxury Facial" ₹1200).
- Pick a date (7-day row) and available time slot.
- Enter name and phone number to confirm booking.
- **Step 4 — Success screen**: Confirm "You're booked!" appears.
- Tap **Share on WhatsApp** → opens WhatsApp with pre-filled message (viral loop).
- As admin: confirm new booking appears in Hub schedule + Bookings calendar.
- **SEO**: Check `<title>` and JSON-LD `LocalBusiness` in page source.

---

## 4. New Account (OTP — dev stub)

| | Production | Local |
|-|------------|-------|
| **Sign up URL** | [https://wa-booking-web.vercel.app/signup](https://wa-booking-web.vercel.app/signup) | http://127.0.0.1:3001/signup |

**Flow:** Enter 10-digit Indian mobile → **Get verification code** → enter **`1234`** (dev stub; SMS not wired) → logged in → complete **Onboarding** if prompted.

> ⚠️ OTP SMS is not wired in production. The code `1234` always works in dev. To enable real signups, wire Twilio or MSG91.

---

## 5. SEO & Marketing Pages

| URL (Production) | URL (Local) | What to check |
|------------------|-------------|---------------|
| [https://wa-booking-web.vercel.app/](https://wa-booking-web.vercel.app/) | `http://127.0.0.1:3001/` | Dynamic hero title, features, pricing, FAQ — all from DB; language switcher |
| [https://wa-booking-web.vercel.app/city/darbhanga](https://wa-booking-web.vercel.app/city/darbhanga) | `http://127.0.0.1:3001/city/darbhanga` | City headline + subtext from SiteContent; JSON-LD schema |
| [https://wa-booking-web.vercel.app/city/laheriasarai](https://wa-booking-web.vercel.app/city/laheriasarai) | `http://127.0.0.1:3001/city/laheriasarai` | City page |
| [https://wa-booking-web.vercel.app/city/mohali](https://wa-booking-web.vercel.app/city/mohali) | `http://127.0.0.1:3001/city/mohali` | City page |
| [https://wa-booking-web.vercel.app/city/patna](https://wa-booking-web.vercel.app/city/patna) | `http://127.0.0.1:3001/city/patna` | City page |
| [https://wa-booking-web.vercel.app/sitemap.xml](https://wa-booking-web.vercel.app/sitemap.xml) | `http://127.0.0.1:3001/sitemap.xml` | Static routes + 5 city URLs |
| [https://wa-booking-web.vercel.app/robots.txt](https://wa-booking-web.vercel.app/robots.txt) | `http://127.0.0.1:3001/robots.txt` | Allow public, disallow `/app/`, `/api/` |

---

## 6. API Health & Quick Checks

| Check | Production | Local |
|-------|------------|-------|
| Health | [https://wa-booking-api.vercel.app/health](https://wa-booking-api.vercel.app/health) | http://localhost:3000/health |
| Super admin login test | `curl -X POST https://wa-booking-api.vercel.app/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"Test@123"}'` | — |

---

## Developer Notes

**Production:**
- All env vars are set on Vercel. See README.md → "Production environment variables" for the full list.
- Neon Postgres is connected; 38 SiteContent keys seeded, demo business and super admin exist.
- Redis is set to localhost (placeholder) — slot lock degrades gracefully; BullMQ reminders won't run until Upstash is provisioned.
- WhatsApp worker is not deployed — connect manually via `/app/whatsapp` if running locally.

**Local dev:**
- Ensure the API is running on port `3000` and Web on `3001`.
- Run `npm run db:seed` in `apps/api/` if demo data is missing. Creates **38 content keys**, demo business, super admin.
- Run `npm run worker:dev` in `apps/api/` to process BullMQ jobs.
- The WhatsApp worker (`apps/wa-worker`) must be running and connected (`/app/whatsapp`) to send real messages.
- OTP code is always `1234` in dev (SMS gateway not wired).
- Language switcher sets a `locale` cookie (`en` or `hi`); affects landing page content fetched from SiteContent DB.
