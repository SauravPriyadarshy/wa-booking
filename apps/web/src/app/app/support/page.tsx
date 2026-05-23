"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiBase } from "@/lib/api-base";
import { Button, Card, Chip, EmptyState, FormField, FieldInput, StatusBadge } from "@/components/ui";

type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
type Ticket = {
  id: string;
  title: string;
  status: TicketStatus;
  priority: string;
  internalNotes: string | null;
  customer: null | { id: string; name: string | null; phone: string | null };
  updatedAt: string;
};

const schema = z.object({
  title: z.string().min(3, "Title is required"),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]).optional(),
  internalNotes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const STATUS_FILTERS: Array<{ id: TicketStatus | "ALL"; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "OPEN", label: "Open" },
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "WAITING_CUSTOMER", label: "Waiting" },
  { id: "RESOLVED", label: "Resolved" },
  { id: "CLOSED", label: "Closed" },
];

function ticketBadge(s: TicketStatus): Parameters<typeof StatusBadge>[0]["status"] {
  const u = s.toLowerCase();
  if (u === "open") return "open";
  if (u === "in_progress") return "in_progress";
  if (u === "waiting_customer") return "follow_up";
  if (u === "resolved") return "resolved";
  if (u === "closed") return "closed";
  return "open";
}

export default function SupportPage() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [status, setStatus] = useState<TicketStatus | "ALL">("ALL");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  async function load(next: TicketStatus | "ALL") {
    if (!token) return;
    setErr(null);
    setLoading(true);
    try {
      const url =
        next === "ALL"
          ? `${apiBase()}/support/tickets`
          : `${apiBase()}/support/tickets?status=${encodeURIComponent(next)}`;
      const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
      const json = (await res.json()) as Ticket[] | { message?: string };
      if (!res.ok) throw new Error((json as { message?: string })?.message ?? "Failed to load tickets");
      setItems(json as Ticket[]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(status).catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (typeof window === "undefined" || items.length === 0) return;
    const raw = window.location.hash.replace("#", "");
    if (!raw) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(raw);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-emerald-400", "rounded-2xl", "transition-shadow");
      window.setTimeout(() => {
        el.classList.remove("ring-2", "ring-emerald-400", "rounded-2xl", "transition-shadow");
      }, 2200);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [items]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", priority: "NORMAL", internalNotes: "" },
  });

  async function onCreate(values: FormValues) {
    if (!token) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase()}/support/tickets`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: values.title,
          priority: values.priority ?? "NORMAL",
          internalNotes: values.internalNotes?.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error((json as { message?: string })?.message ?? "Failed to create ticket");
      form.reset({ title: "", priority: "NORMAL", internalNotes: "" });
      await load(status);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function setTicketStatus(id: string, next: TicketStatus) {
    if (!token) return;
    setErr(null);
    try {
      const res = await fetch(`${apiBase()}/support/tickets/${id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error((json as { message?: string })?.message ?? "Failed to update status");
      await load(status);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="px-4 pb-28 pt-4 md:pb-8">
      <a href="/app" className="text-[13px] font-semibold text-emerald-700">
        ← Hub
      </a>
      <h1 className="mt-3 text-[20px] font-semibold text-zinc-900">Support</h1>
      <p className="mt-1 text-[13px] text-zinc-500">Lightweight tickets — not a full helpdesk.</p>

      {err ? <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{err}</div> : null}

      <Card className="mt-5 !p-4">
        <div className="text-[15px] font-semibold text-zinc-900">New ticket</div>
        <form className="mt-3 grid gap-3" onSubmit={form.handleSubmit(onCreate)}>
          <FormField label="What happened?" required error={form.formState.errors.title?.message}>
            <FieldInput placeholder="Short title" {...form.register("title")} />
          </FormField>
          <FormField label="Priority">
            <select
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] outline-none focus-emerald"
              {...form.register("priority")}
            >
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
            </select>
          </FormField>
          <FormField label="Internal notes">
            <textarea
              className="min-h-[72px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[14px] outline-none focus-emerald"
              placeholder="Optional"
              {...form.register("internalNotes")}
            />
          </FormField>
          <Button type="submit" variant="primary" size="md" loading={busy}>
            Save ticket
          </Button>
        </form>
      </Card>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-zinc-900">Tickets</h2>
          <span className="text-[12px] font-medium text-zinc-400">{items.length} shown</span>
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STATUS_FILTERS.map((o) => (
            <Chip key={o.id} label={o.label} active={status === o.id} onClick={() => setStatus(o.id)} />
          ))}
        </div>

        {loading ? (
          <div className="mt-4 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-zinc-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-4">
            <EmptyState icon="support" title="No tickets" description="Great — or create one when a customer escalates." />
          </div>
        ) : (
          <ul className="mt-4 grid gap-2">
            {items.map((t) => (
              <li key={t.id} id={t.id} className="scroll-mt-6">
                <Card className="!p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[14px] font-semibold text-zinc-900">{t.title}</div>
                      <div className="mt-0.5 text-[12px] text-zinc-600">
                        {t.customer?.name ?? "No customer"} {t.customer?.phone ? `· ${t.customer.phone}` : ""}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={ticketBadge(t.status)} size="sm" />
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            t.priority === "HIGH"
                              ? "bg-red-50 text-red-700"
                              : t.priority === "LOW"
                                ? "bg-zinc-100 text-zinc-600"
                                : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {t.priority}
                        </span>
                      </div>
                    </div>
                    <select
                      value={t.status}
                      onChange={(e) => void setTicketStatus(t.id, e.target.value as TicketStatus)}
                      className="h-10 rounded-xl border border-zinc-200 bg-white px-2 text-[11px] font-semibold text-zinc-800 outline-none focus-emerald"
                    >
                      {(["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"] as TicketStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                  {t.internalNotes ? <p className="mt-2 text-[12px] text-zinc-600">{t.internalNotes}</p> : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
