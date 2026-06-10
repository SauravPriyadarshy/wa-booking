"use client";

import { useEffect, useState } from "react";
import { apiBase } from "@/lib/api-base";
import { HubDashboard } from "@/components/app/hub-dashboard";
import { DashboardSkeleton } from "@/components/ui";

type UserInfo = {
  role: "SUPER_ADMIN" | "BUSINESS_ADMIN" | "STAFF" | null;
  hasBusiness: boolean;
};

type SuperStats = {
  total: number;
  active: number;
  inactive: number;
  newThisWeek: number;
  newThisMonth: number;
  byCategory: Array<{ key: string; name: string; count: number }>;
};

const SUPER_ACTIONS = [
  { href: "/app/superadmin/businesses", label: "Businesses", sub: "Create & manage all tenants", icon: "🏢", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
  { href: "/app/superadmin/features", label: "Feature Flags", sub: "Enable/disable per business", icon: "⚙️", color: "bg-blue-50 border-blue-200 text-blue-800" },
  { href: "/app/superadmin/content", label: "Content Editor", sub: "Landing, SEO, WA templates", icon: "✏️", color: "bg-amber-50 border-amber-200 text-amber-800" },
] as const;

function StatCard({ value, label, sublabel, colorClass }: { value: string | number; label: string; sublabel?: string; colorClass: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${colorClass}`}>
      <div className="text-[26px] font-bold">{value}</div>
      <div className="text-[13px] font-semibold">{label}</div>
      {sublabel && <div className="mt-0.5 text-[11px] opacity-70">{sublabel}</div>}
    </div>
  );
}

function SuperAdminHome() {
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
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">⚡ Super Admin</span>
      </div>
      <h1 className="mt-2 text-[22px] font-bold text-zinc-900">Platform Overview</h1>
      <p className="text-[13px] text-zinc-500">Manage all businesses, content, and feature flags.</p>

      {/* Stats grid */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        {loading ? (
          <>
            <div className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
            <div className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
          </>
        ) : stats ? (
          <>
            <StatCard value={stats.total} label="Total Businesses" sublabel="All time" colorClass="bg-zinc-50 border-zinc-200 text-zinc-800" />
            <StatCard value={stats.active} label="Active" sublabel={`${stats.inactive} inactive`} colorClass="bg-emerald-50 border-emerald-200 text-emerald-800" />
            <StatCard value={stats.newThisWeek} label="New this week" colorClass="bg-blue-50 border-blue-200 text-blue-800" />
            <StatCard value={stats.newThisMonth} label="New this month" colorClass="bg-purple-50 border-purple-200 text-purple-800" />
          </>
        ) : null}
      </div>

      {/* Category breakdown */}
      {stats && stats.byCategory.filter((c) => c.count > 0).length > 0 && (
        <div className="mt-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
          <div className="text-[12px] font-semibold uppercase tracking-wide text-zinc-400">By Category</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.byCategory.filter((c) => c.count > 0).map((c) => (
              <span key={c.key} className="rounded-full bg-zinc-100 px-3 py-1 text-[12px] font-semibold text-zinc-700">
                {c.name} · {c.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-5 grid gap-3">
        {SUPER_ACTIONS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 rounded-2xl border p-4 transition hover:shadow-md active:scale-[0.99] ${l.color}`}
          >
            <span className="shrink-0 text-2xl">{l.icon}</span>
            <div className="min-w-0">
              <div className="text-[15px] font-bold">{l.label}</div>
              <div className="mt-0.5 text-[12px] opacity-70">{l.sub}</div>
            </div>
            <span className="ml-auto shrink-0 opacity-50">›</span>
          </a>
        ))}
      </div>

      <button
        type="button"
        className="mt-6 block w-full py-2 text-center text-[13px] font-medium text-zinc-400"
        onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
      >
        Log out
      </button>
    </div>
  );
}

export default function AppHome() {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { setUser({ role: null, hasBusiness: false }); return; }

    (async () => {
      try {
        const [meRes, bizRes] = await Promise.all([
          fetch(`${apiBase()}/me`, { headers: { authorization: `Bearer ${t}` } }),
          fetch(`${apiBase()}/businesses/me`, { headers: { authorization: `Bearer ${t}` } }),
        ]);
        const me = await meRes.json();
        setUser({ role: me?.user?.role ?? null, hasBusiness: bizRes.ok });
      } catch {
        setUser({ role: null, hasBusiness: false });
      }
    })();
  }, []);

  if (user === null) return <DashboardSkeleton />;

  if (user.role === "SUPER_ADMIN") return <SuperAdminHome />;

  if (!user.hasBusiness) {
    return (
      <div className="px-4 py-4">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="text-[13px] font-medium text-zinc-500">Start here</div>
          <div className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">Create your business</div>
          <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
            You&apos;re one step away from your booking link and QR. Most businesses finish in under three minutes.
          </p>
          <a
            href="/app/onboarding"
            className="mt-4 flex h-11 items-center justify-center rounded-xl bg-emerald-600 text-[15px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Start setup
          </a>
        </div>
        <a
          href="/login"
          className="mt-4 block text-center text-[13px] font-medium text-emerald-700"
          onClick={() => localStorage.removeItem("token")}
        >
          Logout
        </a>
      </div>
    );
  }

  return (
    <div>
      <HubDashboard />
    </div>
  );
}
