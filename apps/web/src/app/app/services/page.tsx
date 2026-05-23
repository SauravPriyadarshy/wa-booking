"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiBase } from "@/lib/api-base";

type Service = {
  id: string;
  name: string;
  durationMin: number;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  priceCents: number | null;
  isActive: boolean;
};

const schema = z.object({
  name: z.string().min(2),
  durationMin: z.number().min(5),
});

type FormValues = z.infer<typeof schema>;

export default function ServicesPage() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: useMemo(() => ({ name: "", durationMin: 15 }), []),
  });

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login");
      const res = await fetch(`${apiBase()}/services`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as Service[];
      if (!res.ok) throw new Error((data as any)?.message ?? "Failed");
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${apiBase()}/me`, {
          headers: { authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const enabledFeatures: string[] = data?.business?.enabledFeatures ?? [];
        // services are core for all categories
        setEnabled(true);
        void enabledFeatures;
      } catch {
        setEnabled(true);
      }
    })();
  }, []);

  async function onSubmit(values: FormValues) {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login");
      const res = await fetch(`${apiBase()}/services`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Failed");
      form.reset({ name: "", durationMin: 15 });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-md px-4 py-6">
        <div className="flex items-center justify-between">
          <a href="/app" className="text-sm text-emerald-700">
            Back
          </a>
          <div className="text-sm text-zinc-500">Services</div>
        </div>

        {!enabled ? (
          <div className="mt-3 rounded-3xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <div className="text-base font-semibold">Services is disabled</div>
            <div className="mt-1 text-sm text-zinc-600">
              Ask super admin to enable it for this business.
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-3xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="text-base font-semibold">Add service</div>
          <form className="mt-4 grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
            <input
              className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 outline-none focus:ring-4 focus:ring-emerald-100"
              placeholder="Example: Consultation"
              {...form.register("name")}
            />
            <select
              className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 outline-none focus:ring-4 focus:ring-emerald-100"
              {...form.register("durationMin", { valueAsNumber: true })}
            >
              {[10, 15, 20, 30, 45, 60, 90, 120].map((m) => (
                <option key={m} value={m}>
                  {m} mins
                </option>
              ))}
            </select>
            <button
              disabled={saving}
              className="h-12 rounded-2xl bg-emerald-600 text-white font-medium disabled:opacity-60 active:scale-[0.99] transition"
            >
              {saving ? "Saving..." : "Add"}
            </button>
          </form>
          </div>
        )}

        {error ? (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-4 grid gap-3">
          {loading ? (
            <div className="text-sm text-zinc-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-zinc-500">No services yet.</div>
          ) : (
            items.map((s) => (
              <div
                key={s.id}
                className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-zinc-500">
                      {s.durationMin} mins
                    </div>
                  </div>
                  <div
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      s.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {s.isActive ? "Active" : "Off"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

