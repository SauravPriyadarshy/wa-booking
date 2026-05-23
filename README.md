# WhatsApp-first Booking + CRM (Monorepo)

Multi-tenant, mobile-first booking and CRM SaaS for Indian service businesses (salons, clinics, home services). Built with NestJS + Prisma (API), Next.js 16 App Router (Web), and a WhatsApp worker via whatsapp-web.js.

---

## 🟢 Production (Live on Vercel)

| Service | URL | Status |
|---------|-----|--------|
| **Web App** | [https://wa-booking-web.vercel.app](https://wa-booking-web.vercel.app) | ✅ Live |
| **API** | [https://wa-booking-api.vercel.app](https://wa-booking-api.vercel.app) | ✅ Live |
| **API Health** | [https://wa-booking-api.vercel.app/health](https://wa-booking-api.vercel.app/health) | `{"ok":true}` |
| **Vercel Dashboard** | [https://vercel.com/sauravpriyadarshys-projects](https://vercel.com/sauravpriyadarshys-projects) | — |

### Production credentials (live)
| Role | Username | Password | URL |
|------|----------|----------|-----|
| Super Admin | `admin` | `Test@123` | [/login](https://wa-booking-web.vercel.app/login) |
| Business Admin | `demo_admin` | `password123` | [/login](https://wa-booking-web.vercel.app/login) |
| Customer (no login) | — | — | [/demo-salon](https://wa-booking-web.vercel.app/demo-salon) |

### Production environment variables (API — `wa-booking-api`)
| Variable | Value | Set |
|----------|-------|-----|
| `DATABASE_URL` | Neon Postgres (pooler) | ✅ |
| `JWT_SECRET` | 64-char random hex | ✅ |
| `CORS_ORIGINS` | `https://wa-booking-web.vercel.app` | ✅ |
| `SUPERADMIN_USERNAME` | `admin` | ✅ |
| `SUPERADMIN_PASSWORD` | `Test@123` | ✅ |
| `REDIS_URL` | `redis://localhost:6379` (graceful no-op) | ✅ |
| `WA_WORKER_URL` | Not set for prod (WA worker needs separate host) | ⚠️ |

### Production environment variables (Web — `wa-booking-web`)
| Variable | Value | Set |
|----------|-------|-----|
| `NEXT_PUBLIC_API_URL` | `https://wa-booking-api.vercel.app` | ✅ |

> **Redis note**: BullMQ and slot-lock features degrade gracefully when Redis is unavailable — the core app (login, bookings, CRM, analytics) works fully. WhatsApp reminder automation requires Upstash Redis + a separate BullMQ worker process.

---

## Monorepo structure

```
apps/
  api/          # NestJS 11 + Prisma 6 + PostgreSQL (port 3000)
  web/          # Next.js 16 App Router (port 3001)
  wa-worker/    # Express + whatsapp-web.js (port 3100)
packages/
  db/           # (placeholder)
  shared/       # (placeholder)
```

---

## Open in browser

### Production (live)
| URL | Purpose |
|-----|---------|
| [https://wa-booking-web.vercel.app](https://wa-booking-web.vercel.app) | Landing page |
| [https://wa-booking-web.vercel.app/login](https://wa-booking-web.vercel.app/login) | Login (all roles) |
| [https://wa-booking-web.vercel.app/signup](https://wa-booking-web.vercel.app/signup) | Mobile OTP signup |
| [https://wa-booking-web.vercel.app/demo-salon](https://wa-booking-web.vercel.app/demo-salon) | Public booking page |
| [https://wa-booking-web.vercel.app/city/darbhanga](https://wa-booking-web.vercel.app/city/darbhanga) | City SEO page — Darbhanga |
| [https://wa-booking-web.vercel.app/city/laheriasarai](https://wa-booking-web.vercel.app/city/laheriasarai) | City SEO page — Laheriasarai |
| [https://wa-booking-web.vercel.app/city/mohali](https://wa-booking-web.vercel.app/city/mohali) | City SEO page — Mohali |
| [https://wa-booking-web.vercel.app/city/patna](https://wa-booking-web.vercel.app/city/patna) | City SEO page — Patna |
| [https://wa-booking-web.vercel.app/city/muzaffarpur](https://wa-booking-web.vercel.app/city/muzaffarpur) | City SEO page — Muzaffarpur |
| [https://wa-booking-web.vercel.app/sitemap.xml](https://wa-booking-web.vercel.app/sitemap.xml) | XML sitemap |
| [https://wa-booking-web.vercel.app/robots.txt](https://wa-booking-web.vercel.app/robots.txt) | robots.txt |

### Local dev
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
| `http://127.0.0.1:3001/app/customers/{id}` | Customer detail + timeline |
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
| `http://127.0.0.1:3001/app/more` | More menu |
| `http://127.0.0.1:3001/app/superadmin/businesses` | Super Admin — all businesses |
| `http://127.0.0.1:3001/app/superadmin/features` | Super Admin — feature flags |
| `http://127.0.0.1:3001/app/superadmin/content` | Super Admin — **Content Editor** |

---

## Roles

| Role | Login | Lands on | Key capability |
|------|-------|----------|----------------|
| `SUPER_ADMIN` | `/login` | `/app` | Content Editor, global feature flags, all businesses |
| `BUSINESS_ADMIN` | `/login` | `/app` | Full business ops, booking link rotate |
| `STAFF` | `/login` | `/app` | Day view, limited actions |
| Customer | `/{slug}` | Public booking page | No login required |

---

## Local dev

### 1. Prerequisites — Postgres + Redis

**Option A — Docker:**
```bash
docker compose up -d   # Postgres :5432 + Redis :6379
```

**Option B — Homebrew (macOS):**
```bash
brew install postgresql@16 && brew services start postgresql@16
brew install redis && brew services start redis
```

### 2. API
```bash
cd apps/api
cp .env.example .env          # fill in DATABASE_URL, JWT_SECRET, etc.
npx prisma migrate deploy
npx prisma generate
npm run db:seed               # creates superadmin + demo-salon + 38 SiteContent keys
npm run start:dev             # http://localhost:3000
```

### 3. BullMQ worker (WhatsApp messages & reminders)
```bash
# In a separate terminal, from apps/api
npm run worker:dev            # listens on QUEUE_REMINDERS; sends WA messages
```

### 4. Web
```bash
cd apps/web
cp .env.example .env.local    # set NEXT_PUBLIC_API_URL=http://localhost:3000
npm run dev                   # http://127.0.0.1:3001
```

### 5. WhatsApp worker (optional — needed for real WA messages)
```bash
cd apps/wa-worker
PUPPETEER_SKIP_DOWNLOAD=1 PORT=3100 npm run dev   # http://localhost:3100
```
> Requires Chrome/Chromium. In Docker/Render use `CHROME_PATH=/usr/bin/chromium`.

---

## Scripts reference

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

## API modules (NestJS)

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
| `site-content` | `/site-content` | Dynamic content (public read, super-admin write, Redis cached) |
| `queues` | _(internal)_ | Redis + BullMQ queue providers |

---

## Environment variables

### `apps/api/.env`
```env
DATABASE_URL="postgresql://app:app@localhost:5432/wa_booking?schema=public"
JWT_SECRET="change_me_use_openssl_rand_hex_32"
REDIS_URL="redis://localhost:6379"
WA_WORKER_URL="http://localhost:3100"
WA_WORKER_SECRET=""          # shared secret between API and wa-worker
SUPERADMIN_USERNAME="admin"
SUPERADMIN_PASSWORD="Test@123"
PORT=3000
CORS_ORIGINS=                # comma-separated origins; empty = allow all in dev
```

### `apps/web/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Deployment

| Service | Platform | Notes |
|---------|----------|-------|
| Web | Vercel (`wa-booking-web`) | `NEXT_PUBLIC_API_URL=https://wa-booking-api.vercel.app` |
| API | Vercel (`wa-booking-api`) | Neon Postgres via integration; `JWT_SECRET`, `CORS_ORIGINS`, `SUPERADMIN_*` must be set |
| Redis | Upstash (recommended) | Set `REDIS_URL` in API env for BullMQ + slot lock |
| BullMQ worker | Render / Railway | `npm run worker:start` from `apps/api`; needs `REDIS_URL` + `WA_WORKER_URL` |
| WhatsApp worker | Render / Railway / Docker VM | Needs Chromium + long-running process; use `Dockerfile` in `apps/wa-worker` |

### Re-deploy after env var changes
```bash
cd apps/api && npx vercel --prod --yes
cd apps/web && npx vercel --prod --yes
```

---

## Database migrations (production)

Migrations run automatically via the `postinstall` script on every Vercel deploy:
```
prisma migrate deploy
```

To seed the production Neon database manually:
```bash
cd apps/api
DATABASE_URL="<neon-connection-string>" npm run db:seed
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
