# Coaching Center Strategy — Darbhanga Beta

**Product positioning:** Lightweight coaching operations CRM — NOT an LMS, NOT online learning.

**Plan requirement:** Coaching module (students, fees, attendance) requires **Plus or Pro** plan.

## Target Customer

- Local coaching centers (Class 6–12, competitive exams)
- Home tutors with 20–200 students
- Fee collection via cash/UPI, attendance on paper registers

## Core Modules (Live)

| Module | Route | Purpose | Plan |
|--------|-------|---------|------|
| Students | `/app/students` | Student list with attendance % and fee badges | Plus+ |
| Student Profile | `/app/students/[id]` | Attendance calendar, fee history, parent WhatsApp | Plus+ |
| Fee Dashboard | `/app/fees` | Monthly collection, overdue tracking, WhatsApp remind | Plus+ |
| Attendance | `/app/students/attendance` | Bulk attendance marking | Plus+ |
| Today Workspace | `/app` | Coaching KPIs when `categoryKey = coaching` | Free (basic) |

## Coaching Dashboard KPIs (Hub)

When business category is **Coaching Center**, the Hub shows:
- Total active students
- Fees due (count + amount)
- Today's attendance %
- New admissions (last 30 days)
- Business Health Score (coaching formula — Plus+)
- Revenue Leakage widget (Plus+)

## Business Success Demo

No signup required: [wa-booking-web.vercel.app/business-success?type=coaching](https://wa-booking-web.vercel.app/business-success?type=coaching)

Interactive simulator with demo tenant data — isolated from live businesses.

## WhatsApp Automation

| Trigger | Message | Status |
|---------|---------|--------|
| Fee due in 3 days | Parent fee reminder | Template ready (Super Admin) |
| Class tomorrow | Class reminder to parent | Planned |
| Fee overdue 7 days | Overdue notice | Planned |
| New admission | Welcome message | Planned |

Templates editable via Super Admin → Content Editor (`wa_templates` group). Requires Plus+ for `wa_templates` feature.

## Pricing (Platform Tiers)

| Plan | Price | Includes |
|------|-------|----------|
| Free | ₹0 | Up to 50 students (as customers), basic booking, 1 staff |
| Plus | Paid | Unlimited students, fees, attendance, health score, reactivation |
| Pro | Paid | Everything Plus + advanced analytics, AI guide, exports |

**Darbhanga field pricing suggestion:** Plus ₹499/mo · Pro ₹999/mo for coaching centers with 50+ students.

**Activation codes for pilots:** `PLUS90` (90 days Plus) · `PRO60` (60 days Pro)

## Onboarding

**Standard:** 7-step wizard — select Coaching Center category + subcategory (JEE, NEET, CBSE, etc.)

**Darbhanga fast path:** `/signup?ref=darbhanga&pack=coaching` — 2 steps, pre-filled services

## 10-Minute Demo Script

1. Open `/business-success?type=coaching` → show simulator (no signup)
2. Sign up → select **Coaching Center** + subcategory
3. Redeem `PLUS90` during onboarding
4. Add 3 demo students (name, batch, phone)
5. Mark today's attendance at `/app/students/attendance`
6. Create one fee record at `/app/fees`
7. Connect WhatsApp → send test fee reminder
8. Show health score on Hub

## Success Metrics (Beta)

- 20 coaching centers registered in Darbhanga in 30 days
- 10 with ≥20 students added
- 5 with WhatsApp connected
- 3 with ≥80% fee collection tracked in app
