# WhatsApp-first Booking + CRM (Monorepo)

Multi-tenant, mobile-first booking and CRM SaaS for Indian service businesses (salons, clinics, home services). Built with NestJS + Prisma (API), Next.js 16 App Router (Web), and a WhatsApp worker via whatsapp-web.js.

---

## Production (Live)

| Service | Platform | URL | Status |
|---------|----------|-----|--------|
| **Web App** | Vercel | [https://wa-booking-web.vercel.app](https://wa-booking-web.vercel.app) | ✅ Live |
| **API** | Vercel | [https://wa-booking-api.vercel.app](https://wa-booking-api.vercel.app) | ✅ Live |
| **WhatsApp Worker** | Render | [https://wa-worker-dewp.onrender.com](https://wa-worker-dewp.onrender.com) | 🔄 Building |
| **BullMQ Worker** | Render | [https://bullmq-worker-u2sl.onrender.com](https://bullmq-worker-u2sl.onrender.com) | 🔄 Building |
| **Redis** | Render Key Value | `singapore-keyvalue.render.com` | ✅ Available |
| **Database** | Neon Postgres | `ep-withered-cloud-aqowbdqg` | ✅ Live |
| **GitHub** | — | [github.com/SauravPriyadarshy/wa-booking](https://github.com/SauravPriyadarshy/wa-booking) | ✅ Public |

### Production credentials

| Role | Username | Password | URL |
|------|----------|----------|-----|
| Super Admin | `admin` | `Test@123` | [/login](https://wa-booking-web.vercel.app/login) |
| Business Admin | `demo_admin` | `password123` | [/login](https://wa-booking-web.vercel.app/login) |
| Customer (no login) | — | — | [/demo-salon](https://wa-booking-web.vercel.app/demo-salon) |

---

## Infrastructure Map

### Vercel — API (`wa-booking-api`)

| Variable | Value | Status |
|----------|-------|--------|
| `DATABASE_URL` | Neon Postgres (pooler) | ✅ |
| `DATABASE_URL_UNPOOLED` | Neon Postgres (direct) | ✅ |
| `JWT_SECRET` | 64-char random hex | ✅ |
| `CORS_ORIGINS` | `https://wa-booking-web.vercel.app` | ✅ |
| `SUPERADMIN_USERNAME` | `admin` | ✅ |
| `SUPERADMIN_PASSWORD` | `Test@123` | ✅ |
| `REDIS_URL` | Render Redis (external TLS) | ✅ |
| `WA_WORKER_URL` | `https://wa-worker-dewp.onrender.com` | ✅ |
| `WA_WORKER_SECRET` | 64-char hex (shared with Render) | ✅ |

### Vercel — Web (`wa-booking-web`)

| Variable | Value | Status |
|----------|-------|--------|
| `NEXT_PUBLIC_API_URL` | `https://wa-booking-api.vercel.app` | ✅ |

### Render — Services

| Service | ID | Env Vars |
|---------|----|----------|
| `wa-redis` (Key Value) | `red-d88kuqjbc2fs73eb9rig` | — |
| `wa-worker` (Web) | `srv-d88kv6lckfvc73fpr7h0` | `SERVICE=wa-worker`, `PORT=3100`, `API_BASE_URL`, `REDIS_URL`, `WA_WORKER_SECRET` |
| `bullmq-worker` (Web) | `srv-d88l0jreo5us7381utog` | `SERVICE=bullmq`, `PORT=3200`, `DATABASE_URL`, `REDIS_URL`, `WA_WORKER_URL`, `WA_WORKER_SECRET` |

> Both Render services use the **universal root `Dockerfile`** and select the service to run via the `SERVICE` environment variable (`wa-worker` or `bullmq`).

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
Dockerfile.bullmq     # Legacy (not used by Render; kept for reference)
docker-entrypoint.sh  # Selects service at runtime
render.yaml           # Render Blueprint spec
docker-compose.yml    # Local dev: Postgres + Redis
```

---

## Production URLs

| URL | Purpose |
|-----|---------|
| [https://wa-booking-web.vercel.app](https://wa-booking-web.vercel.app) | Landing page |
| [https://wa-booking-web.vercel.app/login](https://wa-booking-web.vercel.app/login) | Login (all roles) |
| [https://wa-booking-web.vercel.app/signup](https://wa-booking-web.vercel.app/signup) | Mobile OTP signup |
| [https://wa-booking-web.vercel.app/demo-salon](https://wa-booking-web.vercel.app/demo-salon) | Public booking page |
| [https://wa-booking-web.vercel.app/city/darbhanga](https://wa-booking-web.vercel.app/city/darbhanga) | City SEO — Darbhanga |
| [https://wa-booking-web.vercel.app/city/laheriasarai](https://wa-booking-web.vercel.app/city/laheriasarai) | City SEO — Laheriasarai |
| [https://wa-booking-web.vercel.app/city/mohali](https://wa-booking-web.vercel.app/city/mohali) | City SEO — Mohali |
| [https://wa-booking-web.vercel.app/city/patna](https://wa-booking-web.vercel.app/city/patna) | City SEO — Patna |
| [https://wa-booking-web.vercel.app/city/muzaffarpur](https://wa-booking-web.vercel.app/city/muzaffarpur) | City SEO — Muzaffarpur |
| [https://wa-booking-web.vercel.app/sitemap.xml](https://wa-booking-web.vercel.app/sitemap.xml) | XML sitemap |
| [https://wa-booking-web.vercel.app/robots.txt](https://wa-booking-web.vercel.app/robots.txt) | robots.txt |
| [https://wa-booking-api.vercel.app/health](https://wa-booking-api.vercel.app/health) | API health check |
| [https://wa-worker-dewp.onrender.com/health](https://wa-worker-dewp.onrender.com/health) | WA worker health |

---

## Local Dev

### Prerequisites

**Option A — Docker:**
```bash
docker compose up -d   # Postgres :5432 + Redis :6379
```

**Option B — Homebrew (macOS):**
```bash
brew install postgresql@16 && brew services start postgresql@16
brew install redis && brew services start redis
```

### 1. API
```bash
cd apps/api
cp .env.example .env          # fill DATABASE_URL, JWT_SECRET, etc.
npx prisma migrate deploy
npx prisma generate
npm run db:seed               # creates superadmin + demo-salon + 38 SiteContent keys
npm run start:dev             # http://localhost:3000
```

### 2. BullMQ worker
```bash
# Separate terminal, from apps/api:
npm run worker:dev            # listens on QUEUE_REMINDERS; sends WA messages via wa-worker
```

### 3. Web
```bash
cd apps/web
cp .env.example .env.local    # set NEXT_PUBLIC_API_URL=http://localhost:3000
npm run dev                   # http://127.0.0.1:3001
```

### 4. WhatsApp worker
```bash
cd apps/wa-worker
PUPPETEER_SKIP_DOWNLOAD=1 PORT=3100 npm run dev   # http://localhost:3100
```
> Requires Chrome/Chromium. In Docker/Render the image auto-detects `/usr/bin/chromium`.

---

## Local Dev URLs

| URL | Purpose |
|-----|---------|
| `http://127.0.0.1:3001/` | Landing page |
| `http://127.0.0.1:3001/login` | Login |
| `http://127.0.0.1:3001/signup` | OTP signup |
| `http://127.0.0.1:3001/demo-salon` | Public booking page |
| `http://127.0.0.1:3001/city/darbhanga` | City SEO page |
| `http://127.0.0.1:3001/app` | Hub — command center |
| `http://127.0.0.1:3001/app/bookings` | Calendar + list |
| `http://127.0.0.1:3001/app/customers` | CRM list |
| `http://127.0.0.1:3001/app/inbox` | WhatsApp conversation inbox |
| `http://127.0.0.1:3001/app/leads` | Leads pipeline |
| `http://127.0.0.1:3001/app/support` | Support tickets |
| `http://127.0.0.1:3001/app/payments` | Payment verification |
| `http://127.0.0.1:3001/app/analytics` | Analytics charts (7/30/90d) |
| `http://127.0.0.1:3001/app/services` | Service catalogue |
| `http://127.0.0.1:3001/app/staff` | Staff management |
| `http://127.0.0.1:3001/app/whatsapp` | WhatsApp QR connect |
| `http://127.0.0.1:3001/app/templates` | Quick-reply templates |
| `http://127.0.0.1:3001/app/settings` | Business settings |
| `http://127.0.0.1:3001/app/onboarding` | First-run business setup |
| `http://127.0.0.1:3001/app/superadmin/businesses` | Super Admin — all businesses |
| `http://127.0.0.1:3001/app/superadmin/features` | Super Admin — feature flags |
| `http://127.0.0.1:3001/app/superadmin/content` | Super Admin — Content Editor |

---

## Roles

| Role | Login | Lands on | Key capability |
|------|-------|----------|----------------|
| `SUPER_ADMIN` | `/login` | `/app` | Content Editor, global feature flags, all businesses |
| `BUSINESS_ADMIN` | `/login` | `/app` | Full business ops, booking link rotate |
| `STAFF` | `/login` | `/app` | Day view, limited actions |
| Customer | `/{slug}` | Public booking page | No login required |

---

## Scripts Reference

| Location | Script | What it does |
|----------|--------|--------------|
| `apps/api` | `npm run start:dev` | NestJS with hot-reload |
| `apps/api` | `npm run db:seed` | Seed superadmin + demo business + 38 SiteContent keys |
| `apps/api` | `npm run db:migrate` | Run pending Prisma migrations |
| `apps/api` | `npm run worker:dev` | BullMQ worker (WhatsApp confirmations, reminders) |
| `apps/api` | `npm run build` | Production NestJS build |
| `apps/web` | `npm run dev` | Next.js dev server (port 3001) |
| `apps/web` | `npm run build` | Next.js production build |

---

## API Modules (NestJS)

| Module | Path prefix | Notes |
|--------|-------------|-------|
| `auth` | `/auth` | JWT login, OTP mobile signup, refresh tokens (O(1) prefix lookup) |
| `me` | `/me` | Current user profile, UI capabilities |
| `hub` | `/hub` | Hub stats, schedule, leads/tickets strip |
| `appointments` | `/appointments` | Bookings CRUD; atomic Redis lock + Prisma TX (graceful without Redis) |
| `customers` | `/customers` | CRM, timeline |
| `leads` | `/leads` | Lead pipeline |
| `support` | `/support` | Support tickets |
| `payments` | `/payments` | Payment config, verification |
| `analytics` | `/analytics` | Summary, date-range, top-services, revenue |
| `services` | `/services` | Service catalogue |
| `staff` | `/staff` | Staff profiles, hours |
| `businesses` | `/businesses` | Business profile, hours, slug |
| `categories` | `/categories` | Business categories |
| `conversations` | `/conversations` | WhatsApp conversation threads |
| `whatsapp` | `/whatsapp` | WA session management, QR, `sendMessage()` |
| `quick-replies` | `/quick-replies` | Message templates |
| `settings` | `/settings` | Business settings |
| `public` | `/public` | Unauthenticated booking endpoints |
| `wa-events` | `/wa-events` | Inbound WhatsApp webhook events |
| `superadmin` | `/superadmin` | Platform-wide admin operations |
| `site-content` | `/site-content` | Dynamic content (public read, super-admin write, Redis cached 5 min) |
| `queues` | _(internal)_ | Redis + BullMQ queue providers |

---

## Deployment

### Vercel (API + Web) — auto-deploy on push to `main`
```bash
cd apps/api && npx vercel --prod
cd apps/web && npx vercel --prod
```

### Render (WA worker + BullMQ) — auto-deploy on push to `main`
Both services on Render redeploy automatically when code is pushed to GitHub (`main` branch).
Dashboard: [dashboard.render.com](https://dashboard.render.com)

### Database migrations (production)
Migrations run automatically via the `postinstall` script on every Vercel API deploy:
```
prisma migrate deploy
```

To seed the production Neon database manually:
```bash
cd apps/api
DATABASE_URL="<neon-connection-string>" npm run db:seed
```

---

## Local `.env` Reference

### `apps/api/.env`
```env
DATABASE_URL="postgresql://app:app@localhost:5432/wa_booking?schema=public"
JWT_SECRET="change_me_use_openssl_rand_hex_32"
REDIS_URL="redis://localhost:6379"
WA_WORKER_URL="http://localhost:3100"
WA_WORKER_SECRET=""
SUPERADMIN_USERNAME="admin"
SUPERADMIN_PASSWORD="Test@123"
PORT=3000
CORS_ORIGINS=
```

### `apps/web/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| [`PRODUCT_GUIDE.md`](./PRODUCT_GUIDE.md) | Product overview, step-by-step flows, demo script |
| [`PLANS.md`](./PLANS.md) | Current development status and prioritised next steps |
| [`User_Test_credential.md`](./User_Test_credential.md) | Demo logins and quick test bullets |
| [`docs/PRODUCT_TRANSFORMATION_ROADMAP.md`](./docs/PRODUCT_TRANSFORMATION_ROADMAP.md) | Commercial/UX phased roadmap |
| [`docs/USER_TEST.md`](./docs/USER_TEST.md) | UAT checklist |
