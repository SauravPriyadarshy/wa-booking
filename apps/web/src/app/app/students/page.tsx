"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiBase } from "@/lib/api-base";
import { Button, Card, EmptyState, FieldInput } from "@/components/ui";

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
  attendancePct: number | null;
  pendingFees: number;
};

function AttendanceBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-[11px] text-zinc-400">No data</span>;
  const color = pct >= 80 ? "text-emerald-600 bg-emerald-50" : pct >= 60 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${color}`}>{pct}%</span>;
}

function FeeBadge({ count }: { count: number }) {
  if (count === 0) return <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">Paid up</span>;
  return <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">{count} pending</span>;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", parentName: "", phone: "", classGrade: "", batch: "", course: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login");
      const res = await fetch(`${apiBase()}/coaching/students`, { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Failed");
      setStudents(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const n = q.toLowerCase();
    if (!n) return students;
    return students.filter((s) =>
      s.name.toLowerCase().includes(n) ||
      (s.batch ?? "").toLowerCase().includes(n) ||
      (s.course ?? "").toLowerCase().includes(n)
    );
  }, [students, q]);

  async function addStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${apiBase()}/coaching/students`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Failed");
      setShowForm(false);
      setForm({ name: "", parentName: "", phone: "", classGrade: "", batch: "", course: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  const batches = [...new Set(students.map((s) => s.batch).filter(Boolean))];

  return (
    <div className="px-4 pb-28 pt-4 md:pb-8">
      <a href="/app" className="text-[13px] font-semibold text-emerald-700">← Hub</a>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-zinc-900">Students 📚</h1>
          <p className="text-[12px] text-zinc-500">{students.filter((s) => s.isActive).length} active students</p>
        </div>
        <Button type="button" variant="primary" size="md" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Student"}
        </Button>
      </div>

      {/* Batch chips */}
      {batches.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {batches.map((b) => (
            <button key={b} type="button" onClick={() => setQ(q === b! ? "" : b!)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${q === b ? "border-emerald-400 bg-emerald-600 text-white" : "border-zinc-200 bg-white text-zinc-700"}`}>
              {b}
            </button>
          ))}
        </div>
      )}

      {/* Add student form */}
      {showForm && (
        <form onSubmit={addStudent} className="mt-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm space-y-3">
          <div className="text-[14px] font-bold text-zinc-900">New Student</div>
          <FieldInput placeholder="Student name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FieldInput placeholder="Parent name" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
          <FieldInput placeholder="Phone" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <FieldInput placeholder="Class / Grade" value={form.classGrade} onChange={(e) => setForm({ ...form, classGrade: e.target.value })} />
            <FieldInput placeholder="Batch" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} />
          </div>
          <FieldInput placeholder="Course" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={saving}>Save Student</Button>
        </form>
      )}

      <div className="mt-3">
        <FieldInput placeholder="Search name, batch, course…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {error && <div className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-800">{error}</div>}

      <div className="mt-4 grid gap-2">
        {loading ? (
          <><div className="h-20 animate-pulse rounded-2xl bg-zinc-100" /><div className="h-20 animate-pulse rounded-2xl bg-zinc-100" /></>
        ) : filtered.length === 0 ? (
          <EmptyState icon="users" title="No students yet" description="Add your first student to start tracking attendance and fees." />
        ) : (
          filtered.map((s) => (
            <a key={s.id} href={`/app/students/${s.id}`} className="block">
              <Card className="!p-4 hover:border-emerald-100 hover:shadow-md transition-colors">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-[14px] font-bold text-blue-700">
                    {s.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-bold text-zinc-900">{s.name}</span>
                      {s.batch && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">{s.batch}</span>}
                    </div>
                    {s.parentName && <div className="text-[12px] text-zinc-500">Parent: {s.parentName}</div>}
                    {s.course && <div className="text-[12px] text-zinc-400">{s.course}{s.classGrade ? ` · Class ${s.classGrade}` : ""}</div>}
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <AttendanceBadge pct={s.attendancePct} />
                      <FeeBadge count={s.pendingFees} />
                    </div>
                  </div>
                  <span className="shrink-0 text-zinc-300 mt-1">›</span>
                </div>
              </Card>
            </a>
          ))
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <a href="/app/fees" className="flex-1 grid place-items-center h-11 rounded-xl border border-zinc-200 bg-white text-[13px] font-semibold text-zinc-700">
          💰 Fee Dashboard
        </a>
        <a href="/app/students/attendance" className="flex-1 grid place-items-center h-11 rounded-xl border border-zinc-200 bg-white text-[13px] font-semibold text-zinc-700">
          📋 Mark Attendance
        </a>
      </div>
    </div>
  );
}
