"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiBase } from "@/lib/api-base";
import { StepHint } from "@/components/ui";

type SuperStats = {
  total: number;
  active: number;
  inactive: number;
  newThisWeek: number;
  newThisMonth: number;
  waConnected?: number;
  withBookings?: number;
  byCategory: Array<{ key: string; name: string; count: number }>;
};

const LINKS = [
  {
    href: "/app/superadmin/businesses",
    label: "Businesses",
    sub: "Add salons, clinics, coaching centers — each gets their own login & booking link.",
    icon: "🏢",
    step: "1",
    cta: "Manage tenants",
  },
  {
    href: "/app/superadmin/plans",
    label: "Activation Codes",
    sub: "Give shop owners codes like PLUS90 or PRO60 to unlock paid features.",
    icon: "🎫",
    step: "2",
    cta: "Create codes",
  },
  {
    href: "/app/superadmin/features",
    label: "Plans & Features",
    sub: "Turn modules on/off per business — WhatsApp, analytics, coaching, etc.",
    icon: "⚙️",
    step: "3",
    cta: "Configure plans",
  },
  {
    href: "/app/superadmin/content",
    label: "Website & Messages",
    sub: "Edit landing page text, city pages, and WhatsApp message templates.",
    icon: "✏️",
    step: "4",
    cta: "Edit content",
  },
] as const;

function Stat({ value, label, sub, color }: { value: string | number; label: string; sub?: string; color: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${color}`}>
      <div className="text-[24px] font-bold">{value}</div>
      <div className="text-[13px] font-semibold">{label}</div>
      {sub ? <div className="mt-0.5 text-[11px] opacity-70">{sub}</div> : null}
    </div>
  );
}

export default function SuperAdminPage() {
  const t = useTranslations("superAdmin");
  const tc = useTranslations("common");
  const [stats, setStats] = useState<SuperStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tok = localStorage.getItem("token");
    if (!tok) return;
    fetch(`${apiBase()}/superadmin/stats`, { headers: { authorization: `Bearer ${tok}` } })
      .then((r) => r.json())
      .then((d) => setStats(d as SuperStats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 pb-8">
      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
        ⚡ {t("badge")}
      </span>

      <StepHint icon="🛠️" title={t("hintTitle")} body={t("hintBody")} />

      <h1 className="text-[22px] font-bold text-zinc-900">{t("title")}</h1>
      <p className="text-[13px] leading-relaxed text-zinc-500">{t("subtitle")}</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {loading ? (
          [1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100" />)
        ) : stats ? (
          <>
            <Stat value={stats.total} label={t("statBusinesses")} sub={t("statBusinessesSub")} color="bg-zinc-50 border-zinc-200 text-zinc-800" />
            <Stat value={stats.active} label={t("statActive")} sub={`${stats.inactive} ${t("inactive")}`} color="bg-emerald-50 border-emerald-200 text-emerald-800" />
            <Stat value={stats.waConnected ?? "—"} label={t("statWa")} sub={t("statWaSub")} color="bg-green-50 border-green-200 text-green-800" />
            <Stat value={stats.withBookings ?? "—"} label={t("statBookings")} sub={t("statBookingsSub")} color="bg-blue-50 border-blue-200 text-blue-800" />
          </>
        ) : (
          <div className="col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-900">
            {tc("error")} — {tc("refresh")}
          </div>
        )}
      </div>

      {stats && stats.byCategory.filter((c) => c.count > 0).length > 0 ? (
        <div className="rounded-2xl border border-zinc-100 bg-white p-4">
          <div className="text-[12px] font-semibold uppercase tracking-wide text-zinc-400">{t("byCategory")}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {stats.byCategory
              .filter((c) => c.count > 0)
              .map((c) => (
                <span key={c.key} className="rounded-full bg-zinc-100 px-3 py-1 text-[12px] font-semibold text-zinc-700">
                  {c.name}: {c.count}
                </span>
              ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        <h2 className="text-[15px] font-bold text-zinc-900">{t("whatToDo")}</h2>
        <p className="mt-1 text-[12px] text-zinc-500">{t("whatToDoSub")}</p>
        <div className="mt-3 grid gap-3">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group flex items-start gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[13px] font-bold text-emerald-800">
                {l.step}
              </span>
              <span className="text-2xl shrink-0">{l.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-zinc-900">{l.label}</div>
                <div className="mt-1 text-[12px] leading-relaxed text-zinc-500">{l.sub}</div>
                <div className="mt-2 text-[12px] font-bold text-emerald-700 group-hover:underline">{l.cta} →</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
