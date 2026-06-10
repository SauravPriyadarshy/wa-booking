# Clinic Strategy — Darbhanga Beta

**Product positioning:** Appointment + queue + follow-up assistant — NOT EMR, NOT telemedicine, NOT prescription software.

## What We Build (Phase 1 — Live)

Uses existing booking + CRM infrastructure:

| Feature | Status | Route |
|---------|--------|-------|
| Consultation booking | ✅ Live | `/demo-salon` style public page |
| Appointment calendar | ✅ Live | `/app/bookings` |
| Patient CRM | ✅ Live | `/app/customers` (tags, timeline, spend) |
| WhatsApp reminders | ✅ Live | Auto 24h reminder on booking |
| Follow-up leads | ✅ Live | `/app/leads` pipeline |
| Clinic Health Score | ✅ Live | `/hub/health` (attendance-based) |
| Payment verification | ✅ Live | `/app/payments` |

## What We Do NOT Build

- Electronic Medical Records (EMR/EHR)
- Prescription writing
- Lab report management
- Telemedicine video calls
- Insurance billing
- Hospital bed management

## Clinic-Specific Setup (Auto on Category Select)

Default services seeded:
- Consultation (15 min)
- Follow-up Visit (10 min)
- Health Check (20 min)

## Follow-Up Automation (Roadmap)

| Interval | Use Case |
|----------|----------|
| 7 days | Post-consultation check-in |
| 15 days | Chronic condition follow-up |
| 30 days | Routine review |
| 90 days | Annual check reminder |

Implementation: BullMQ delayed jobs using `inactive_recovery` template pattern.

## Queue Screen (Roadmap — Phase 2)

Planned lightweight queue view at `/app/queue`:
- Current patient (in consultation)
- Waiting list (confirmed today, sorted by time)
- Completed / Missed counts
- Estimated wait time

No new database models required — uses existing `Appointment` with status filters.

## Darbhanga Clinic Acquisition

**Target:** 15 clinics in 30 days (Darbhanga Sadar, Laheriasarai)

**Pitch (Hindi):**
> "Patient ko WhatsApp reminder automatic jayega. No-show 50% kam. Appointment register ek jagah. Free mein shuru karein."

**Demo flow (5 min):**
1. Create clinic business → services auto-fill
2. Book one test appointment from public link
3. Show WhatsApp confirmation
4. Show patient in CRM with visit history

## Pricing

| Plan | Price | For |
|------|-------|-----|
| Free | ₹0 | Solo doctor, ≤30 patients/month |
| Pro | ₹499/mo | Clinic with 2+ doctors, WhatsApp automation |
| Clinic Plus | ₹799/mo | Multi-doctor, follow-up automation, analytics |
