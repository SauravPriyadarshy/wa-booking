"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiBase } from "@/lib/api-base";
import { ManualWhatsAppButton } from "@/components/app/manual-whatsapp-button";
import { useWhatsAppLink } from "@/hooks/use-whatsapp-link";
import { Card, EmptyState, Button } from "@/components/ui";

type FeeItem = {
  id: string;
  month: string;
  amountCents: number;
  paidAmountCents: number;
  dueDate: string;
  notes: string | null;
  courseName: string | null;
  installmentIndex: number | null;
  installmentTotal: number | null;
  student: { id: string; name: string; phone: string | null; batch: string | null; course: string | null };
};

type BatchRow = {
  id: string;
  name: string;
  _count: { enrollments: number };
  course: { name: string };
};

type StudentRow = {
  id: string;
  name: string;
  batch: string | null;
  phone: string | null;
  enrollments?: Array<{ batch: { id: string; name: string } }>;
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

function defaultDueDateForMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return new Date().toISOString().slice(0, 10);
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function buildInstallmentDates(month: string, count: number): string[] {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m || count < 1) return [];
  const dates: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const day = Math.min(28, 5 + i * Math.floor(28 / count));
    dates.push(`${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  return dates;
}

export default function CoachingFeesPage() {
  const { showManualFallback, openInstallmentReminder } = useWhatsAppLink();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingFee, setMarkingFee] = useState<string | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueBatchId, setIssueBatchId] = useState("");
  const [issueMonth, setIssueMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });
  const [issueAmountRupees, setIssueAmountRupees] = useState("");
  const [installmentCount, setInstallmentCount] = useState("1");
  const [issueMsg, setIssueMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login");
      const res = await fetch(`${apiBase()}/coaching/fees/dashboard`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { message?: string }).message ?? "Failed");
      setDashboard(data as Dashboard);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMeta = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const [batchRes, studentRes] = await Promise.all([
        fetch(`${apiBase()}/coaching/batches`, { headers: { authorization: `Bearer ${token}` } }),
        fetch(`${apiBase()}/coaching/students`, { headers: { authorization: `Bearer ${token}` } }),
      ]);
      const batchData = (await batchRes.json()) as BatchRow[];
      const studentData = (await studentRes.json()) as StudentRow[];
      if (batchRes.ok && Array.isArray(batchData)) setBatches(batchData);
      if (studentRes.ok && Array.isArray(studentData)) setStudents(studentData);
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    void load();
    void loadMeta();
  }, [load, loadMeta]);

  const selectedBatch = useMemo(
    () => batches.find((b) => b.id === issueBatchId) ?? null,
    [batches, issueBatchId],
  );

  const batchStudentIds = useMemo(() => {
    if (!issueBatchId) return new Set<string>();
    return new Set(
      students
        .filter((s) => s.enrollments?.some((e) => e.batch.id === issueBatchId))
        .map((s) => s.id),
    );
  }, [students, issueBatchId]);

  async function markFeePaid(feeId: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setMarkingFee(feeId);
    try {
      const res = await fetch(`${apiBase()}/coaching/fees/${feeId}/paid`, {
        method: "PATCH",
        headers: { authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setMarkingFee(null);
    }
  }

  async function issueFees() {
    const token = localStorage.getItem("token");
    if (!token) return;
    const amountRupees = Number(issueAmountRupees);
    const installments = Math.max(1, Number(installmentCount) || 1);
    if (!issueBatchId || !issueMonth.trim() || !Number.isFinite(amountRupees) || amountRupees <= 0) {
      setIssueMsg("Pick batch, month, and a valid amount.");
      return;
    }

    const targets = students.filter((s) => batchStudentIds.has(s.id));
    if (targets.length === 0) {
      setIssueMsg("No students enrolled in this batch.");
      return;
    }

    setIssuing(true);
    setIssueMsg(null);
    const totalAmount = Math.round(amountRupees * 100);
    const dueDates = buildInstallmentDates(issueMonth, installments);
    let created = 0;

    try {
      for (const student of targets) {
        const body =
          installments > 1
            ? {
                studentId: student.id,
                month: issueMonth,
                totalAmount,
                numberOfInstallments: installments,
                dueDates,
                courseName: selectedBatch?.course.name,
                notes: `${selectedBatch?.name ?? "Batch"} · ${installments} installments`,
              }
            : {
                studentId: student.id,
                month: issueMonth,
                amountCents: totalAmount,
                dueDate: dueDates[0] ?? defaultDueDateForMonth(issueMonth),
                courseName: selectedBatch?.course.name,
                notes: `Batch ${selectedBatch?.name ?? ""}`,
              };

        const res = await fetch(`${apiBase()}/coaching/fees`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });
        if (res.ok) created += 1;
      }
      setIssueMsg(`Created fee records for ${created} student${created === 1 ? "" : "s"}.`);
      await load();
      if (created > 0) setIssueOpen(false);
    } catch (e) {
      setIssueMsg(e instanceof Error ? e.message : "Could not issue fees");
    } finally {
      setIssuing(false);
    }
  }

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
      <div className="flex items-center justify-between gap-2">
        <Link href="/app/coaching/matrix" className="text-[13px] font-semibold text-emerald-700">
          ← Academic Matrix
        </Link>
        <Button type="button" variant="primary" size="sm" onClick={() => setIssueOpen(true)}>
          Issue New Fees
        </Button>
      </div>

      <h1 className="mt-1 text-[20px] font-bold text-zinc-900">Fee Dashboard</h1>
      <p className="text-[12px] text-zinc-500">Installments, collections, and parent reminders</p>

      {showManualFallback ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          WhatsApp is not connected — use Remind buttons to send installment notices from your phone.
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
      ) : dashboard ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
              <div className="text-[22px] font-bold text-emerald-600">{formatINR(dashboard.currentMonthCollected)}</div>
              <div className="text-[12px] font-semibold text-zinc-700">Collected this month</div>
            </div>
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <div className="text-[22px] font-bold text-red-600">{formatINR(dashboard.pendingAmount)}</div>
              <div className="text-[12px] font-semibold text-red-700">Total pending</div>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
              <div className="text-[22px] font-bold text-zinc-900">{dashboard.totalStudents}</div>
              <div className="text-[12px] font-semibold text-zinc-700">Active students</div>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <div className="text-[22px] font-bold text-amber-600">{dashboard.overdueCount}</div>
              <div className="text-[12px] font-semibold text-amber-700">Overdue</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[13px] font-bold text-zinc-900">Pending Fee Collection</div>
            {dashboard.pendingFeesList.length === 0 ? (
              <div className="mt-3">
                <EmptyState icon="calendar" title="All fees collected!" description="No pending fees right now." />
              </div>
            ) : (
              Object.entries(byMonth)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([month, fees]) => (
                  <div key={month} className="mt-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-[12px] font-bold uppercase tracking-wide text-zinc-500">{month}</span>
                      {month === currentMonth ? (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">Current</span>
                      ) : null}
                    </div>
                    <div className="grid gap-2">
                      {fees.map((fee) => {
                        const overdue = isOverdue(fee.dueDate);
                        const remaining = fee.amountCents - fee.paidAmountCents;
                        const dueLabel = new Date(fee.dueDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        });
                        return (
                          <Card key={fee.id} className={`!p-4 ${overdue ? "border-amber-100" : ""}`}>
                            <div className="flex items-center gap-3">
                              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-[13px] font-bold text-blue-700">
                                {fee.student.name[0]?.toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[14px] font-bold text-zinc-900">{fee.student.name}</span>
                                  {fee.installmentIndex ? (
                                    <span className="text-[10px] text-zinc-400">
                                      Inst {fee.installmentIndex}/{fee.installmentTotal}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-[12px] text-zinc-500">
                                  {formatINR(remaining)} due · {dueLabel}
                                  {overdue ? <span className="ml-1 font-semibold text-amber-600">OVERDUE</span> : null}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => markFeePaid(fee.id)}
                                  disabled={markingFee === fee.id}
                                  className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap"
                                >
                                  {markingFee === fee.id ? "…" : "Mark Paid"}
                                </button>
                                {fee.student.phone ? (
                                  <ManualWhatsAppButton
                                    label="Remind"
                                    onClick={() =>
                                      openInstallmentReminder(
                                        fee.student.phone!,
                                        Math.round(remaining / 100),
                                        fee.student.name,
                                        fee.courseName ?? fee.student.course ?? "enrollment",
                                        dueLabel,
                                      )
                                    }
                                  />
                                ) : null}
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

      {issueOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIssueOpen(false);
          }}
        >
          <Card className="relative z-10 w-full max-w-md !p-5 shadow-lg">
            <h2 className="text-[16px] font-semibold text-zinc-900">Issue New Fees</h2>
            <p className="mt-1 text-[13px] text-zinc-600">Generate monthly or installment fee ledgers for a batch.</p>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-[12px] font-medium text-zinc-700">
                Batch
                <select
                  value={issueBatchId}
                  onChange={(e) => setIssueBatchId(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 px-3 text-[14px]"
                >
                  <option value="">Select batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b._count.enrollments} students)
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-[12px] font-medium text-zinc-700">
                Billing month
                <input
                  type="month"
                  value={issueMonth}
                  onChange={(e) => setIssueMonth(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 px-3 text-[14px]"
                />
              </label>
              <label className="grid gap-1 text-[12px] font-medium text-zinc-700">
                Total amount (₹ per student)
                <input
                  type="number"
                  min={1}
                  value={issueAmountRupees}
                  onChange={(e) => setIssueAmountRupees(e.target.value)}
                  placeholder="e.g. 15000"
                  className="h-10 rounded-xl border border-zinc-200 px-3 text-[14px]"
                />
              </label>
              <label className="grid gap-1 text-[12px] font-medium text-zinc-700">
                Installments
                <select
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 px-3 text-[14px]"
                >
                  {[1, 2, 3, 4, 6].map((n) => (
                    <option key={n} value={String(n)}>
                      {n === 1 ? "Single payment" : `${n} installments`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {issueMsg ? <p className="mt-3 text-[13px] text-emerald-700">{issueMsg}</p> : null}
            <div className="mt-5 flex gap-2">
              <Button type="button" variant="secondary" size="md" className="flex-1" onClick={() => setIssueOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" size="md" className="flex-1" loading={issuing} onClick={() => void issueFees()}>
                Issue fees
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
