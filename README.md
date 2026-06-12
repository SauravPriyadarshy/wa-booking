# WhatsApp Business Assistant (Monorepo)

Multi-tenant, mobile-first **Business Growth Assistant** for Indian service businesses — coaching centers, clinics, salons, home services, and more. Built with NestJS + Prisma (API), Next.js 16 App Router (Web), and WhatsApp automation via whatsapp-web.js + BullMQ.

**Tagline (EN):** The easiest way to run your business on WhatsApp  
**Tagline (HI):** WhatsApp से अपना व्यवसाय चलाइए

---

## Production (Live)

| Service | Platform | URL | Status |
|---------|----------|-----|--------|
| **Web App** | Vercel | [https://wa-booking-web.vercel.app](https://wa-booking-web.vercel.app) | ✅ Live |
| **API** | Vercel | [https://wa-booking-api.vercel.app](https://wa-booking-api.vercel.app) | ✅ Live |
| **WhatsApp Worker** | Render | [https://wa-worker-dewp.onrender.com](https://wa-worker-dewp.onrender.com) | ✅ Live |
| **BullMQ Worker** | Render | [https://bullmq-worker-u2sl.onrender.com](https://bullmq-worker-u2sl.onrender.com) | ✅ Live |
| **Redis** | Render Key Value | Singapore region | ✅ Available |
| **Database** | Neon Postgres | Production Neon | ✅ Live |
| **GitHub** | — | [github.com/SauravPriyadarshy/wa-booking](https://github.com/SauravPriyadarshy/wa-booking) | ✅ Public |

### Production credentials

| Role | Username | Password | URL |
|------|----------|----------|-----|
| Super Admin | `admin` or `super` | `Test@123` | [/login](https://wa-booking-web.vercel.app/login) |
| Business Admin | `demo_admin` | `password123` | [/login](https://wa-booking-web.vercel.app/login) |
| Customer (no login) | — | — | [/demo-salon](https://wa-booking-web.vercel.app/demo-salon) |

### Activation codes (Super Admin seeded)

| Code | Plan | Validity |
|------|------|----------|
| `FREE30` | Free extension | 30 days |
| `PLUS30` / `PLUS90` | Plus | 30 / 90 days |
| `PRO30` / `PRO60` / `PRO90` | Pro | 30 / 60 / 90 days |

Redeem during onboarding or via Super Admin → `/app/superadmin/plans`.

---

## Monorepo Structure

```
apps/
  api/          # NestJS 11 + Prisma 6 + PostgreSQL (port 3000)
  web/          # Next.js 16 App Router (port 3001)
  wa-worker/    # Express + whatsapp-web.js (port 3100)
packages/
  db/           # (placeholder)
  shared/       # (placeholder)
Dockerfile            # Universal — SERVICE=wa-worker or SERVICE=bullmq
docker-compose.yml    # Local dev: Postgres + Redis
```

---

## Key Production URLs

| URL | Purpose |
|-----|---------|
| [https://wa-booking-web.vercel.app](https://wa-booking-web.vercel.app) | Landing page (compact, mobile-first) |
| [https://wa-booking-web.vercel.app/business-success](https://wa-booking-web.vercel.app/business-success) | Interactive industry demo (no signup) |
| [https://wa-booking-web.vercel.app/signup](https://wa-booking-web.vercel.app/signup) | Mobile OTP signup (WhatsApp or Email) |
| [https://wa-booking-web.vercel.app/demo-salon](https://wa-booking-web.vercel.app/demo-salon) | Public booking page |
| [https://wa-booking-web.vercel.app/darbhanga](https://wa-booking-web.vercel.app/darbhanga) | Darbhanga launch page |
| [https://wa-booking-web.vercel.app/city/darbhanga](https://wa-booking-web.vercel.app/city/darbhanga) | City SEO — Darbhanga |
| [https://wa-booking-web.vercel.app/city/samastipur](https://wa-booking-web.vercel.app/city/samastipur) | City SEO — Samastipur |
| [https://wa-booking-web.vercel.app/app/reactivation](https://wa-booking-web.vercel.app/app/reactivation) | Customer reactivation (Plus+) |
| [https://wa-booking-web.vercel.app/app/superadmin/plans](https://wa-booking-web.vercel.app/app/superadmin/plans) | Activation codes (Super Admin) |
| [https://wa-booking-api.vercel.app/public/business-success/types](https://wa-booking-api.vercel.app/public/business-success/types) | Business Success API |
| [https://wa-booking-api.vercel.app/health](https://wa-booking-api.vercel.app/health) | API health check |

**City SEO pages:** Darbhanga, Laheriasarai, Benipur, Baheri, Jale, Samastipur, Muzaffarpur, Patna, Mohali — see `/sitemap.xml`.

---

## Local Dev

### Prerequisites

```bash
docker compose up -d   # Postgres :5432 + Redis :6379
```

### 1. API

```bash
cd apps/api
cp .env.example .env
npx prisma migrate deploy
npx prisma generate
npm run db:seed
npm run start:dev    # or: npm run build && node dist/main.js
```

### 2. BullMQ worker

```bash
cd apps/api && npm run worker:dev
```

### 3. Web

```bash
cd apps/web
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:3000
npm run dev                  # http://127.0.0.1:3001
```

### 4. WhatsApp worker

```bash
cd apps/wa-worker
PORT=3100 npm run dev
```

---

## Roles

| Role | Login | Lands on | Key capability |
|------|-------|----------|----------------|
| `SUPER_ADMIN` | `/login` | `/app` | Content Editor, activation codes, all businesses |
| `BUSINESS_ADMIN` | `/login` | `/app` | Full business ops, plan management |
| `STAFF` | `/login` | `/app` | Day view, limited actions |
| Customer | `/{slug}` | Public booking page | No login required |

---

## Pricing Plans (enforced in API)

| Plan | Limits | Key features |
|------|--------|--------------|
| **FREE** | 50 customers · 50 bookings/mo · 1 staff | Basic CRM, booking, dashboard, Hindi |
| **PLUS** | Unlimited | Health score, revenue leakage, reactivation, coaching, fees, attendance, WA templates |
| **PRO** | Unlimited | Everything Plus + advanced analytics, AI guide, exports, API access |

Plan info: `GET /plans/me` · Upgrade via activation codes or Super Admin.

---

## API Modules (NestJS)

| Module | Path prefix | Notes |
|--------|-------------|-------|
| `auth` | `/auth` | JWT login, OTP signup, refresh tokens |
| `me` | `/me` | Profile, UI capabilities, plan features |
| `plans` | `/plans` | Plan usage and limits |
| `hub` | `/hub` | Dashboard, health score, revenue leakage, reactivation |
| `coaching` | `/coaching` | Students, fees, attendance (Plus+) |
| `appointments` | `/appointments` | Bookings; Redis lock + Prisma TX |
| `customers` | `/customers` | CRM, timeline, tags |
| `public` | `/public` | Booking + Business Success simulator |
| `superadmin` | `/superadmin` | Businesses, features, activation codes |
| `site-content` | `/site-content` | Dynamic content (Redis cached 5 min) |
| `whatsapp` | `/whatsapp` | WA session, QR connect |
| `categories` | `/categories` | Categories + subcategories |

Full list in [`PLANS.md`](./PLANS.md).

---

## Localization

| Locale | Code | UI |
|--------|------|-----|
| English | `en` | Default |
| Hindi / Hinglish | `hi` | Natural Bihar-friendly copy |

Toggle: **EN · हिं** switcher on landing and app sidebar. Messages in `apps/web/messages/{en,hi}.json` (Maithili keys editable in Super Admin SiteContent).

---

## Deployment

### Vercel (API + Web)

```bash
cd apps/api && npx vercel --prod
cd apps/web && npx vercel --prod
```

Migrations run via `postinstall` on API deploy. Seed production manually:

```bash
cd apps/api && DATABASE_URL="<neon-url>" npm run db:seed
```

### Render (WA + BullMQ workers)

Auto-deploy on push to `main`. Dashboard: [dashboard.render.com](https://dashboard.render.com)

---

## Documentation

| Document | Purpose |
|----------|---------|
| [`PRODUCT_GUIDE.md`](./PRODUCT_GUIDE.md) | Product overview, demo script |
| [`PLANS.md`](./PLANS.md) | Dev status and priorities |
| [`PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) | Launch checklist |
| [`User_Test_credential.md`](./User_Test_credential.md) | Demo logins and test URLs |
| [`BUSINESS_HEALTH_SCORE.md`](./BUSINESS_HEALTH_SCORE.md) | Health score formula |
| [`DARBHANGA_LAUNCH_PLAN.md`](./DARBHANGA_LAUNCH_PLAN.md) | 30-day Darbhanga launch |
| [`LOCAL_MARKETING_PLAN.md`](./LOCAL_MARKETING_PLAN.md) | Local marketing strategy |
| [`DARBHANGA_BUNDLE.md`](./DARBHANGA_BUNDLE.md) | Darbhanga WhatsApp Pack |
| [`COACHING_CENTER_STRATEGY.md`](./COACHING_CENTER_STRATEGY.md) | Coaching vertical |
| [`CLINIC_STRATEGY.md`](./CLINIC_STRATEGY.md) | Clinic vertical |
| [`docs/USER_TEST.md`](./docs/USER_TEST.md) | UAT checklist |
| [`docs/PRODUCT_TRANSFORMATION_ROADMAP.md`](./docs/PRODUCT_TRANSFORMATION_ROADMAP.md) | Phased roadmap |
| [`docs/CONVERSION_METRICS.md`](./docs/CONVERSION_METRICS.md) | Funnel metrics |
