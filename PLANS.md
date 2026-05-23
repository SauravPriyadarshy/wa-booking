# Development Plans

Current state, priorities, and known gaps for the WhatsApp-first Booking + CRM platform.

> For the full commercial/UX phased roadmap see [`docs/PRODUCT_TRANSFORMATION_ROADMAP.md`](./docs/PRODUCT_TRANSFORMATION_ROADMAP.md).

---

## What is built (as of May 2026)

### Infrastructure
- [x] npm workspaces monorepo (`api`, `web`, `wa-worker`)
- [x] PostgreSQL with Prisma (multi-tenant, single DB, `businessId` scoping)
- [x] Redis + BullMQ (queues wired in `AppModule`; standalone worker process at `src/worker.ts`)
- [x] JWT auth with refresh tokens (O(1) indexed `tokenPrefix` lookup — no more O(n) bcrypt scan)
- [x] **Vercel deployment LIVE** — web + API live in production (May 23, 2026)
  - Web: https://wa-booking-web.vercel.app ✅
  - API: https://wa-booking-api.vercel.app ✅
  - Neon Postgres: 6 migrations applied, 40 SiteContent keys seeded ✅
  - All production env vars configured ✅
- [x] **Render deployment LIVE** — WhatsApp worker + BullMQ worker live (May 23, 2026)
  - WhatsApp worker: https://wa-worker-dewp.onrender.com ✅
  - BullMQ worker: https://bullmq-worker-u2sl.onrender.com ✅
  - Redis Key Value: `singapore-keyvalue.render.com` ✅
  - Keep-alive cron: API pings wa-worker every 10 min (prevents Render free-tier sleep) ✅
- [x] **GitHub repo**: https://github.com/SauravPriyadarshy/wa-booking ✅
- [x] Auto-deploy on push: Vercel (web + api) + Render (both workers) trigger on `main` branch push ✅
- [x] Slot lock Redis-unavailable bug fixed (graceful fallback when Redis unreachable)
- [x] Docker Compose for local Postgres + Redis
- [x] Universal root `Dockerfile` with `SERVICE` env var selector (wa-worker vs bullmq)
- [x] Global rate limiting via `ThrottlerModule` (60 req/min default; applied as `APP_GUARD`)
- [x] `@nestjs/schedule` wired for cron jobs
- [x] Dynamic site content (`SiteContent` model + API, Redis cached, Super Admin editable)
- [x] BullMQ worker HTTP health endpoint (runs as web service on Render free plan)

### Auth & Onboarding
- [x] Mobile OTP signup (dev stub: `1234`; SMS gateway not wired)
- [x] Password login for Admin / Staff
- [x] Multi-step onboarding (business name, category, hours)
- [x] Role-based UI gating via `/me/ui`

### Hub
- [x] KPI cards (today's bookings, pending confirmations, revenue, free slots) with deep links
- [x] Today's schedule strip
- [x] Leads & tickets compact strip (stage/status change inline, View → scroll-highlight)
- [x] Date-first / time-second display pattern
- [x] Booking link card (copy, share, print QR, admin-only slug rotate)
- [x] Quick actions (refresh, new booking, add lead, new ticket)

### Bookings
- [x] Day view and list view
- [x] URL deep links (`?date`, `?view`, `?status`)
- [x] Confirm, cancel (with reason), no-show status flows
- [x] **Atomic booking**: Redis slot lock (`SET NX PX`) + Prisma interactive transaction
- [x] **Auto-enqueue** 24h reminder on create; booking_confirm on CONFIRMED; post_visit on COMPLETED

### Customers (CRM)
- [x] Customer list with search/filter
- [x] Customer detail with timeline (bookings, payments, WhatsApp messages)
- [x] Internal staff notes

### WhatsApp
- [x] QR connect flow (`/app/whatsapp`)
- [x] Conversation inbox (`/app/inbox`)
- [x] Message thread view
- [x] Quick replies (templates) in conversation
- [x] Inbound webhook events (`wa-events` module)
- [x] Worker (whatsapp-web.js, separate process, deployed on Render)
- [x] **Outbound send**: `/sessions/:id/send` endpoint on wa-worker
- [x] **Heartbeat loop**: 60s state check + auto-reconnect with back-off
- [x] **sendMessage()** on `WhatsAppService` — used by BullMQ worker
- [x] `workerConfigured` flag in status API — UI shows setup guide vs. QR flow
- [x] **Instant booking notifications**: customer gets acknowledgement + provider gets new booking alert on every booking create
- [x] **Provider confirm via WhatsApp**: reply `CONFIRM <id>` or `CANCEL <id>` → `POST /wa/booking-action` updates status and triggers customer confirmation message
- [x] **Keep-alive cron**: `WhatsAppKeepAlive` pings `/health` every 10 min (prevents Render free-tier sleep)
- [x] Business phone configurable via `PATCH /settings/profile` and `/app/settings/profile` UI

### Leads
- [x] Lead list with stage pipeline (New → Contacted → Qualified → Converted)
- [x] Lead detail + notes
- [x] Create lead from Hub quick action or Inbox

### Support Tickets
- [x] Ticket list with status (Open, In Progress, Resolved)
- [x] Assign staff to ticket
- [x] Internal notes

### Payments
- [x] UPI config (QR, UPI ID)
- [x] Cash payment option
- [x] Pending verification list + verify action

### Services & Staff
- [x] Service catalogue (name, duration, price, buffer)
- [x] Service groups
- [x] Staff profiles, availability, hours

### Analytics
- [x] Summary: today's bookings, 30d no-show rate, repeat customers, verified revenue
- [x] **Date-range endpoint** — daily bookings + revenue by day
- [x] **Top services endpoint** — by booking count
- [x] **Revenue endpoint** — verified vs total by day
- [x] **Recharts UI** — daily bookings bar chart, revenue bar chart, top services pie chart, 7/30/90d toggle

### Templates (Quick Replies)
- [x] CRUD for quick-reply templates
- [x] Templates surfaced in Inbox conversation view

### Settings
- [x] **Business Profile** (`GET/PATCH /settings/profile`): name, phone, slug, timezone — editable by Business Admin and Super Admin
- [x] `/app/settings/profile` — frontend profile form (name, WhatsApp number, booking URL, timezone)
- [x] Business hours (weekday open/close times)
- [x] Holidays

### SEO & Public Web
- [x] `generateMetadata` on all pages — pulls title/description from SiteContent DB
- [x] `sitemap.ts` — static routes + 5 city pages
- [x] `robots.ts` — correct allow/disallow rules
- [x] JSON-LD `LocalBusiness` schema on `[slug]` booking page
- [x] JSON-LD `SoftwareApplication` schema on landing page
- [x] City landing pages: Darbhanga, Laheriasarai, Mohali, Patna, Muzaffarpur (force-dynamic)

### Dynamic Content Management (SiteContent)
- [x] `SiteContent` Prisma model with `key`, `locale`, `group`, `label`, `value`
- [x] NestJS `site-content` module: public GET (Redis cached 5 min), Super Admin PUT/bulk
- [x] 40 default keys seeded: landing (EN + HI), SEO, WhatsApp templates (EN + HI incl. new booking_new_customer + booking_new_provider), city pages, onboarding
- [x] Super Admin Content Editor UI at `/app/superadmin/content`

### Retention Automation (WhatsApp)
- [x] **New booking → customer**: immediate `booking_new_customer` job — "Booking received, pending confirmation"
- [x] **New booking → provider**: immediate `booking_new_provider` job — alert to business phone with CONFIRM/CANCEL instructions
- [x] **Booking confirmed**: immediate WhatsApp message via BullMQ `booking_confirm` job (also triggered by WhatsApp CONFIRM command)
- [x] **24h reminder**: delayed job; checks appointment not cancelled before send
- [x] **Post-visit follow-up**: 24h delayed `post_visit` job on COMPLETED
- [x] **Inactive recovery**: `inactive_recovery` job type scaffolded in worker
- [x] All templates interpolated from SiteContent DB (editable by Super Admin)

### Viral / Growth
- [x] **WhatsApp share button** on booking success screen — pre-filled `api.whatsapp.com` deep link

### Multilingual (i18n)
- [x] `next-intl` installed (without routing mode)
- [x] `messages/en.json` + `messages/hi.json`
- [x] `NextIntlClientProvider` wraps root layout; locale detected from `locale` cookie
- [x] `LangSwitcher` component for EN ↔ HI toggle

### Super Admin
- [x] Business list and activate/deactivate
- [x] Feature flags per business
- [x] **Content Editor** — edit all site content, WhatsApp templates, SEO metadata

---

## Current priorities (next 2–4 weeks)

### P0 — Must fix before public launch
- [ ] **WhatsApp QR scan** — scan QR at `/app/whatsapp` with `+919122000751` to activate end-to-end delivery
- [ ] **OTP SMS gateway** — wire Twilio / MSG91 so real mobile signups work (dev stub `1234` only)
- [ ] **WhatsApp session persistence** — sessions drop on worker restart; evaluate Redis-backed session store or Baileys migration
- [ ] **Auth rate limits per-route** — override ThrottlerGuard on `/auth/login` and `/auth/otp/request` to 10 req/min

### P1 — High impact
- [ ] **Inactive 45d recovery job** — schedule cron to query customers with no booking in 45d and enqueue `inactive_recovery` jobs
- [ ] **Staff day view** — STAFF role sees "my column only"
- [ ] **Push-style badge counts** — Hub KPI badges for pending confirm, needs reply, payments pending (poll or SSE)
- [ ] **WhatsApp message linking** — link every outbound message to booking/customer in CRM timeline
- [ ] **More city pages** — add cities to `sitemap.ts` and seed SiteContent keys

### P2 — Polish & UX
- [ ] **Empty states** — every primary route needs calm copy + one primary CTA
- [ ] **LangSwitcher visible** — add language toggle to landing page and Hub header
- [ ] **next-intl applied in client components** — `useTranslations()` in signup, booking pages
- [ ] **Customer detail deep link from Inbox** — "Open customer profile" from WA conversation

### P3 — Later
- [ ] **Demo data toggle** — seed mini-calendar in onboarding "training mode"
- [ ] **Industry packs** — terminology and default widgets per category (patient vs client)
- [ ] **Loyalty score v1** — heuristic (visit count + recency + spend)
- [ ] **Prisma N+1 audit** — Hub + day view are prime suspects
- [ ] **`packages/shared`** — extract shared TS types/utils (currently placeholder)

---

## Known technical debt

| Area | Issue | Priority |
|------|-------|----------|
| OTP | Dev stub always accepts `1234` — not production-safe | P0 |
| WA sessions | No Redis-backed session persistence across worker restarts | P0 |
| WA QR | Worker deployed but QR not yet scanned — WhatsApp automation pending scan | P0 |
| Auth throttle | `/auth/login` and `/auth/otp/request` not specifically rate-limited (only global 60/min) | P1 |
| Inactive recovery | `inactive_recovery` job processor exists but no cron to schedule it | P1 |
| i18n coverage | `useTranslations()` not yet applied to client components (signup, booking, hub) | P2 |
| `prisma.config.ts` | Deprecated `package.json#prisma` property triggers warning | P3 |
| `packages/db`, `packages/shared` | Empty placeholders | P3 |
| Money display | Verify all `priceCents` → INR formatting is consistent across web | P2 |

---

## Infrastructure status

| Concern | Status |
|---------|--------|
| Postgres | Prod: **Neon** (Vercel integration) ✅ Live |
| Redis | Prod: **Render Key Value** — external TLS URL set on Vercel ✅ |
| WhatsApp worker | Prod: **Render** (`wa-worker-dewp.onrender.com`) 🔄 Building — scan QR after deploy |
| BullMQ worker | Prod: **Render** (`bullmq-worker-u2sl.onrender.com`) 🔄 Building |
| SMS / OTP | Not wired — needs Twilio or MSG91 |
| Email | Not implemented |
| Push notifications | Not implemented |
| GitHub | https://github.com/SauravPriyadarshy/wa-booking ✅ Auto-deploy enabled |

---

## How to use this document

1. Pick a task from **Current priorities** above.
2. Work on **one vertical slice** at a time.
3. Update the checklist here when done.
4. Update `PRODUCT_GUIDE.md` and `docs/USER_TEST.md` whenever user-visible behaviour changes.
5. Update `User_Test_credential.md` if new demo accounts or flows are added.
