/**
 * Standalone BullMQ worker process.
 * Start with: npm run worker:dev (dev) or npm run worker:start (prod)
 */
import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { QUEUE_REMINDERS } from './queues/queues.module';

const redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const prisma = new PrismaClient();

const WA_WORKER_URL = process.env.WA_WORKER_URL ?? 'http://localhost:3100';
const WA_WORKER_SECRET = process.env.WA_WORKER_SECRET;

async function sendWhatsApp(businessId: string, to: string, message: string) {
  try {
    const res = await fetch(`${WA_WORKER_URL}/sessions/${businessId}/send`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(WA_WORKER_SECRET ? { 'x-worker-secret': WA_WORKER_SECRET } : {}),
      },
      body: JSON.stringify({ to, message }),
      signal: AbortSignal.timeout(15_000),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn(`[worker] WA send failed (${businessId} → ${to}): ${data?.error}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[worker] WA send exception (${businessId} → ${to}):`, e);
    return false;
  }
}

/** Interpolate {variable} placeholders in a template string. */
function interpolate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

function formatDateTime(isoDate: string) {
  const d = new Date(isoDate);
  const date = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { date, time };
}

async function getTemplate(key: string, locale = 'en'): Promise<string | null> {
  const row = await prisma.siteContent.findUnique({
    where: { key_locale: { key, locale } },
    select: { value: true },
  });
  return row?.value ?? null;
}

async function processJob(job: Job) {
  const { name, data } = job;

  // Resolve customer phone
  const getPhone = async (customerId: string): Promise<string | null> => {
    const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { phone: true } });
    return customer?.phone ?? null;
  };

  if (name === 'booking_new_customer') {
    const phone = data.customerPhone ?? (await getPhone(data.customerId));
    if (!phone) { console.warn(`[worker] booking_new_customer: no phone for customer ${data.customerId}`); return; }

    const template = await getTemplate('wa.booking_new_customer', 'en')
      ?? 'Hi {customerName}! 👋\n\nYour booking request has been received at *{businessName}*.\n\n📅 {date}\n⏰ {time}\n💇 Service: {service}\n\nWe\'ll confirm shortly. Thank you!';

    const { date, time } = formatDateTime(data.startAt);
    const message = interpolate(template, {
      customerName: data.customerName ?? 'there',
      businessName: data.businessName,
      date,
      time,
      service: data.serviceName,
    });

    await sendWhatsApp(data.businessId, phone, message);
    console.log(`[worker] booking_new_customer sent for appointment ${data.appointmentId}`);
    return;
  }

  if (name === 'booking_new_provider') {
    const phone = data.businessPhone;
    if (!phone) { console.warn(`[worker] booking_new_provider: no phone for business ${data.businessId}`); return; }

    const template = await getTemplate('wa.booking_new_provider', 'en')
      ?? '📋 *New Booking Request!*\n\n👤 {customerName}\n💇 {service}\n📅 {date} at {time}\n📞 {customerPhone}\n\nReply to confirm or cancel:\n✅ *CONFIRM {bookingId}*\n❌ *CANCEL {bookingId}*';

    const { date, time } = formatDateTime(data.startAt);
    const message = interpolate(template, {
      customerName: data.customerName ?? 'Customer',
      service: data.serviceName,
      date,
      time,
      customerPhone: data.customerPhone ?? 'N/A',
      bookingId: data.appointmentId,
    });

    await sendWhatsApp(data.businessId, phone, message);
    console.log(`[worker] booking_new_provider sent for appointment ${data.appointmentId}`);
    return;
  }

  if (name === 'booking_confirm') {
    const phone = data.customerPhone ?? (await getPhone(data.customerId));
    if (!phone) { console.warn(`[worker] booking_confirm: no phone for customer ${data.customerId}`); return; }

    const template = await getTemplate('wa.booking_confirm', 'en')
      ?? 'Hi {customerName}! Your appointment at *{businessName}* is confirmed.\n\n📅 {date}\n⏰ {time}\n💇 {service}\n\nSee you soon!';

    const { date, time } = formatDateTime(data.startAt);
    const message = interpolate(template, {
      customerName: data.customerName ?? 'there',
      businessName: data.businessName,
      date,
      time,
      service: data.serviceName,
    });

    await sendWhatsApp(data.businessId, phone, message);
    console.log(`[worker] booking_confirm sent for appointment ${data.appointmentId}`);
    return;
  }

  if (name === 'reminder_24h') {
    // Re-fetch appointment to ensure it hasn't been cancelled
    const appt = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: {
        customer: { select: { name: true, phone: true } },
        service: { select: { name: true } },
        business: { select: { name: true } },
      },
    });
    if (!appt || appt.status === 'CANCELLED') return;
    const phone = appt.customer?.phone;
    if (!phone) return;

    const template = await getTemplate('wa.reminder_24h', 'en')
      ?? 'Reminder: Tomorrow at {time} your *{service}* appointment at *{businessName}* is scheduled. Reply CANCEL to cancel.';

    const { date, time } = formatDateTime(appt.startAt.toISOString());
    const message = interpolate(template, {
      customerName: appt.customer.name ?? 'there',
      businessName: appt.business.name,
      date,
      time,
      service: appt.service.name,
    });

    await sendWhatsApp(data.businessId, phone, message);
    console.log(`[worker] reminder_24h sent for appointment ${appt.id}`);
    return;
  }

  if (name === 'post_visit') {
    const phone = data.customerPhone ?? (await getPhone(data.customerId));
    if (!phone) return;

    const template = await getTemplate('wa.post_visit', 'en')
      ?? 'Hope you loved your *{service}* at {businessName}! ⭐\nHow was your experience?\n\nBook again: {bookingLink}';

    const bookingLink = `${process.env.WEB_BASE_URL ?? 'https://yourbooking.app'}/${data.bookingSlug}`;
    const message = interpolate(template, {
      customerName: data.customerName ?? 'there',
      businessName: data.businessName,
      service: data.serviceName,
      bookingLink,
    });

    await sendWhatsApp(data.businessId, phone, message);
    console.log(`[worker] post_visit sent for appointment ${data.appointmentId}`);
    return;
  }

  if (name === 'inactive_recovery') {
    const phone = data.phone;
    if (!phone) return;

    const template = await getTemplate('wa.inactive_recovery', 'en')
      ?? 'Hi {customerName}! We miss you at *{businessName}* 😊\n\nReady for your next {service}?\n\nBook: {bookingLink}';

    const bookingLink = `${process.env.WEB_BASE_URL ?? 'https://yourbooking.app'}/${data.bookingSlug}`;
    const message = interpolate(template, {
      customerName: data.customerName ?? 'there',
      businessName: data.businessName,
      service: data.serviceName ?? 'appointment',
      bookingLink,
    });

    await sendWhatsApp(data.businessId, phone, message);
    console.log(`[worker] inactive_recovery sent to customer ${data.customerId}`);
    return;
  }

  console.warn(`[worker] Unknown job type: ${name}`);
}

const worker = new Worker(
  QUEUE_REMINDERS,
  async (job) => {
    try {
      await processJob(job);
    } catch (e) {
      console.error(`[worker] Job ${job.name}#${job.id} failed:`, e);
      throw e; // let BullMQ handle retry
    }
  },
  { connection: redis, concurrency: 3 },
);

worker.on('completed', (job) => console.log(`[worker] ✓ ${job.name}#${job.id}`));
worker.on('failed', (job, err) => console.error(`[worker] ✗ ${job?.name}#${job?.id}:`, err.message));

console.log(`[worker] BullMQ worker started. Queue: ${QUEUE_REMINDERS}`);

// Expose a minimal HTTP health endpoint so Render can run this as a web service (free plan).
import http from 'http';
const PORT = Number(process.env.PORT ?? 3200);
http
  .createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, queue: QUEUE_REMINDERS, uptime: process.uptime() }));
  })
  .listen(PORT, () => console.log(`[worker] Health endpoint on :${PORT}`));
