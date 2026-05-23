"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiBase } from "@/lib/api-base";

type Business = { id: string; name: string; slug: string };
type Feature = { key: string; enabled: boolean };

const schema = z.object({
  businessId: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

const ALL = ["whatsapp", "crm", "payments", "analytics", "support", "ai", "queue"] as const;
type FeatureKey = (typeof ALL)[number];

function SuperAdminFeaturesPage() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("businessId") ?? "";
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: useMemo(() => ({ businessId: preselectedId }), [preselectedId]),
  });

  async function api(path: string, init?: RequestInit) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please login as super admin");
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

  async function loadBusinesses() {
    setError(null);
    setLoading(true);
    try {
      const list = (await api("/superadmin/businesses")) as Business[];
      setBusinesses(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadFeatures(businessId: string) {
    setError(null);
    try {
      const list = (await api(`/superadmin/features?businessId=${encodeURIComponent(businessId)}`)) as Feature[];
      setFeatures(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  useEffect(() => {
    loadBusinesses().then(() => {
      if (preselectedId) {
        form.setValue("businessId", preselectedId);
        void loadFeatures(preselectedId);
      }
    });
  }, []);

  async function toggle(key: FeatureKey, enabled: boolean) {
    const businessId = form.getValues("businessId");
    if (!businessId) return;
    setError(null);
    try {
      await api("/superadmin/features", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessId, key, enabled }),
      });
      await loadFeatures(businessId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  }

  const enabledSet = useMemo(() => {
    const m = new Map(features.map((f) => [f.key, f.enabled]));
    return m;
  }, [features]);

  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between">
        <a href="/app" className="text-sm text-emerald-700">
          Back
        </a>
        <div className="text-sm text-zinc-500">Feature flags</div>
      </div>

      <div className="mt-3 rounded-3xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <div className="text-base font-semibold">Choose business</div>
        <select
          className="mt-3 h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 outline-none focus:ring-4 focus:ring-emerald-100"
          {...form.register("businessId")}
          onChange={(e) => {
            form.setValue("businessId", e.target.value);
            setFeatures([]);
            if (e.target.value) loadFeatures(e.target.value);
          }}
        >
          <option value="">{loading ? "Loading..." : "Select business"}</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} ({b.slug})
            </option>
          ))}
        </select>
      </div>

      {form.watch("businessId") ? (
        <div className="mt-3 rounded-3xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
          <div className="text-base font-semibold">Enable features</div>
          <div className="mt-3 grid gap-2">
            {ALL.map((k) => {
              const enabled = Boolean(enabledSet.get(k));
              return (
                <button
                  key={k}
                  className={`h-12 rounded-2xl border px-4 text-left font-medium ${
                    enabled
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-zinc-200 bg-white text-zinc-900"
                  }`}
                  onClick={() => toggle(k, !enabled)}
                  type="button"
                >
                  {enabled ? "ON" : "OFF"} · {k}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}

import { Suspense } from "react";

export default function SuperAdminFeaturesPageWrapper() {
  return (
    <Suspense>
      <SuperAdminFeaturesPage />
    </Suspense>
  );
}

