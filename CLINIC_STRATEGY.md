# Clinic Strategy — Developer Reference

**Last updated:** 12 June 2026  
**Product positioning:** Appointment + queue + follow-up assistant — **NOT** EMR, NOT telemedicine, NOT prescription software.

**Related:** [Coaching Center](./COACHING_CENTER_STRATEGY.md) · [PLANS.md](./PLANS.md) · [User_Test_credential.md](./User_Test_credential.md)

---

## How clinic works in the codebase

Clinic is **not a separate NestJS module**. It is implemented via `BusinessCategory.key === "clinic"` branching across hub, automation, settings, staff, and onboarding. Unlike coaching (dedicated `/coaching/*` API), clinic reuses **bookings + CRM + queue** primitives.

**Key files:**

| Area | Path |
|------|------|
| Subcategory seeds | `apps/api/src/common/subcategory-seeds.ts` |
| Category + service templates | `apps/api/prisma/seed.ts` |
| Hub clinic logic | `apps/api/src/hub/hub.service.ts` (`clinicSnapshot`) |
| Hub UI | `apps/web/src/components/app/hub-dashboard.tsx` |
| Queue UI | `apps/web/src/app/app/queue/page.tsx` |
| Follow-up automation | `apps/api/src/automation/automation.service.ts` |
| WA job processor | `apps/api/src/worker.ts` |
| Follow-up settings | `apps/web/src/app/app/settings/follow-ups/page.tsx` |
| Staff/doctor fields | `apps/api/src/staff/staff.service.ts`, `apps/web/src/app/app/staff/page.tsx` |
| Onboarding | `apps/web/src/app/app/onboarding/page.tsx` |
| Public booking | `apps/web/src/app/[slug]/booking-client.tsx` |
| Plan limits | `apps/api/src/plans/plan-limits.ts` |

---

## What we build vs what we do NOT build

### ✅ In scope (live)

| Feature | Route / API | Plan (enforced) |
|---------|-------------|-----------------|
| Public consultation booking | `/{slug}` | Free (50 bookings/mo limit) |
| Appointment calendar | `/app/bookings` | Free |
| Patient CRM (customers) | `/app/customers` | Free (50 patients limit) |
| WhatsApp 24h reminder | Auto on booking create | Free (WA connect required) |
| Booking confirm / post-visit WA | Auto on status change | Free |
| **Clinic follow-up WA** (7/15/30/90 days) | Auto on COMPLETED | **Free today** ⚠️ |
| Leads pipeline | `/app/leads` | Free |
| Payments | `/app/payments` | Free |
| Queue dashboard | `/app/queue`, `GET /hub/queue` | **Free today** ⚠️ |
| Clinic Hub KPIs | `/app` → “Clinic Today” | Free |
| Health Score (attendance-based) | `GET /hub/health` | **Plus+** |
| Revenue Leakage | `GET /hub/revenue-leakage` | **Plus+** |
| Patient reactivation | `/app/reactivation` | **Plus+** |
| Follow-up interval toggles | `/app/settings/follow-ups` | **Free today** ⚠️ |
| Doctor/staff fields | `/app/staff` | Free (1 staff on Free) |

⚠️ **Plan gating gaps:** Queue and clinic follow-up automation are documented as Plus+ in older pitches but are **not** gated in code (`assertFeature` not called). `follow_up_automation` exists in `plan-limits.ts` but is unused.

### ❌ Out of scope (never build here)

- Electronic Medical Records (EMR/EHR)
- Prescription writing
- Lab report management
- Telemedicine / video calls
- Insurance billing
- Hospital bed management

---

## Onboarding flow

### Standard path (5 steps)

**UI:** `apps/web/src/app/app/onboarding/page.tsx`

| Step | User action | API |
|------|-------------|-----|
| 1 | Business name, phone, optional activation code | — |
| 2 | Select **Clinic** + **specialization** (required) | `GET /categories` → auto `POST /categories/sync-subcategories` if empty |
| 2b | If “Other” → type custom specialization | Stored on business |
| 2c | Continue | `POST /businesses` (creates business + seeds services from template) |
| 3 | Review/edit services | `GET /services`, user edits list |
| 4 | Set business hours | `POST /settings/hours` (default Mon–Sat 9:00–18:00, Sun closed) |
| 5 | Optional staff name | `POST /staff` → Hub |

### Darbhanga fast path (2 steps)

**URL:** `/signup?ref=darbhanga&pack=clinic`

| Step | Content |
|------|---------|
| 1 | Shop name + Coaching/Salon/Clinic pack selection |
| 2 | Create business → done screen with booking link + WhatsApp share |

**Skips:** subcategory UI, services edit, hours, staff. Category auto-resolved to `clinic`. Sets `localStorage.darbhangaLaunch`.

**Pack file:** `apps/web/src/lib/darbhanga-pack.ts`

### Clinic specializations (subcategories)

**Source:** `apps/api/src/common/subcategory-seeds.ts`

| Key | Name |
|-----|------|
| `general_physician` | General Physician |
| `child_specialist` | Child Specialist |
| `ent` | ENT |
| `orthopedic` | Orthopedic |
| `gynecologist` | Gynecologist |
| `dentist` | Dentist |
| `physiotherapist` | Physiotherapist |
| `other` | Other (+ custom text field) |

**API:** `GET /categories` (public) · `POST /categories/sync-subcategories` (public, upserts all seeds)

### Default services (auto-created on business create)

From `apps/api/prisma/seed.ts` category template:

| Service | Duration |
|---------|----------|
| Consultation | 15 min |
| Follow-up Visit | 10 min |
| Health Check | 20 min (+ 5 min buffer after) |

User can add/edit/remove in onboarding step 3 and later at `/app/services`.

---

## User journey map (clinic owner)

```
Signup (OTP → password)
  → Onboarding (category Clinic + specialization)
  → Hub (/app)
       ├─ Clinic Today KPIs → Queue, Leads, Payments
       ├─ Today Workspace (bookings, follow-ups, no-shows)
       ├─ Health Score / Revenue Leakage (Plus+)
       └─ Booking link (copy / share / QR)

Daily operations
  ├─ /app/bookings     — calendar, confirm, complete, no-show
  ├─ /app/queue        — who's waiting, in consultation, done
  ├─ /app/customers    — patient CRM, tags, timeline, spend
  ├─ /app/leads        — follow-up pipeline (NEW → CONVERTED)
  ├─ /app/payments     — record UPI/cash payments
  ├─ /app/reactivation — WhatsApp to inactive patients (Plus+)
  ├─ /app/staff        — doctors: title, specialization, fee, duration
  ├─ /app/whatsapp     — connect QR for automations
  └─ /app/settings/follow-ups — toggle 7/15/30/90 day WA follow-ups

Patient (public)
  └─ /{business-slug}  — pick service → date → slot → name/phone → book
```

**Navigation note:** Queue is **not** in bottom nav. Reach via Hub “Clinic Today”, `/app/more`, or direct URL. Comment in `me.service.ts`: kept under More until promoted.

---

## Hub widgets (clinic category)

**File:** `apps/web/src/components/app/hub-dashboard.tsx`  
**Data:** `GET /hub/clinic-snapshot` (no plan gate)

### Clinic-only section — “Clinic Today”

| Card | Metric | Links to |
|------|--------|----------|
| Patients today | Count of today's appointments | `/app/queue` |
| In queue | Waiting (confirmed, not started) | `/app/queue` |
| Follow-ups due | Leads stale 24–48h | `/app/leads` |
| Revenue today | Sum of payments today | `/app/payments` |

### Greeting copy

- Title: `greetingClinic` — “Hello Dr. {name}!”
- Sub: `greetingClinicSub` — “Today's patient queue”

### Shared widgets (clinic-relevant behaviour)

| Widget | Clinic-specific logic |
|--------|----------------------|
| **Health Score** | Uses **attendance rate** (completed vs no-shows), not salon repeat rate. `hub.service.ts` ~806–812. Plus+ gated. |
| **Revenue Leakage** | Includes pending follow-up leads. Plus+ gated. |
| **Leads & tickets** | Same pipeline as all categories |
| **Plan usage bars** | Free: 50 customers, 1 staff, 50 bookings/mo |

---

## Queue screen (`/app/queue`)

**UI:** `apps/web/src/app/app/queue/page.tsx`  
**API:** `GET /hub/queue`

Lightweight view over today's `Appointment` records — **no separate queue model**.

| Section | Logic |
|---------|-------|
| Current | In-consultation / active patient |
| Waiting | Confirmed today, sorted by `startAt` |
| Completed | Status COMPLETED today |
| Missed | NO_SHOW or CANCELLED today |
| Wait estimate | Derived from queue position + service duration |

Actions: confirm, complete, no-show, reschedule (links to bookings).

---

## API reference (clinic-relevant)

All tenant routes: JWT + `businessId` from auth (never from body).

### Hub

| Method | Path | Plan | Returns |
|--------|------|------|---------|
| GET | `/hub/clinic-snapshot` | None | `patientsToday`, `waitingCount`, `followUpsDue`, `noShowToday`, `revenueTodayCents` |
| GET | `/hub/queue` | None | Today's queue rows |
| GET | `/hub/health` | Plus (`health_score`) | 0–100 score + actions |
| GET | `/hub/revenue-leakage` | Plus (`revenue_leakage`) | Estimated loss + links |
| GET | `/hub/reactivation` | Plus (`reactivation`) | 30/60/90-day inactive buckets |
| GET | `/hub/dashboard` | None | Generic stats + schedule |

### Settings

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/settings/follow-ups` | JWT | Read 7/15/30/90 toggles |
| PATCH | `/settings/follow-ups` | BUSINESS_ADMIN | Update toggles. Stored as `BusinessFeature` keys `followup_7`, etc. |

Settings hub link to follow-ups **only shown when** `categoryKey === "clinic"` (`settings/page.tsx`).

### Staff (doctor fields)

When UI detects clinic category, staff form shows:

- Title (Dr., etc.)
- Specialization
- Consultation fee (₹, stored as cents)
- Default consultation duration

**API:** `POST/PATCH /staff` — fields on `Staff` model, no server-side category check.

### Customers (patients)

Same as all categories. Labels say “patient” in queue UI only.

| Method | Path | Limit |
|--------|------|-------|
| GET/POST | `/customers` | Free ≤50 customers |
| GET | `/customers/:id/timeline` | Appointments, leads, tickets, payments (last 20 each) |

### Public booking

| Method | Path | Notes |
|--------|------|-------|
| GET | `/public/business/:slug` | Services list |
| GET | `/public/business/:slug/slots` | Supports `staffId` param — **UI does not expose doctor picker** |
| POST | `/public/business/:slug/book` | Creates customer + PENDING appointment |

**Demo tenants** (`tenantType=DEMO`, e.g. `demo-city-care-clinic`): booking blocked.

---

## WhatsApp automations (clinic)

**Enqueue:** `apps/api/src/appointments/appointments.service.ts`  
**Process:** `apps/api/src/worker.ts`  
**Clinic follow-ups:** `apps/api/src/automation/automation.service.ts`

| Job / trigger | Template key | When | Clinic-only? |
|---------------|--------------|------|--------------|
| `reminder_24h` | `wa.reminder_24h` | 24h before appointment | All |
| `booking_confirm` | `wa.booking_confirm` | Status → CONFIRMED | All |
| `post_visit` | `wa.post_visit` | 24h after COMPLETED | All |
| **`clinic_followup`** | `wa.clinic_followup` | 7/15/30/90 days after COMPLETED | **Yes** — only if `category.key === 'clinic'` |
| `inactive_recovery` | `wa.inactive_recovery` | Daily cron, 45+ days inactive | All (customers, not leads) |

**Clinic follow-up message** supports `{doctorLine}` from assigned staff name.

**Dedup:** `FollowUpLog` model — unique per business/customer/kind/interval/appointment.

**Settings:** `/app/settings/follow-ups` toggles intervals. Default: **all intervals enabled** for clinic if no explicit flag set.

**Templates:** Editable by Super Admin at `/app/superadmin/content` (keys under `wa.*`). Requires WA session connected at `/app/whatsapp`.

---

## CRM & leads (clinic context)

Uses generic **Customer** model — no diagnosis, prescriptions, or EMR fields.

### Customer list filters (`/app/customers`)

- All · New (≤14 days) · Inactive (≥45 days) · VIP tag
- Hub links to inactive/missed patients

### Leads pipeline (`/app/leads`)

Stages: `NEW` → `INTERESTED` → `FOLLOW_UP` → `CONVERTED`

Hub “Follow-ups due” = leads not updated in 24–48 hours.

### Reactivation (`/app/reactivation`) — Plus+

Manual WhatsApp deep-links for 30/60/90-day **customer** inactivity buckets. Separate from automated `clinic_followup` jobs.

---

## Plan limits (clinic)

**Source:** `apps/api/src/plans/plan-limits.ts`

| Limit / feature | Free | Plus | Pro |
|-----------------|------|------|-----|
| Customers (patients) | 50 | Unlimited | Unlimited |
| Staff (doctors) | 1 | Unlimited | Unlimited |
| Bookings/month | 50 | Unlimited | Unlimited |
| Health score | ❌ | ✅ | ✅ |
| Revenue leakage | ❌ | ✅ | ✅ |
| Reactivation | ❌ | ✅ | ✅ |
| Queue dashboard | ✅ (ungated) | ✅ | ✅ |
| Clinic follow-up WA | ✅ (ungated) | ✅ | ✅ |
| WA template editing | ❌ | ✅ | ✅ |
| Advanced analytics | ❌ | ❌ | ✅ |

**Activation codes:** `PLUS90`, `PRO60`, etc. — enter at onboarding step 1 or Super Admin → `/app/superadmin/plans`.

---

## Business Success demo (no signup)

**URL:** [wa-booking-web.vercel.app/business-success?type=clinic](https://wa-booking-web.vercel.app/business-success?type=clinic)

**Data:** `apps/api/src/common/business-success-data.ts` — isolated demo tenant, never mixed with live data.

Shows: clinic stats, health score preview, revenue leakage, today's queue preview.

---

## Known gaps (for developers)

| Gap | Detail | Priority |
|-----|--------|----------|
| Queue not in bottom nav | Only Hub / More links | P2 UX |
| Queue + follow-ups not plan-gated | Doc says Plus+; code allows Free | P1 product decision |
| `follow_up_automation` unused | In plan-limits only | P1 |
| No doctor picker on public booking | API supports `staffId`; UI doesn't | P2 |
| Service template inconsistency | `seed.ts` vs `categories.service.ts` DEFAULT_TEMPLATES | P3 |
| Darbhanga path skips hours/services | Fast onboarding leaves defaults | P2 |
| No clinic-specific API module | Unlike coaching `/coaching/*` | By design |

---

## 5-minute demo script (field / sales)

1. Open `/business-success?type=clinic` → simulator
2. Sign up → **Clinic** + specialization (e.g. General Physician)
3. Copy booking link from Hub → book test appointment on phone
4. Show WhatsApp confirmation (if WA connected) or pending in `/app/bookings`
5. Confirm appointment → show patient in `/app/customers` timeline
6. Show `/app/queue` for today's patients
7. (Plus) Show Health Score + `/app/reactivation`

**Hindi pitch:**
> "Patient ko WhatsApp reminder automatic jayega. No-show kam hoga. Appointment ek jagah. Free mein shuru karein."

---

## Darbhanga acquisition targets

**Goal:** 15 clinics in 30 days (Darbhanga Sadar, Laheriasarai)

**Suggested field pricing:** Plus ₹499/mo · pilot code `PLUS90`
