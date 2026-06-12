# WhatsApp Business Assistant — Web App

Next.js 16 App Router frontend for the WhatsApp Business Assistant platform.

**Production:** [wa-booking-web.vercel.app](https://wa-booking-web.vercel.app)  
**Monorepo root:** [`../../README.md`](../../README.md)

---

## Stack

- Next.js 16 (App Router) · React 19 · Tailwind 4
- `next-intl` — EN · HI bilingual UI
- Zod + react-hook-form · recharts (analytics)

---

## Local Dev

```bash
cd apps/web
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:3000
npm run dev                  # http://127.0.0.1:3001
```

Requires API running on `:3000` and seeded database.

---

## Key Routes

| Route | Purpose |
|-------|---------|
| `/` | Compact landing page |
| `/business-success` | Interactive industry simulator (public) |
| `/signup` | Mobile OTP signup → set password |
| `/login` | Mobile + password login |
| `/forgot-password` | Reset password via WhatsApp OTP |
| `/app/settings` | Icon cards for all settings sections |
| `/app/bookings` | Compact day/list view with + Show More |
| `/app` | Hub (Today Workspace) |
| `/app/reactivation` | Customer reactivation (Plus+) |
| `/app/students`, `/app/fees` | Coaching module (Plus+) |
| `/app/queue` | Clinic queue (Plus+) |
| `/app/superadmin/plans` | Activation codes (Super Admin) |
| `/city/[city]` | City SEO pages |
| `/[slug]` | Public booking page |

---

## i18n

Messages: `messages/en.json`, `messages/hi.json`  
Locale resolution: `src/i18n/request.ts` (cookie-based; `mai` cookie maps to `hi`)  
Switcher: `src/components/lang-switcher.tsx` (EN · हिं)

---

## Deploy

```bash
npx vercel --prod
```

Env: `NEXT_PUBLIC_API_URL=https://wa-booking-api.vercel.app`

---

## Agent Notes

See [`AGENTS.md`](./AGENTS.md) for Next.js 16 breaking changes. Project conventions in [`.cursor/rules/project-overview.mdc`](../../.cursor/rules/project-overview.mdc).
