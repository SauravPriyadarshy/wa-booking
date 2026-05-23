"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiBase } from "@/lib/api-base";

type QuickReply = { id: string; title: string; body: string; tags: string[]; isActive: boolean };

const schema = z.object({
  title: z.string().min(2, "Title is required"),
  body: z.string().min(1, "Message is required"),
  tags: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function TemplatesPage() {
  const [items, setItems] = useState<QuickReply[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  async function load() {
    if (!token) return;
    setErr(null);
    const res = await fetch(`${apiBase()}/quick-replies`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const json = (await res.json()) as any;
    if (!res.ok) throw new Error(json?.message ?? "Failed to load quick replies");
    setItems(json as QuickReply[]);
  }

  useEffect(() => {
    load().catch((e) => setErr(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { title: "", body: "", tags: "" } });

  const tagsHelp = useMemo(() => "Examples: booking, followup, payment", []);

  async function onSubmit(values: FormValues) {
    if (!token) return;
    setBusy(true);
    setErr(null);
    try {
      const tags =
        values.tags?.trim()
          ? values.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [];
      const res = await fetch(`${apiBase()}/quick-replies`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: values.title, body: values.body, tags }),
      });
      const json = (await res.json()) as any;
      if (!res.ok) throw new Error(json?.message ?? "Failed to create");
      form.reset({ title: "", body: "", tags: "" });
      await load();
    } catch (e: any) {
      setErr(e.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-4 py-4">
      <div className="text-sm text-zinc-500">Quick replies</div>
      <div className="mt-2 text-xs text-zinc-500">Tap to copy. Use inside WhatsApp chats.</div>

      {err ? (
        <div className="mt-3 rounded-2xl bg-red-50 p-3 text-xs text-red-700">{err}</div>
      ) : null}

      <div className="mt-3 grid gap-3">
        <div className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="text-sm font-semibold">Add new</div>
          <form className="mt-3 grid gap-2" onSubmit={form.handleSubmit(onSubmit)}>
            <input
              className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
              placeholder="Title (e.g. Confirm booking)"
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <div className="text-xs text-red-600">{form.formState.errors.title.message}</div>
            ) : null}
            <textarea
              className="min-h-[92px] w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
              placeholder="Message (e.g. ✅ Your booking is confirmed for {time})"
              {...form.register("body")}
            />
            {form.formState.errors.body ? (
              <div className="text-xs text-red-600">{form.formState.errors.body.message}</div>
            ) : null}
            <input
              className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400"
              placeholder={`Tags (comma separated) — ${tagsHelp}`}
              {...form.register("tags")}
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
          <div className="text-sm font-semibold">Saved ({items.length})</div>
          {items.length === 0 ? (
            <div className="mt-2 text-xs text-zinc-500">No quick replies yet.</div>
          ) : (
            <div className="mt-3 grid gap-2">
              {items.map((q) => (
                <button
                  key={q.id}
                  onClick={async () => {
                    await navigator.clipboard.writeText(q.body);
                  }}
                  className="text-left rounded-2xl border border-zinc-100 bg-zinc-50 p-3"
                >
                  <div className="text-sm font-semibold">{q.title}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-zinc-600">{q.body}</div>
                  {q.tags?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {q.tags.slice(0, 4).map((t) => (
                        <span key={t} className="rounded-full bg-white px-2 py-0.5 text-[11px] text-zinc-600">
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

