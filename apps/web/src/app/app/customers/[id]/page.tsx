"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiBase } from "@/lib/api-base";
import { Button, Card, CustomerCardSkeleton, EmptyState, FieldInput, FormField } from "@/components/ui";

type Customer = {
  id: string;
  name: string | null;
  phone: string | null;
  notes: string | null;
  tags: string[];
  birthday: string | null;
  createdAt: string;
  totalVisits: number;
  totalSpendCents: number;
  preferredService: string | null;
  lastVisitAt: string | null;
};

type Timeline = {
  customer: { id: string; name: string | null; phone: string | null; createdAt: string };
  items: Array<{ type: string; id: string; at: string; title: string; subtitle: string }>;
};

type Tab = "timeline" | "notes" | "stats";

const ALL_TAGS = ["VIP", "Regular", "Inactive", "New"] as const;

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  VIP: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
  Regular: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  Inactive: { bg: "bg-zinc-100", text: "text-zinc-600", border: "border-zinc-200" },
  New: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200" },
};

const TIMELINE_ICONS: Record<string, string> = {
  booking: "📅",
  payment: "💰",
  support: "🎫",
  lead: "📋",
};

function formatINR(cents: number) {
  return `₹${Math.round(cents / 100).toLocaleString("en-IN")}`;
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000));
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const token = useMemo(() => (typeof window === "undefined" ? null : localStorage.getItem("token")), []);
  const [tab, setTab] = useState<Tab>("timeline");
  const [c, setC] = useState<Customer | null>(null);
  const [tl, setTl] = useState<Timeline | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTag, setSavingTag] = useState<string | null>(null);
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [converting, setConverting] = useState(false);
  const [studentForm, setStudentForm] = useState({ batch: "", classGrade: "", course: "" });

  async function apiCall(path: string, init?: RequestInit) {
    if (!token) throw new Error("Please login");
    const res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: { ...(init?.headers ?? {}), authorization: `Bearer ${token}` },
    });
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
        const [cust, timeline, me] = await Promise.all([
          apiCall(`/customers/${encodeURIComponent(id)}`),
          apiCall(`/customers/${encodeURIComponent(id)}/timeline`),
          apiCall("/me").catch(() => null),
        ]);
        setC(cust as Customer);
        setTl(timeline as Timeline);
        const meData = me as { ok?: boolean; business?: { categoryKey?: string | null } | null } | null;
        if (meData?.ok) setCategoryKey(meData.business?.categoryKey ?? null);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleTag(tag: string) {
    if (!c) return;
    setSavingTag(tag);
    const currentTags = c.tags ?? [];
    const newTags = currentTags.includes(tag) ? currentTags.filter((t) => t !== tag) : [...currentTags, tag];
    try {
      const updated = await apiCall(`/customers/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tags: newTags }),
      });
      setC((prev) => prev ? { ...prev, tags: (updated as Customer).tags ?? newTags } : prev);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to update tag");
    } finally {
      setSavingTag(null);
    }
  }

  async function convertToStudent() {
    if (!c?.name?.trim()) return;
    setConverting(true);
    setErr(null);
    try {
      const created = (await apiCall("/coaching/students", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: c.name.trim(),
          phone: c.phone ?? undefined,
          parentName: c.name.trim(),
          batch: studentForm.batch.trim() || undefined,
          classGrade: studentForm.classGrade.trim() || undefined,
          course: studentForm.course.trim() || undefined,
        }),
      })) as { id?: string };
      setConvertOpen(false);
      if (created.id) router.push(`/app/students/${created.id}`);
      else router.push("/app/students");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create student");
    } finally {
      setConverting(false);
    }
  }

  const waHref = useMemo(() => {
    const raw = (c?.phone ?? "").replace(/\s+/g, "");
    if (!raw) return null;
    const digits = raw.replace(/[^\d]/g, "");
    if (!digits) return null;
    return `https://wa.me/${digits.startsWith("0") ? digits.slice(1) : digits}`;
  }, [c?.phone]);

  if (loading && !c) {
    return (
      <div className="space-y-4">
        <CustomerCardSkeleton />
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  const lastVisitDays = c?.lastVisitAt ? daysSince(c.lastVisitAt) : null;

  return (
    <div className="space-y-4">
      <a href="/app/customers" className="text-[13px] font-semibold text-emerald-700">← Customers</a>

      {err && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{err}</div>
      )}

      {/* Customer header */}
      <div className="mt-4 flex items-start gap-3">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-[20px] font-bold text-emerald-700">
          {(c?.name ?? "?")[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[20px] font-bold text-zinc-900">{c?.name ?? "Customer"}</h1>
          <p className="text-[14px] text-zinc-500">{c?.phone ?? "—"}</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">
            Customer since {c?.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—"}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex gap-2">
        {waHref && (
          <a href={waHref} target="_blank" rel="noreferrer"
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-[13px] font-bold text-white">
            💬 WhatsApp
          </a>
        )}
        <a href="/app/bookings?new=1"
          className="flex h-10 flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white text-[13px] font-semibold text-zinc-800">
          📅 Book
        </a>
      </div>

      {categoryKey === "coaching" ? (
        <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
          <p className="text-[13px] font-semibold text-blue-900">Convert to Regular Student</p>
          <p className="mt-0.5 text-[12px] text-blue-800">
            Trial bookings stay as customers until you add them to a batch for fees and attendance.
          </p>
          <Button type="button" variant="primary" size="sm" className="mt-3" onClick={() => setConvertOpen(true)}>
            Convert to Regular Student
          </Button>
        </div>
      ) : null}

      {/* Tags */}
      <div className="mt-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Tags</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {ALL_TAGS.map((tag) => {
            const active = c?.tags?.includes(tag) ?? false;
            const colors = TAG_COLORS[tag];
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                disabled={savingTag === tag}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-bold transition active:scale-95 ${
                  active
                    ? `${colors.bg} ${colors.text} ${colors.border}`
                    : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                } ${savingTag === tag ? "opacity-50" : ""}`}
              >
                {active ? "✓ " : ""}{tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats strip */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-zinc-100 bg-white p-3 text-center shadow-sm">
          <div className="text-[18px] font-bold text-zinc-900">{c?.totalVisits ?? 0}</div>
          <div className="text-[11px] text-zinc-500">Visits</div>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-3 text-center shadow-sm">
          <div className="text-[18px] font-bold text-emerald-600">
            {c?.totalSpendCents ? formatINR(c.totalSpendCents) : "—"}
          </div>
          <div className="text-[11px] text-zinc-500">Spent</div>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-white p-3 text-center shadow-sm">
          <div className="text-[18px] font-bold text-zinc-900">
            {lastVisitDays !== null ? (lastVisitDays === 0 ? "Today" : `${lastVisitDays}d`) : "—"}
          </div>
          <div className="text-[11px] text-zinc-500">Last visit</div>
        </div>
      </div>

      {c?.preferredService && (
        <div className="mt-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700">
          ⭐ Preferred: <span className="font-semibold">{c.preferredService}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-5 flex rounded-xl bg-zinc-100 p-1">
        {([["timeline", "Timeline"], ["stats", "Activity"], ["notes", "Notes"]] as const).map(([k, label]) => (
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

      {tab === "notes" && (
        <Card className="mt-4 !p-4">
          <div className="text-[13px] font-semibold text-zinc-900">Staff notes</div>
          <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-zinc-700">
            {c?.notes?.trim() ? c.notes : "No notes yet."}
          </p>
        </Card>
      )}

      {tab === "stats" && (
        <div className="mt-4 space-y-3">
          <Card className="!p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Total visits</div>
                <div className="mt-1 text-[22px] font-bold text-zinc-900">{c?.totalVisits ?? 0}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Total spend</div>
                <div className="mt-1 text-[22px] font-bold text-emerald-600">
                  {c?.totalSpendCents ? formatINR(c.totalSpendCents) : "₹0"}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Last visit</div>
                <div className="mt-1 text-[14px] font-semibold text-zinc-900">
                  {c?.lastVisitAt ? new Date(c.lastVisitAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Never"}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Preferred</div>
                <div className="mt-1 text-[14px] font-semibold text-zinc-900">{c?.preferredService ?? "—"}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === "timeline" && (
        <>
          {!tl && !err && <div className="mt-4 text-[13px] text-zinc-500">Loading…</div>}
          {!tl && err && <div className="mt-4 text-[13px] text-zinc-500">Timeline unavailable.</div>}
          {tl?.items.length === 0 && (
            <div className="mt-4">
              <EmptyState icon="calendar" title="कोई history नहीं" description="Bookings and payments will appear here." />
            </div>
          )}
          {tl && tl.items.length > 0 && (
            <ul className="mt-4 grid gap-2">
              {tl.items.slice(0, 30).map((it) => (
                <li key={`${it.type}:${it.id}`}>
                  <Card className="!p-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 text-lg">{TIMELINE_ICONS[it.type] ?? "📌"}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-semibold text-zinc-900">{it.title}</div>
                        <div className="text-[12px] text-zinc-500">{it.subtitle}</div>
                      </div>
                      <time className="shrink-0 text-[10px] font-semibold text-zinc-400">
                        {new Date(it.at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </time>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {convertOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConvertOpen(false);
          }}
        >
          <Card className="relative z-10 w-full max-w-md !p-5 shadow-lg">
            <h2 className="text-[16px] font-semibold text-zinc-900">Convert to Regular Student</h2>
            <p className="mt-1 text-[13px] text-zinc-600">
              {c?.name} · {c?.phone ?? "No phone"}
            </p>
            <div className="mt-4 grid gap-3">
              <FormField label="Batch" required>
                <FieldInput
                  placeholder="e.g. NEET 2026"
                  value={studentForm.batch}
                  onChange={(e) => setStudentForm((f) => ({ ...f, batch: e.target.value }))}
                />
              </FormField>
              <FormField label="Class / Grade">
                <FieldInput
                  placeholder="e.g. Class 12"
                  value={studentForm.classGrade}
                  onChange={(e) => setStudentForm((f) => ({ ...f, classGrade: e.target.value }))}
                />
              </FormField>
              <FormField label="Course (optional)">
                <FieldInput
                  placeholder="e.g. NEET"
                  value={studentForm.course}
                  onChange={(e) => setStudentForm((f) => ({ ...f, course: e.target.value }))}
                />
              </FormField>
            </div>
            <div className="mt-5 flex gap-2">
              <Button type="button" variant="secondary" size="md" className="flex-1" onClick={() => setConvertOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                className="flex-1"
                loading={converting}
                disabled={!studentForm.batch.trim()}
                onClick={() => void convertToStudent()}
              >
                Save student
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
