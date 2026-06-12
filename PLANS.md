# Development Plans

Current state, priorities, and known gaps for **WhatsApp Business Assistant**.

> For the commercial/UX phased roadmap see [`docs/PRODUCT_TRANSFORMATION_ROADMAP.md`](./docs/PRODUCT_TRANSFORMATION_ROADMAP.md).

---

## What is built (June 2026 — Launch Ready)

### V3 — Business Growth Assistant (June 2026)
- [x] **Product repositioning** — WhatsApp Business Assistant; Business Growth Assistant positioning
- [x] **Business Success module** — `/business-success` interactive industry simulator (no signup)
- [x] **AI Business Guide** — floating knowledge-base assistant on marketing pages (no external AI API)
- [x] **Customer reactivation** — `/app/reactivation` with 30/60/90 day buckets + WhatsApp actions
- [x] **Plan gating** — Free / Plus / Pro enforced in API + usage bars on Hub
- [x] **Activation codes** — `FREE30`, `PLUS30`, `PLUS90`, `PRO30`, `PRO60`, `PRO90` + Super Admin UI
- [x] **Demo tenants** — `tenantType=DEMO` isolated from LIVE businesses; public booking blocked on demos
- [x] **Subcategory system** — Category → subcategory with "Other" + custom specialization
- [x] **7-step onboarding** — info → category/subcategory → services → hours → staff → WhatsApp → done
- [x] **Bilingual UI** — English + Hindi/Hinglish switcher (`EN` · `हिं`); Maithili content keys in Super Admin
- [x] **OTP delivery** — WhatsApp only on signup UI; code never shown publicly (dev bypass `1234` server-side only)
- [x] **In-app help chat** — 💬 floating button with AI Q&A + send to admin (Support ticket)
- [x] **Bookings UX** — compact calendar, centered forms, centered modal (no blur bottom sheet)
- [x] **Logout** — red button below Settings (sidebar + Settings + More pages)
- [x] **Business Success resilience** — offline fallback simulators when API unreachable
- [x] **Compact landing page** — hero, categories, benefits, Business Success CTA, pricing, testimonials, FAQ
- [x] **City SEO** — Darbhanga, Laheriasarai, Benipur, Baheri, Jale, Samastipur, Muzaffarpur, Patna, Mohali

### V2 — Darbhanga Beta (June 2026)
- [x] **Today Workspace** — actionable cards: bookings, pending confirm, payments, follow-ups
- [x] **Business Health Score** — category-aware (salon/clinic/coaching), 0–100 (Plus+)
- [x] **Revenue Leakage widget** — estimated loss + one-click actions (Plus+)
- [x] **Coaching module** — students, attendance, fees (`/app/students`, `/app/fees`, `/app/students/attendance`)
- [x] **Customer CRM tags** — VIP/Regular/Inactive/New with spend history
- [x] **Clinic queue** — `/app/queue` reception dashboard
- [x] **Super Admin** — stats, activation codes at `/app/superadmin/plans`
- [x] **3-tier pricing UI** — Free / Plus / Pro on landing page

### Core Platform (May–June 2026)
- [x] npm workspaces monorepo (`api`, `web`, `wa-worker`)
- [x] PostgreSQL + Prisma multi-tenant (`businessId` scoping)
- [x] Redis + BullMQ worker (`apps/api/src/worker.ts`)
- [x] JWT auth + refresh tokens (O(1) prefix lookup)
- [x] **Vercel LIVE** — web + API
- [x] **Render LIVE** — WA worker + BullMQ worker + Redis
- [x] Neon Postgres — 12 migrations applied
- [x] Dynamic SiteContent (Super Admin editable, Redis cached)
- [x] WhatsApp automation — booking confirm, 24h reminder, post-visit, inactive recovery cron
- [x] Hub, bookings, CRM, leads, support, payments, analytics (Pro), staff, services
- [x] SEO — sitemap, robots, JSON-LD, city pages
- [x] Rate limiting (ThrottlerModule 60/min global)

---

## Current priorities (next 2–4 weeks)

### P0 — Must fix before scale
- [ ] **OTP SMS gateway** — wire Twilio / MSG91 (dev stub `1234`; WhatsApp/Email delivery live when env set)
- [ ] **WhatsApp session persistence** — sessions drop on worker restart
- [ ] **WhatsApp QR scan in prod** — connect at `/app/whatsapp` for full automation
- [x] **Auth rate limits per-route** — `/auth/login` and `/auth/otp/request` at 10 req/min

### P1 — High impact
- [ ] **Referral rewards flow** — schema exists; UI + redemption pending
- [ ] **Plan upgrade UI in-app** — redeem code from Settings (not just onboarding)
- [ ] **Push-style badge counts** — Hub KPI badges (poll or SSE)
- [ ] **Lighthouse mobile > 90** — image WebP, lazy loading audit
- [ ] **2FA optional** — for Super Admin and Business Admin

### P2 — Polish
- [ ] **Empty states** — every primary route with calm copy + one CTA
- [ ] **Customer detail from Inbox** — "Open customer profile" from WA conversation
- [ ] **Branch management** — Pro plan feature (schema TBD)
- [ ] **Export tools** — Pro plan CSV exports

### P3 — Later
- [ ] **Official WhatsApp Business API** — for > 100 businesses
- [ ] **Sentry integration** — error tracking
- [ ] **`packages/shared`** — extract shared TS types

---

## Known technical debt

| Area | Issue | Priority |
|------|-------|----------|
| OTP | Dev stub always accepts `1234` | P0 |
| WA sessions | No Redis-backed session persistence | P0 |
| Referral | Schema only; no full redemption flow | P1 |
| Plan UI | Upgrade only via onboarding or Super Admin | P1 |
| `prisma.config.ts` | Deprecated warning on migrate | P3 |

---

## Infrastructure status

| Concern | Status |
|---------|--------|
| Postgres | Neon ✅ Live (12 migrations) |
| Redis | Render Key Value ✅ |
| WhatsApp worker | Render ✅ |
| BullMQ worker | Render ✅ |
| SMS / OTP | Not wired |
| GitHub auto-deploy | Vercel + Render on `main` ✅ |

---

## How to use this document

1. Pick a task from **Current priorities**.
2. Work on **one vertical slice** at a time.
3. Update this file when done.
4. Update `PRODUCT_GUIDE.md` and `docs/USER_TEST.md` when user-visible behaviour changes.
