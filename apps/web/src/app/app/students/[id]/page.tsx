"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiBase } from "@/lib/api-base";
import { ManualWhatsAppButton } from "@/components/app/manual-whatsapp-button";
import { useWhatsAppLink } from "@/hooks/use-whatsapp-link";
import { Button, Card } from "@/components/ui";

type EnrollmentRow = {
  id: string;
  status: "ACTIVE" | "SUSPENDED";
  enrollmentDate: string;
  batch: {
    id: string;
    name: string;
    course: { id: string; name: string; stream: { id: string; name: string; key: string } };
  };
};

type AttendanceRecord = { id: string; dateISO: string; present: boolean };
type FeeRecord = {
  id: string;
  month: string;
  amountCents: number;
  paidAmountCents: number;
  dueDate: string;
  paidAt: string | null;
  notes: string | null;
  courseName: string | null;
  installmentIndex: number | null;
  installmentTotal: number | null;
};

type Student = {
  id: string;
  name: string;
  parentName: string | null;
  phone: string | null;
  classGrade: string | null;
  batch: string | null;
  course: string | null;
  isActive: boolean;
  admissionAt: string;
  enrollments: EnrollmentRow[];
  attendance: AttendanceRecord[];
  feeRecords: FeeRecord[];
};

type BatchOption = {
  id: string;
  name: string;
  course: { name: string; stream: { name: string } };
};

type Tab = "enrollment" | "attendance" | "fees";

function formatINR(cents: number) {
  return `₹${Math.round(cents / 100).toLocaleString("en-IN")}`;
}

function MonthCalendar({ records }: { records: AttendanceRecord[] }) {
  const byDate = useMemo(() => {
    const m: Record<string, boolean> = {};
    records.forEach((r) => {
      m[r.dateISO] = r.present;
    });
    return m;
  }, [records]);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const cells: Array<{ day: number | null; dateISO?: string }> = [];
  for (let i = 0; i < firstDay; i += 1) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d += 1) {
    const dateISO = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateISO });
  }

  return (
    <Card className="!p-4">
      <div className="text-[13px] font-bold text-zinc-900">{monthLabel}</div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-zinc-400">
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, idx) => {
          if (!cell.day || !cell.dateISO) {
            return <div key={`e-${idx}`} className="aspect-square" />;
          }
          const status = byDate[cell.dateISO];
          const bg =
            status === true ? "bg-emerald-500 text-white" : status === false ? "bg-red-400 text-white" : "bg-zinc-100 text-zinc-500";
          const label = status === true ? "Present" : status === false ? "Absent" : "—";
          return (
            <div
              key={cell.dateISO}
              title={`${cell.dateISO}: ${label}`}
              className={`flex aspect-square items-center justify-center rounded-lg text-[11px] font-semibold ${bg}`}
            >
              {cell.day}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded bg-emerald-500" /> Present
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded bg-red-400" /> Absent
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded bg-zinc-100" /> Not marked
        </span>
      </div>
    </Card>
  );
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { showManualFallback, openInstallmentReminder } = useWhatsAppLink();
  const [student, setStudent] = useState<Student | null>(null);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("enrollment");
  const [admitOpen, setAdmitOpen] = useState(false);
  const [admitBatchId, setAdmitBatchId] = useState("");
  const [admitting, setAdmitting] = useState(false);
  const [payOpen, setPayOpen] = useState<string | null>(null);
  const [payRupees, setPayRupees] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [paying, setPaying] = useState(false);
  const [receiptFee, setReceiptFee] = useState<FeeRecord | null>(null);

  const token = useMemo(() => (typeof window === "undefined" ? null : localStorage.getItem("token")), []);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    try {
      const [studentRes, batchRes] = await Promise.all([
        fetch(`${apiBase()}/coaching/students/${id}`, { headers: { authorization: `Bearer ${token}` } }),
        fetch(`${apiBase()}/coaching/batches`, { headers: { authorization: `Bearer ${token}` } }),
      ]);
      const data = (await studentRes.json()) as Student & { message?: string };
      if (!studentRes.ok) throw new Error(data.message ?? "Failed");
      setStudent(data);
      const batchData = (await batchRes.json()) as BatchOption[];
      setBatches(Array.isArray(batchData) ? batchData : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleEnrollment(enrollmentId: string, status: "ACTIVE" | "SUSPENDED") {
    if (!token) return;
    try {
      const res = await fetch(`${apiBase()}/coaching/enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  async function quickAdmit() {
    if (!token || !student || !admitBatchId) return;
    setAdmitting(true);
    try {
      const res = await fetch(`${apiBase()}/coaching/enrollments`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ studentId: student.id, batchId: admitBatchId }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Failed");
      setAdmitOpen(false);
      setAdmitBatchId("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setAdmitting(false);
    }
  }

  async function recordPayment(fee: FeeRecord) {
    if (!token) return;
    const rupees = Number(payRupees);
    if (!Number.isFinite(rupees) || rupees <= 0) return;
    setPaying(true);
    try {
      const res = await fetch(`${apiBase()}/coaching/fees/${fee.id}/payment`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          paidAmountCents: Math.round(rupees * 100),
          method: payMethod,
        }),
      });
      const data = (await res.json()) as FeeRecord & { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Payment failed");
      setReceiptFee({ ...fee, paidAmountCents: data.paidAmountCents, paidAt: data.paidAt });
      setPayOpen(null);
      setPayRupees("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setPaying(false);
    }
  }

  const totalPaid = useMemo(
    () => student?.feeRecords.reduce((s, f) => s + (f.paidAt ? f.amountCents : f.paidAmountCents), 0) ?? 0,
    [student?.feeRecords],
  );
  const totalPending = useMemo(
    () =>
      student?.feeRecords.reduce((s, f) => s + (f.paidAt ? 0 : f.amountCents - f.paidAmountCents), 0) ?? 0,
    [student?.feeRecords],
  );
  const attendancePct = useMemo(() => {
    if (!student?.attendance.length) return null;
    const present = student.attendance.filter((a) => a.present).length;
    return Math.round((present / student.attendance.length) * 100);
  }, [student?.attendance]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
        <div className="h-32 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/app/students" className="text-[13px] font-semibold text-emerald-700">
        ← Students
      </Link>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div>
      ) : null}

      {student ? (
        <>
          <div className="mt-2 flex items-start gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-100 text-[20px] font-bold text-blue-700">
              {student.name[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-zinc-900">{student.name}</h1>
              {student.parentName ? <p className="text-[13px] text-zinc-500">Parent: {student.parentName}</p> : null}
              <div className="mt-1 flex flex-wrap gap-1.5">
                {student.classGrade ? (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">
                    Class {student.classGrade}
                  </span>
                ) : null}
                {student.enrollments
                  .filter((e) => e.status === "ACTIVE")
                  .map((e) => (
                    <span
                      key={e.id}
                      className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700"
                    >
                      {e.batch.course.stream.name} · {e.batch.name}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-zinc-100 bg-white p-3 text-center shadow-sm">
              <div
                className={`text-[18px] font-bold ${attendancePct !== null && attendancePct < 60 ? "text-red-600" : "text-emerald-600"}`}
              >
                {attendancePct !== null ? `${attendancePct}%` : "—"}
              </div>
              <div className="text-[11px] text-zinc-500">Attendance</div>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-white p-3 text-center shadow-sm">
              <div className="text-[18px] font-bold text-emerald-600">{formatINR(totalPaid)}</div>
              <div className="text-[11px] text-zinc-500">Collected</div>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-white p-3 text-center shadow-sm">
              <div className={`text-[18px] font-bold ${totalPending > 0 ? "text-red-600" : "text-zinc-400"}`}>
                {formatINR(totalPending)}
              </div>
              <div className="text-[11px] text-zinc-500">Balance</div>
            </div>
          </div>

          <div className="flex rounded-xl bg-zinc-100 p-1">
            {(
              [
                ["enrollment", "Enrollment"],
                ["attendance", "Attendance"],
                ["fees", "Fee Ledger"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`flex-1 rounded-lg py-2 text-[13px] font-semibold transition ${
                  tab === k ? "bg-white text-blue-800 shadow-sm" : "text-zinc-600"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {tab === "enrollment" ? (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button type="button" size="sm" variant="primary" onClick={() => setAdmitOpen(true)}>
                  Quick Admit
                </Button>
              </div>
              {student.enrollments.length === 0 ? (
                <Card className="!p-5 text-center text-[14px] text-zinc-500">No batch enrollments yet.</Card>
              ) : (
                student.enrollments.map((e) => (
                  <Card key={e.id} className="!p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[14px] font-bold text-zinc-900">{e.batch.name}</div>
                        <div className="text-[12px] text-zinc-500">
                          {e.batch.course.stream.name} · {e.batch.course.name}
                        </div>
                        <div className="mt-1 text-[11px] text-zinc-400">
                          Since {new Date(e.enrollmentDate).toLocaleDateString("en-IN")}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            e.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {e.status}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            void toggleEnrollment(
                              e.id,
                              e.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                            )
                          }
                          className="text-[11px] font-semibold text-emerald-700"
                        >
                          {e.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          ) : null}

          {tab === "attendance" ? (
            <div className="space-y-3">
              <MonthCalendar records={student.attendance} />
              <Link href="/app/coaching/attendance" className="block text-center text-[13px] font-semibold text-emerald-700">
                Mark today&apos;s attendance →
              </Link>
            </div>
          ) : null}

          {tab === "fees" ? (
            <div className="space-y-2">
              {student.feeRecords.length === 0 ? (
                <Card className="!p-5 text-center">
                  <div className="text-[14px] text-zinc-500">No fee records yet.</div>
                  <Link href="/app/coaching/fees" className="mt-2 block text-[13px] font-semibold text-emerald-600">
                    Issue fees →
                  </Link>
                </Card>
              ) : (
                student.feeRecords.map((fee) => {
                  const remaining = fee.paidAt ? 0 : fee.amountCents - fee.paidAmountCents;
                  const dueLabel = new Date(fee.dueDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <Card key={fee.id} className={`!p-4 ${remaining > 0 ? "border-amber-100" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[14px] font-bold text-zinc-900">
                            {fee.month}
                            {fee.installmentIndex
                              ? ` · Inst ${fee.installmentIndex}/${fee.installmentTotal}`
                              : ""}
                          </div>
                          <div className="text-[12px] text-zinc-500">
                            {formatINR(fee.amountCents)} · Due {dueLabel}
                            {fee.courseName ? ` · ${fee.courseName}` : ""}
                          </div>
                          {fee.paidAmountCents > 0 && !fee.paidAt ? (
                            <div className="text-[11px] text-emerald-700">
                              Paid {formatINR(fee.paidAmountCents)} · Pending {formatINR(remaining)}
                            </div>
                          ) : null}
                          {fee.notes ? <div className="text-[11px] text-zinc-400">{fee.notes}</div> : null}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {fee.paidAt ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-600">
                              ✓ Paid
                            </span>
                          ) : (
                            <>
                              <Button type="button" size="sm" variant="primary" onClick={() => setPayOpen(fee.id)}>
                                Record payment
                              </Button>
                              {student.phone ? (
                                <ManualWhatsAppButton
                                  label="Remind"
                                  onClick={() =>
                                    openInstallmentReminder(
                                      student.phone!,
                                      Math.round(remaining / 100),
                                      student.name,
                                      fee.courseName ?? student.course ?? "course",
                                      dueLabel,
                                    )
                                  }
                                />
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          ) : null}
        </>
      ) : null}

      {admitOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAdmitOpen(false);
          }}
        >
          <Card className="relative z-10 w-full max-w-md !p-5 shadow-lg">
            <h2 className="text-[16px] font-semibold text-zinc-900">Quick Admit</h2>
            <p className="mt-1 text-[13px] text-zinc-600">Enroll into an additional batch or stream.</p>
            <select
              value={admitBatchId}
              onChange={(e) => setAdmitBatchId(e.target.value)}
              className="mt-4 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]"
            >
              <option value="">Select batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.course.stream.name} · {b.course.name} · {b.name}
                </option>
              ))}
            </select>
            <div className="mt-5 flex gap-2">
              <Button type="button" variant="secondary" size="md" className="flex-1" onClick={() => setAdmitOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                className="flex-1"
                loading={admitting}
                onClick={() => void quickAdmit()}
              >
                Enroll
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      {payOpen && student ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setPayOpen(null);
          }}
        >
          <Card className="relative z-10 w-full max-w-md !p-5 shadow-lg">
            <h2 className="text-[16px] font-semibold text-zinc-900">Record Payment</h2>
            {(() => {
              const fee = student.feeRecords.find((f) => f.id === payOpen);
              if (!fee) return null;
              const remaining = fee.amountCents - fee.paidAmountCents;
              return (
                <>
                  <p className="mt-1 text-[13px] text-zinc-600">
                    Balance due: {formatINR(remaining)} for {fee.month}
                  </p>
                  <input
                    type="number"
                    min={1}
                    value={payRupees}
                    onChange={(e) => setPayRupees(e.target.value)}
                    placeholder="Amount in ₹"
                    className="mt-4 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]"
                  />
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="mt-3 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank">Bank transfer</option>
                  </select>
                  <div className="mt-5 flex gap-2">
                    <Button type="button" variant="secondary" size="md" className="flex-1" onClick={() => setPayOpen(null)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      className="flex-1"
                      loading={paying}
                      onClick={() => void recordPayment(fee)}
                    >
                      Save
                    </Button>
                  </div>
                </>
              );
            })()}
          </Card>
        </div>
      ) : null}

      {receiptFee && student ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center print:bg-white print:p-0"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setReceiptFee(null);
          }}
        >
          <Card className="relative z-10 w-full max-w-sm !p-5 shadow-lg print:shadow-none" id="fee-receipt">
            <div className="text-center">
              <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Fee Receipt</div>
              <div className="mt-2 text-[16px] font-bold text-zinc-900">{student.name}</div>
              <div className="text-[12px] text-zinc-500">{student.parentName ?? student.phone ?? ""}</div>
            </div>
            <div className="mt-4 space-y-2 border-t border-dashed border-zinc-200 pt-4 text-[13px]">
              <div className="flex justify-between">
                <span className="text-zinc-500">Month</span>
                <span className="font-semibold">{receiptFee.month}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Amount</span>
                <span className="font-semibold">{formatINR(receiptFee.paidAmountCents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Date</span>
                <span className="font-semibold">{new Date().toLocaleDateString("en-IN")}</span>
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] text-zinc-400">धन्यवाद · BookNow Coaching</p>
            <div className="mt-4 flex gap-2 print:hidden">
              <Button type="button" variant="secondary" size="md" className="flex-1" onClick={() => setReceiptFee(null)}>
                Close
              </Button>
              <Button type="button" variant="primary" size="md" className="flex-1" onClick={() => window.print()}>
                Print
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
