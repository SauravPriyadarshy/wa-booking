"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiBase } from "@/lib/api-base";
import { buildWaMeUrl } from "@/lib/whatsapp-link";
import { Button, Card } from "@/components/ui";

type ParentRow = {
  studentId: string;
  studentName: string;
  parentPhone: string;
  parentName: string | null;
};

type RosterPayload = {
  batchName: string;
  parents: ParentRow[];
};

export default function BatchBroadcastPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: batchId } = use(params);
  const [roster, setRoster] = useState<RosterPayload | null>(null);
  const [message, setMessage] = useState("");
  const [queueIndex, setQueueIndex] = useState(0);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/coaching/batches/${batchId}/broadcast-roster`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as RosterPayload;
      if (res.ok) setRoster(data);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const parents = roster?.parents ?? [];
  const current = parents[queueIndex] ?? null;
  const progress = parents.length > 0 ? Math.round((sent.size / parents.length) * 100) : 0;

  function openCurrentWa() {
    if (!current || !message.trim()) return;
    const text = `${message.trim()}\n\n— ${roster?.batchName ?? "Coaching"}`;
    window.open(buildWaMeUrl(current.parentPhone, text), "_blank");
    setSent((prev) => new Set(prev).add(current.studentId));
  }

  function nextInQueue() {
    setQueueIndex((i) => Math.min(i + 1, Math.max(0, parents.length - 1)));
  }

  if (loading) return <div className="py-10 text-center text-[14px] text-zinc-500">Loading roster…</div>;

  return (
    <div className="space-y-4">
      <Link href={`/app/coaching/batches/${batchId}`} className="text-[13px] font-semibold text-emerald-700">
        ← Batch panel
      </Link>

      <div>
        <h1 className="text-[20px] font-bold text-zinc-900">Batch Broadcast</h1>
        <p className="text-[12px] text-zinc-500">
          Step through parents one-by-one — each opens WhatsApp in a new tab with your message pre-filled.
        </p>
      </div>

      <Card className="!p-4">
        <label className="grid gap-1 text-[12px] font-medium text-zinc-700">
          Batch message
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder='e.g. "Class timing changed tomorrow to 8 AM."'
            className="rounded-xl border border-zinc-200 px-3 py-2 text-[14px]"
          />
        </label>
      </Card>

      {parents.length === 0 ? (
        <p className="text-center text-[13px] text-zinc-500">No parent phone numbers in this batch.</p>
      ) : (
        <>
          <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-[12px] text-zinc-500">
              <span>
                Progress: {sent.size}/{parents.length} ({progress}%)
              </span>
              <span>
                Step {queueIndex + 1} of {parents.length}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {current ? (
            <Card className="!p-4">
              <div className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">Current parent</div>
              <div className="mt-2 text-[16px] font-bold text-zinc-900">{current.studentName}</div>
              <div className="text-[13px] text-zinc-500">
                {current.parentName ? `${current.parentName} · ` : ""}
                {current.parentPhone}
              </div>
              {sent.has(current.studentId) ? (
                <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                  Sent ✓
                </span>
              ) : null}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1"
                  disabled={!message.trim()}
                  onClick={openCurrentWa}
                >
                  Open WhatsApp
                </Button>
                <Button type="button" variant="secondary" className="flex-1" onClick={nextInQueue}>
                  Next parent →
                </Button>
              </div>
            </Card>
          ) : null}

          <div className="space-y-2">
            <div className="text-[12px] font-bold text-zinc-700">Queue</div>
            {parents.map((p, idx) => (
              <button
                key={p.studentId}
                type="button"
                onClick={() => setQueueIndex(idx)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left ${
                  idx === queueIndex ? "border-emerald-300 bg-emerald-50" : "border-zinc-100 bg-white"
                }`}
              >
                <span className="text-[13px] font-semibold text-zinc-900">{p.studentName}</span>
                <span className={`text-[11px] font-bold ${sent.has(p.studentId) ? "text-emerald-600" : "text-zinc-400"}`}>
                  {sent.has(p.studentId) ? "✓" : "—"}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
