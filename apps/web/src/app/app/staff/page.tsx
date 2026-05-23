"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiBase } from "@/lib/api-base";

type Staff = {
  id: string;
  title: string | null;
  isAvailable: boolean;
  user: { id: string; name: string | null };
};

const schema = z.object({
  name: z.string().min(2),
  title: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function StaffPage() {
  const [items, setItems] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: useMemo(() => ({ name: "", title: "" }), []),
  });

  async function api(path: string, init?: RequestInit) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please login");
    const res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? "Request failed");
    return data;
  }

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const data = (await api("/staff")) as Staff[];
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
        // staff ops are core; keep enabled unless future flag is introduced
        setEnabled(true);
        void enabledFeatures;
      } catch {
        setEnabled(true);
      }
    })();
  }, []);

  async function create(values: FormValues) {
    setSaving(true);
    setError(null);
    try {
      await api("/staff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      form.reset({ name: "", title: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(staffId: string, next: boolean) {
    setError(null);
    try {
      await api(`/staff/${staffId}/availability`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isAvailable: next }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-md px-4 py-6">
        <div className="flex items-center justify-between">
          <a href="/app" className="text-sm text-emerald-700">
            Back
          </a>
          <div className="text-sm text-zinc-500">Staff</div>
        </div>

        {!enabled ? (
          <div className="mt-3 rounded-3xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <div className="text-base font-semibold">Staff is disabled</div>
            <div className="mt-1 text-sm text-zinc-600">
              Ask super admin to enable it for this business.
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-3xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="text-base font-semibold">Add staff</div>
          <form className="mt-4 grid gap-3" onSubmit={form.handleSubmit(create)}>
            <input
              className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 outline-none focus:ring-4 focus:ring-emerald-100"
              placeholder="Name"
              {...form.register("name")}
            />
            <input
              className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 outline-none focus:ring-4 focus:ring-emerald-100"
              placeholder="Role (optional) e.g. Therapist"
              {...form.register("title")}
            />
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
            <div className="text-sm text-zinc-500">No staff yet.</div>
          ) : (
            items.map((s) => (
              <div
                key={s.id}
                className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{s.user.name ?? "Staff"}</div>
                    <div className="text-xs text-zinc-500">{s.title ?? "—"}</div>
                  </div>
                  <button
                    className={`h-9 rounded-full px-3 text-xs font-medium ${
                      s.isAvailable
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                    onClick={() => toggle(s.id, !s.isAvailable)}
                  >
                    {s.isAvailable ? "Available" : "Off"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

