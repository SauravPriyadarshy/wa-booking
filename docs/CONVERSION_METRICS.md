# Conversion & funnel metrics

**Honest framing:** No codebase can guarantee a **global “97% conversion rate.”** Conversion is measured per **funnel step** and cohort. Use this doc to define **events**, **targets**, and **experiments** so the product can move toward elite benchmarks (often **90%+** on narrow steps such as OTP verify among users who requested a code).

## North-star (business)

> *“This software saves me time, reduces stress, and helps me retain customers.”*

Proxy metrics: **weekly active businesses (WAB)**, **bookings per business per week**, **repeat booking rate**, **WhatsApp messages handled in-app**.

## Core funnel (web)

| Step | Route / event | What “success” means | Stretch target (example) |
|------|----------------|----------------------|---------------------------|
| 1 | Land on `/` | Primary CTA click (signup vs login) | Track click-through |
| 2 | `/signup` — phone submitted | `POST /auth/otp/request` **200** | **≥ 95%** of valid phone submissions |
| 3 | `/signup` — code verified | `POST /auth/otp/verify` **200** + token stored | **≥ 97%** of codes entered (dev: `1234`) |
| 4 | `/app` — business exists | `GET /businesses/me` **200** | Onboarding completion drives this |
| 5 | `/app/onboarding` — finished | `POST /businesses` **200** | **≥ 90%** of users who start step 1 |
| 6 | Hub — “activation” cleared | WhatsApp connected **or** first booking created | Product-led growth focus |
| 7 | Public `/{slug}` — completed booking | `POST .../book` **200** | **≥ 85%** of sessions that pick slot + enter details |

Tune targets after you have **baseline data** (see Implementation).

## WhatsApp / “conversation” completion

If **“conversation ratio”** means **template or session completion** (e.g. reminder → booking confirmed):

- Define **thread state** in your WA provider or worker logs.
- Measure **sent → delivered → read → action** separately; industry variance is huge.

Do **not** confuse with signup conversion.

## Implementation (minimal)

1. Add **PostHog**, **Plausible**, or **GA4** (pick one) with env-gated script in `apps/web`.
2. Fire events: `landing_cta_signup`, `otp_requested`, `otp_verified`, `onboarding_completed`, `booking_created`, `whatsapp_connected`.
3. Build a simple **SQL or spreadsheet** weekly: counts per step, drop-off %.

## Product levers already in the codebase

- **OTP signup** (`/signup`) — reduces password friction for Tier-2/3 SMBs.
- **Hub activation strip** — nudges WhatsApp + first booking (dismissible).
- **Landing** — primary CTA is signup; secondary is login.
- **Deep links** from Hub KPIs and leads/tickets — fewer dead ends.

## Review cadence

- Monthly: revisit funnel table and **one** experiment (copy, CTA order, onboarding step count).
- Quarterly: align with `docs/PRODUCT_TRANSFORMATION_ROADMAP.md`.
