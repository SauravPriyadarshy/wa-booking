"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiBase } from "@/lib/api-base";
import { Card } from "@/components/ui";

type BatchReport = {
  batch: { id: string; name: string; courseName: string; rosterCount: number };
  month: string;
  attendanceRate: number | null;
  feeCollectionPct: number | null;
  totalDue: number;
  totalPaid: number;
  pendingAmount: number;
  overallTestAvg: number | null;
  testTrends: Array<{ subject: string; date: string; avgPct: number; count: number }>;
};

type Overview = {
  month: string;
  batchCount: number;
  totalDue: number;
  totalPaid: number;
  pendingAmount: number;
  feeCollectionPct: number | null;
  avgAttendance: number | null;
  batches: BatchReport[];
};

function formatINR(cents: number) {
  return `₹${Math.round(cents / 100).toLocaleString("en-IN")}`;
}

export default function CoachingReportsPage() {
  const searchParams = useSearchParams();
  const focusBatch = searchParams.get("batch");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${apiBase()}/coaching/reports/overview`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as Overview & { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Failed");
      setOverview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const batches = overview?.batches ?? [];
  const focused = focusBatch ? batches.find((b) => b.batch.id === focusBatch) : null;
  const display = focused ? [focused] : batches;

  if (loading) return <div className="py-10 text-center text-[14px] text-zinc-500">Loading reports…</div>;

  return (
    <div className="space-y-4">
      <Link href="/app/coaching/matrix" className="text-[13px] font-semibold text-emerald-700">
        ← Academic Matrix
      </Link>

      <div>
        <h1 className="text-[20px] font-bold text-zinc-900">Institute Reports</h1>
        <p className="text-[12px] text-zinc-500">Attendance, fees, and test performance by batch</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div> : null}

      {overview ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card className="!p-4 text-center">
              <div className="text-[20px] font-bold text-emerald-600">{formatINR(overview.totalPaid)}</div>
              <div className="text-[11px] text-zinc-500">Collected ({overview.month})</div>
            </Card>
            <Card className="!p-4 text-center">
              <div className="text-[20px] font-bold text-red-600">{formatINR(overview.pendingAmount)}</div>
              <div className="text-[11px] text-zinc-500">Pending</div>
            </Card>
            <Card className="!p-4 text-center">
              <div className="text-[20px] font-bold text-blue-600">
                {overview.feeCollectionPct != null ? `${overview.feeCollectionPct}%` : "—"}
              </div>
              <div className="text-[11px] text-zinc-500">Fee collection rate</div>
            </Card>
            <Card className="!p-4 text-center">
              <div className="text-[20px] font-bold text-purple-600">
                {overview.avgAttendance != null ? `${overview.avgAttendance}%` : "—"}
              </div>
              <div className="text-[11px] text-zinc-500">Avg attendance (30d)</div>
            </Card>
          </div>

          {display.map((report) => (
            <Card key={report.batch.id} className="!p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[15px] font-bold text-zinc-900">{report.batch.name}</div>
                  <div className="text-[11px] text-zinc-500">
                    {report.batch.courseName} · {report.batch.rosterCount} students
                  </div>
                </div>
                <Link
                  href={`/app/coaching/batches/${report.batch.id}`}
                  className="text-[11px] font-semibold text-emerald-700"
                >
                  Open batch →
                </Link>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-zinc-50 p-2">
                  <div className="text-[16px] font-bold text-zinc-900">
                    {report.attendanceRate != null ? `${report.attendanceRate}%` : "—"}
                  </div>
                  <div className="text-[10px] text-zinc-500">Attendance</div>
                </div>
                <div className="rounded-xl bg-zinc-50 p-2">
                  <div className="text-[16px] font-bold text-zinc-900">
                    {report.feeCollectionPct != null ? `${report.feeCollectionPct}%` : "—"}
                  </div>
                  <div className="text-[10px] text-zinc-500">Fees</div>
                </div>
                <div className="rounded-xl bg-zinc-50 p-2">
                  <div className="text-[16px] font-bold text-zinc-900">
                    {report.overallTestAvg != null ? `${report.overallTestAvg}%` : "—"}
                  </div>
                  <div className="text-[10px] text-zinc-500">Test avg</div>
                </div>
              </div>

              {report.testTrends.length > 0 ? (
                <div className="mt-4">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Test trends</div>
                  <div className="mt-2 space-y-1">
                    {report.testTrends.map((t) => (
                      <div key={t.date} className="flex items-center gap-2">
                        <span className="w-16 shrink-0 text-[10px] text-zinc-400">{t.date.slice(5)}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                          <div className="h-full bg-blue-500" style={{ width: `${t.avgPct}%` }} />
                        </div>
                        <span className="w-10 text-right text-[10px] font-bold text-zinc-600">{t.avgPct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>
          ))}
        </>
      ) : null}
    </div>
  );
}
