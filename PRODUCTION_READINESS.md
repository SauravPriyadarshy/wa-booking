# Production Readiness Checklist

**Last Updated:** 10 June 2026  
**Product:** WhatsApp Business Assistant (BookNow)  
**Status:** ✅ LIVE — https://wa-booking-web.vercel.app

---

## ✅ Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| API deployed on Vercel | ✅ | `wa-booking-api.vercel.app` |
| Web deployed on Vercel | ✅ | `wa-booking-web.vercel.app` |
| WhatsApp Worker on Render | ✅ | `wa-worker-dewp.onrender.com` |
| BullMQ Worker on Render | ✅ | Processes reminder queues |
| PostgreSQL (Neon) | ✅ | 12 migrations applied |
| Redis (Render Key Value) | ✅ | BullMQ + API caching |
| Production seed run | ✅ | Subcategories, activation codes, demo tenants |

---

## ✅ Security

| Item | Status | Notes |
|------|--------|-------|
| JWT auth with refresh tokens | ✅ | HttpOnly cookie; token redacted in logs |
| bcryptjs password hashing | ✅ | 10 rounds |
| Helmet HTTP headers | ✅ | HSTS + standard headers |
| Rate limiting (ThrottlerModule) | ✅ | 60/min global; 10/min on `/auth/login` + OTP |
| Next.js security headers | ✅ | CSP, HSTS, X-Frame-Options via `next.config.ts` |
| OTP delivery (WhatsApp) | ✅ | Code sent via WA; never shown in UI; dev bypass server-side only |
| In-app help chat | ✅ | AI Q&A + admin ticket from 💬 button |
| Logout visible | ✅ | Red logout below Settings |
| Input validation | ✅ | whitelist + forbidNonWhitelisted |
| Production CORS lockdown | ✅ | Requires `CORS_ORIGINS` in prod |
| Multi-tenant data isolation | ✅ | All queries scoped by `businessId` |
| Demo tenant isolation | ✅ | `tenantType=DEMO`; public booking blocked |
| Audit logs | ✅ | `AuditLog` model |
| Plan feature gating | ✅ | Free/Plus/Pro enforced server-side |

---

## ✅ Features Live

| Feature | Status | Plan |
|---------|--------|------|
| Booking flow (public page) | ✅ | Free |
| Calendar / appointment management | ✅ | Free |
| Customer CRM (tags, spend, history) | ✅ | Free (50 customer limit) |
| Staff management | ✅ | Free (1 staff) |
| 7-step onboarding wizard | ✅ | Free |
| Category + subcategory system | ✅ | Free |
| Business Success demo (`/business-success`) | ✅ | Public |
| AI Business Guide (marketing pages) | ✅ | Public |
| Bilingual UI (EN · HI) | ✅ | Free |
| Business Success offline fallback | ✅ | Public — works if API slow/unavailable |
| Today Workspace (Hub) | ✅ | Free |
| Business Health Score | ✅ | Plus+ |
| Revenue Leakage widget | ✅ | Plus+ |
| Customer reactivation (30/60/90d) | ✅ | Plus+ |
| Coaching module (students/fees/attendance) | ✅ | Plus+ |
| Clinic queue dashboard | ✅ | Plus+ (clinic category) |
| Analytics dashboard | ✅ | Pro |
| Activation codes (Super Admin) | ✅ | Super Admin |
| Hindi landing + compact layout | ✅ | Free |
| City SEO pages (9 cities) | ✅ | Public |
| WhatsApp inbox + automation | ✅ | Free (connect required) |

---

## 📡 Key API Endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /public/business-success/types` | Public | Business type cards for simulator |
| `GET /public/business-success/simulator/:type` | Public | Interactive demo data |
| `GET /plans/me` | Business user | Plan, limits, usage |
| `GET /hub/health` | Business user | Health score 0–100 (Plus+) |
| `GET /hub/revenue-leakage` | Business user | Revenue loss estimate (Plus+) |
| `GET /hub/reactivation` | Business user | 30/60/90 day inactive buckets (Plus+) |
| `GET /hub/coaching-snapshot` | Business user | Coaching KPIs |
| `GET /hub/clinic-snapshot` | Business user | Clinic KPIs |
| `GET /hub/queue` | Business user | Clinic patient queue |
| `GET /superadmin/stats` | Super Admin | Platform stats |
| `GET/POST /superadmin/activation-codes` | Super Admin | Plan activation codes |

---

## ⚠️ Known Risks & Mitigations

### 1. Render Free Tier Sleep
- **Mitigation:** Keep-alive cron pings `/health` every 10 min
- **Next step:** Upgrade to Render Starter ($7/mo) before > 10 active businesses

### 2. WhatsApp Session Stability
- **Mitigation:** Auto-reconnect + QR re-scan in UI
- **Next step:** Redis-backed session store or WhatsApp Business API migration

### 3. OTP Dev Stub
- **Risk:** Production accepts code `1234` for all OTP requests
- **Next step:** Wire MSG91 or Twilio before public mobile signup campaign

### 4. Plan Enforcement
- **Status:** Server-side gating live; client shows upgrade banners
- **Next step:** In-app plan upgrade flow (redeem code from Settings)

---

## 📋 Pre-Launch Checklist

- [x] Set production `SUPERADMIN_USERNAME` and `SUPERADMIN_PASSWORD`
- [x] Verify Vercel environment variables
- [x] Run `prisma migrate deploy` on production DB
- [x] Run seed script on production DB
- [x] Deploy web + API to Vercel
- [ ] Test WhatsApp QR scan and connection end-to-end
- [ ] Test booking flow end-to-end with real phone
- [ ] Test activation code redemption (`PLUS90`)
- [ ] Verify `/business-success` on mobile
- [ ] Run Lighthouse (target: > 90 on mobile)
- [ ] Wire OTP SMS gateway

---

## 🔧 Environment Variables

### Vercel (API)
```
DATABASE_URL, JWT_SECRET, REDIS_URL, WA_WORKER_URL, WA_WORKER_SECRET
CORS_ORIGINS, SUPERADMIN_USERNAME, SUPERADMIN_PASSWORD
```

### Vercel (Web)
```
NEXT_PUBLIC_API_URL=https://wa-booking-api.vercel.app
```

### Render (workers)
```
DATABASE_URL, REDIS_URL, WA_WORKER_SECRET, API_URL
```

---

## 🚀 Scaling Path

| Stage | Users | Action |
|-------|-------|--------|
| 0–10 businesses | Free tier | Current setup |
| 10–50 businesses | $7–14/mo | Upgrade Render workers to Starter |
| 50–200 businesses | $50–100/mo | Upgrade Neon, add autoscaling |
| 200+ businesses | Custom | WhatsApp Business API, dedicated infra |
