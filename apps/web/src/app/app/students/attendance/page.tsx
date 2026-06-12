"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiBase } from "@/lib/api-base";

type Student = { id: string; name: string; batch: string | null };

export default function AttendancePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [dateISO, setDateISO] = useState(() => new Date().toISOString().slice(0, 10));
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${apiBase()}/coaching/students`, { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: Student[] | { items?: Student[] }) => {
        const rows = Array.isArray(d) ? d : (d.items ?? []);
        setStudents(rows.map((s) => ({ id: s.id, name: s.name, batch: s.batch })));
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    const token = localStorage.getItem("token");
    if (!token) return;
    setSaving(true);
    setMsg(null);
    try {
      const records = students.map((s) => ({
        studentId: s.id,
        present: present[s.id] ?? false,
      }));
      const res = await fetch(`${apiBase()}/coaching/attendance/bulk`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ dateISO, records }),
      });
      const data = (await res.json()) as { message?: string; marked?: number };
      if (!res.ok) throw new Error(data.message ?? "Save failed");
      setMsg(`Saved ✓ (${data.marked ?? records.length} students)`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save — try again");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-8 text-center text-[14px] text-zinc-500">Loading…</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <Link href="/app/students" className="text-[13px] font-medium text-emerald-700">← Students</Link>
        <h1 className="mt-1 text-xl font-semibold">Attendance</h1>
        <p className="text-[13px] text-zinc-500">Mark present / absent for today</p>
      </div>

      <input
        type="date"
        value={dateISO}
        onChange={(e) => setDateISO(e.target.value)}
        className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-[14px]"
      />

      <div className="space-y-2">
        {students.map((s) => (
          <label
            key={s.id}
            className="flex min-h-[52px] items-center justify-between rounded-2xl border border-zinc-100 bg-white px-4 shadow-sm"
          >
            <div>
              <div className="text-[14px] font-semibold text-zinc-900">{s.name}</div>
              {s.batch ? <div className="text-[11px] text-zinc-500">{s.batch}</div> : null}
            </div>
            <input
              type="checkbox"
              checked={present[s.id] ?? false}
              onChange={(e) => setPresent((p) => ({ ...p, [s.id]: e.target.checked }))}
              className="h-5 w-5 rounded border-zinc-300 text-emerald-600"
            />
          </label>
        ))}
        {students.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-zinc-500">No students yet — add from Students page.</p>
        ) : null}
      </div>

      {students.length > 0 ? (
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-600 text-[15px] font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save attendance"}
        </button>
      ) : null}
      {msg ? <p className="text-center text-[13px] text-emerald-700">{msg}</p> : null}
    </div>
  );
}
