# User Test Credentials (Demo)

Credentials and quick entry points for testing the WhatsApp-first Booking + CRM platform.

For a step-by-step QA checklist, use [`docs/USER_TEST.md`](./docs/USER_TEST.md).

---

## Base URLs

| Environment | URL |
|-------------|-----|
| **Production (live)** | **[https://wa-booking-web.vercel.app](https://wa-booking-web.vercel.app)** |
| Local dev | `http://127.0.0.1:3001` |
| Production API | `https://wa-booking-api.vercel.app` |
| Local API | `http://localhost:3000` |
| WA Worker (Render) | `https://wa-worker-dewp.onrender.com` |
| BullMQ Worker (Render) | `https://bullmq-worker-u2sl.onrender.com` |

---

## 1. Super Admin (Global Dashboard)

Access all businesses, manage categories, edit all site content, and configure global feature flags.

| | Production | Local |
|-|------------|-------|
| **Login URL** | [https://wa-booking-web.vercel.app/login](https://wa-booking-web.vercel.app/login) | http://127.0.0.1:3001/login |
| **Username** | `super` | `super` |
| **Password** | `Test@123` | `Test@123` |

**What to test:**
- `/app/superadmin/businesses` — create new business + admin, list all businesses
- `/app/superadmin/features` — toggle feature flags per business (e.g. enable WhatsApp, analytics)
- `/app/superadmin/content` — **Content Editor** (landing page text, SEO metadata, WhatsApp templates, city pages, onboarding — all editable, changes live within 5 min)
  - Filter by group (Landing Page, SEO, WhatsApp Templates, City Pages, Onboarding) and language (EN, HI)
  - Edit a hero title → Save → visit `/` to confirm change

**To add a new service provider (doctor, spa, etc.):**
1. Login as Super Admin → click yellow "Super Admin Panel" banner
2. Go to `/app/superadmin/businesses`
3. Fill Business Name, Category, Phone, Admin Username, Password → Create

---

## 2. Business Admin (Demo Salon & Spa)

Manage services, staff, bookings, and customer relationships for a specific business.

| | Production | Local |
|-|------------|-------|
| **Login URL** | [https://wa-booking-web.vercel.app/login](https://wa-booking-web.vercel.app/login) | http://127.0.0.1:3001/login |
| **Username** | `demo_admin` | `demo_admin` |
| **Password** | `password123` | `password123` |
| **Business Phone** | `+919122000751` | — |

**What to test:**
- **Hub** (`/app`): KPI cards, schedule strip, Leads & tickets, booking link card
- **Analytics** (`/app/analytics`): 7d/30d/90d toggle; daily bookings bar chart; revenue; top services
- **Bookings** (`/app/bookings`): Day / list view; confirm a booking → customer gets WhatsApp confirmation automatically
- **WhatsApp** (`/app/whatsapp`): Connect QR → scan with phone → verify CONNECTED status; new bookings send alerts to `+919122000751`
- **Provider confirm via WhatsApp**: When a new booking arrives, provider gets a message — reply `CONFIRM <bookingId>` or `CANCEL <bookingId>` to act directly from WhatsApp
- **Inbox** (`/app/inbox`): WhatsApp conversation list; open a thread; use Quick Replies
- **Customers** (`/app/customers`): List, filters, customer detail timeline
- **Leads** (`/app/leads`): Pipeline view; change stage
- **Support** (`/app/support`): Ticket list; assign staff; change status
- **Payments** (`/app/payments`): Verify UPI or cash payments
- **Services** (`/app/services`): Add / edit services and pricing
- **Staff** (`/app/staff`): Add / edit staff members
- **Templates** (`/app/templates`): WhatsApp quick-reply templates
- **Settings → Business Profile** (`/app/settings/profile`): Update name, WhatsApp number, booking URL slug, timezone
- **Settings → Hours** (`/app/settings`): Configure working days and hours
- **Booking link card** on Hub: Copy, Share, Print QR

---

## 3. Customer (Public Booking)

Self-service booking page. No login required.

| | Production | Local |
|-|------------|-------|
| **Public URL** | [https://wa-booking-web.vercel.app/demo-salon](https://wa-booking-web.vercel.app/demo-salon) | http://127.0.0.1:3001/demo-salon |

**What to test:**
- Select a service (Haircut, Beard, Facial)
- Pick a date (7-day row) and available time slot
- Enter name and phone number → confirm booking
- **Success screen**: "You're booked!" with WhatsApp share link
- Customer receives a WhatsApp acknowledgement immediately (if WA worker connected)
- Provider (`+919122000751`) receives new booking alert with CONFIRM/CANCEL instructions
- Reply `CONFIRM <id>` from provider → customer gets confirmed booking WhatsApp message

---

## 4. New Account (OTP — dev stub)

| | Production | Local |
|-|------------|-------|
| **Sign up URL** | [https://wa-booking-web.vercel.app/signup](https://wa-booking-web.vercel.app/signup) | http://127.0.0.1:3001/signup |

**Flow:** Enter 10-digit Indian mobile → **Get verification code** → enter **`1234`** (dev stub) → logged in → complete **Onboarding** if prompted.

> OTP SMS is not wired in production. The code `1234` always works. Wire Twilio or MSG91 for real signups.

---

## 5. WhatsApp Hub — Current State

| Component | Status |
|-----------|--------|
| WA Worker (Render) | ✅ Live — `https://wa-worker-dewp.onrender.com/health` |
| BullMQ Worker (Render) | ✅ Live — `https://bullmq-worker-u2sl.onrender.com/` |
| Keep-alive ping | ✅ API pings worker every 10 min (no sleep on Render free tier) |
| Business phone set | ✅ `+919122000751` |
| WhatsApp session | Scan QR at `/app/whatsapp` to connect |

**WhatsApp automation flow (once connected):**
1. Customer books → customer gets "Booking received" WhatsApp message instantly
2. Provider (`+919122000751`) gets "New Booking!" alert with `CONFIRM <id>` / `CANCEL <id>` instructions
3. Provider replies `CONFIRM abc123` → booking confirmed → customer gets confirmation WhatsApp
4. 24h before appointment → customer gets reminder WhatsApp
5. 24h after visit → customer gets "Hope you enjoyed!" follow-up WhatsApp

**To connect WhatsApp:**
1. Login as `demo_admin` → go to `/app/whatsapp`
2. Click **Get QR / connect** (wait ~20s for QR)
3. Open WhatsApp on `+919122000751` → Settings → Linked Devices → Link a Device → scan QR
4. Status changes to **Connected** ✅

---

## 6. SEO & Marketing Pages

| URL (Production) | What to check |
|------------------|---------------|
| [https://wa-booking-web.vercel.app/](https://wa-booking-web.vercel.app/) | Dynamic hero title, features, pricing, FAQ — all from DB; language switcher (EN ↔ हिं) |
| [https://wa-booking-web.vercel.app/city/darbhanga](https://wa-booking-web.vercel.app/city/darbhanga) | City headline + subtext from SiteContent; JSON-LD schema |
| [https://wa-booking-web.vercel.app/city/laheriasarai](https://wa-booking-web.vercel.app/city/laheriasarai) | City page |
| [https://wa-booking-web.vercel.app/city/mohali](https://wa-booking-web.vercel.app/city/mohali) | City page |
| [https://wa-booking-web.vercel.app/sitemap.xml](https://wa-booking-web.vercel.app/sitemap.xml) | Static routes + city URLs |
| [https://wa-booking-web.vercel.app/robots.txt](https://wa-booking-web.vercel.app/robots.txt) | Allow public, disallow `/app/` |

---

## 7. API Health & Quick Checks

| Check | Command / URL |
|-------|---------------|
| API health | [https://wa-booking-api.vercel.app/health](https://wa-booking-api.vercel.app/health) |
| WA worker health | [https://wa-worker-dewp.onrender.com/health](https://wa-worker-dewp.onrender.com/health) |
| Super admin login | `curl -X POST https://wa-booking-api.vercel.app/auth/login -H "Content-Type: application/json" -d '{"username":"super","password":"Test@123"}'` |
| Business admin login | `curl -X POST https://wa-booking-api.vercel.app/auth/login -H "Content-Type: application/json" -d '{"username":"demo_admin","password":"password123"}'` |
| WA status | `GET /whatsapp/status` (authenticated) |
| Business profile | `GET /settings/profile` (authenticated) |

---

## Developer Notes

**Production infrastructure:**
- Vercel: web + API auto-deploy on push to `main`
- Render: WA worker + BullMQ worker auto-deploy on push to `main`
- Redis: Render Key Value (Singapore region), external TLS URL set on Vercel API
- Neon Postgres: 6 migrations, 40 SiteContent keys seeded (incl. 2 new WA booking templates)
- GitHub: https://github.com/SauravPriyadarshy/wa-booking

**Local dev:**
- Ensure API is running on port `3000` and Web on `3001`
- Run `npm run db:seed` in `apps/api/` if demo data is missing
- Run `npm run worker:dev` in `apps/api/` to process BullMQ jobs
- WhatsApp worker must be running and connected to send real messages
- OTP code is always `1234` in dev (SMS gateway not wired)
