"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiBase } from "@/lib/api-base";
import { Button, Card } from "@/components/ui";

type StaffRow = {
  id: string;
  title: string | null;
  specializations: string[];
  user: { name: string | null };
};

type CourseOption = { id: string; name: string; streamName: string };

type MatrixResponse = {
  streams: Array<{
    id: string;
    name: string;
    courses: Array<{ id: string; name: string }>;
  }>;
};

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export default function CoachingBatchesPage() {
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [courseId, setCourseId] = useState("");
  const [name, setName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(["MON", "WED", "FRI"]);
  const [staffIds, setStaffIds] = useState<string[]>([]);
  const [conflict, setConflict] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const [matrixRes, staffRes] = await Promise.all([
        fetch(`${apiBase()}/coaching/matrix`, { headers: { authorization: `Bearer ${token}` } }),
        fetch(`${apiBase()}/coaching/staff`, { headers: { authorization: `Bearer ${token}` } }),
      ]);
      const matrix = (await matrixRes.json()) as MatrixResponse;
      const staffData = (await staffRes.json()) as StaffRow[];
      const flat: CourseOption[] = [];
      for (const stream of matrix.streams ?? []) {
        for (const course of stream.courses ?? []) {
          flat.push({ id: course.id, name: course.name, streamName: stream.name });
        }
      }
      setCourses(flat);
      setStaff(Array.isArray(staffData) ? staffData : []);
      if (!courseId && flat[0]) setCourseId(flat[0].id);
    } catch {
      setError("Could not load courses or faculty");
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const payload = useMemo(
    () => ({
      roomNumber: roomNumber.trim() || undefined,
      startTime,
      endTime,
      daysOfWeek,
      staffIds,
    }),
    [roomNumber, startTime, endTime, daysOfWeek, staffIds],
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !courseId) return;
    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await fetch(`${apiBase()}/coaching/batches/check-conflict`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { conflict?: boolean; reason?: string };
        setConflict(data.conflict ? (data.reason ?? "FACULTY_SCHEDULE_CONFLICT") : null);
      } catch {
        setConflict(null);
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [payload, courseId]);

  function toggleDay(day: string) {
    setDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  function toggleStaff(id: string) {
    setStaffIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function saveBatch() {
    const token = localStorage.getItem("token");
    if (!token || !courseId || !name.trim()) return;
    if (conflict) {
      setError(conflict);
      return;
    }
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(`${apiBase()}/coaching/batches`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          courseId,
          name: name.trim(),
          roomNumber: roomNumber.trim() || undefined,
          startTime,
          endTime,
          daysOfWeek,
          staffIds,
        }),
      });
      const data = (await res.json()) as { message?: string; id?: string };
      if (!res.ok) throw new Error(data.message ?? "Could not create batch");
      setMsg(`Batch "${name}" created successfully.`);
      setName("");
      setRoomNumber("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Link href="/app/coaching/matrix" className="text-[13px] font-semibold text-emerald-700">
        ← Academic Matrix
      </Link>

      <div>
        <h1 className="text-[20px] font-bold text-zinc-900">Batch Wizard</h1>
        <p className="text-[12px] text-zinc-500">Faculty, room, and schedule with live conflict detection</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div>
      ) : null}
      {msg ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">{msg}</div>
      ) : null}

      <Card className="!p-4 space-y-4">
        <label className="grid gap-1 text-[12px] font-medium text-zinc-700">
          Course
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="h-10 rounded-xl border border-zinc-200 px-3 text-[14px]"
          >
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.streamName} — {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-[12px] font-medium text-zinc-700">
          Batch name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. NEET 2026 Morning A"
            className="h-10 rounded-xl border border-zinc-200 px-3 text-[14px]"
          />
        </label>

        <label className="grid gap-1 text-[12px] font-medium text-zinc-700">
          Room number
          <input
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="e.g. 204"
            className="h-10 rounded-xl border border-zinc-200 px-3 text-[14px]"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-[12px] font-medium text-zinc-700">
            Start time
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 px-3 text-[14px]"
            />
          </label>
          <label className="grid gap-1 text-[12px] font-medium text-zinc-700">
            End time
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 px-3 text-[14px]"
            />
          </label>
        </div>

        <div>
          <div className="text-[12px] font-medium text-zinc-700">Days of week</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => {
              const on = daysOfWeek.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                    on ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[12px] font-medium text-zinc-700">Faculty (domain experts)</div>
          {staff.length === 0 ? (
            <p className="mt-2 text-[12px] text-zinc-500">Add staff from Settings → Staff first.</p>
          ) : (
            <div className="mt-2 grid gap-2">
              {staff.map((s) => {
                const on = staffIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleStaff(s.id)}
                    className={`flex min-h-[44px] items-center justify-between rounded-xl border px-3 py-2 text-left ${
                      on ? "border-emerald-300 bg-emerald-50" : "border-zinc-100 bg-white"
                    }`}
                  >
                    <div>
                      <div className="text-[13px] font-semibold text-zinc-900">
                        {s.title ? `${s.title} ` : ""}
                        {s.user.name ?? "Faculty"}
                      </div>
                      {s.specializations.length > 0 ? (
                        <div className="text-[11px] text-zinc-500">{s.specializations.join(" · ")}</div>
                      ) : null}
                    </div>
                    <span className={`text-[11px] font-bold ${on ? "text-emerald-700" : "text-zinc-400"}`}>
                      {on ? "✓" : "+"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {checking ? (
          <p className="text-[12px] text-zinc-500">Checking schedule conflicts…</p>
        ) : conflict ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-900">
            ⚠ {conflict === "FACULTY_SCHEDULE_CONFLICT" ? "Faculty or room schedule conflict detected" : conflict}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">
            ✓ No schedule conflicts detected
          </div>
        )}

        <Button
          type="button"
          variant="primary"
          size="md"
          className="w-full"
          loading={saving}
          disabled={!!conflict || !courseId || !name.trim()}
          onClick={() => void saveBatch()}
        >
          Create batch
        </Button>
      </Card>
    </div>
  );
}
