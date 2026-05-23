"use client";

import { use, useEffect, useMemo, useState } from "react";
import { apiBase } from "@/lib/api-base";
import { Card, CustomerCardSkeleton, EmptyState } from "@/components/ui";

type Customer = {
  id: string;
  name: string | null;
  phone: string | null;
  notes: string | null;
  createdAt: string;
};

type Timeline = {
  customer: { id: string; name: string | null; phone: string | null; createdAt: string };
  items: Array<{ type: string; id: string; at: string; title: string; subtitle: string }>;
};

type Tab = "timeline" | "notes";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const token = useMemo(() => (typeof window === "undefined" ? null : localStorage.getItem("token")), []);
  const [tab, setTab] = useState<Tab>("timeline");
  const [c, setC] = useState<Customer | null>(null);
  const [tl, setTl] = useState<Timeline | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function api(path: string) {
    if (!token) throw new Error("Please login");
    const res = await fetch(`${apiBase()}${path}`, { headers: { authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { message?: string })?.message ?? "Request failed");
    return data;
  }

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const [cust, timeline] = await Promise.all([
          api(`/customers/${encodeURIComponent(id)}`),
          api(`/customers/${encodeURIComponent(id)}/timeline`),
        ]);
        setC(cust as Customer);
        setTl(timeline as Timeline);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const waHref = useMemo(() => {
    const raw = (c?.phone ?? "").replace(/\s+/g, "");
    if (!raw) return null;
    const digits = raw.replace(/[^\d]/g, "");
    if (!digits) return null;
    return `https://wa.me/${digits.startsWith("0") ? digits.slice(1) : digits}`;
  }, [c?.phone]);

  if (loading && !c) {
    return (
      <div className="px-4 py-4">
        <CustomerCardSkeleton />
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-28 pt-4 md:pb-8">
      <a href="/app/customers" className="text-[13px] font-semibold text-emerald-700">
        ← Customers
      </a>

      {err ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{err}</div>
      ) : null}

      <div className="mt-4">
        <h1 className="text-[20px] font-semibold text-zinc-900">{c?.name ?? "Customer"}</h1>
        <p className="text-[14px] text-zinc-600">{c?.phone ?? "—"}</p>
        <p className="mt-1 text-[12px] text-zinc-400">
          Since {c?.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN") : "—"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-xl bg-emerald-600 px-4 text-[13px] font-semibold text-white"
            >
              Message
            </a>
          ) : null}
          <a
            href="/app/bookings?new=1"
            className="inline-flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-[13px] font-semibold text-zinc-800"
          >
            Book
          </a>
        </div>
      </div>

      <div className="mt-5 flex rounded-xl bg-zinc-100 p-1">
        {(
          [
            ["timeline", "Timeline"],
            ["notes", "Notes"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`flex-1 rounded-lg py-2 text-[13px] font-semibold transition ${
              tab === k ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "notes" ? (
        <Card className="mt-4 !p-4">
          <div className="text-[13px] font-semibold text-zinc-900">Staff notes</div>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-zinc-700">
            {c?.notes?.trim() ? c.notes : "No notes yet. Edit from your admin tools when supported."}
          </p>
        </Card>
      ) : !tl && !err ? (
        <div className="mt-4 text-[13px] text-zinc-500">Loading timeline…</div>
      ) : !tl && err ? (
        <div className="mt-4 text-[13px] text-zinc-500">Timeline unavailable.</div>
      ) : tl && tl.items.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon="calendar" title="No history yet" description="Bookings and payments will appear here." />
        </div>
      ) : tl ? (
        <ul className="mt-4 grid gap-2">
          {tl.items.slice(0, 20).map((it) => (
            <li key={`${it.type}:${it.id}`}>
              <Card className="!p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-zinc-900">{it.title}</div>
                    <div className="text-[12px] text-zinc-600">{it.subtitle}</div>
                  </div>
                  <time className="shrink-0 text-[10px] font-semibold text-zinc-400">
                    {new Date(it.at).toLocaleString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
