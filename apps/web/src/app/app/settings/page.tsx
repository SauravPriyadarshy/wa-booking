"use client";

import { Card } from "@/components/ui";

const LINKS = [
  { href: "/app/settings/profile", title: "Business Profile", sub: "Name, WhatsApp number, booking URL" },
  { href: "/app/services", title: "Services", sub: "What you offer" },
  { href: "/app/staff", title: "Staff", sub: "People & availability" },
  { href: "/app/templates", title: "Quick replies", sub: "WhatsApp one-tap messages" },
  { href: "/app/payments", title: "Payments", sub: "UPI / cash verification" },
  { href: "/app/whatsapp", title: "WhatsApp", sub: "Connect & status" },
  { href: "/app/leads", title: "Leads", sub: "Inquiries pipeline" },
  { href: "/app/more", title: "More tools", sub: "Extras & admin" },
] as const;

export default function SettingsPage() {
  return (
    <div className="px-4 pb-28 pt-4 md:pb-8">
      <a href="/app" className="text-[13px] font-semibold text-emerald-700">
        ← Hub
      </a>
      <h1 className="mt-3 text-[20px] font-semibold text-zinc-900">Settings</h1>
      <p className="mt-1 text-[13px] text-zinc-500">Everything about how your business runs on the app.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} className="block tap-highlight-none">
            <Card className="h-full !p-4 transition-colors hover:border-zinc-200 hover:shadow-md">
              <div className="text-[15px] font-semibold text-zinc-900">{l.title}</div>
              <div className="mt-1 text-[12px] text-zinc-500">{l.sub}</div>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
