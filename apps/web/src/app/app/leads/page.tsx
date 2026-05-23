"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiBase } from "@/lib/api-base";

type LeadStage = "NEW" | "INTERESTED" | "FOLLOW_UP" | "CONVERTED" | "LOST";
type Lead = {
  id: string;
  name: string | null;
  phone: string | null;
  source: string;
  stage: LeadStage;
  notes: string | null;
  updatedAt: string;
};

const createSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

function stageLabel(stage: LeadStage) {
  switch (stage) {
    case "NEW":
      return "New";
    case "INTERESTED":
      return "Interested";
    case "FOLLOW_UP":
      return "Follow up";
    case "CONVERTED":
      return "Converted";
    case "LOST":
      return "Lost";
  }
}

export default function LeadsPage() {
  const [items, setItems] = useState<Lead[]>([]);
  const [stage, setStage] = useState<LeadStage | "ALL">("ALL");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", phone: "", source: "WHATSAPP", notes: "" },
  });

  const stageOptions: { id: LeadStage | "ALL"; label: string }[] = useMemo(
    () => [
      { id: "ALL", label: "All" },
      { id: "NEW", label: "New" },
      { id: "INTERESTED", label: "Interested" },
      { id: "FOLLOW_UP", label: "Follow up" },
      { id: "CONVERTED", label: "Converted" },
      { id: "LOST", label: "Lost" },
    ],
    [],
  );

  async function load(nextStage: LeadStage | "ALL") {
    if (!token) return;
    setErr(null);
    const url =
      nextStage === "ALL"
        ? `${apiBase()}/leads`
        : `${apiBase()}/leads?stage=${encodeURIComponent(nextStage)}`;
    const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
    const json = (await res.json()) as any;
    if (!res.ok) throw new Error(json?.message ?? "Failed to load leads");
    setItems(json as Lead[]);
  }

  useEffect(() => {
    load(stage).catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    if (typeof window === "undefined" || items.length === 0) return;
    const raw = window.location.hash.replace("#", "");
    if (!raw) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(raw);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-emerald-400", "ring-offset-2", "ring-offset-white", "transition-shadow");
      window.setTimeout(() => {
        el.classList.remove("ring-2", "ring-emerald-400", "ring-offset-2", "ring-offset-white", "transition-shadow");
      }, 2200);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [items]);

  async function onCreate(values: CreateForm) {
    if (!token) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`${apiBase()}/leads`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: values.name?.trim() || undefined,
          phone: values.phone?.trim() || undefined,
          source: values.source?.trim() || "WHATSAPP",
          notes: values.notes?.trim() || undefined,
        }),
      });
      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.message ?? "Failed to create lead");
      form.reset({ name: "", phone: "", source: "WHATSAPP", notes: "" });
      await load(stage);
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function setLeadStage(id: string, next: LeadStage) {
    if (!token) return;
    setErr(null);
    try {
      const res = await fetch(`${apiBase()}/leads/${id}/stage`, {
        method: "PATCH",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ stage: next }),
      });
      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.message ?? "Failed to update stage");
      await load(stage);
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    }
  }

  return (
    <div className="px-4 py-4">
      <div className="text-sm text-zinc-500">Leads</div>
      <div className="mt-2 text-xs text-zinc-500">New inquiries → follow up → converted.</div>

      {err ? <div className="mt-3 rounded-2xl bg-red-50 p-3 text-xs text-red-700">{err}</div> : null}

      <div className="mt-3 grid gap-3">
        <div className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="text-sm font-semibold">Add lead (15 sec)</div>
          <form className="mt-3 grid gap-2" onSubmit={form.handleSubmit(onCreate)}>
            <input
              className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
              placeholder="Name (optional)"
              {...form.register("name")}
            />
            <input
              className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
              placeholder="Phone (optional)"
              {...form.register("phone")}
            />
            <select
              className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
              {...form.register("source")}
            >
              <option value="WHATSAPP">WhatsApp</option>
              <option value="WALKIN">Walk-in</option>
              <option value="CALL">Phone call</option>
              <option value="OTHER">Other</option>
            </select>
            <textarea
              className="min-h-[76px] w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
              placeholder="Notes (optional)"
              {...form.register("notes")}
            />
            <button
              disabled={busy}
              className="mt-1 rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              type="submit"
            >
              {busy ? "Saving..." : "Save"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">List</div>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as any)}
              className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs outline-none"
            >
              {stageOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {items.length === 0 ? (
            <div className="mt-2 text-xs text-zinc-500">No leads.</div>
          ) : (
            <div className="mt-3 grid gap-2">
              {items.map((l) => (
                <div key={l.id} id={l.id} className="scroll-mt-6 rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{l.name || l.phone || "Lead"}</div>
                      <div className="mt-0.5 text-xs text-zinc-600">
                        {l.phone ? l.phone : "No phone"} • {l.source} • {stageLabel(l.stage)}
                      </div>
                    </div>
                    <select
                      value={l.stage}
                      onChange={(e) => setLeadStage(l.id, e.target.value as LeadStage)}
                      className="rounded-xl border border-zinc-200 bg-white px-2 py-1 text-xs"
                    >
                      {(["NEW", "INTERESTED", "FOLLOW_UP", "CONVERTED", "LOST"] as LeadStage[]).map((s) => (
                        <option key={s} value={s}>
                          {stageLabel(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  {l.notes ? <div className="mt-2 text-xs text-zinc-600">{l.notes}</div> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

