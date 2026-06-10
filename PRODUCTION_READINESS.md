# Production Readiness Checklist

**Last Updated:** June 2026  
**Product:** BookNow — WhatsApp Business Assistant  
**Status:** ✅ LIVE — https://wa-booking-web.vercel.app

---

## ✅ Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| API deployed on Vercel | ✅ | `apps/api` · Serverless Functions |
| Web deployed on Vercel | ✅ | `apps/web` · Next.js 16 App Router |
| WhatsApp Worker on Render | ✅ | `apps/wa-worker` · Express + whatsapp-web.js |
| BullMQ Worker on Render | ✅ | Processes reminder and notification queues |
| PostgreSQL (Neon) | ✅ | Production Neon serverless Postgres |
| Redis (Render Key Value) | ✅ | BullMQ queues + API caching |

---

## ✅ Security

| Item | Status | Notes |
|------|--------|-------|
| JWT auth with refresh tokens | ✅ | 15min access / 7d refresh |
| bcryptjs password hashing | ✅ | 10 rounds |
| Helmet HTTP headers | ✅ | `@nestjs/helmet` |
| Rate limiting (ThrottlerModule) | ✅ | API-wide throttling |
| RBAC (SUPER_ADMIN / BUSINESS_ADMIN / STAFF) | ✅ | `RolesGuard` + `RequireBusinessGuard` |
| Multi-tenant data isolation | ✅ | All queries scoped by `businessId` |
| Audit logs | ✅ | `AuditLog` model for sensitive operations |
| CORS configured | ✅ | `CORS_ORIGINS` env variable |

---

## ✅ WhatsApp Reliability

| Item | Status | Notes |
|------|--------|-------|
| Keep-alive cron (every 10 min) | ✅ | Prevents Render free tier sleep |
| Auto-reconnect on session drop | ✅ | Worker reconnects on restart |
| Booking confirmation to customer | ✅ | BullMQ `booking_new_customer` job |
| Booking notification to provider | ✅ | BullMQ `booking_new_provider` job |
| CONFIRM/CANCEL via WhatsApp reply | ✅ | `wa-events` module |
| 24h reminder | ✅ | Scheduled reminder job |
| Post-visit follow-up | ✅ | 24h after appointment |

---

## ✅ Features Live

| Feature | Status |
|---------|--------|
| Booking flow (public page) | ✅ |
| Calendar / appointment management | ✅ |
| Customer CRM (with tags, spend, history) | ✅ |
| Staff management | ✅ |
| Payments (UPI/cash + verification) | ✅ |
| Analytics dashboard | ✅ |
| Support tickets | ✅ |
| Leads management | ✅ |
| WhatsApp inbox | ✅ |
| Quick replies | ✅ |
| Business profile + settings | ✅ |
| Super Admin dashboard | ✅ |
| Feature flags per business | ✅ |
| Dynamic site content (SiteContent) | ✅ |
| City landing pages (SEO) | ✅ |
| Coaching module (students/fees/attendance) | ✅ |
| Hindi language support | ✅ |

---

## ⚠️ Known Risks & Mitigations

### 1. Render Free Tier Sleep
- **Risk:** wa-worker and bullmq-worker sleep after 15 min of inactivity
- **Mitigation:** Keep-alive cron in API pings `/health` every 10 min
- **Next step:** Upgrade to Render Starter ($7/mo) before > 10 active businesses

### 2. WhatsApp Session Stability
- **Risk:** `whatsapp-web.js` sessions can drop due to WhatsApp policy changes
- **Mitigation:** Auto-reconnect + clear status in UI + user can re-scan QR
- **Next step:** Monitor session drops via audit logs

### 3. Neon Cold Starts
- **Risk:** Neon serverless Postgres has occasional cold start latency (50-200ms)
- **Mitigation:** Vercel Edge caching on public routes
- **Next step:** Enable Neon connection pooling (PgBouncer)

### 4. WhatsApp Web Business Policy
- **Risk:** WhatsApp may block accounts sending bulk messages
- **Mitigation:** All messages are 1:1 booking-related (not marketing bulk)
- **Next step:** Consider migrating to official WhatsApp Business API for > 100 businesses

---

## 📋 Pre-Launch Checklist

- [ ] Set production `SUPERADMIN_USERNAME` and `SUPERADMIN_PASSWORD`
- [ ] Verify all Vercel environment variables set (see README)
- [ ] Verify all Render environment variables set
- [ ] Run `prisma migrate deploy` on production DB
- [ ] Run seed script on production DB  
- [ ] Test WhatsApp QR scan and connection
- [ ] Test booking flow end-to-end
- [ ] Test WhatsApp confirmation message delivery
- [ ] Test 24h reminder delivery
- [ ] Verify city landing pages are accessible
- [ ] Check sitemap at `/sitemap.xml`
- [ ] Check robots.txt
- [ ] Run Lighthouse (target: > 90 on mobile)

---

## 🔧 Environment Variables Required

### Vercel (API + Web)
```
DATABASE_URL         # Neon PostgreSQL connection string
JWT_SECRET           # Random 32+ char secret
REFRESH_TOKEN_SECRET # Random 32+ char secret
REDIS_URL            # Render Key Value URL
WA_WORKER_URL        # Render wa-worker URL
WA_WORKER_SECRET     # Shared secret for worker auth
CORS_ORIGINS         # Comma-separated list of allowed origins
SUPERADMIN_USERNAME  # e.g. "super"
SUPERADMIN_PASSWORD  # Strong password
NEXT_PUBLIC_API_URL  # Vercel API URL
NEXT_PUBLIC_WEB_URL  # Vercel Web URL
```

### Render (wa-worker + bullmq-worker)
```
DATABASE_URL         # Same Neon connection string
REDIS_URL            # Same Render Key Value URL
WA_WORKER_SECRET     # Same shared secret
API_URL              # Vercel API URL (for booking-action callback)
```

---

## 📊 Monitoring

- **Vercel Dashboard:** Function invocations, error rates, p99 latency
- **Render Dashboard:** Worker uptime, restart logs
- **Neon Dashboard:** Query performance, connection count
- **Audit Logs:** Available at `/app/superadmin` (future UI) or directly via DB

---

## 🚀 Scaling Path

| Stage | Users | Action |
|-------|-------|--------|
| 0-10 businesses | Free tier everywhere | No changes needed |
| 10-50 businesses | $7-14/mo | Upgrade Render workers to Starter |
| 50-200 businesses | $50-100/mo | Upgrade Neon plan, add Render autoscaling |
| 200+ businesses | Custom | Migrate to WhatsApp Business API, dedicated infra |
