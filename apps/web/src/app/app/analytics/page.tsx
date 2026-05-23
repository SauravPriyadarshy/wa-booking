"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { apiBase } from "@/lib/api-base";
import { StatCard, DashboardSkeleton } from "@/components/ui";

type Summary = {
  ok: true;
  todayBookings: number;
  last30: { total: number; noShow: number; noShowRate: number };
  repeatCustomers: number;
  verifiedRevenueCents: number;
};

type DailyRow = { date: string; bookings: number; revenueCents: number };
type TopService = { serviceId: string; name: string; bookings: number };

const COLORS = ["#059669", "#2563eb", "#d97706", "#dc2626", "#7c3aed"];

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("token");
  return token ? { authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${apiBase()}${path}`, { headers: authHeader() });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function formatDate(iso: string) {
  const [, , d] = iso.split("-");
  return d;
}

function formatRupees(cents: number) {
  return `₹${Math.round(cents / 100).toLocaleString("en-IN")}`;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [range, setRange] = useState<"7" | "30" | "90">("30");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      const [s, r, ts] = await Promise.all([
        fetchJson<Summary>("/analytics/summary"),
        fetchJson<{ ok: boolean; daily: DailyRow[] }>(`/analytics/range?days=${range}`),
        fetchJson<{ ok: boolean; topServices: TopService[] }>(`/analytics/top-services?days=${range}`),
      ]);
      if (!s) { setErr("Failed to load analytics"); setLoading(false); return; }
      setSummary(s);
      setDaily(r?.daily ?? []);
      setTopServices(ts?.topServices ?? []);
      setLoading(false);
    })();
  }, [range]);

  const insights: string[] = [];
  if (summary) {
    if (summary.last30.noShowRate > 0.08)
      insights.push("No-shows are above 8%. Consider sending WhatsApp reminders the day before.");
    if (summary.repeatCustomers < 10 && summary.last30.total > 5)
      insights.push("Repeat visits are still building — nudge happy customers to rebook.");
    if (summary.todayBookings === 0)
      insights.push("Nothing on the books today — share your public link from the Hub.");
  }

  return (
    <div className="px-4 pb-28 pt-4 md:pb-8">
      <a href="/app" className="text-[13px] font-semibold text-emerald-700">
        ← Hub
      </a>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-[20px] font-semibold text-zinc-900">Insights</h1>
        <div className="flex gap-1 rounded-xl border border-zinc-100 bg-white p-1">
          {(["7", "30", "90"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-lg px-3 py-1 text-[12px] font-semibold transition ${
                range === r ? "bg-emerald-600 text-white" : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {err && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
          {err}
        </div>
      )}

      {loading ? (
        <div className="mt-4">
          <DashboardSkeleton />
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <StatCard label="Today" value={String(summary?.todayBookings ?? 0)} accent="emerald" sub="bookings" />
            <StatCard
              label="Revenue (verified)"
              value={formatRupees(summary?.verifiedRevenueCents ?? 0)}
              accent="zinc"
              sub="all time verified"
            />
            <StatCard
              label="Active customers"
              value={String(summary?.repeatCustomers ?? 0)}
              accent="blue"
              sub="with ≥1 booking"
            />
            <StatCard
              label="No-show rate"
              value={`${Math.round((summary?.last30.noShowRate ?? 0) * 100)}%`}
              accent={(summary?.last30.noShowRate ?? 0) > 0.08 ? "amber" : "zinc"}
              sub={`${summary?.last30.noShow} / ${summary?.last30.total} (30d)`}
            />
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
                Suggestions
              </div>
              <ul className="mt-2 list-inside list-disc space-y-1 text-[13px] text-zinc-800">
                {insights.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Daily bookings bar chart */}
          {daily.length > 0 && (
            <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 text-[13px] font-semibold text-zinc-700">
                Bookings — last {range} days
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={daily} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(v) => [`${v} bookings`, "Bookings"]}
                    labelFormatter={(l) => `Date: ${l}`}
                  />
                  <Bar dataKey="bookings" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Revenue bar chart */}
          {daily.some((d) => d.revenueCents > 0) && (
            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 text-[13px] font-semibold text-zinc-700">
                Revenue — last {range} days
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={daily} margin={{ top: 0, right: 0, bottom: 0, left: -15 }}>
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tickFormatter={(v) => `₹${Math.round(v / 100)}`} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [formatRupees(Number(v)), "Revenue"]} labelFormatter={(l) => `Date: ${l}`} />
                  <Bar dataKey="revenueCents" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top services pie */}
          {topServices.length > 0 && (
            <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-3 text-[13px] font-semibold text-zinc-700">Top services</div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <ResponsiveContainer width="100%" height={160} className="sm:w-1/2">
                  <PieChart>
                    <Pie
                      data={topServices}
                      dataKey="bookings"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                    >
                      {topServices.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} bookings`, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="space-y-1.5 text-[13px]">
                  {topServices.map((s, idx) => (
                    <li key={s.serviceId} className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: COLORS[idx % COLORS.length] }}
                      />
                      <span className="flex-1 text-zinc-700">{s.name}</span>
                      <span className="font-semibold text-zinc-900">{s.bookings}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
