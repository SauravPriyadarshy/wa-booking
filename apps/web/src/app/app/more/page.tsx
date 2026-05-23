"use client";

import { useEffect, useState } from "react";
import { apiBase } from "@/lib/api-base";

type MeResponse =
  | { ok: false }
  | {
      ok: true;
      user: { role: "SUPER_ADMIN" | "BUSINESS_ADMIN" | "STAFF" };
      business: null | { categoryKey: string | null; enabledFeatures: string[] };
    };

function Card({
  href,
  title,
  subtitle,
}: {
  href: string;
  title: string;
  subtitle: string;
}) {
  return (
    <a
      href={href}
      className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
    >
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-zinc-500">{subtitle}</div>
    </a>
  );
}

export default function MorePage() {
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${apiBase()}/me`, {
          headers: { authorization: `Bearer ${token}` },
        });
        setMe((await res.json()) as MeResponse);
      } catch {
        setMe({ ok: false });
      }
    })();
  }, []);

  const enabled = me?.ok && me.business ? new Set(me.business.enabledFeatures) : new Set<string>();
  const cat = me?.ok && me.business ? me.business.categoryKey : null;
  const role = me?.ok ? me.user.role : null;

  return (
    <div className="px-4 py-4">
      <div className="text-sm text-zinc-500">More</div>

      <div className="mt-3 grid gap-3">
        <Card href="/app/settings" title="Settings" subtitle="All business preferences in one place" />
        <Card href="/app/services" title="Services" subtitle="What you offer" />
        <Card href="/app/staff" title="Staff" subtitle="Availability & workload" />
        <Card href="/app/leads" title="Leads" subtitle="New inquiries → customers" />
        <Card href="/app/support" title="Support" subtitle="Tickets + shared inbox (v1)" />
        <Card href="/app/templates" title="Quick replies" subtitle="1-tap WhatsApp messages" />
        <Card href="/app/payments" title="Payments" subtitle="Manual verify (UPI/Cash)" />
        <Card href="/app/analytics" title="Analytics" subtitle="Simple business insights" />

        {enabled.has("whatsapp") ? (
          <Card href="/app/whatsapp" title="WhatsApp" subtitle="Connect and automation" />
        ) : (
          <div className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            <div className="text-sm font-semibold">WhatsApp</div>
            <div className="text-xs text-zinc-500">Disabled by admin</div>
          </div>
        )}

        {role === "SUPER_ADMIN" ? (
          <>
            <Card
              href="/app/superadmin/businesses"
              title="Super Admin: Businesses"
              subtitle="Create business + admin"
            />
            <Card
              href="/app/superadmin/features"
              title="Super Admin: Feature flags"
              subtitle="Show/hide modules per business"
            />
            <Card
              href="/app/superadmin/content"
              title="Super Admin: Content Editor"
              subtitle="Edit landing, SEO, WhatsApp templates, city pages"
            />
          </>
        ) : null}
      </div>

      <div className="mt-4 rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
        <div className="text-xs font-medium text-zinc-700">Category mode</div>
        <div className="mt-1 text-xs text-zinc-500">
          {cat ?? "not set"} — this will decide what modules show up (Salon vs
          Clinic vs Home Service) with progressive disclosure.
        </div>
      </div>
    </div>
  );
}

