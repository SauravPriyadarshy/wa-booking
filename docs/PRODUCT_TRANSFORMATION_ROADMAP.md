# Product transformation roadmap

**Charter:** Evolve this monorepo into a **commercially sustainable, production-grade, WhatsApp-first operational assistant** for Indian SMB service businesses (Tier-2/Tier-3, non-technical owners).

**North-star feeling:** *“I cannot smoothly operate my business without this.”*

**Success metric (verbatim goal):** *“This software saves me time, reduces stress, and helps me retain customers.”*

**Execution rule:** Preserve PostgreSQL, multi-tenant model, Redis, WhatsApp worker, Vercel deployment, and **aggressive simplicity** — no ERP creep, no dashboard overload.

---

## What already exists (foundation)

| Area | Repo reality (baseline) |
|------|-------------------------|
| Design tokens | `apps/web/src/app/globals.css` — Plus Jakarta Sans, emerald/zinc palette, radii, shadows |
| Mobile shell | App routes, bottom nav, FAB, sheets |
| Hub | Stats, schedule, WhatsApp strip, industry module pills, booking link + QR, leads/tickets inbox |
| WhatsApp | Connect flow, inbox, quick replies, worker path |
| Bookings / CRM | Day/list, customers, timeline direction |
| Support | Lightweight tickets, assign staff |
| Retention (scaffold) | `apps/web/src/lib/retention-triggers.ts`, `apps/api/src/messaging/retention-templates.ts` — templates/reference, jobs to wire |
| Onboarding | Multi-step business setup |
| Roles | `BUSINESS_ADMIN`, `STAFF`, `SUPER_ADMIN` — UI gated via `/me` + `/me/ui` |

Use this document to **sequence** work; do not attempt all sections in one release.

---

## Phased plan (recommended)

### Phase 0 — Definition (1–2 weeks)

- Lock **ICP** (salon vs clinic vs home service) priority order for Darbhanga/Mohali-style markets.
- **3-tap audit:** list top 10 daily actions; measure taps today; define target per action.
- **Visual north star:** moodboard (Linear / Notion / Stripe / Fresha) → extract *patterns* (spacing, hierarchy, empty states), not pixel-clone.

**Maps to:** Sections 1 (principles), 15 (rules), 17 (metric).

---

### Phase 1 — Design system & shell (2–4 weeks)

- **Single source of truth** for: page padding, card radius, heading scale, body text min size (≥15px where readable), button heights (44px touch).
- Extend `globals.css` tokens only where Tailwind doesn’t cover; avoid duplicate magic numbers in screens.
- **Empty states + loading:** every primary route gets calm copy + one primary action (already started on Hub/bookings — extend).
- **Motion budget:** one transition pattern (150–200ms), no gratuitous animation.

**Maps to:** Sections 1, 9, 14.

---

### Phase 2 — Daily operational dependency (3–6 weeks)

- Hub is the **default home**: today-first, not analytics-first.
- **Queues:** pending confirm, needs reply, follow-ups due, payments pending — each with deep link + optional push-style badge counts.
- **Staff day view:** “my column” for STAFF role (reduce admin noise).

**Maps to:** Sections 2, 6 (surface-level “insights” only), 13.

---

### Phase 3 — WhatsApp continuity (4–8 weeks)

- Message templates for: confirm, remind, reschedule, cancel, payment nudge, review, “book again”.
- **Human tone:** short, Hinglish-friendly optional variants, no spam cadence (rate limits + quiet hours).
- Link every outbound message to **booking/customer** in CRM timeline.

**Maps to:** Section 3, parts of 8.

---

### Phase 4 — Retention automation engine (6–10 weeks)

- **Job runner:** Bull/Redis schedules + idempotent sends + audit log.
- Triggers: inactive 45/60d, service interval (“haircut due?”), birthday (if captured), post-visit feedback, loyalty nudge.
- **Opt-in & compliance:** business toggles per template; customer opt-out stored.

**Maps to:** Section 4; builds on existing retention template files.

---

### Phase 5 — Business memory (ongoing, 4–8 weeks per slice)

- Unified **customer object**: bookings + payments + WhatsApp threads + tickets + notes + tags.
- **Revisit pattern** inference (simple rules before ML): last service, median gap, staff preference.
- “Loyalty score” v1 = heuristic (visit count + recency + spend), not black-box AI.

**Maps to:** Section 5.

---

### Phase 6 — Lightweight operational “AI” (4–6 weeks)

- **Rule-based suggestions** first (cheaper, explainable): low bookings tomorrow, open tickets >48h, staff double-booked.
- Optional LLM later for *copy* only, not for scheduling truth.

**Maps to:** Section 6.

---

### Phase 7 — Industry packs (6+ weeks)

- Already have **category keys** and hub module mapping — extend to: **default dashboard widgets**, **terminology** (patient vs client), **hidden nav items**.
- Validate with one pilot per vertical.

**Maps to:** Section 7.

---

### Phase 8 — Onboarding ≤5 minutes (2–4 weeks)

- Instrument funnel: signup → business → services → WA connect → first booking.
- **Skip paths:** “I’ll connect WhatsApp later” with clear reminder card on Hub.
- Optional **demo data** toggle (seed mini calendar) for training mode only.

**Maps to:** Section 10.

---

### Phase 9 — Performance & reliability (continuous)

- Prisma: `select` only needed fields; N+1 audit on Hub + day view.
- Redis: cache public business payload, rate-limit WA sends.
- Web: route-level loading, optimistic PATCH for status/stage where safe.

**Maps to:** Section 11.

---

### Phase 10 — Support + roles polish (2–4 weeks)

- Ticket ↔ customer link; labels; “resolved” closes loop on timeline.
- Staff UI: **tasks-only** shell variant (fewer tabs, same codebase).

**Maps to:** Sections 12, 13.

---

## Section crosswalk (prompt § → workstream)

| § | Theme | Primary phase |
|---|--------|----------------|
| 1 | Full UI/UX redesign | 1 |
| 2 | Daily operational dependency | 2 |
| 3 | WhatsApp-first | 3 |
| 4 | Retention automation | 4 |
| 5 | Business memory | 5 |
| 6 | Smart operational AI | 6 |
| 7 | Industry-specific | 7 |
| 8 | Extreme ease of use | 1–3 (continuous) |
| 9 | Premium trust | 1 |
| 10 | Onboarding | 8 |
| 11 | Performance | 9 |
| 12 | Support | 10 |
| 13 | Role-based UI | 2, 10 |
| 14 | Design system | 1 |
| 15 | Execution rules | All |
| 16 | Final outcome | All |
| 17 | Success metric | Phase 0 + analytics |

---

## Anti-patterns (do not ship)

- Dense data tables as default on mobile.
- More than **one** primary chart on Hub.
- Feature flags without business value (“because we can”).
- Robotic WhatsApp copy or >3 automated touches per week without cause.
- ERP vocabulary (orders, SKUs, warehouses) for salons/clinics.

---

## How to use this doc in PRs

1. Pick **one phase** and **one vertical slice** (e.g. “Phase 4: inactive 60d + one template + audit log”).
2. Link PR to a bullet under that phase.
3. Update **PRODUCT_GUIDE.md** + **docs/USER_TEST.md** when user-visible behavior changes.

---

## Document links

- [README](../README.md) — runbooks & env
- [PRODUCT_GUIDE](../PRODUCT_GUIDE.md) — demo narrative
- [USER_TEST](./USER_TEST.md) — QA checklist
- [User_Test_credential](../User_Test_credential.md) — demo logins
