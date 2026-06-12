"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageCircle, Plus, RefreshCw } from "lucide-react";
import { apiBase } from "@/lib/api-base";
import { openWhatsAppLink } from "@/lib/whatsapp-router";
import { Button, Card, EmptyState } from "@/components/ui";

type QueueRow = {
  id: string;
  tokenNumber: number | null;
  customerName: string;
  phone: string | null;
  serviceName: string;
  staffId: string | null;
  staffName: string | null;
  doctorTitle: string | null;
  queueStatus: "WAITING" | "IN_CONSULTATION" | "COMPLETED" | "SKIPPED" | null;
  paymentStatus: "PENDING" | "PAID_CASH" | "PAID_UPI";
  bookingType: string;
};

type StaffOption = { id: string; name: string; title: string | null; feeCents: number | null };

type QueuePayload = {
  current: QueueRow | null;
  waiting: QueueRow[];
  completed: QueueRow[];
  skipped: QueueRow[];
  staff: StaffOption[];
  summary: {
    inConsultation: number;
    waiting: number;
    completed: number;
    skipped: number;
    collectedCents: number;
    cashCount: number;
    upiCount: number;
  };
  currentVisibleToken: number | null;
};

const QUEUE_STATUSES = ["WAITING", "IN_CONSULTATION", "COMPLETED", "SKIPPED"] as const;

function formatINR(cents: number) {
  return `₹${Math.round(cents / 100).toLocaleString("en-IN")}`;
}

function statusLabel(s: QueueRow["queueStatus"]) {
  if (s === "IN_CONSULTATION") return "In consultation";
  if (s === "COMPLETED") return "Completed";
  if (s === "SKIPPED") return "Skipped";
  return "Waiting";
}

function statusClass(s: QueueRow["queueStatus"]) {
  if (s === "IN_CONSULTATION") return "bg-blue-100 text-blue-800";
  if (s === "COMPLETED") return "bg-emerald-100 text-emerald-800";
  if (s === "SKIPPED") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

export default function QueuePage() {
  const [data, setData] = useState<QueuePayload | null>(null);
  const [staffId, setStaffId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [walkInOpen, setWalkInOpen] = useState(false);
  const [wiName, setWiName] = useState("");
  const [wiPhone, setWiPhone] = useState("");
  const [wiSaving, setWiSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please login");
    const q = staffId ? `?staffId=${encodeURIComponent(staffId)}` : "";
    const res = await fetch(`${apiBase()}/clinic/queue${q}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error((json as { message?: string }).message ?? "Failed");
    const payload = json as QueuePayload;
    setData(payload);
    if (!staffId && payload.staff?.[0]?.id) setStaffId(payload.staff[0].id);
  }, [staffId]);

  useEffect(() => {
    load()
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
    const id = setInterval(() => {
      load().catch(() => {});
    }, 20000);
    return () => clearInterval(id);
  }, [load]);

  const allRows = useMemo(() => {
    if (!data) return [];
    return [...(data.current ? [data.current] : []), ...data.waiting, ...data.completed, ...data.skipped].sort(
      (a, b) => (a.tokenNumber ?? 999) - (b.tokenNumber ?? 999),
    );
  }, [data]);

  const selectedStaff = data?.staff.find((s) => s.id === staffId);

  async function registerWalkIn() {
    if (!staffId || !wiName.trim() || !wiPhone.trim()) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setWiSaving(true);
    try {
      const res = await fetch(`${apiBase()}/clinic/walk-in/register`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ staffId, name: wiName.trim(), phone: wiPhone.trim() }),
      });
      const body = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(body.message ?? "Failed");
      setWalkInOpen(false);
      setWiName("");
      setWiPhone("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setWiSaving(false);
    }
  }

  async function nextPatient() {
    if (!staffId) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    setBusyId("next");
    try {
      const res = await fetch(`${apiBase()}/clinic/queue/next-patient`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ staffId }),
      });
      if (!res.ok) throw new Error("Failed");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  async function patchStatus(rowId: string, queueStatus: (typeof QUEUE_STATUSES)[number]) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setBusyId(rowId);
    try {
      const res = await fetch(`${apiBase()}/clinic/queue/${rowId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ queueStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      await load();
    } finally {
      setBusyId(null);
    }
  }

  async function patchPayment(rowId: string, paymentStatus: "PAID_CASH" | "PAID_UPI" | "PENDING") {
    const token = localStorage.getItem("token");
    if (!token) return;
    setBusyId(`pay-${rowId}`);
    try {
      const res = await fetch(`${apiBase()}/clinic/queue/${rowId}/payment`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      await load();
    } finally {
      setBusyId(null);
    }
  }

  function notifyToken(row: QueueRow) {
    if (!row.phone) return;
    openWhatsAppLink({
      phone: row.phone,
      type: "CLINIC_TOKEN",
      variables: {
        doctorName: selectedStaff?.name ?? row.staffName ?? "Doctor",
        token: String(row.tokenNumber ?? "—"),
        currentToken: String(data?.currentVisibleToken ?? row.tokenNumber ?? "—"),
      },
    });
  }

  function notifySkipped(row: QueueRow) {
    if (!row.phone) return;
    openWhatsAppLink({
      phone: row.phone,
      type: "CLINIC_SKIP",
      variables: { token: String(row.tokenNumber ?? "—") },
    });
  }

  if (loading && !data) {
    return <div className="py-10 text-center text-[14px] text-zinc-500">Loading live queue…</div>;
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-[20px] font-bold text-zinc-900">Live Patient Queue</h1>
          <p className="text-[12px] text-zinc-500">Reception terminal — tokens, fees, WhatsApp alerts</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700"
          aria-label="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {err ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{err}</div> : null}

      {data ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Card className="!p-3 text-center">
              <div className="text-[18px] font-bold text-blue-700">{data.summary.inConsultation}</div>
              <div className="text-[10px] font-semibold text-blue-600">Inside</div>
            </Card>
            <Card className="!p-3 text-center">
              <div className="text-[18px] font-bold text-amber-700">{data.summary.waiting}</div>
              <div className="text-[10px] font-semibold text-amber-600">Waiting</div>
            </Card>
            <Card className="!p-3 text-center">
              <div className="text-[18px] font-bold text-emerald-700">{formatINR(data.summary.collectedCents)}</div>
              <div className="text-[10px] font-semibold text-emerald-600">
                Cash {data.summary.cashCount} · UPI {data.summary.upiCount}
              </div>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 text-[13px]"
            >
              {data.staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title ? `${s.title} ` : ""}
                  {s.name}
                </option>
              ))}
            </select>
            <Button type="button" size="sm" variant="primary" onClick={() => setWalkInOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Walk-in
            </Button>
            <Button type="button" size="sm" variant="secondary" loading={busyId === "next"} onClick={() => void nextPatient()}>
              Next patient →
            </Button>
          </div>

          {data.current ? (
            <Card className="!p-4 border-emerald-200 bg-emerald-50">
              <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Now consulting</div>
              <div className="mt-1 text-[16px] font-bold text-zinc-900">
                Token #{data.current.tokenNumber} · {data.current.customerName}
              </div>
            </Card>
          ) : null}

          {allRows.length === 0 ? (
            <EmptyState icon="users" title="No patients today" description="Register a walk-in or wait for online bookings." />
          ) : (
            <div className="space-y-2">
              {allRows.map((row) => (
                <Card key={row.id} className="!p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-zinc-900 px-2 py-0.5 text-[12px] font-bold text-white">
                          #{row.tokenNumber ?? "—"}
                        </span>
                        <span className="text-[14px] font-bold text-zinc-900">{row.customerName}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-500">
                        {row.phone ?? "No phone"} · {row.bookingType.replace("_", " ")}
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClass(row.queueStatus)}`}>
                      {statusLabel(row.queueStatus)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      value={row.queueStatus ?? "WAITING"}
                      disabled={busyId === row.id}
                      onChange={(e) => void patchStatus(row.id, e.target.value as (typeof QUEUE_STATUSES)[number])}
                      className="h-9 rounded-lg border border-zinc-200 px-2 text-[12px]"
                    >
                      {QUEUE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {statusLabel(s)}
                        </option>
                      ))}
                    </select>

                    <label className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-[11px]">
                      <input
                        type="checkbox"
                        checked={row.paymentStatus === "PAID_CASH"}
                        onChange={(e) => void patchPayment(row.id, e.target.checked ? "PAID_CASH" : "PENDING")}
                      />
                      Cash
                    </label>
                    <label className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-[11px]">
                      <input
                        type="checkbox"
                        checked={row.paymentStatus === "PAID_UPI"}
                        onChange={(e) => void patchPayment(row.id, e.target.checked ? "PAID_UPI" : "PENDING")}
                      />
                      UPI
                    </label>

                    {row.phone ? (
                      <>
                        <button
                          type="button"
                          onClick={() => notifyToken(row)}
                          className="inline-flex h-9 items-center gap-1 rounded-lg bg-[#25D366] px-2.5 text-[11px] font-bold text-white"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> Token
                        </button>
                        {row.queueStatus === "SKIPPED" ? (
                          <button
                            type="button"
                            onClick={() => notifySkipped(row)}
                            className="inline-flex h-9 items-center rounded-lg border border-[#25D366] px-2.5 text-[11px] font-semibold text-[#25D366]"
                          >
                            Skip alert
                          </button>
                        ) : null}
                      </>
                    ) : null}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : null}

      {walkInOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setWalkInOpen(false);
          }}
        >
          <Card className="w-full max-w-md !p-5 shadow-lg">
            <h2 className="text-[16px] font-semibold">Register walk-in</h2>
            <p className="mt-1 text-[13px] text-zinc-500">Auto-assigns next token for selected doctor.</p>
            <input
              value={wiName}
              onChange={(e) => setWiName(e.target.value)}
              placeholder="Patient name"
              className="mt-4 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]"
            />
            <input
              value={wiPhone}
              onChange={(e) => setWiPhone(e.target.value)}
              placeholder="Mobile number"
              className="mt-2 h-10 w-full rounded-xl border border-zinc-200 px-3 text-[14px]"
            />
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setWalkInOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" className="flex-1" loading={wiSaving} onClick={() => void registerWalkIn()}>
                Register
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
