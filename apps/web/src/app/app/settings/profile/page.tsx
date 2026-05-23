"use client";

import { useEffect, useState } from "react";
import { apiBase } from "@/lib/api-base";
import { Button, Card } from "@/components/ui";

type Profile = {
  id: string;
  name: string;
  phone: string | null;
  slug: string;
  timezone: string;
};

function api(path: string, init?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
  });
}

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", slug: "", timezone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api("/settings/profile")
      .then((r) => r.json())
      .then((d: Profile) => {
        setProfile(d);
        setForm({ name: d.name ?? "", phone: d.phone ?? "", slug: d.slug ?? "", timezone: d.timezone ?? "Asia/Kolkata" });
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await api("/settings/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name || undefined,
          phone: form.phone || undefined,
          slug: form.slug || undefined,
          timezone: form.timezone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Save failed");
      setProfile(data as Profile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const TIMEZONES = [
    "Asia/Kolkata",
    "Asia/Dhaka",
    "Asia/Karachi",
    "Asia/Dubai",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Europe/London",
    "America/New_York",
    "America/Los_Angeles",
    "UTC",
  ];

  return (
    <div className="px-4 pb-28 pt-4 md:pb-8">
      <a href="/app/settings" className="text-[13px] font-semibold text-emerald-700">
        ← Settings
      </a>
      <h1 className="mt-3 text-[20px] font-semibold text-zinc-900">Business Profile</h1>
      <p className="mt-1 text-[13px] text-zinc-500">Update your business name, WhatsApp number, and booking URL.</p>

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
      ) : (
        <form onSubmit={save} className="mt-6 space-y-4">
          <Card className="!p-4 space-y-4">
            {/* Business Name */}
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-zinc-700">Business Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Demo Salon & Spa"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* WhatsApp / Contact Phone */}
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-zinc-700">
                WhatsApp / Contact Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+919122000751"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <p className="mt-1 text-[11px] text-zinc-500">
                New booking alerts will be sent to this number. Use international format (+91…).
              </p>
            </div>

            {/* Booking URL Slug */}
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-zinc-700">Booking Page URL</label>
              <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                <span className="shrink-0 pl-3 text-[13px] text-zinc-400">booknow.app/</span>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                  placeholder="my-salon"
                  className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 text-[14px] text-zinc-900 outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">Lowercase letters, numbers and hyphens only.</p>
            </div>

            {/* Timezone */}
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-zinc-700">Timezone</label>
              <select
                value={form.timezone}
                onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[14px] text-zinc-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</div>
          )}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
              ✓ Profile saved successfully
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" loading={saving}>
            Save Profile
          </Button>

          {profile && (
            <Card className="!p-4">
              <div className="text-[12px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">Current values</div>
              <div className="space-y-1 text-[13px] text-zinc-700">
                <div><span className="text-zinc-400">Name:</span> {profile.name}</div>
                <div><span className="text-zinc-400">Phone:</span> {profile.phone ?? <span className="text-red-500">Not set</span>}</div>
                <div><span className="text-zinc-400">Slug:</span> {profile.slug}</div>
                <div><span className="text-zinc-400">Timezone:</span> {profile.timezone}</div>
              </div>
            </Card>
          )}
        </form>
      )}
    </div>
  );
}
