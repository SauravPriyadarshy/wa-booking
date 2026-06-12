# User Test Credentials (Demo)

Credentials and quick entry points for testing **WhatsApp Business Assistant**.

For step-by-step QA, use [`docs/USER_TEST.md`](./docs/USER_TEST.md).

---

## Base URLs

| Environment | URL |
|-------------|-----|
| **Production (live)** | [https://wa-booking-web.vercel.app](https://wa-booking-web.vercel.app) |
| **Production API** | [https://wa-booking-api.vercel.app](https://wa-booking-api.vercel.app) |
| Local dev (web) | `http://127.0.0.1:3001` |
| Local dev (API) | `http://localhost:3000` |

---

## 1. Super Admin

| | Production | Local |
|-|------------|-------|
| **Login** | [/login](https://wa-booking-web.vercel.app/login) | `http://127.0.0.1:3001/login` |
| **Username** | `admin` or `super` | same |
| **Password** | `Test@123` | same |

**Test routes:**
- `/app/superadmin/businesses` — create/manage tenants
- `/app/superadmin/plans` — activation codes (`FREE30`, `PLUS90`, `PRO60`)
- `/app/superadmin/content` — SiteContent editor (EN · HI + optional Mai keys)
- `/app/superadmin/features` — feature flags per business

---

## 2. Business Admin (Demo Salon — Free plan)

| | Production | Local |
|-|------------|-------|
| **Login** | [/login](https://wa-booking-web.vercel.app/login) | `http://127.0.0.1:3001/login` |
| **Username** | `demo_admin` | same |
| **Password** | `password123` | same |

**Test on Free plan:**
- Hub shows **usage bars** (customers, staff, bookings/month)
- Health score and revenue leakage show **upgrade banner** (Plus required)
- `/app/reactivation` shows upgrade prompt

**Unlock Plus for testing:**
- During onboarding: enter activation code `PLUS90`
- Super Admin → `/app/superadmin/plans` → assign plan to business

**Key routes:**
- `/app` — Hub (Today Workspace)
- `/app/bookings` — Calendar
- `/app/customers` — CRM with tags
- `/app/reactivation` — Inactive customers (Plus+)
- `/app/whatsapp` — Connect QR
- `/app/onboarding` — 7-step wizard (new accounts)

---

## 3. Customer (Public Booking)

| | Production | Local |
|-|------------|-------|
| **URL** | [/demo-salon](https://wa-booking-web.vercel.app/demo-salon) | `http://127.0.0.1:3001/demo-salon` |

No login. Select service → pick slot → enter name/phone → confirm.

> Demo tenant URLs (`demo-darbhanga-career-academy`, etc.) are **read-only** — booking blocked by design.

---

## 4. New Account (OTP — dev stub)

| | Production | Local |
|-|------------|-------|
| **Signup** | [/signup](https://wa-booking-web.vercel.app/signup) | `http://127.0.0.1:3001/signup` |
| **Delivery** | WhatsApp or Email (user picks on signup) | same |
| **OTP code** | `1234` (always works until SMS gateway wired) | same |

**Onboarding paths:**
- Standard: `/app/onboarding` — 7 steps
- Darbhanga fast: `/signup?ref=darbhanga&pack=salon` — 2 steps

---

## 5. Business Success Demo (no login)

| URL | Purpose |
|-----|---------|
| [/business-success](https://wa-booking-web.vercel.app/business-success) | Pick business type → simulator (API + offline fallback) |
| [/business-success?type=coaching](https://wa-booking-web.vercel.app/business-success?type=coaching) | Direct to coaching demo |

---

## 6. Activation Codes (production seeded)

| Code | Plan | Validity |
|------|------|----------|
| `FREE30` | Free extension | 30 days |
| `PLUS30` | Plus | 30 days |
| `PLUS90` | Plus | 90 days |
| `PRO30` | Pro | 30 days |
| `PRO60` | Pro | 60 days |
| `PRO90` | Pro | 90 days |

Enter during onboarding step 1, or redeem via API `POST /businesses/me/redeem-code`.

---

## 7. SEO & Marketing Pages

| URL | Check |
|-----|-------|
| [/](https://wa-booking-web.vercel.app/) | Compact landing, EN · HI switcher |
| [/business-success](https://wa-booking-web.vercel.app/business-success) | Industry simulator |
| [/darbhanga](https://wa-booking-web.vercel.app/darbhanga) | Darbhanga launch page |
| [/city/darbhanga](https://wa-booking-web.vercel.app/city/darbhanga) | City SEO |
| [/city/samastipur](https://wa-booking-web.vercel.app/city/samastipur) | City SEO |
| [/sitemap.xml](https://wa-booking-web.vercel.app/sitemap.xml) | All public routes |

---

## 8. API Quick Checks

| Check | URL / Command |
|-------|---------------|
| API health | `GET https://wa-booking-api.vercel.app/health` |
| Business Success types | `GET https://wa-booking-api.vercel.app/public/business-success/types` |
| Hub health (auth) | `GET /hub/health` — returns 403 on Free plan |
| Plan usage (auth) | `GET /plans/me` |
| Reactivation (auth) | `GET /hub/reactivation` — Plus+ only |

---

## Developer Notes

**Production:** Vercel (web + API) + Render (workers) + Neon (12 migrations) + Redis  
**Local:** `npm run db:seed` in `apps/api` · `npm run worker:dev` for BullMQ · OTP always `1234`  
**Deploy:** `cd apps/api && npx vercel --prod` · `cd apps/web && npx vercel --prod`
