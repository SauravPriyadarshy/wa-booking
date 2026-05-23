# User acceptance test (UAT) checklist

Use this document for **manual QA** of the WhatsApp-first booking + CRM product. Complete steps in order the first time you test a release; for smoke tests, run only the **Critical path** section.

**Prerequisites:** API on `:3000`, Web on `:3001`, database seeded. Credentials: see `User_Test_credential.md` in the repo root.

---

## 1. Critical path (smoke, ~5 minutes)

| Step | Action | Expected |
|------|--------|----------|
| 1.0 | Open `/`, tap **Start free with mobile**. | Lands on `/signup`. |
| 1.1 | Enter valid 10-digit mobile → **Get verification code**. | Step 2; demo shows code `1234`. |
| 1.2 | Enter code → **Continue**. | Token stored; redirect `/app` (or onboarding if no business). |
| 1.3 | *(Alternate)* `/login` as **business admin** (`demo_admin` / `password123`). | Redirect to `/app` (Hub). |
| 1.4 | Hub shows greeting with a **name** (not generic “there” if profile has a name). | Personalized greeting. |
| 1.5 | Tap **Today** KPI card (if shown). | Opens bookings **day** view for today. |
| 1.6 | Tap **Pending** KPI (if shown). | Opens bookings **list** filtered to pending. |
| 1.7 | Expand **Leads & tickets**. | **Current** shows **two lines**: weekday + date, then **time** (updates each second). |
| 1.8 | Each list row shows **Last activity** with **date line** then **time line** below it. | Clear separation; no scrambled date/time. |
| 1.9 | Tap **View** on a lead or ticket (if any). | Opens **Leads** or **Support** and **scrolls** to that row (highlight ring). |
| 1.10 | Open public page `/{business-slug}` (e.g. `/demo-salon`). | Services load; can complete a test booking. |
| 1.11 | On Hub, expand **Booking link** card: **Copy**, **Share**, **Print** (if browser allows). | QR renders; link matches public URL. |

---

## 2. Hub & dashboard

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Reload Hub; confirm **date** under greeting matches today. | Correct calendar date. |
| 2.2 | **Today’s schedule** row → tap item. | Goes to bookings day view for today. |
| 2.3 | **Calendar** link. | Same as above with today’s date in URL where applicable. |
| 2.4 | Workspace **module pills** (category strip). | Each opens a sensible route (bookings, staff, customers, etc.). |
| 2.5 | **Refresh hub** inside Leads & tickets. | Dashboard stats refresh without full page reload errors. |

---

## 3. Leads & tickets (Hub strip)

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | **Add lead** / **New ticket** (optional prompts). | Item appears after inbox refresh or manual refresh. |
| 3.2 | Change **stage** on a lead from Hub. | Stage updates; no error toast. |
| 3.3 | Change **status** on a ticket from Hub. | Status updates. |
| 3.4 | **Assign staff** on a ticket (if staff exist). | Assignment saves; dropdown reflects assignee after refresh. |
| 3.5 | Title row link (not the select). | Navigates to full list with hash; target row visible. |

---

## 4. Booking link & QR (admin)

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | As **business admin**, open **Create new booking link…** → confirm. | New slug; old public URL returns not found. |
| 4.2 | As **staff** (if test user exists): confirm **regenerate** control is **hidden**. | Staff cannot rotate slug from Hub. |
| 4.3 | **Print** opens a window with QR + business line + URL. | Pop-up not blocked; print dialog usable. |

---

## 5. Bookings & customers

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | `/app/bookings` — **Day** / **List** toggle. | Views switch; data loads. |
| 5.2 | URL `?date=YYYY-MM-DD&view=day`. | Opens correct day. |
| 5.3 | URL `?view=list&status=PENDING`. | List shows pending only (or empty state). |
| 5.4 | `/app/customers?filter=inactive`. | Inactive filter applied when present in UI. |

---

## 6. Roles

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Login as **super admin** (`admin`). | Can reach superadmin routes if enabled in build. |
| 6.2 | Login as **staff**. | Hub loads; restricted actions hidden or API returns 403 where appropriate. |

---

## 7. Regression notes

- After **slug regenerate**, update any **printed QR** materials in the real world; old codes stop working.
- **Leads & tickets** “Current” clock uses the **device** time zone (`en-IN` locale for formatting).

---

## Sign-off

| Date | Tester | Build / branch | Pass / fail | Notes |
|------|--------|----------------|---------------|-------|
| | | | | |
