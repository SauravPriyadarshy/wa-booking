# WhatsApp-first Booking + CRM: Product & Demo Guide

This guide provides a comprehensive overview of the platform's functionalities, user flows, and design philosophy. Intended for non-technical users, stakeholders, and demo presentations.

**Related:** [README](./README.md) (setup & deployment) · [PLANS.md](./PLANS.md) (dev status) · [Demo credentials](./User_Test_credential.md) · [Roadmap](./docs/PRODUCT_TRANSFORMATION_ROADMAP.md) · [UAT checklist](./docs/USER_TEST.md)

> **LIVE IN PRODUCTION** — Web: [https://wa-booking-web.vercel.app](https://wa-booking-web.vercel.app) | API: [https://wa-booking-api.vercel.app](https://wa-booking-api.vercel.app) | WA Worker: [https://wa-worker-dewp.onrender.com](https://wa-worker-dewp.onrender.com) | GitHub: [github.com/SauravPriyadarshy/wa-booking](https://github.com/SauravPriyadarshy/wa-booking)

---

## 1. Product Overview

Our platform is a **WhatsApp-first Booking and CRM system** for service-based Indian businesses (clinics, salons, spas, home services, coaching). It bridges the gap between casual WhatsApp conversations and professional business management — no app download needed for customers.

### Core Value Proposition
- **WhatsApp Integration**: Booking confirmations and reminders sent automatically on WhatsApp.
- **Self-Service Booking**: Customers book from a link or QR code in their browser — no signup.
- **Unified CRM**: Every customer interaction (chats, bookings, payments) in one timeline.
- **Mobile-First Design**: Optimised for business owners running everything from their phone.
- **Dynamic Content**: Super Admin can update all landing page text, SEO metadata, and WhatsApp templates from the app — no code changes needed.
- **Multilingual**: Hindi and English supported across the platform.

---

## 2. User Roles & Experiences

### A. The Customer (External User)
The customer books without creating an account.
- **Flow**: Scans a QR code or clicks a link → Selects Service → Picks Date & Time → Enters Name/Phone → **Booking confirmed** → Gets WhatsApp confirmation automatically.
- **New**: After booking, a **WhatsApp share button** lets them tell friends about the business.

### A2. New Business Owner (First Run)
- **Flow**: Landing page **Start free with mobile** → OTP on `/signup` → `/app` → **Onboarding** (business name, category, hours) → Hub.
- **Key Feature**: **Passwordless signup** for Indian mobiles (`+91…`), then guided 5-minute setup.

### B. The Business Admin (Salon/Clinic Owner)
The owner manages daily operations.
- **Flow**: Logs in → Checks **Hub** → Confirms bookings → Sends WhatsApp messages → Checks Analytics.
- **Key Feature**: **Hub** is the command center — today's bookings, leads, revenue, and quick actions in one screen.
- **Retention runs automatically**: Once WhatsApp is connected, booking confirmations, 24h reminders, and post-visit follow-ups are sent without any manual action.

### C. The Super Admin (Platform Owner)
The platform owner manages all businesses.
- **Flow**: Logs in → Manages businesses → Edits site content → Toggles feature flags.
- **Key Feature**: **Content Editor** at `/app/superadmin/content` — edit landing page text, SEO titles, WhatsApp message templates, and city page content directly from the app.

---

## 3. Key Functionalities (Step-by-Step)

### 🟢 Landing Page (Public Marketing)
- **What it is**: The public homepage at `/`. Server-rendered, SEO-optimised, dynamic.
- **Step-by-Step**:
    1. Hero title, subtitle, feature bullets, trust line, pricing plans, and FAQ all come from the database — editable by Super Admin with no code deploy.
    2. Footer links to city-specific landing pages (Darbhanga, Laheriasarai, Mohali, Patna).
    3. JSON-LD schema (`SoftwareApplication`) included for Google rich results.
- **Language**: Toggle between English and Hindi using the language switcher (EN ↔ हिं).

### 🟢 City Landing Pages (SEO)
- **URLs**: `/city/darbhanga`, `/city/laheriasarai`, `/city/mohali`, `/city/patna`, `/city/muzaffarpur`
- **What it is**: City-specific pages for local SEO — businesses in those cities searching for booking tools.
- **Content**: Headline and subtext are editable by Super Admin via the Content Editor.
- **Schema**: `LocalBusiness` JSON-LD with `areaServed` city field.

### 🟢 Hub (Today's Overview)
- **What it is**: Your command center — the first screen after login.
- **Step-by-Step**:
    1. See **KPI cards**: today's bookings, pending confirmations, revenue, and free slots. Each card is a deep link.
    2. Check the **schedule strip** for upcoming appointments.
    3. Expand **Leads & tickets** to triage without leaving the page.
    4. Use the **Booking link** card (green panel) to share or print your booking QR.

### 🟢 Hub — Leads & Tickets (Inbox Preview)
- **What it is**: A compact strip on the Hub for quick triage. Full history is in Leads and Support.
- **Step-by-Step**:
    1. Tap **Open** to expand the section.
    2. Date on the first line, time on the second — never ambiguous.
    3. Change stage (lead) or status (ticket) inline.
    4. Tap **View** → jumps to the item in Leads/Support with a scroll highlight.
    5. Quick actions: **Refresh hub**, **New booking**, **Add lead**, **New ticket**.

### 🟢 WhatsApp Inbox
- **What it is**: A full conversation view for every WhatsApp contact.
- **Step-by-Step**:
    1. Navigate to **Inbox** from the bottom nav or side menu.
    2. Each row shows contact name, last message preview, and timestamp.
    3. Tap a contact to open the thread.
    4. Use **Quick Replies** (templates) to respond in one tap.
    5. Tap **New booking** or **Add lead** directly from the conversation.

### 🟢 Public Booking Page + QR
- **What it is**: A dedicated URL for your business (`/{slug}`), plus a printable QR.
- **Step-by-Step**:
    1. On the Hub, find the **Booking link** card.
    2. **Copy** the URL, **Share**, or **Print** (clean QR + business name + URL).
    3. Customers visit the link, pick a service and time, and confirm.
    4. The booking instantly appears in your calendar.
    5. The customer gets a **WhatsApp confirmation** automatically (if WA is connected).
    6. On the booking success screen, a **Share on WhatsApp** button lets the customer spread the word.
    7. **Rotating the link (admins only)**: Generates a new slug. Old QR codes stop working.
- **SEO**: Each booking page has a `LocalBusiness` JSON-LD schema and dynamic `<title>` / `<meta description>` pulled from the database.

### 🟢 Retention Automation (WhatsApp)
- **What it is**: Automated WhatsApp messages that run in the background once a booking is made.
- **Production status**: BullMQ worker on Render (`bullmq-worker-u2sl.onrender.com`) + WA worker on Render (`wa-worker-dewp.onrender.com`). Scan QR at `/app/whatsapp` to activate full automation.
- **Flows** (all via BullMQ worker → WA worker):
    1. **Booking confirmed**: Admin confirms a booking → WhatsApp message sent to customer immediately.
    2. **24h reminder**: At booking creation, a delayed job is queued. 24h before the appointment, a reminder is sent. Cancelled bookings are skipped.
    3. **Post-visit follow-up**: 24h after marking an appointment **Completed**, a feedback/rebook message is sent with the booking link.
- **Templates**: All messages are editable by Super Admin via the Content Editor (`wa_templates` group).
- **Variables** supported: `{customerName}`, `{businessName}`, `{date}`, `{time}`, `{service}`, `{bookingLink}`.

### 🟢 Professional Calendar (Bookings)
- **What it is**: A visual view of all appointments.
- **Step-by-Step**:
    1. View upcoming bookings by date (day view or list view).
    2. **Atomic booking**: concurrent booking attempts on the same slot are safely rejected using a Redis lock + database transaction.
    3. Confirm pending bookings → triggers WhatsApp confirmation.
    4. Mark no-shows; manage cancellations.
    5. URL params `date`, `view`, and `status` for deep links from Hub KPI cards.

### 🟢 Analytics (Insights)
- **What it is**: A bird's-eye view of business performance with real charts.
- **Step-by-Step**:
    1. Navigate to **Analytics**.
    2. Use the **7d / 30d / 90d** toggle at the top.
    3. See KPI cards: today's bookings, verified revenue, active customers, no-show rate.
    4. **Daily bookings bar chart** — see booking trends over the selected period.
    5. **Revenue bar chart** — verified revenue by day.
    6. **Top services pie chart** — which services drive the most bookings.
    7. Suggestion chips appear when the data reveals actionable insights (high no-show rate, low repeat visits).

### 🟢 Customer CRM & Timeline
- **What it is**: A "Business Memory" for every customer.
- **Step-by-Step**:
    1. Search for a customer by name or phone.
    2. View their **Timeline**: last visit, what they booked, how they paid, WhatsApp messages.
    3. Add internal notes (staff-only; never shown to customer).

### 🟢 Leads Management
- **What it is**: A pipeline to track prospective customers.
- **Step-by-Step**:
    1. Navigate to **Leads**.
    2. Change stage (New → Contacted → Qualified → Converted) inline.
    3. Tap a lead for full history and notes.
    4. Convert to a booking via **New booking**.

### 🟢 Support Tickets
- **What it is**: A lightweight helpdesk for post-visit issues.
- **Step-by-Step**:
    1. Navigate to **Support**.
    2. Assign to a staff member; change status (Open → In Progress → Resolved).
    3. Add internal notes.

### 🟢 Payments & Verification
- **What it is**: Tracking UPI and Cash payments.
- **Step-by-Step**:
    1. Configure UPI ID / QR under Settings → Payments.
    2. View **Pending Verification** list.
    3. Tap **Verify** once money is received.

### 🟢 Templates (Quick Replies)
- **What it is**: Saved WhatsApp message templates for common responses.
- **Step-by-Step**:
    1. Navigate to **Templates** to see saved replies.
    2. Create / edit templates with a title and body.
    3. Templates appear as one-tap options inside Inbox conversation view.

### 🟢 Settings
- **What it is**: Business profile, hours, notifications, and account configuration.
- **Step-by-Step**:
    1. Update business name, address.
    2. Set **Working hours** — controls booking slot availability.
    3. Set **Holidays** — no slots are generated on marked holidays.

### 🟢 Super Admin — Content Editor
- **URL**: `/app/superadmin/content`
- **What it is**: Edit all user-facing text without touching code.
- **Step-by-Step**:
    1. Filter by group (Landing Page, SEO, WhatsApp Templates, City Pages, Onboarding) or language (EN, HI).
    2. Search by key, label, or content.
    3. Click any field to edit inline. Hit **Save** — changes go live within 5 minutes (Redis cache).
    4. JSON values (pricing plans, FAQ, feature bullets) are shown in a multi-line editor.
- **What you can edit**:
    - Landing page hero title, subtitle, CTAs, feature list, trust line, FAQ, pricing plans (EN + HI)
    - SEO `<title>` and `<meta description>` for landing, login, signup, booking pages
    - WhatsApp message templates for booking confirmation, 24h reminder, post-visit, inactive recovery (EN + HI)
    - City page headlines and subtexts
    - Onboarding screen text

---

## 4. Design & Layout Philosophy

### Premium Aesthetics
- **Color Palette**: Emerald & Zinc — Emerald for trust/growth (WhatsApp-inspired), Zinc for clean professional backdrop.
- **Glassmorphism**: Subtle blur effects and soft shadows.

### Mobile-First Layout
- **Bottom Navigation**: Essential actions within thumb's reach.
- **Card-Based UI**: Clean cards rather than dense tables.
- **TAP, don't TYPE**: Buttons are large; most actions are 1–3 taps.
- **Hub KPIs**: Each stat card is a deep link to the right screen.

### Date & Time Rules
- Date on the first line, time on the second — always. No ambiguous single-line `"Mon 10:30 AM"` format.

### Multilingual
- Toggle between **English** and **Hindi** via the language switcher.
- All marketing content (landing, city pages, WA templates) stored in the database with both `en` and `hi` variants — editable by Super Admin.

---

## 5. Typical Demo Script

> **Live demo URLs** — use these directly in presentations:
> - Landing: https://wa-booking-web.vercel.app
> - Login: https://wa-booking-web.vercel.app/login
> - Public booking: https://wa-booking-web.vercel.app/demo-salon
> - Credentials: `super` / `Test@123` (Super Admin) · `demo_admin` / `password123` (Business Admin)

1. **The Landing Page**: "A salon owner in Darbhanga searches for a booking tool. They land on [our page](https://wa-booking-web.vercel.app) — the headline is in Hindi if they prefer. They see pricing, FAQs, city-specific page. They hit **Start free with mobile**."
2. **The Signup**: "They enter their mobile number, get OTP `1234` (dev stub), and are inside the app in under a minute. Onboarding pre-fills their services."
3. **The Message**: "A customer messages on WhatsApp asking for a haircut tomorrow at 10 AM."
4. **The Inbox**: "I open **Inbox** — I see the conversation. I tap **Add lead** so I don't lose track."
5. **The Hub**: "I go to **Hub**. I see **Leads & tickets** — date on one line, time on the next. I tap **View** or change stage right here."
6. **The Booking**: "I tap **New booking** — the appointment lands on the calendar. The customer gets a **WhatsApp confirmation** automatically (once WA worker is connected)."
7. **The Link**: "I scroll to **Booking link**: I **Share** the QR to Instagram or **Print** a sticker for the door."
8. **The Customer Self-books**: "They scan the QR, pick **Classic Haircut**, choose a free slot, and confirm. I see it on the Hub schedule. They see a **Share on WhatsApp** button on their confirmation screen — viral loop."
9. **The Analytics**: "At end of day I check **Analytics** — bar chart of daily bookings, revenue, top services. 90-day view shows which services are growing."
10. **The Content Editor** *(Super Admin only)*: "I want to update the landing page tagline for Hindi speakers. I go to **Content Editor**, filter by 'Landing Page + Hindi', find the hero title field, update it, hit Save. Done in 30 seconds — no code deploy, no engineer needed."
11. **The Relationship**: "Next time they walk in, I open **Customers** → check their **Timeline**. I greet them by name, mention their last visit. The 24h reminder was sent automatically. That's the product loop."

---
