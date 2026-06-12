# User acceptance test (UAT) checklist

Use this document for **manual QA** of the WhatsApp Business Assistant. Complete steps in order the first time you test a release; for smoke tests, run only the **Critical path** section.

**Prerequisites:** API on `:3000`, Web on `:3001`, database seeded. Credentials: see [`User_Test_credential.md`](../User_Test_credential.md).

**Production smoke:** [wa-booking-web.vercel.app](https://wa-booking-web.vercel.app)

---

## 1. Critical path (smoke, ~5 minutes)

| Step | Action | Expected |
|------|--------|----------|
| 1.0 | Open `/`, tap **Start free**. | Lands on `/signup`. |
| 1.0b | Open `/business-success`, pick Coaching. | Simulator loads (API or fallback); no crash on `.map`. |
| 1.1 | On `/signup`, pick WhatsApp or Email → **Get verification code**. | Step 2; demo code `1234` when SMS gateway not wired. |
| 1.2 | Enter code → **Continue**. | Token stored; redirect `/app` or onboarding. |
| 1.3 | *(Alternate)* `/login` as **business admin** (`demo_admin` / `password123`). | Redirect to `/app` (Hub). |
| 1.4 | Hub shows greeting with a **name** (not generic “there” if profile has a name). | Personalized greeting. |
| 1.5 | On **Free plan**: usage bars visible (customers, staff, bookings). | PlanUsageBar shown. |
| 1.6 | Tap **Today** KPI card (if shown). | Opens bookings **day** view for today. |
| 1.7 | Expand **Leads & tickets**. | **Current** shows **two lines**: weekday + date, then **time**. |
| 1.8 | Open public page `/{business-slug}` (e.g. `/demo-salon`). | Services load; can complete a test booking. |
| 1.9 | On Hub, expand **Booking link** card: **Copy**, **Share**, **Print**. | QR renders; link matches public URL. |
| 1.10 | Toggle language **EN · हिं**. | UI strings change; no layout break. |

---

## 2. Hub & dashboard

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Reload Hub; confirm **date** under greeting matches today. | Correct calendar date. |
| 2.2 | **Today’s schedule** row → tap item. | Goes to bookings day view for today. |
| 2.3 | Workspace **module pills** (category strip). | Each opens sensible route. |
| 2.4 | **Free plan:** Health score shows upgrade banner. | UpgradeBanner with Plus CTA. |
| 2.5 | **Plus plan** (redeem `PLUS90`): Health score widget loads. | Score 0–100 with actions. |
| 2.6 | **Plus plan:** Revenue leakage widget loads. | Estimated loss + action links. |

---

## 3. Plan gating & activation codes

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | As Free user, open `/app/reactivation`. | Upgrade prompt (Plus required). |
| 3.2 | Redeem `PLUS90` during onboarding or via API. | Plan changes to Plus; features unlock. |
| 3.3 | `GET /plans/me` (authenticated). | Returns plan, limits, usage counts. |
| 3.4 | Super Admin → `/app/superadmin/plans`. | List/create activation codes. |
| 3.5 | Free plan: add 51st customer. | API returns 403 or limit error. |

---

## 4. Business Success & AI Guide

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | `/business-success` — pick each business type. | Simulator loads per type (API or fallback). |
| 4.2 | Tap 💬 **AI Business Guide** on landing or business-success. | Chat opens; keyword answers (no external API). |
| 4.3 | Demo tenant public URL (e.g. `demo-darbhanga-career-academy`). | Booking blocked (read-only demo). |

---

## 5. Coaching module (Plus+, category = coaching)

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | `/app/students` — list loads. | Students with attendance % and fee badges. |
| 5.2 | `/app/fees` — dashboard. | Overdue fees, collection stats. |
| 5.3 | `/app/students/attendance` — mark attendance. | Bulk mark saves. |
| 5.4 | Free plan + coaching category: open `/app/students`. | Upgrade banner or 403 from API. |

---

## 6. Clinic module

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | `/app/queue` (clinic category, Plus+). | Current, waiting, completed patients. |
| 6.2 | `/app/customers` — patient tags (VIP, Regular, etc.). | Tags visible and editable. |

---

## 7. Leads & tickets (Hub strip)

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | Change **stage** on a lead from Hub. | Stage updates; no error toast. |
| 7.2 | Title row link (not the select). | Navigates to full list with hash; target row visible. |

---

## 8. Booking link & QR (admin)

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | As **business admin**, regenerate booking link. | New slug; old public URL returns not found. |
| 8.2 | As **staff**: confirm **regenerate** control is **hidden**. | Staff cannot rotate slug from Hub. |

---

## 9. Roles

| Step | Action | Expected |
|------|--------|----------|
| 9.1 | Login as **super admin** (`admin` / `Test@123`). | Superadmin routes accessible. |
| 9.2 | Login as **staff**. | Hub loads; restricted actions hidden or 403. |

---

## 10. SEO & localization

| Step | Action | Expected |
|------|--------|----------|
| 10.1 | `/city/darbhanga`, `/city/samastipur`. | City SEO pages render with metadata. |
| 10.2 | `/sitemap.xml`. | Includes city pages and `/business-success`. |
| 10.3 | Hindi (`hi`) locale on landing. | Natural Hinglish copy; switcher shows EN · HI. |

---

## Regression notes

- After **slug regenerate**, update any **printed QR** materials; old codes stop working.
- **Leads & tickets** “Current” clock uses the **device** time zone (`en-IN` locale).
- Demo tenants (`tenantType=DEMO`) must never accept public bookings.

---

## Sign-off

| Date | Tester | Build / branch | Pass / fail | Notes |
|------|--------|----------------|---------------|-------|
| | | | | |
