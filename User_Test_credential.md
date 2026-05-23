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
- **Hub** (`/app`): KPI cards (tap to deep-link), schedule strip, Leads & tickets, booking link card
- **Analytics** (`/app/analytics`): 7d/30d/90d toggle; daily bookings bar chart; revenue bar chart; top services pie chart
- **Bookings** (`/app/bookings`): Day / list view; confirm a booking → WhatsApp confirmation queued; URL params `?date`, `?view`, `?status`
- **WhatsApp** (`/app/whatsapp`): Connect QR → scan with phone → verify CONNECTED status
- **Inbox** (`/app/inbox`): WhatsApp conversation list; open a thread; use Quick Replies
- **Customers** (`/app/customers`): List, filters, customer detail timeline
- **Leads** (`/app/leads`): Pipeline view; change stage; tap **View** to scroll-highlight from Hub
- **Support** (`/app/support`): Ticket list; assign staff; change status
- **Payments** (`/app/payments`): Verify UPI or cash payments
- **Services** (`/app/services`): Add / edit services and pricing
- **Staff** (`/app/staff`): Add / edit staff members
- **Templates** (`/app/templates`): Create quick-reply templates for WhatsApp
- **Settings** (`/app/settings`): Business profile, working hours, notifications
- **Booking link card** on Hub: Copy, Share, Print QR; **Create new booking link** rotates slug

---

## 3. Customer (Public Booking)

Self-service booking page. No login required.

| | Production | Local |
|-|------------|-------|
| **Public URL** | [https://wa-booking-web.vercel.app/demo-salon](https://wa-booking-web.vercel.app/demo-salon) | http://127.0.0.1:3001/demo-salon |

**What to test:**
- Select a service (e.g., "Classic Haircut" ₹500, "Beard Trim" ₹200, "Luxury Facial" ₹1200)
- Pick a date (7-day row) and available time slot
- Enter name and phone number to confirm booking
- **Step 4 — Success screen**: Confirm "You're booked!" appears
- Tap **Share on WhatsApp** → opens WhatsApp with pre-filled message (viral loop)
- As admin: confirm new booking appears in Hub schedule + Bookings calendar
- If WA worker is connected: customer should receive a WhatsApp confirmation automatically

---

## 4. New Account (OTP — dev stub)

| | Production | Local |
|-|------------|-------|
| **Sign up URL** | [https://wa-booking-web.vercel.app/signup](https://wa-booking-web.vercel.app/signup) | http://127.0.0.1:3001/signup |

**Flow:** Enter 10-digit Indian mobile → **Get verification code** → enter **`1234`** (dev stub) → logged in → complete **Onboarding** if prompted.

> OTP SMS is not wired in production. The code `1234` always works. Wire Twilio or MSG91 for real signups.

---

## 5. WhatsApp Worker Test

Once Render finishes building (~5-10 min from first deploy):

1. Log in as Business Admin → go to `/app/whatsapp`
2. Click **Connect WhatsApp**
3. Scan the QR code with your phone
4. Status should change to **CONNECTED**
5. Make a booking at `/demo-salon` — the customer should receive a WhatsApp confirmation

**Worker health check:**
- WA worker: [https://wa-worker-dewp.onrender.com/health](https://wa-worker-dewp.onrender.com/health)
- BullMQ worker: [https://bullmq-worker-u2sl.onrender.com/](https://bullmq-worker-u2sl.onrender.com/)

---

## 6. SEO & Marketing Pages

| URL (Production) | What to check |
|------------------|---------------|
| [https://wa-booking-web.vercel.app/](https://wa-booking-web.vercel.app/) | Dynamic hero title, features, pricing, FAQ — all from DB; language switcher (EN ↔ हिं) |
| [https://wa-booking-web.vercel.app/city/darbhanga](https://wa-booking-web.vercel.app/city/darbhanga) | City headline + subtext from SiteContent; JSON-LD schema |
| [https://wa-booking-web.vercel.app/city/laheriasarai](https://wa-booking-web.vercel.app/city/laheriasarai) | City page |
| [https://wa-booking-web.vercel.app/city/mohali](https://wa-booking-web.vercel.app/city/mohali) | City page |
| [https://wa-booking-web.vercel.app/city/patna](https://wa-booking-web.vercel.app/city/patna) | City page |
| [https://wa-booking-web.vercel.app/city/muzaffarpur](https://wa-booking-web.vercel.app/city/muzaffarpur) | City page |
| [https://wa-booking-web.vercel.app/sitemap.xml](https://wa-booking-web.vercel.app/sitemap.xml) | Static routes + 5 city URLs |
| [https://wa-booking-web.vercel.app/robots.txt](https://wa-booking-web.vercel.app/robots.txt) | Allow public, disallow `/app/`, `/api/` |

---

## 7. API Health & Quick Checks

| Check | Command / URL |
|-------|---------------|
| API health | [https://wa-booking-api.vercel.app/health](https://wa-booking-api.vercel.app/health) |
| WA worker health | [https://wa-worker-dewp.onrender.com/health](https://wa-worker-dewp.onrender.com/health) |
| Super admin login | `curl -X POST https://wa-booking-api.vercel.app/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"Test@123"}'` |
| Redis connectivity | Check API health response for Redis errors in Render logs |

---

## Developer Notes

**Production infrastructure:**
- Vercel: web + API auto-deploy on push to `main`
- Render: WA worker + BullMQ worker auto-deploy on push to `main`
- Redis: Render Key Value (Singapore region), external TLS URL set on Vercel API
- Neon Postgres: 6 migrations, 38 SiteContent keys, demo business + super admin seeded
- GitHub: https://github.com/SauravPriyadarshy/wa-booking

**First-time WhatsApp setup (after Render build completes):**
1. Go to `/app/whatsapp` as Business Admin
2. Click Connect → scan QR with phone
3. Done — automation runs for all future bookings

**Local dev:**
- Ensure API is running on port `3000` and Web on `3001`
- Run `npm run db:seed` in `apps/api/` if demo data is missing
- Run `npm run worker:dev` in `apps/api/` to process BullMQ jobs
- WhatsApp worker must be running and connected to send real messages
- OTP code is always `1234` in dev (SMS gateway not wired)
- Language switcher sets a `locale` cookie (`en` or `hi`)
