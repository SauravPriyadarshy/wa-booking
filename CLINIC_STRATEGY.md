# Clinic Strategy — Darbhanga Beta

**Product positioning:** Appointment + queue + follow-up assistant — NOT EMR, NOT telemedicine, NOT prescription software.

## What We Build (Phase 1 — Live)

Uses existing booking + CRM infrastructure:

| Feature | Status | Route | Plan |
|---------|--------|-------|------|
| Consultation booking | ✅ Live | `/{slug}` public page | Free |
| Appointment calendar | ✅ Live | `/app/bookings` | Free |
| Patient CRM | ✅ Live | `/app/customers` (tags, timeline, spend) | Free |
| WhatsApp reminders | ✅ Live | Auto 24h reminder on booking | Free |
| Follow-up leads | ✅ Live | `/app/leads` pipeline | Free |
| Clinic Health Score | ✅ Live | `/hub/health` (attendance-based) | Plus+ |
| Revenue Leakage | ✅ Live | `/hub/revenue-leakage` | Plus+ |
| Patient reactivation | ✅ Live | `/app/reactivation` | Plus+ |
| Payment verification | ✅ Live | `/app/payments` | Free |
| Queue dashboard | ✅ Live | `/app/queue` | Plus+ (clinic category) |

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

Subcategories: General, Dental, Eye, Pediatric, etc.

## Queue Screen (`/app/queue`) — Live

Lightweight queue view:
- Current patient (in consultation)
- Waiting list (confirmed today, sorted by time)
- Completed / Missed counts
- Estimated wait time

Uses existing `Appointment` with status filters — no new database models.

## Follow-Up Automation (Roadmap)

| Interval | Use Case |
|----------|----------|
| 7 days | Post-consultation check-in |
| 15 days | Chronic condition follow-up |
| 30 days | Routine review |
| 90 days | Annual check reminder |

Implementation: BullMQ delayed jobs using `inactive_recovery` template pattern.

## Business Success Demo

No signup: [wa-booking-web.vercel.app/business-success?type=clinic](https://wa-booking-web.vercel.app/business-success?type=clinic)

## Darbhanga Clinic Acquisition

**Target:** 15 clinics in 30 days (Darbhanga Sadar, Laheriasarai)

**Pitch (Hindi):**
> "Patient ko WhatsApp reminder automatic jayega. No-show 50% kam. Appointment register ek jagah. Free mein shuru karein."

**Demo flow (5 min):**
1. Open `/business-success?type=clinic` → show simulator
2. Sign up → select Clinic category + subcategory
3. Book one test appointment from public link
4. Show WhatsApp confirmation
5. Show patient in CRM with visit history
6. Show queue at `/app/queue` (Plus+)

## Pricing (Platform Tiers)

| Plan | Price | For |
|------|-------|-----|
| Free | ₹0 | Solo doctor, ≤50 patients, 50 bookings/mo |
| Plus | Paid | Queue, health score, reactivation, follow-ups |
| Pro | Paid | Advanced analytics, exports, multi-staff |

**Darbhanga field suggestion:** Plus ₹499/mo · activation code `PLUS90` for anchor clinics.
