# WhatsApp Business Assistant — API

NestJS 11 backend for the WhatsApp Business Assistant platform. Multi-tenant booking + CRM with plan gating, WhatsApp automation, and dynamic SiteContent.

**Production:** [wa-booking-api.vercel.app](https://wa-booking-api.vercel.app)  
**Monorepo root:** [`../../README.md`](../../README.md)

---

## Stack

- NestJS 11 · Prisma 6 · PostgreSQL (Neon in prod)
- Redis + BullMQ (`apps/api/src/worker.ts` — run separately)
- JWT auth + refresh tokens · `@nestjs/throttler` (60/min global; 10/min on auth routes)
- OTP delivery: WhatsApp (`OTP_WA_BUSINESS_ID`) or Resend email (`RESEND_API_KEY`); dev fallback code `1234`

---

## Getting Started

### 1. Environment

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
JWT_SECRET="your_secret"
REDIS_URL="redis://localhost:6379"
WA_WORKER_URL="http://localhost:3100"
SUPERADMIN_USERNAME="admin"
SUPERADMIN_PASSWORD="password"
```

### 2. Database

```bash
docker compose up -d   # from repo root
npx prisma migrate deploy
npx prisma generate
npm run db:seed
```

### 3. Run

```bash
npm run start:dev      # API on :3000
npm run worker:dev     # BullMQ worker (separate terminal)
```

---

## Key Modules

| Module | Prefix | Notes |
|--------|--------|-------|
| `auth` | `/auth` | Login, OTP signup (WhatsApp/Email), refresh |
| `me` | `/me` | Profile, UI capabilities, plan features |
| `plans` | `/plans` | `GET /plans/me` — limits + usage |
| `hub` | `/hub` | Dashboard, health, leakage, reactivation |
| `coaching` | `/coaching` | Students, fees, attendance (Plus+) |
| `public` | `/public` | Booking + Business Success simulator |
| `superadmin` | `/superadmin` | Businesses, activation codes |
| `site-content` | `/site-content` | Dynamic content (Redis cached 5 min) |
| `appointments` | `/appointments` | Bookings with Redis slot lock |
| `customers` | `/customers` | CRM, tags, timeline |

Plan limits defined in `src/plans/plan-limits.ts`. All business queries scoped by `businessId`.

---

## Plan Tiers

| Plan | Limits |
|------|--------|
| Free | 50 customers · 50 bookings/mo · 1 staff |
| Plus | Unlimited + health score, reactivation, coaching, fees |
| Pro | Everything Plus + advanced analytics, AI guide, exports |

Activation codes: `FREE30`, `PLUS30`, `PLUS90`, `PRO30`, `PRO60`, `PRO90`

---

## Demo Credentials

See root [`User_Test_credential.md`](../../User_Test_credential.md).

- **Super Admin:** `admin` / `Test@123`
- **Business Admin:** `demo_admin` / `password123`
- **OTP (dev):** always `1234`

---

## Deploy

```bash
npx vercel --prod
```

Migrations run via `postinstall`. Seed production manually:

```bash
DATABASE_URL="<neon-url>" npm run db:seed
```
