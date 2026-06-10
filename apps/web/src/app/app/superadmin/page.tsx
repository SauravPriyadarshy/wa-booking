"use client";

import { useEffect, useState } from "react";
import { apiBase } from "@/lib/api-base";

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
  { href: "/app/superadmin/businesses", label: "Businesses", sub: "Create & manage tenants", icon: "🏢" },
  { href: "/app/superadmin/features", label: "Plans & Features", sub: "Enable modules per business", icon: "⚙️" },
  { href: "/app/superadmin/content", label: "Content & SEO", sub: "Landing, city pages, WA templates", icon: "✏️" },
  { href: "/app/settings", label: "Settings", sub: "Platform configuration", icon: "🔧" },
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
  const [stats, setStats] = useState<SuperStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) return;
    fetch(`${apiBase()}/superadmin/stats`, { headers: { authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => setStats(d as SuperStats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 pb-28 pt-4 md:pb-8">
      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">
        ⚡ Super Admin
      </span>
      <h1 className="mt-2 text-[22px] font-bold text-zinc-900">Platform Dashboard</h1>
      <p className="text-[13px] text-zinc-500">Businesses · Plans · Revenue · Support</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
            ))}
          </>
        ) : stats ? (
          <>
            <Stat value={stats.total} label="Businesses" sub="All tenants" color="bg-zinc-50 border-zinc-200 text-zinc-800" />
            <Stat value={stats.active} label="Active" sub={`${stats.inactive} inactive`} color="bg-emerald-50 border-emerald-200 text-emerald-800" />
            <Stat value={stats.waConnected ?? "—"} label="WA Connected" sub="WhatsApp live" color="bg-green-50 border-green-200 text-green-800" />
            <Stat value={stats.withBookings ?? "—"} label="With Bookings" sub="Last 30 days" color="bg-blue-50 border-blue-200 text-blue-800" />
            <Stat value={stats.newThisWeek} label="New this week" color="bg-purple-50 border-purple-200 text-purple-800" />
            <Stat value={stats.newThisMonth} label="New this month" color="bg-amber-50 border-amber-200 text-amber-800" />
          </>
        ) : null}
      </div>

      {stats && stats.byCategory.filter((c) => c.count > 0).length > 0 ? (
        <div className="mt-5 rounded-2xl border border-zinc-100 bg-white p-4">
          <div className="text-[12px] font-semibold uppercase tracking-wide text-zinc-400">By category</div>
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

      <div className="mt-6 grid gap-3">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition hover:border-emerald-100"
          >
            <span className="text-2xl">{l.icon}</span>
            <div>
              <div className="text-[14px] font-semibold text-zinc-900">{l.label}</div>
              <div className="text-[12px] text-zinc-500">{l.sub}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
