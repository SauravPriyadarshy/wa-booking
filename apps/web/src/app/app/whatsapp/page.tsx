"use client";

import { useCallback, useEffect, useState } from "react";
import { apiBase } from "@/lib/api-base";
import { Button, Card, toast } from "@/components/ui";

type WaState =
  | { status: "DISCONNECTED"; workerConfigured?: boolean }
  | { status: "QR_REQUIRED"; qrDataUrl?: string; updatedAt?: number; workerConfigured?: boolean }
  | { status: "CONNECTED"; updatedAt?: number; workerConfigured?: boolean }
  | { status: "ERROR"; message?: string; updatedAt?: number; workerConfigured?: boolean };

type QuickReply = { id: string; title: string; body: string };

type Dash = {
  stats: { needsReplyCount: number };
} | null;

export default function WhatsAppPage() {
  const [state, setState] = useState<WaState>({ status: "DISCONNECTED" });
  const [dash, setDash] = useState<Dash>(null);
  const [quick, setQuick] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [boot, setBoot] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please login");
    const res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: { ...(init?.headers ?? {}), authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { message?: string })?.message ?? "Request failed");
    return data;
  }, []);

  async function refresh() {
    setError(null);
    try {
      const [s, d, q] = await Promise.all([
        api("/whatsapp/status").catch(() => ({ status: "DISCONNECTED" })),
        api("/hub/dashboard").catch(() => null),
        api("/hub/quick-replies").catch(() => []),
      ]);
      setState(s as WaState);
      setDash(d as Dash);
      setQuick((q as QuickReply[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBoot(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${apiBase()}/me`, { headers: { authorization: `Bearer ${token}` } });
        const data = await res.json();
        const enabledFeatures: string[] = data?.business?.enabledFeatures ?? [];
        setEnabled(enabledFeatures.includes("whatsapp") || enabledFeatures.length === 0);
      } catch {
        setEnabled(true);
      }
    })();
  }, []);

  async function connect() {
    setLoading(true);
    setError(null);
    try {
      const s = (await api("/whatsapp/connect", { method: "POST" })) as WaState;
      setState(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const connected = state.status === "CONNECTED";
  // workerConfigured=false means WA_WORKER_URL is not set at all (not deployed)
  // workerConfigured=true but error = worker sleeping on Render free tier (waking up)
  const workerNotDeployed = state.workerConfigured === false;
  const workerSleeping =
    state.workerConfigured === true &&
    !!error &&
    (error.toLowerCase().includes("unreachable") ||
      error.toLowerCase().includes("econnrefused") ||
      error.toLowerCase().includes("fetch failed") ||
      error.toLowerCase().includes("failed to fetch") ||
      error.toLowerCase().includes("timeout"));
  const workerUnreachable = workerNotDeployed;

  if (!enabled) {
    return (
      <div className="px-4 py-6">
        <Card className="!p-5">
          <div className="text-[15px] font-semibold text-zinc-900">WhatsApp is disabled</div>
          <p className="mt-2 text-[13px] text-zinc-600">Ask your admin to enable WhatsApp for this business.</p>
          <a href="/app" className="mt-4 flex h-11 items-center justify-center rounded-xl bg-emerald-600 text-[14px] font-semibold text-white">
            Back to Hub
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 pb-28 pt-4 md:pb-8">
      <div className="flex items-center justify-between">
        <a href="/app" className="text-[13px] font-semibold text-emerald-700">
          ← Hub
        </a>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            connected ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {connected ? "Connected" : state.status}
        </span>
      </div>

      <h1 className="mt-3 text-[20px] font-semibold text-zinc-900">WhatsApp Hub</h1>
      <p className="mt-1 text-[13px] text-zinc-500">Quick replies and inbox — keep customers moving.</p>

      {boot ? <div className="mt-6 h-24 animate-pulse rounded-2xl bg-zinc-100" /> : null}

      {dash && dash.stats.needsReplyCount > 0 ? (
        <Card className="mt-5 !p-4 border-amber-100 bg-amber-50/60">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Needs action</div>
              <div className="mt-1 text-[18px] font-semibold text-zinc-900">{dash.stats.needsReplyCount}</div>
              <div className="text-[12px] text-zinc-600">conversations likely waiting on you</div>
            </div>
            <a
              href="/app/inbox"
              className="flex h-10 shrink-0 items-center rounded-xl bg-zinc-900 px-3 text-[12px] font-semibold text-white"
            >
              Inbox
            </a>
          </div>
        </Card>
      ) : null}

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-zinc-900">Quick replies</h2>
          <a href="/app/templates" className="text-[12px] font-semibold text-emerald-700">
            Manage
          </a>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {quick.length === 0 ? (
            <p className="text-[13px] text-zinc-500">Add templates for pricing, address, and timings.</p>
          ) : (
            quick.slice(0, 10).map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard?.writeText(q.body);
                    toast.success("Copied");
                  } catch {
                    toast.error("Copy failed");
                  }
                }}
                className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-800"
              >
                {q.title}
              </button>
            ))
          )}
        </div>
      </section>

      <Card className="mt-6 !p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[15px] font-semibold text-zinc-900">Connection</div>
            <p className="mt-1 text-[12px] text-zinc-500">Scan QR with WhatsApp → Linked devices.</p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => void refresh()}>
            Refresh
          </Button>
        </div>

        {state.status === "QR_REQUIRED" && state.qrDataUrl ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-100 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={state.qrDataUrl} alt="WhatsApp QR" className="w-full rounded-xl" />
          </div>
        ) : null}

        {workerUnreachable ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xl">⚙️</span>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-amber-900">WhatsApp worker not deployed</div>
                <p className="mt-1 text-[12px] leading-5 text-amber-800">
                  WhatsApp automation needs a separate always-on server. It cannot run on Vercel (serverless). You need to deploy the worker once.
                </p>
                <div className="mt-3 space-y-2">
                  {[
                    { step: "1", text: "Deploy apps/wa-worker to Render, Railway, or any VPS with Docker" },
                    { step: "2", text: "Set WA_WORKER_URL on Vercel API project (e.g. https://your-worker.onrender.com)" },
                    { step: "3", text: "Redeploy the API, then come back here to scan QR" },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-900">
                        {step}
                      </span>
                      <span className="text-[12px] text-amber-900">{text}</span>
                    </div>
                  ))}
                </div>
                <a
                  href="https://render.com/deploy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 rounded-lg bg-amber-900 px-3 py-1.5 text-[12px] font-semibold text-white"
                >
                  Deploy on Render →
                </a>
              </div>
            </div>
          </div>
        ) : workerSleeping ? (
          <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-xl">💤</span>
              <div className="flex-1">
                <div className="text-[14px] font-semibold text-blue-900">Worker is waking up…</div>
                <p className="mt-1 text-[12px] leading-5 text-blue-800">
                  The WhatsApp server is starting (Render free tier). This takes 30–60 seconds on first use.
                  Please wait and try again.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  loading={loading}
                  onClick={() => { setError(null); void connect(); }}
                >
                  Try again
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {error ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">{error}</div>
            ) : null}
            <Button type="button" variant="primary" size="lg" className="mt-4 w-full" loading={loading} onClick={() => void connect()}>
              {connected ? "Refresh session" : "Get QR / connect"}
            </Button>
          </>
        )}
      </Card>

      <a
        href="/app/inbox"
        className="mt-4 flex h-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-[14px] font-semibold text-zinc-900"
      >
        Open inbox (beta)
      </a>
    </div>
  );
}
