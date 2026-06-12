"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiBase } from "@/lib/api-base";
import { Button, Card, EmptyState } from "@/components/ui";

type BatchRow = {
  id: string;
  name: string;
  roomNumber: string | null;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
  _count: { enrollments: number };
  staffAssignments: Array<{
    staff: { id: string; title: string | null; specializations: string[]; user: { name: string | null } };
  }>;
};

type CourseRow = {
  id: string;
  name: string;
  batches: BatchRow[];
};

type StreamRow = {
  id: string;
  key: string;
  name: string;
  courses: CourseRow[];
};

type MatrixResponse = { streams: StreamRow[] };

const STREAM_LABELS: Record<string, string> = {
  SCHOOLING: "Schooling",
  JEE: "IIT-JEE",
  NEET: "NEET",
  CIVIL_SERVICES: "BPSC",
  SSC: "SSC",
};

export default function CoachingMatrixPage() {
  const [matrix, setMatrix] = useState<MatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [newCourseName, setNewCourseName] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      let res = await fetch(`${apiBase()}/coaching/matrix`, {
        headers: { authorization: `Bearer ${token}` },
      });
      let data = (await res.json()) as MatrixResponse & { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Failed to load matrix");

      if (!data.streams?.length) {
        await fetch(`${apiBase()}/coaching/streams/ensure`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
          body: JSON.stringify({}),
        });
        res = await fetch(`${apiBase()}/coaching/matrix`, {
          headers: { authorization: `Bearer ${token}` },
        });
        data = (await res.json()) as MatrixResponse;
      }

      setMatrix(data);
      if (!selectedStreamId && data.streams[0]) setSelectedStreamId(data.streams[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [selectedStreamId]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedStream = useMemo(
    () => matrix?.streams.find((s) => s.id === selectedStreamId) ?? null,
    [matrix, selectedStreamId],
  );

  async function addCourse() {
    if (!selectedStream || !newCourseName.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setCreatingCourse(true);
    try {
      const res = await fetch(`${apiBase()}/coaching/courses`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ streamId: selectedStream.id, name: newCourseName.trim() }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Could not create course");
      setNewCourseName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setCreatingCourse(false);
    }
  }

  if (loading) {
    return <div className="py-10 text-center text-[14px] text-zinc-500">Loading academic matrix…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link href="/app" className="text-[13px] font-semibold text-emerald-700">
          ← Hub
        </Link>
        <Link href="/app/coaching/batches">
          <Button type="button" variant="primary" size="sm">
            + New Batch
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-[20px] font-bold text-zinc-900">Academic Matrix</h1>
        <p className="text-[12px] text-zinc-500">Streams → courses → active batches</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div>
      ) : null}

      {!matrix?.streams.length ? (
        <EmptyState icon="calendar" title="No streams yet" description="Initialize your coaching verticals." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {matrix.streams.map((stream) => {
              const batchCount = stream.courses.reduce((n, c) => n + c.batches.length, 0);
              const active = stream.id === selectedStreamId;
              return (
                <button
                  key={stream.id}
                  type="button"
                  onClick={() => setSelectedStreamId(stream.id)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    active
                      ? "border-emerald-300 bg-emerald-50 shadow-sm"
                      : "border-zinc-100 bg-white hover:border-zinc-200"
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                    {STREAM_LABELS[stream.key] ?? stream.key}
                  </div>
                  <div className="mt-1 text-[14px] font-bold text-zinc-900">{stream.name}</div>
                  <div className="mt-1 text-[11px] text-zinc-500">
                    {stream.courses.length} courses · {batchCount} batches
                  </div>
                </button>
              );
            })}
          </div>

          {selectedStream ? (
            <div className="space-y-4">
              <Card className="!p-4">
                <div className="text-[13px] font-bold text-zinc-900">{selectedStream.name} — Courses</div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder="e.g. NEET 2026 Foundation"
                    className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 text-[14px]"
                  />
                  <Button type="button" size="sm" variant="primary" loading={creatingCourse} onClick={() => void addCourse()}>
                    Add
                  </Button>
                </div>
              </Card>

              {selectedStream.courses.length === 0 ? (
                <EmptyState icon="calendar" title="No courses in this stream" description="Add a course to start creating batches." />
              ) : (
                selectedStream.courses.map((course) => (
                  <Card key={course.id} className="!p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[15px] font-bold text-zinc-900">{course.name}</div>
                      <span className="text-[11px] text-zinc-400">{course.batches.length} batches</span>
                    </div>
                    {course.batches.length === 0 ? (
                      <p className="mt-2 text-[12px] text-zinc-500">No batches — create one from the batch wizard.</p>
                    ) : (
                      <div className="mt-3 grid gap-2">
                        {course.batches.map((batch) => (
                          <div
                            key={batch.id}
                            className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-3 py-2.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                            <Link
                              href={`/app/coaching/batches/${batch.id}`}
                              className="text-[14px] font-semibold text-zinc-900 hover:text-emerald-700"
                            >
                              {batch.name}
                            </Link>
                                <div className="text-[11px] text-zinc-500">
                                  {batch.startTime}–{batch.endTime} · {batch.daysOfWeek.join(", ")}
                                  {batch.roomNumber ? ` · Room ${batch.roomNumber}` : ""}
                                </div>
                              </div>
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                {batch._count.enrollments} students
                              </span>
                            </div>
                            {batch.staffAssignments.length > 0 ? (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {batch.staffAssignments.map(({ staff }) => (
                                  <span
                                    key={staff.id}
                                    className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600 ring-1 ring-zinc-200"
                                  >
                                    {staff.title ? `${staff.title} ` : ""}
                                    {staff.user.name ?? "Faculty"}
                                    {staff.specializations[0] ? ` · ${staff.specializations[0]}` : ""}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
