# Coaching Center Strategy — Developer Reference

**Last updated:** 12 June 2026  
**Product positioning:** Lightweight coaching operations CRM — **NOT** an LMS, NOT online learning.

**Plan requirement:** Students, fees, and attendance APIs require **Plus or Pro** (`coaching_module`, `attendance`, `fee_tracking`).

**Related:** [Clinic Strategy](./CLINIC_STRATEGY.md) · [PLANS.md](./PLANS.md) · [User_Test_credential.md](./User_Test_credential.md)

---

## How coaching works in the codebase

Coaching has a **dedicated NestJS module** at `apps/api/src/coaching/` with Prisma models `Student`, `StudentAttendance`, and `FeeRecord`. It sits alongside the shared booking/CRM platform — **students are separate from customers** (no auto-link when someone books a Demo Class).

**Key files:**

| Area | Path |
|------|------|
| API module | `apps/api/src/coaching/coaching.controller.ts`, `coaching.service.ts`, `coaching.dto.ts` |
| Prisma models | `apps/api/prisma/schema.prisma` (`Student`, `StudentAttendance`, `FeeRecord`) |
| Migration | `apps/api/prisma/migrations/20260610135244_add_customer_tags_birthday_coaching_module/` |
| Plan limits | `apps/api/src/plans/plan-limits.ts` |
| Hub snapshot | `apps/api/src/hub/hub.service.ts` (`coachingSnapshot`, health coaching branch) |
| Hub UI | `apps/web/src/components/app/hub-dashboard.tsx` |
| Students UI | `apps/web/src/app/app/students/` |
| Fees UI | `apps/web/src/app/app/fees/page.tsx` |
| Attendance UI | `apps/web/src/app/app/students/attendance/page.tsx` |
| Subcategory seeds | `apps/api/src/common/subcategory-seeds.ts` |
| Onboarding | `apps/web/src/app/app/onboarding/page.tsx` |
| Darbhanga pack | `apps/web/src/lib/darbhanga-pack.ts` |
| Public booking | `apps/web/src/app/[slug]/booking-client.tsx` |
| Business Success demo | `apps/api/src/common/business-success-data.ts` |

---

## Target customer

- Local coaching centers (Class 6–12, competitive exams)
- Home tutors with 20–200 students
- Fee collection via cash/UPI; attendance on paper registers today

---

## What we build vs what we do NOT build

### ✅ In scope (live)

| Module | Route | API | Plan |
|--------|-------|-----|------|
| Student list + add | `/app/students` | `GET/POST /coaching/students` | Plus+ |
| Student profile | `/app/students/[id]` | `GET/PATCH /coaching/students/:id` | Plus+ |
| Bulk attendance | `/app/students/attendance` | `POST /coaching/attendance/bulk` | Plus+ (`attendance`) |
| Fee dashboard | `/app/fees` | `GET /coaching/fees/dashboard` | Plus+ (`fee_tracking`) |
| Mark fee paid | `/app/fees`, student detail | `PATCH /coaching/fees/:id/paid` | Plus+ |
| Create fee record | — (API only) | `POST /coaching/fees` | Plus+ — **no UI yet** |
| Hub coaching KPIs | `/app` | `GET /hub/coaching-snapshot` | **Free** (ungated) |
| Health Score (coaching formula) | Hub widget | `GET /hub/health` | Plus+ |
| Revenue Leakage (pending fees) | Hub widget | `GET /hub/revenue-leakage` | Plus+ |
| Public class booking | `/{slug}` | `POST /public/business/:slug/book` | Free (50 bookings/mo) |
| Demo Class / Regular Class services | Public + `/app/services` | From category template | Free |

### ❌ Out of scope

- Video classes / LMS / course content
- Online exams / test series platform
- Parent portal login
- Automated fee WhatsApp jobs (planned — manual `wa.me` only today)
- Student ↔ Customer sync from demo-class bookings

---

## Onboarding flow

### Standard path (5 steps)

**UI:** `apps/web/src/app/app/onboarding/page.tsx`

| Step | User action | API |
|------|-------------|-----|
| 1 | Business name, phone, optional activation code (`PLUS90`) | — |
| 2 | Select **Coaching Center** + **specialization** (required) | `GET /categories` + sync if empty |
| 2b | If “Other” → custom specialization text | — |
| 2c | Continue | `POST /businesses` → auto-seeds services |
| 3 | Review/edit services (Demo Class, Regular Class, Doubt Session) | `GET /services` |
| 4 | Business hours | `POST /settings/hours` (Mon–Sat 9–18, Sun closed) |
| 5 | Optional staff | `POST /staff` → Hub |

### Darbhanga fast path (2 steps)

**URL:** `/signup?ref=darbhanga&pack=coaching`

| Step | Content |
|------|---------|
| 1 | Shop name + pack selection (Coaching Pack) |
| 2 | Create business → booking link + WhatsApp share text |

**Skips:** subcategory, services, hours, staff, activation code UI. Category forced to `coaching`.

### Coaching specializations (subcategories)

**Source:** `apps/api/src/common/subcategory-seeds.ts`

NEET · JEE · UPSC · BPSC · SSC · Railway · Spoken English · Computer Training · School Coaching · Tuition Center · Other

### Default services (auto-created)

| Service | Duration |
|---------|----------|
| Demo Class | 60 min |
| Regular Class | 60 min |
| Doubt Session | 30 min |

No default prices — duration only. Edit at `/app/services`.

---

## User journey map (coaching owner)

```
Signup (OTP → password)
  → Onboarding (Coaching Center + specialization, redeem PLUS90 for module access)
  → Hub (/app)
       ├─ Coaching Today KPIs (Free — visible even before Plus)
       ├─ Health Score / Revenue Leakage (Plus+)
       └─ Booking link

Daily operations (Plus+ for module pages)
  ├─ /app/students              — list, search, batch filter, add student
  ├─ /app/students/[id]         — attendance calendar, fees, parent WhatsApp
  ├─ /app/students/attendance   — bulk present/absent for a date
  ├─ /app/fees                  — overdue dashboard, mark paid, manual WA remind
  ├─ /app/bookings              — demo class / regular class appointments
  ├─ /app/customers             — generic CRM (parents who booked online)
  ├─ /app/reactivation          — inactive *customers* only (not students)
  └─ /app/whatsapp              — connect for booking automations

Parent / prospect (public)
  └─ /{business-slug}           — book Demo Class / Regular Class / Doubt Session
```

**Navigation:** Students and Fees are **not** in bottom nav (Hub · Bookings · Customers · More). Access via:

- Hub “Coaching Today” cards
- `/app/more` — when `categoryKey === "coaching"` AND plan has `coaching_module`
- Direct URLs

---

## Hub widgets (coaching category)

**File:** `apps/web/src/components/app/hub-dashboard.tsx`  
**Data:** `GET /hub/coaching-snapshot` (**no plan gate** — Free users see KPIs but get 403 on module pages)

### Coaching-only section — “Coaching Today”

| Card | Metric | Links to |
|------|--------|----------|
| Students | Active student count | `/app/students` |
| Fees Due | Count + ₹ total pending | `/app/fees` |
| Attendance | Today's attendance % | `/app/students` |
| New Admissions | Admits in last 30 days | `/app/students` |

### Greeting copy

- Title: `greetingCoaching`
- Sub: `greetingCoachingSub` — “Today's classes”

### Plus widgets (coaching-specific logic)

| Widget | Coaching formula |
|--------|------------------|
| **Health Score** | Fee collection %, students with recent attendance, pending fees penalty. `hub.service.ts` |
| **Revenue Leakage** | Includes `pendingFees` from `FeeRecord` table |

---

## API reference (`/coaching/*`)

**Module:** `apps/api/src/coaching/`  
**Guards:** `JwtUserGuard` + `RequireBusinessGuard` on all routes  
**Tenant rule:** every query filters by authenticated `businessId`

| Method | Path | Plan feature | Purpose |
|--------|------|--------------|---------|
| GET | `/coaching/students` | `coaching_module` | List + 30d attendance % + pending fee count |
| POST | `/coaching/students` | `coaching_module` | Create student |
| GET | `/coaching/students/:id` | `coaching_module` | Detail + 60 attendance rows + 24 fee rows |
| PATCH | `/coaching/students/:id` | `coaching_module` | Update / deactivate |
| POST | `/coaching/attendance` | `attendance` | Single day upsert |
| POST | `/coaching/attendance/bulk` | `attendance` | Body: `{ dateISO, records: [{ studentId, present }] }` |
| GET | `/coaching/fees/dashboard` | `fee_tracking` | Stats + top 20 pending |
| POST | `/coaching/fees` | `fee_tracking` | Create fee record |
| PATCH | `/coaching/fees/:id/paid` | `fee_tracking` | Mark paid + timestamp |

### Related hub APIs

| Method | Path | Plan | Notes |
|--------|------|------|-------|
| GET | `/hub/coaching-snapshot` | None | Hub KPIs |
| GET | `/hub/health` | `health_score` | Coaching-weighted score |
| GET | `/hub/revenue-leakage` | `revenue_leakage` | Pending fees included |
| GET | `/me`, `/me/ui` | — | `categoryKey`, `planFeatures` for UI gating |

---

## Database models

**Schema:** `apps/api/prisma/schema.prisma`

### `Student`

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Student name |
| `parentName` | string? | |
| `phone` | string? | Parent WhatsApp |
| `classGrade` | string? | e.g. "Class 10" |
| `batch` | string? | e.g. "NEET 2026" |
| `course` | string? | |
| `isActive` | boolean | Soft deactivate |
| `admissionAt` | DateTime | |

Indexes: `[businessId, isActive]`, `[businessId, batch]`

### `StudentAttendance`

| Field | Type | Notes |
|-------|------|-------|
| `studentId` | FK | Cascade delete |
| `dateISO` | string | `YYYY-MM-DD` |
| `present` | boolean | |

Unique: `[studentId, dateISO]`

### `FeeRecord`

| Field | Type | Notes |
|-------|------|-------|
| `studentId` | FK | |
| `amountCents` | int | ₹ stored as cents |
| `dueDate` | DateTime | |
| `paidAt` | DateTime? | null = pending |
| `month` | string | e.g. `"2026-06"` |
| `notes` | string? | |

**No seed data** for demo students — demo tenants are empty; simulator uses static JSON in `business-success-data.ts`.

---

## UI pages (detailed)

### `/app/students`

- Search by name/phone/batch
- Batch filter chips
- Badges: attendance % (30d), pending fee count
- Add student form: name, parent, phone, class, batch, course
- Tap row → student detail

### `/app/students/[id]`

- **Attendance tab:** 30-day calendar heatmap
- **Fees tab:** history, mark paid button
- **Info tab:** read-only fields (edit API exists, UI not wired)
- **WhatsApp Parent:** opens `wa.me/{phone}`

### `/app/students/attendance`

- Pick date
- List active students with Present / Absent toggles
- Bulk save → `POST /coaching/attendance/bulk`

⚠️ **Known bug:** UI may send `{ entries }` while API expects `{ dateISO, records }` — verify before relying on bulk save in production.

### `/app/fees`

- Summary cards: collected this month, pending count, overdue amount
- Pending list with student name, month, amount, due date
- **Mark paid** → `PATCH /coaching/fees/:id/paid`
- **Remind** → manual `wa.me` with text `"Fee reminder for {month}"`

**Missing:** form to create new fee records (`POST /coaching/fees`).

---

## WhatsApp automations

### Live (appointment-based — all categories)

| Job | Template | Trigger |
|-----|----------|---------|
| `booking_confirm` | `wa.booking_confirm` | Appointment CONFIRMED |
| `reminder_24h` | `wa.reminder_24h` | 24h before class |
| `post_visit` | `wa.post_visit` | 24h after COMPLETED |
| `inactive_recovery` | `wa.inactive_recovery` | Cron — **customers** 45+ days inactive |

Templates use `{service}`, `{customerName}` — works for “Demo Class” bookings.

### Manual only (coaching-specific today)

| Action | Where | Mechanism |
|--------|-------|-----------|
| Fee reminder | `/app/fees` | Hardcoded `wa.me` text |
| Contact parent | `/app/students/[id]` | `wa.me/{phone}` |

### Planned (not implemented)

| Trigger | Message | Status |
|---------|---------|--------|
| Fee due in 3 days | Parent reminder | Template slot in Super Admin; no worker job |
| Class tomorrow | Class reminder | Planned |
| Fee overdue 7 days | Overdue notice | Planned |
| New admission | Welcome message | Planned |

Editable templates: Super Admin → `/app/superadmin/content` (`wa_templates` group). Requires Plus+ for in-app template editing feature.

---

## Plan limits (coaching)

**Source:** `apps/api/src/plans/plan-limits.ts`

| Feature key | Free | Plus | Pro |
|-------------|------|------|-----|
| `coaching_module` (students CRUD) | ❌ | ✅ | ✅ |
| `attendance` | ❌ | ✅ | ✅ |
| `fee_tracking` | ❌ | ✅ | ✅ |
| `health_score` | ❌ | ✅ | ✅ |
| `revenue_leakage` | ❌ | ✅ | ✅ |
| `reactivation` | ❌ | ✅ | ✅ |
| `wa_templates` | ❌ | ✅ | ✅ |
| `advanced_analytics` | ❌ | ❌ | ✅ |
| Hub coaching KPIs (snapshot) | ✅ | ✅ | ✅ |
| Public booking | ✅ (50/mo) | ✅ | ✅ |
| Customers (CRM) | 50 max | Unlimited | Unlimited |
| Staff | 1 max | Unlimited | Unlimited |

**Students do not count** toward the 50-customer Free limit, but module APIs return 403 without Plus.

**UI gating:** `apps/web/src/app/app/more/page.tsx`:

```typescript
(cat === "coaching" || enabled.has("coaching")) && planFeatures.has("coaching_module")
```

Super Admin can also enable per-business `coaching` feature flag.

**Activation codes:** `PLUS90` (90 days Plus) · `PRO60` (60 days Pro) — onboarding step 1 or Super Admin.

---

## Public booking flow (coaching)

**Files:** `apps/web/src/app/[slug]/booking-client.tsx`, `apps/api/src/public/public.controller.ts`

Same UX as salon/clinic — **not** a student enrollment flow:

1. Load business + services (`GET /public/business/:slug`)
2. Pick **Demo Class** / **Regular Class** / **Doubt Session**
3. Pick date + slot (`GET .../slots?serviceId=&date=`)
4. Enter name + phone
5. `POST .../book` → creates **Customer** + **Appointment** (PENDING or CONFIRMED)

Post-booking: standard WA jobs if connected. **Does not create a Student record.**

Demo slugs (`demo-darbhanga-career-academy`, etc.): `tenantType=DEMO` → booking blocked.

---

## Business Success demo (no signup)

**URL:** [wa-booking-web.vercel.app/business-success?type=coaching](https://wa-booking-web.vercel.app/business-success?type=coaching)

Interactive simulator: student count, fee collection, attendance %, health score preview, revenue leakage.

**Offline fallback:** static data if API unreachable (`business-success-client.tsx`).

---

## Known gaps (for developers)

| Gap | Detail | Priority |
|-----|--------|----------|
| No fee creation UI | `POST /coaching/fees` unused | P1 |
| No student edit UI | `PATCH` exists; Info tab read-only | P2 |
| Attendance bulk API mismatch | UI payload vs API contract | P0 bug |
| Students ≠ Customers | Demo bookings don't create students | P2 product |
| No automated fee WA jobs | Manual links only | P1 |
| Hub KPIs on Free, modules 403 | Confusing UX | P2 |
| Students not in bottom nav | Discoverability | P2 |
| Reactivation is customer-only | No student dropout tracking | P3 |
| Darbhanga skips Plus code UI | Fast path has no activation field | P2 |

---

## 10-minute demo script

1. `/business-success?type=coaching` → simulator (no signup)
2. Sign up → **Coaching Center** + NEET (or JEE)
3. Enter **`PLUS90`** at step 1 → unlock module
4. `/app/students` → add 3 students (name, batch, parent phone)
5. `/app/students/attendance` → mark today present/absent
6. `/app/fees` → view dashboard (create fees via API or seed for demo)
7. `/app/whatsapp` → connect → book Demo Class from public link → show WA confirm
8. Hub → Health Score + Revenue Leakage

---

## Pricing (platform tiers)

| Plan | Suggested field price | Includes |
|------|----------------------|----------|
| Free | ₹0 | Booking, 50 customers, Hub KPIs (view only for module) |
| Plus | ₹499/mo suggested | Students, fees, attendance, health score, reactivation |
| Pro | ₹999/mo suggested | Plus + analytics, exports, AI guide |

**Darbhanga beta goal:** 20 centers in 30 days · 10 with ≥20 students · 5 WA connected · 3 tracking ≥80% fees in app
