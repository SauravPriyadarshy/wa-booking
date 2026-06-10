# Coaching Center Strategy — Darbhanga Beta

**Product positioning:** Lightweight coaching operations CRM — NOT an LMS, NOT online learning.

## Target Customer

- Local coaching centers (Class 6–12, competitive exams)
- Home tutors with 20–200 students
- Fee collection via cash/UPI, attendance on paper registers

## Core Modules (Live)

| Module | Route | Purpose |
|--------|-------|---------|
| Students | `/app/students` | Student list with attendance % and fee badges |
| Student Profile | `/app/students/[id]` | Attendance calendar, fee history, parent WhatsApp |
| Fee Dashboard | `/app/fees` | Monthly collection, overdue tracking, WhatsApp remind |
| Today Workspace | `/app` | Coaching KPIs when `categoryKey = coaching` |

## Coaching Dashboard KPIs (Hub)

When business category is **Coaching Center**, the Hub shows:
- Total active students
- Fees due (count + amount)
- Today's attendance %
- New admissions (last 30 days)
- Business Health Score (coaching formula)

## WhatsApp Automation (Planned)

| Trigger | Message |
|---------|---------|
| Fee due in 3 days | Parent fee reminder |
| Class tomorrow | Class reminder to parent |
| Fee overdue 7 days | Overdue notice |
| New admission | Welcome message |

Templates editable via Super Admin → Content Editor (`wa_templates` group).

## Pricing for Darbhanga Market

| Plan | Price | Includes |
|------|-------|----------|
| Free | ₹0 | Up to 50 students, basic attendance |
| Pro | ₹499/mo | Unlimited students, fee reminders, analytics |
| Coaching Plus | ₹999/mo | Everything + parent WhatsApp automation |

## 10-Minute Onboarding Script

1. Sign up → select **Coaching Center** category
2. Add 3 demo students (name, batch, phone)
3. Mark today's attendance
4. Create one fee record for current month
5. Connect WhatsApp → send test fee reminder
6. Share coaching dashboard with owner

## Success Metrics (Beta)

- 20 coaching centers registered in Darbhanga in 30 days
- 10 with ≥20 students added
- 5 with WhatsApp connected
- 3 with ≥80% fee collection tracked in app
