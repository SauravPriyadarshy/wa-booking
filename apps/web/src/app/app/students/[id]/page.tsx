"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import { apiBase } from "@/lib/api-base";
import { Card } from "@/components/ui";

type AttendanceRecord = { id: string; dateISO: string; present: boolean };
type FeeRecord = { id: string; month: string; amountCents: number; dueDate: string; paidAt: string | null; notes: string | null };
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
  attendance: AttendanceRecord[];
  feeRecords: FeeRecord[];
};

type Tab = "attendance" | "fees" | "info";

function formatINR(cents: number) { return `₹${Math.round(cents / 100).toLocaleString("en-IN")}`; }

function AttendanceCalendar({ records }: { records: AttendanceRecord[] }) {
  const byDate = useMemo(() => {
    const m: Record<string, boolean> = {};
    records.forEach((r) => { m[r.dateISO] = r.present; });
    return m;
  }, [records]);

  // Get last 30 days
  const days: string[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      <div className="text-[12px] font-semibold uppercase tracking-wide text-zinc-400 mb-3">Last 30 Days Attendance</div>
      <div className="grid grid-cols-10 gap-1">
        {days.map((d) => {
          const status = byDate[d];
          const bg = status === true ? "bg-emerald-500" : status === false ? "bg-red-400" : "bg-zinc-100";
          const date = new Date(d);
          return (
            <div key={d} title={d} className={`h-5 w-full rounded-sm ${bg}`} />
          );
        })}
      </div>
      <div className="mt-2 flex gap-3 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Present</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400" /> Absent</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-zinc-100" /> Not marked</span>
      </div>
    </div>
  );
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("attendance");
  const [markingFee, setMarkingFee] = useState<string | null>(null);

  const token = useMemo(() => (typeof window === "undefined" ? null : localStorage.getItem("token")), []);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase()}/coaching/students/${id}`, { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Failed");
      setStudent(data as Student);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { void load(); }, [load]);

  async function markFeePaid(feeId: string) {
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

  const attendancePct = useMemo(() => {
    if (!student?.attendance.length) return null;
    const present = student.attendance.filter((a) => a.present).length;
    return Math.round((present / student.attendance.length) * 100);
  }, [student?.attendance]);

  const totalPaid = useMemo(() => (student?.feeRecords.filter((f) => f.paidAt).reduce((s, f) => s + f.amountCents, 0) ?? 0), [student?.feeRecords]);
  const totalPending = useMemo(() => (student?.feeRecords.filter((f) => !f.paidAt).reduce((s, f) => s + f.amountCents, 0) ?? 0), [student?.feeRecords]);

  if (loading) return (
    <div className="px-4 py-4 space-y-3">
      <div className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
      <div className="h-32 animate-pulse rounded-2xl bg-zinc-100" />
    </div>
  );

  return (
    <div className="px-4 pb-28 pt-4 md:pb-8">
      <a href="/app/students" className="text-[13px] font-semibold text-emerald-700">← Students</a>

      {error && <div className="mt-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">{error}</div>}

      {student && (
        <>
          {/* Header */}
          <div className="mt-3 flex items-start gap-3">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-100 text-[20px] font-bold text-blue-700">
              {student.name[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-zinc-900">{student.name}</h1>
              {student.parentName && <p className="text-[13px] text-zinc-500">Parent: {student.parentName}</p>}
              <div className="mt-1 flex flex-wrap gap-1.5">
                {student.batch && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">{student.batch}</span>}
                {student.classGrade && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">Class {student.classGrade}</span>}
                {student.course && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600">{student.course}</span>}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-zinc-100 bg-white p-3 text-center shadow-sm">
              <div className={`text-[18px] font-bold ${attendancePct !== null && attendancePct < 60 ? "text-red-600" : "text-emerald-600"}`}>
                {attendancePct !== null ? `${attendancePct}%` : "—"}
              </div>
              <div className="text-[11px] text-zinc-500">Attendance</div>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-white p-3 text-center shadow-sm">
              <div className="text-[18px] font-bold text-emerald-600">{formatINR(totalPaid)}</div>
              <div className="text-[11px] text-zinc-500">Paid</div>
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-white p-3 text-center shadow-sm">
              <div className={`text-[18px] font-bold ${totalPending > 0 ? "text-red-600" : "text-zinc-400"}`}>{formatINR(totalPending)}</div>
              <div className="text-[11px] text-zinc-500">Pending</div>
            </div>
          </div>

          {student.phone && (
            <a href={`https://wa.me/${student.phone.replace(/[^\d]/g, "")}`} target="_blank" rel="noreferrer"
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-[13px] font-bold text-white">
              💬 WhatsApp Parent
            </a>
          )}

          {/* Tabs */}
          <div className="mt-4 flex rounded-xl bg-zinc-100 p-1">
            {([["attendance", "Attendance"], ["fees", "Fees"], ["info", "Info"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setTab(k)}
                className={`flex-1 rounded-lg py-2 text-[13px] font-semibold transition ${tab === k ? "bg-white text-blue-800 shadow-sm" : "text-zinc-600"}`}>
                {l}
              </button>
            ))}
          </div>

          {tab === "attendance" && (
            <div className="mt-4">
              <AttendanceCalendar records={student.attendance} />
              <div className="mt-3 text-[12px] text-zinc-400 text-center">
                Total records: {student.attendance.length} · Present: {student.attendance.filter((a) => a.present).length}
              </div>
            </div>
          )}

          {tab === "fees" && (
            <div className="mt-4 space-y-2">
              {student.feeRecords.length === 0 ? (
                <Card className="!p-5 text-center">
                  <div className="text-[14px] text-zinc-500">No fee records yet.</div>
                  <a href="/app/fees" className="mt-2 block text-[13px] font-semibold text-emerald-600">Go to Fee Dashboard →</a>
                </Card>
              ) : (
                student.feeRecords.map((fee) => (
                  <Card key={fee.id} className={`!p-4 ${!fee.paidAt ? "border-red-100" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[14px] font-bold text-zinc-900">{fee.month}</div>
                        <div className="text-[12px] text-zinc-500">
                          {formatINR(fee.amountCents)} · Due {new Date(fee.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </div>
                        {fee.notes && <div className="text-[11px] text-zinc-400">{fee.notes}</div>}
                      </div>
                      {fee.paidAt ? (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-600">✓ Paid</span>
                      ) : (
                        <button type="button" onClick={() => markFeePaid(fee.id)} disabled={markingFee === fee.id}
                          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                          {markingFee === fee.id ? "…" : "Mark Paid"}
                        </button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {tab === "info" && (
            <Card className="mt-4 !p-4 space-y-3">
              {[
                { label: "Name", value: student.name },
                { label: "Parent", value: student.parentName },
                { label: "Phone", value: student.phone },
                { label: "Class", value: student.classGrade },
                { label: "Batch", value: student.batch },
                { label: "Course", value: student.course },
                { label: "Admission", value: student.admissionAt ? new Date(student.admissionAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label} className="flex justify-between">
                    <span className="text-[13px] text-zinc-500">{label}</span>
                    <span className="text-[13px] font-semibold text-zinc-900">{value}</span>
                  </div>
                ) : null
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
