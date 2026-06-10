"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiBase } from "@/lib/api-base";
import { Card, EmptyState } from "@/components/ui";

type FeeItem = {
  id: string;
  month: string;
  amountCents: number;
  dueDate: string;
  notes: string | null;
  student: { id: string; name: string; phone: string | null; batch: string | null };
};

type Dashboard = {
  totalStudents: number;
  pendingAmount: number;
  pendingCount: number;
  overdueCount: number;
  currentMonthCollected: number;
  currentMonthCount: number;
  pendingFeesList: FeeItem[];
};

function formatINR(cents: number) {
  return `₹${Math.round(cents / 100).toLocaleString("en-IN")}`;
}

function isOverdue(dueDate: string) {
  return new Date(dueDate) < new Date();
}

export default function FeesPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingFee, setMarkingFee] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login");
      const res = await fetch(`${apiBase()}/coaching/fees/dashboard`, { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Failed");
      setDashboard(data as Dashboard);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function markFeePaid(feeId: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setMarkingFee(feeId);
    try {
      const res = await fetch(`${apiBase()}/coaching/fees/${feeId}/paid`, { method: "PATCH", headers: { authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setMarkingFee(null);
    }
  }

  // Group pending fees by month
  const byMonth = useMemo(() => {
    if (!dashboard?.pendingFeesList) return {};
    const m: Record<string, FeeItem[]> = {};
    dashboard.pendingFeesList.forEach((f) => {
      if (!m[f.month]) m[f.month] = [];
      m[f.month].push(f);
    });
    return m;
  }, [dashboard?.pendingFeesList]);

  const currentMonth = useMemo(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <a href="/app/students" className="text-[13px] font-semibold text-emerald-700">← Students</a>
      </div>

      <h1 className="mt-3 text-[20px] font-bold text-zinc-900">Fee Dashboard 💰</h1>
      <p className="text-[12px] text-zinc-500">Monthly fee collection overview</p>

      {error && <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">{error}</div>}

      {/* Stats grid */}
      {loading ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[1,2,3,4].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-100" />)}
        </div>
      ) : dashboard ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
              <div className="text-[22px] font-bold text-emerald-600">{formatINR(dashboard.currentMonthCollected)}</div>
              <div className="text-[12px] font-semibold text-zinc-700">Collected this month</div>
              <div className="text-[11px] text-zinc-400">{dashboard.currentMonthCount} students</div>
            </div>
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <div className="text-[22px] font-bold text-red-600">{formatINR(dashboard.pendingAmount)}</div>
              <div className="text-[12px] font-semibold text-red-700">Total pending</div>
              <div className="text-[11px] text-red-400">{dashboard.pendingCount} students</div>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
              <div className="text-[22px] font-bold text-zinc-900">{dashboard.totalStudents}</div>
              <div className="text-[12px] font-semibold text-zinc-700">Active students</div>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <div className="text-[22px] font-bold text-amber-600">{dashboard.overdueCount}</div>
              <div className="text-[12px] font-semibold text-amber-700">Overdue</div>
              <div className="text-[11px] text-amber-400">Past due date</div>
            </div>
          </div>

          {/* Pending fees list */}
          <div className="mt-5">
            <div className="text-[13px] font-bold text-zinc-900">Pending Fee Collection</div>
            {dashboard.pendingFeesList.length === 0 ? (
              <div className="mt-3">
                <EmptyState icon="calendar" title="सब fees collect हो गई!" description="बढ़िया काम — कोई pending fee नहीं।" />
              </div>
            ) : (
              Object.entries(byMonth)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([month, fees]) => (
                  <div key={month} className="mt-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-[12px] font-bold uppercase tracking-wide text-zinc-500">{month}</span>
                      {month === currentMonth && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Current</span>}
                      {month < currentMonth && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Overdue</span>}
                    </div>
                    <div className="grid gap-2">
                      {fees.map((fee) => {
                        const overdue = isOverdue(fee.dueDate);
                        return (
                          <Card key={fee.id} className={`!p-4 ${overdue ? "border-amber-100" : ""}`}>
                            <div className="flex items-center gap-3">
                              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-[13px] font-bold text-blue-700">
                                {fee.student.name[0]?.toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[14px] font-bold text-zinc-900">{fee.student.name}</span>
                                  {fee.student.batch && <span className="text-[11px] text-zinc-400">{fee.student.batch}</span>}
                                </div>
                                <div className="text-[12px] text-zinc-500">
                                  {formatINR(fee.amountCents)} · Due {new Date(fee.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                  {overdue && <span className="ml-1 font-semibold text-amber-600">OVERDUE</span>}
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5 items-end">
                                <button
                                  type="button"
                                  onClick={() => markFeePaid(fee.id)}
                                  disabled={markingFee === fee.id}
                                  className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap"
                                >
                                  {markingFee === fee.id ? "…" : "Mark Paid"}
                                </button>
                                {fee.student.phone && (
                                  <a
                                    href={`https://wa.me/${fee.student.phone.replace(/[^\d]/g, "")}?text=Fee reminder for ${fee.month}`}
                                    target="_blank" rel="noreferrer"
                                    className="rounded-xl border border-[#25D366] px-3 py-1 text-[11px] font-semibold text-[#25D366] whitespace-nowrap"
                                  >
                                    💬 Remind
                                  </a>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
