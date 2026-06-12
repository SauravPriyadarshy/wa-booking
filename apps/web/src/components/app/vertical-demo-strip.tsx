"use client";

import Link from "next/link";

type Step = { label: string; href: string; desc: string };

const FLOWS: Record<string, { title: string; bookingSlug?: string; steps: Step[] }> = {
  clinic: {
    title: "Clinic demo flow",
    bookingSlug: "demo-clinic",
    steps: [
      { label: "1. Live Queue", href: "/app/queue", desc: "Register walk-in · advance tokens · WhatsApp alerts" },
      { label: "2. Bookings", href: "/app/bookings", desc: "Online appointments & confirmations" },
      { label: "3. Customers", href: "/app/customers", desc: "Patient CRM & history" },
    ],
  },
  coaching: {
    title: "Coaching demo flow",
    bookingSlug: "demo-coaching",
    steps: [
      { label: "1. Matrix", href: "/app/coaching/matrix", desc: "Streams · courses · batches" },
      { label: "2. Batch panel", href: "/app/coaching/matrix", desc: "Open Morning Batch A → attendance · fees · broadcast" },
      { label: "3. Students", href: "/app/students", desc: "Student 360° · fee ledger · reports" },
    ],
  },
  salon: {
    title: "Salon demo flow",
    bookingSlug: "demo-salon",
    steps: [
      { label: "1. Bookings", href: "/app/bookings", desc: "Today's calendar · confirm · WhatsApp" },
      { label: "2. Customers", href: "/app/customers", desc: "CRM · tags · visit history" },
      { label: "3. Services", href: "/app/services", desc: "Menu · pricing · duration" },
    ],
  },
};

export function VerticalDemoStrip({
  categoryKey,
  bookingSlug,
}: {
  categoryKey: string | null;
  bookingSlug?: string | null;
}) {
  if (!categoryKey || !FLOWS[categoryKey]) return null;
  const flow = FLOWS[categoryKey];
  const slug = bookingSlug ?? flow.bookingSlug;
  const publicUrl = slug ? `/${slug}` : null;

  return (
    <section className="mt-4 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Demo guide</div>
          <h2 className="mt-0.5 text-[15px] font-bold text-zinc-900">{flow.title}</h2>
        </div>
        {publicUrl ? (
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-emerald-600 px-3 py-2 text-[12px] font-bold text-white"
          >
            Public booking ↗
          </a>
        ) : null}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {flow.steps.map((step) => (
          <Link
            key={step.label}
            href={step.href}
            className="rounded-xl border border-white bg-white/80 p-3 transition hover:border-emerald-200 hover:shadow-sm"
          >
            <div className="text-[13px] font-bold text-emerald-800">{step.label}</div>
            <div className="mt-1 text-[11px] leading-relaxed text-zinc-600">{step.desc}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
