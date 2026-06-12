"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiBase } from "@/lib/api-base";
import { ManualWhatsAppButton } from "@/components/app/manual-whatsapp-button";
import { useWhatsAppLink } from "@/hooks/use-whatsapp-link";
import { Card, EmptyState, Button } from "@/components/ui";

type FeeItem = {
  id: string;
  month: string;
  amountCents: number;
  dueDate: string;
  notes: string | null;
  student: { id: string; name: string; phone: string | null; batch: string | null };
};

type StudentRow = {
  id: string;
  name: string;
  batch: string | null;
  phone: string | null;
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

export default function FeesPage() {
  const { showManualFallback, openFeeReminder } = useWhatsAppLink();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingFee, setMarkingFee] = useState<string | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueBatch, setIssueBatch] = useState("");
  const [issueMonth, setIssueMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
  });
  const [issueAmountRupees, setIssueAmountRupees] = useState("");
  const [issueDueDate, setIssueDueDate] = useState(() => defaultDueDateForMonth(issueMonth));
  const [issueMsg, setIssueMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login");
      const res = await fetch(`${apiBase()}/coaching/fees/dashboard`, { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { message?: string }).message ?? "Failed");
      setDashboard(data as Dashboard);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${apiBase()}/coaching/students`, { headers: { authorization: `Bearer ${token}` } });
      const data = (await res.json()) as StudentRow[];
      if (res.ok && Array.isArray(data)) setStudents(data);
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    void load();
    void loadStudents();
  }, [load, loadStudents]);

  useEffect(() => {
    setIssueDueDate(defaultDueDateForMonth(issueMonth));
  }, [issueMonth]);

  const batches = useMemo(() => {
    const set = new Set<string>();
    for (const s of students) {
      if (s.batch?.trim()) set.add(s.batch.trim());
    }
    return [...set].sort();
  }, [students]);

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
    if (!issueBatch.trim() || !issueMonth.trim() || !Number.isFinite(amountRupees) || amountRupees <= 0) {
      setIssueMsg("Pick batch, month, and a valid amount.");
      return;
    }
    const targets = students.filter((s) => (s.batch ?? "").trim() === issueBatch.trim());
    if (targets.length === 0) {
      setIssueMsg("No students in this batch.");
      return;
    }

    setIssuing(true);
    setIssueMsg(null);
    const amountCents = Math.round(amountRupees * 100);
    let created = 0;
    try {
      for (const student of targets) {
        const res = await fetch(`${apiBase()}/coaching/fees`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify({
            studentId: student.id,
            amountCents,
            month: issueMonth,
            dueDate: issueDueDate,
            notes: `Batch ${issueBatch}`,
          }),
        });
        if (res.ok) created += 1;
      }
      setIssueMsg(`Created ${created} fee record${created === 1 ? "" : "s"} for ${issueBatch}.`);
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
        <a href="/app/students" className="text-[13px] font-semibold text-emerald-700">← Students</a>
        <Button type="button" variant="primary" size="sm" onClick={() => setIssueOpen(true)}>
          Issue New Fees
        </Button>
      </div>

      <h1 className="mt-1 text-[20px] font-bold text-zinc-900">Fee Dashboard</h1>
      <p className="text-[12px] text-zinc-500">Monthly fee collection overview</p>

      {showManualFallback ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          WhatsApp is not connected — use Remind buttons to send fee messages from your phone.
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
                      {month < currentMonth ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Overdue</span>
                      ) : null}
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
                                  {fee.student.batch ? (
                                    <span className="text-[11px] text-zinc-400">{fee.student.batch}</span>
                                  ) : null}
                                </div>
                                <div className="text-[12px] text-zinc-500">
                                  {formatINR(fee.amountCents)} · Due{" "}
                                  {new Date(fee.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
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
                                  showManualFallback ? (
                                    <ManualWhatsAppButton
                                      label="Remind"
                                      onClick={() => openFeeReminder(fee.student.phone!, fee.month)}
                                    />
                                  ) : (
                                    <a
                                      href={`https://wa.me/${fee.student.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Fee reminder for ${fee.month}`)}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rounded-xl border border-[#25D366] px-3 py-1 text-[11px] font-semibold text-[#25D366] whitespace-nowrap"
                                    >
                                      Remind
                                    </a>
                                  )
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
            <p className="mt-1 text-[13px] text-zinc-600">Create fee records for all students in a batch.</p>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-[12px] font-medium text-zinc-700">
                Batch
                <select
                  value={issueBatch}
                  onChange={(e) => setIssueBatch(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 px-3 text-[14px]"
                >
                  <option value="">Select batch</option>
                  {batches.map((b) => (
                    <option key={b} value={b}>
                      {b}
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
                Amount (₹ per student)
                <input
                  type="number"
                  min={1}
                  value={issueAmountRupees}
                  onChange={(e) => setIssueAmountRupees(e.target.value)}
                  placeholder="e.g. 1500"
                  className="h-10 rounded-xl border border-zinc-200 px-3 text-[14px]"
                />
              </label>
              <label className="grid gap-1 text-[12px] font-medium text-zinc-700">
                Due date
                <input
                  type="date"
                  value={issueDueDate}
                  onChange={(e) => setIssueDueDate(e.target.value)}
                  className="h-10 rounded-xl border border-zinc-200 px-3 text-[14px]"
                />
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
