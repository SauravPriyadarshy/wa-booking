"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiBase } from "@/lib/api-base";
import { Button, Card } from "@/components/ui";

type FeeHistory = {
  month: string;
  amountCents: number;
  paidAmountCents: number;
  isFullyPaid: boolean;
  paymentMode: "CASH" | "UPI" | null;
};

type TestHistory = {
  marksObtained: number;
  remarks: string | null;
  test: { subject: string; maxMarks: number; testDate: string };
};

type StudentReport = {
  id: string;
  name: string;
  parentName: string | null;
  parentPhone: string | null;
  classGrade: string | null;
  admissionAt: string;
  batchLink: { id: string; name: string; course: { name: string } } | null;
  attendancePct: number | null;
  attendanceStreak: number;
  studentTestAvg: number | null;
  classAvgPct: number | null;
  feeHistory: FeeHistory[];
  testHistory: TestHistory[];
};

function formatINR(cents: number) {
  return `₹${Math.round(cents / 100).toLocaleString("en-IN")}`;
}

export default function StudentReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${apiBase()}/coaching/students/${id}/report`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as StudentReport & { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Failed");
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <div className="py-10 text-center text-[14px] text-zinc-500">Loading report…</div>;
  if (!report) return <div className="py-10 text-center text-[14px] text-red-600">{error ?? "Not found"}</div>;

  return (
    <div className="space-y-4 print:space-y-2" id="student-report">
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Link href={`/app/students/${id}`} className="text-[13px] font-semibold text-emerald-700">
          ← Student profile
        </Link>
        <Button type="button" size="sm" variant="primary" onClick={() => window.print()}>
          Print / Save PDF
        </Button>
      </div>

      <Card className="!p-5">
        <div className="text-center">
          <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Parent–Teacher Report</div>
          <h1 className="mt-2 text-[22px] font-bold text-zinc-900">{report.name}</h1>
          {report.parentName ? <p className="text-[13px] text-zinc-500">Parent: {report.parentName}</p> : null}
          {report.batchLink ? (
            <p className="text-[12px] text-zinc-500">
              {report.batchLink.name} · {report.batchLink.course.name}
            </p>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-emerald-50 p-3 text-center">
            <div className="text-[18px] font-bold text-emerald-700">
              {report.attendancePct != null ? `${report.attendancePct}%` : "—"}
            </div>
            <div className="text-[10px] text-emerald-800">Attendance (90d)</div>
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-center">
            <div className="text-[18px] font-bold text-blue-700">
              {report.studentTestAvg != null ? `${report.studentTestAvg}%` : "—"}
            </div>
            <div className="text-[10px] text-blue-800">Student test avg</div>
          </div>
          <div className="rounded-xl bg-purple-50 p-3 text-center">
            <div className="text-[18px] font-bold text-purple-700">
              {report.classAvgPct != null ? `${report.classAvgPct}%` : "—"}
            </div>
            <div className="text-[10px] text-purple-800">Class average</div>
          </div>
          <div className="rounded-xl bg-zinc-50 p-3 text-center">
            <div className="text-[18px] font-bold text-zinc-800">{report.attendanceStreak}</div>
            <div className="text-[10px] text-zinc-600">Days present (90d)</div>
          </div>
        </div>
      </Card>

      <Card className="!p-4">
        <h2 className="text-[14px] font-bold text-zinc-900">Fee history</h2>
        {report.feeHistory.length === 0 ? (
          <p className="mt-2 text-[13px] text-zinc-500">No fee records.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {report.feeHistory.map((f) => (
              <div key={f.month} className="flex justify-between text-[13px]">
                <span className="text-zinc-600">{f.month}</span>
                <span className="font-semibold text-zinc-900">
                  {formatINR(f.paidAmountCents)} / {formatINR(f.amountCents)}
                  {f.isFullyPaid ? " ✓" : ""}
                  {f.paymentMode ? ` · ${f.paymentMode}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="!p-4">
        <h2 className="text-[14px] font-bold text-zinc-900">Test progress vs class</h2>
        {report.testHistory.length === 0 ? (
          <p className="mt-2 text-[13px] text-zinc-500">No test scores yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {report.testHistory.map((t, idx) => {
              const pct = t.test.maxMarks > 0 ? Math.round((t.marksObtained / t.test.maxMarks) * 100) : 0;
              return (
                <div key={`${t.test.subject}-${idx}`} className="rounded-xl border border-zinc-100 px-3 py-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="font-semibold text-zinc-900">{t.test.subject}</span>
                    <span className="text-zinc-600">
                      {t.marksObtained}/{t.test.maxMarks} ({pct}%)
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                  </div>
                  {report.classAvgPct != null ? (
                    <div className="mt-1 text-[10px] text-zinc-400">Class avg: {report.classAvgPct}%</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <p className="text-center text-[11px] text-zinc-400 print:mt-4">
        Generated by BookNow Coaching · {new Date().toLocaleDateString("en-IN")}
      </p>
    </div>
  );
}
