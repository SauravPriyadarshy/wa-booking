"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiBase } from "@/lib/api-base";

type Category = { id: string; name: string };
type Business = { id: string; name: string; slug: string; isActive: boolean; createdAt: string };
type Created = {
  ok: true;
  business: { id: string; name: string; slug: string };
  adminUser: { id: string; username: string; role: string };
};

const schema = z.object({
  name: z.string().min(2),
  categoryId: z.string().optional(),
  phone: z.string().optional(),
  adminUsername: z.string().min(3),
  adminPassword: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function SuperAdminBusinessesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [result, setResult] = useState<Created | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: useMemo(
      () => ({ name: "", categoryId: "", phone: "", adminUsername: "", adminPassword: "Test@123" }),
      [],
    ),
  });

  async function api(path: string, init?: RequestInit) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please login as super admin");
    const res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: { ...(init?.headers ?? {}), authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? "Request failed");
    return data;
  }

  async function loadData() {
    try {
      const [cats, bizs] = await Promise.all([
        fetch(`${apiBase()}/categories`).then((r) => r.json()),
        api("/superadmin/businesses"),
      ]);
      setCategories(cats as Category[]);
      setBusinesses((bizs as Business[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      setCategories([]);
    }
  }

  useEffect(() => { void loadData(); }, []);

  async function create(values: FormValues) {
    setSaving(true);
    setError(null);
    setResult(null);
    try {
      const created = (await api("/superadmin/businesses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, categoryId: values.categoryId || undefined }),
      })) as Created;
      setResult(created);
      form.reset({ name: "", categoryId: "", phone: "", adminUsername: "", adminPassword: "Test@123" });
      setShowForm(false);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between">
          <a href="/app" className="text-sm font-semibold text-emerald-700">← Dashboard</a>
          <div className="text-xs text-zinc-400 font-medium">Super Admin</div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-[18px] font-semibold text-zinc-900">All Businesses</h1>
          <button
            onClick={() => { setShowForm(!showForm); setResult(null); setError(null); }}
            className="h-9 rounded-xl bg-emerald-600 px-4 text-[13px] font-semibold text-white transition hover:bg-emerald-700"
          >
            {showForm ? "Cancel" : "+ Add Business"}
          </button>
        </div>

        {/* Business List */}
        {businesses.length > 0 ? (
          <div className="mt-4 space-y-2">
            {businesses.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-zinc-900 truncate">{b.name}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${b.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                      {b.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-zinc-400">
                    /{b.slug} · {new Date(b.createdAt).toLocaleDateString("en-IN")}
                  </div>
                </div>
                <div className="ml-4 flex gap-2">
                  <a
                    href={`/app/superadmin/features?businessId=${b.id}`}
                    className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-50"
                  >
                    Features
                  </a>
                  <a
                    href={`/${b.slug}`}
                    target="_blank"
                    className="rounded-lg border border-emerald-200 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    View ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-center text-[13px] text-zinc-400">
            No businesses yet. Click "+ Add Business" to create one.
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="mt-5 rounded-3xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
            <div className="text-[15px] font-semibold text-zinc-900">Create new business</div>
            <form className="mt-4 grid gap-3" onSubmit={form.handleSubmit(create)}>
              <input
                className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-[14px] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Business name (e.g. Dr. Sharma Clinic)"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-[11px] text-red-500">{form.formState.errors.name.message}</p>
              )}

              <select
                className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-[14px] outline-none focus:border-emerald-500"
                {...form.register("categoryId")}
              >
                <option value="">Category (optional)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <input
                className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-[14px] outline-none focus:border-emerald-500"
                placeholder="WhatsApp/Contact phone (e.g. +919122000751)"
                {...form.register("phone")}
              />

              <div className="mt-1 text-[12px] font-semibold uppercase tracking-wide text-zinc-400">
                Business Admin Login
              </div>

              <input
                className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-[14px] outline-none focus:border-emerald-500"
                placeholder="Username (e.g. dr_sharma)"
                {...form.register("adminUsername")}
              />
              {form.formState.errors.adminUsername && (
                <p className="text-[11px] text-red-500">{form.formState.errors.adminUsername.message}</p>
              )}

              <input
                className="h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-[14px] outline-none focus:border-emerald-500"
                type="password"
                placeholder="Password (min 6 characters)"
                {...form.register("adminPassword")}
              />

              <button
                disabled={saving}
                className="h-12 rounded-2xl bg-emerald-600 text-[14px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 active:scale-[0.99]"
              >
                {saving ? "Creating…" : "Create business & admin"}
              </button>
            </form>

            {error && (
              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">{error}</div>
            )}
          </div>
        )}

        {result && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-[13px] font-semibold text-emerald-800">✓ Business created successfully!</div>
            <div className="mt-2 space-y-1 text-[13px] text-emerald-700">
              <div>Business: <span className="font-semibold">{result.business.name}</span></div>
              <div>Booking URL: <span className="font-semibold">/{result.business.slug}</span></div>
              <div>Admin username: <span className="font-semibold">{result.adminUser.username}</span></div>
              <div className="mt-2 text-[12px] text-emerald-600">
                Share login at: wa-booking-web.vercel.app/login with the username above
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
