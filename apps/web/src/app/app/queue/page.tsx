"use client";

import { useCallback, useEffect, useState } from "react";
import { apiBase } from "@/lib/api-base";
import { EmptyState, StatusBadge, DashboardSkeleton } from "@/components/ui";
import { Clock, User, ChevronRight } from "lucide-react";

type QueueRow = {
  id: string;
  startAt: string;
  status: string;
  customerName: string;
  phone: string | null;
  serviceName: string;
  staffName: string | null;
  durationMin: number;
};

type QueuePayload = {
  current: QueueRow | null;
  waiting: QueueRow[];
  completed: QueueRow[];
  missed: QueueRow[];
  estimatedWaitMin: number;
  counts: { waiting: number; completed: number; missed: number; total: number };
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function badgeStatus(status: string): "confirmed" | "pending" | "completed" | "no_show" {
  const u = status.toUpperCase();
  if (u === "CONFIRMED") return "confirmed";
  if (u === "COMPLETED") return "completed";
  if (u === "NO_SHOW") return "no_show";
  return "pending";
}

function PatientRow({ row, highlight }: { row: QueueRow; highlight?: boolean }) {
  return (
    <a
      href={`/app/customers`}
      className={`flex items-center gap-3 rounded-2xl border p-3 transition active:scale-[0.99] ${
        highlight ? "border-emerald-200 bg-emerald-50" : "border-zinc-100 bg-white"
      }`}
    >
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${highlight ? "bg-emerald-100" : "bg-zinc-100"}`}>
        <User className={`h-5 w-5 ${highlight ? "text-emerald-600" : "text-zinc-500"}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold text-zinc-900">{row.customerName}</div>
        <div className="truncate text-[12px] text-zinc-500">
          {formatTime(row.startAt)} · {row.serviceName}
          {row.staffName ? ` · ${row.staffName}` : ""}
        </div>
        {row.phone ? <div className="text-[11px] text-zinc-400">{row.phone}</div> : null}
      </div>
      <StatusBadge status={badgeStatus(row.status)} size="sm" />
    </a>
  );
}

export default function QueuePage() {
  const [data, setData] = useState<QueuePayload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please login");
    const res = await fetch(`${apiBase()}/hub/queue`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message ?? "Failed");
    setData(json as QueuePayload);
  }, []);

  useEffect(() => {
    load()
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
    const id = setInterval(() => {
      load().catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [load]);

  if (loading && !data) return <DashboardSkeleton />;

  if (err && !data) {
    return (
      <div className="px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-800">{err}</div>
      </div>
    );
  }

  const q = data!;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-zinc-900">Patient Queue</h1>
          <p className="text-[13px] text-zinc-500">आज का कतार — live update</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            load()
              .catch((e) => setErr(e instanceof Error ? e.message : "Failed"))
              .finally(() => setLoading(false));
          }}
          className="rounded-xl bg-zinc-100 px-3 py-2 text-[12px] font-semibold text-zinc-700"
        >
          Refresh
        </button>
      </div>

      {/* Summary strip */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-center">
          <div className="text-[20px] font-bold text-blue-700">{q.counts.waiting}</div>
          <div className="text-[11px] font-semibold text-blue-600">Waiting</div>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-center">
          <div className="text-[20px] font-bold text-emerald-700">{q.counts.completed}</div>
          <div className="text-[11px] font-semibold text-emerald-600">Done</div>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50 p-3 text-center">
          <div className="text-[20px] font-bold text-red-700">{q.counts.missed}</div>
          <div className="text-[11px] font-semibold text-red-600">Missed</div>
        </div>
      </div>

      {q.estimatedWaitMin > 0 ? (
        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            Estimated wait: <strong>{q.estimatedWaitMin} min</strong>
          </span>
        </div>
      ) : null}

      {/* Current patient */}
      <section className="mt-6">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">Current Patient</h2>
        {q.current ? (
          <div className="mt-2">
            <PatientRow row={q.current} highlight />
          </div>
        ) : (
          <div className="mt-2 rounded-2xl border border-zinc-100 bg-white">
            <EmptyState
              icon="users"
              title="कोई patient अभी नहीं"
              description="जब appointment confirm होगी, patient यहाँ दिखेगा।"
              action={
                <a href="/app/bookings?new=1" className="inline-flex h-10 items-center rounded-xl bg-emerald-600 px-4 text-[13px] font-semibold text-white">
                  Add appointment
                </a>
              }
            />
          </div>
        )}
      </section>

      {/* Waiting */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-zinc-900">Waiting ({q.waiting.length})</h2>
          <a href="/app/bookings" className="flex items-center gap-0.5 text-[12px] font-semibold text-emerald-700">
            All <ChevronRight className="h-3 w-3" />
          </a>
        </div>
        {q.waiting.length === 0 ? (
          <p className="mt-2 text-[13px] text-zinc-500">कोई waiting patient नहीं है।</p>
        ) : (
          <ul className="mt-2 grid gap-2">
            {q.waiting.map((row) => (
              <li key={row.id}>
                <PatientRow row={row} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Completed */}
      {q.completed.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-[15px] font-semibold text-zinc-900">Completed ({q.completed.length})</h2>
          <ul className="mt-2 grid gap-2 opacity-80">
            {q.completed.slice(0, 5).map((row) => (
              <li key={row.id}>
                <PatientRow row={row} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Missed */}
      {q.missed.length > 0 ? (
        <section className="mt-6">
          <h2 className="text-[15px] font-semibold text-red-700">Missed ({q.missed.length})</h2>
          <ul className="mt-2 grid gap-2">
            {q.missed.map((row) => (
              <li key={row.id}>
                <PatientRow row={row} />
              </li>
            ))}
          </ul>
          <a href="/app/customers?filter=inactive" className="mt-2 inline-block text-[12px] font-semibold text-emerald-700">
            Follow up missed patients →
          </a>
        </section>
      ) : null}
    </div>
  );
}
