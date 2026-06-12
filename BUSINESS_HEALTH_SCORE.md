# Business Health Score

**Score range:** 0–100 · **Updated:** June 2026

The Business Health Score appears on the Hub (`/app`) for **Plus and Pro plans** and is computed from existing data — no manual input required. Free plan users see an upgrade banner instead.

**Hindi label:** व्यवसाय स्थिति रिपोर्ट

## Score Levels

| Score | Level | Meaning |
|-------|-------|---------|
| 90–100 | Excellent | Business running smoothly |
| 70–89 | Good | Minor improvements possible |
| 50–69 | Needs Attention | Action recommended this week |
| 0–49 | Critical | Immediate action required |

## Category-Specific Calculation

### Salon / Barber / Spa / Default

- **Repeat customer %** (up to +25): customers with a booking in last 30 days
- **Staff utilization** (up to +15): completed appointments vs staff capacity
- **WhatsApp connected** (+15)
- **Penalties:** pending payments (−5 each, max −15), overdue leads (−3 each, max −15), no staff available (−10)

**Recommendations:** Contact missed customers, Reconnect WhatsApp, Verify payments, Improve follow-ups

### Clinic

- **Appointment attendance rate** (up to +30): completed vs total (excluding no-shows)
- **WhatsApp connected** (+15)
- **Penalties:** no-shows, overdue follow-ups, pending payments

**Recommendations:** Follow up missed patients, Complete follow-ups, Reconnect WhatsApp

### Coaching Center

- **Fee collection %** (up to +25): paid fees vs total fees due in 30 days
- **Student attendance %** (up to +20): active students with recent attendance
- **WhatsApp connected** (+15)
- **Penalties:** pending payments, overdue leads

**Recommendations:** Collect pending fees, Reconnect WhatsApp, Improve follow-ups

## API

```
GET /hub/health
Authorization: Bearer <token>
```

Response:
```json
{
  "score": 78,
  "level": "good",
  "categoryKey": "salon",
  "actions": [
    { "key": "followup", "label": "Improve follow-ups", "href": "/app/leads" }
  ]
}
```

## Revenue Leakage (Companion Widget)

```
GET /hub/revenue-leakage
```

Shows estimated revenue at risk from:
- Missed appointments (no-show + cancelled, 30 days)
- Pending follow-ups (leads overdue 48h+)
- Pending fees (coaching)
- Inactive customers (no booking 30+ days)
- Unanswered leads (NEW stage 24h+)

Each item includes a one-click action link. **Plus+ only** — Hindi label: संभावित छूटी हुई कमाई.

## Customer Reactivation (Companion Feature)

```
GET /hub/reactivation
```

Returns inactive customers in 30 / 60 / 90 day buckets with WhatsApp action links. **Plus+ only.** UI at `/app/reactivation`.

## Plan Gating

| Feature | Free | Plus | Pro |
|---------|------|------|-----|
| Health score | ❌ | ✅ | ✅ |
| Revenue leakage | ❌ | ✅ | ✅ |
| Reactivation engine | ❌ | ✅ | ✅ |
| Advanced analytics | ❌ | ❌ | ✅ |

Check current plan: `GET /plans/me`
