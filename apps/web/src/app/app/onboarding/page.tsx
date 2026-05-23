"use client";

import { useEffect, useMemo, useState } from "react";
import { apiBase } from "@/lib/api-base";
import { Button, FormField, FieldInput } from "@/components/ui";

type Category = { id: string; key: string; name: string; templateJson?: { services?: Array<{ name: string; durationMin?: number }> } };

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [phone, setPhone] = useState("");

  const selected = useMemo(() => categories.find((c) => c.id === categoryId), [categories, categoryId]);
  const previewServices = selected?.templateJson?.services ?? [];

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/categories`);
        const data = (await res.json()) as Category[];
        setCategories(data);
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  function nextFrom1() {
    setError(null);
    if (name.trim().length < 2) {
      setError("Enter your business name");
      return;
    }
    if (!categoryId) {
      setError("Pick a category");
      return;
    }
    setStep(2);
  }

  async function finish() {
    setError(null);
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login first");
      const res = await fetch(`${apiBase()}/businesses`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), categoryId, phone: phone.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { message?: string })?.message ?? "Setup failed");
      window.location.href = "/app";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex gap-1">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${step >= s ? "bg-emerald-500" : "bg-zinc-200"}`}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Step {step} of 4
          </p>
          <h1 className="mt-1 text-[20px] font-semibold text-zinc-900">
            {step === 1 && "Business basics"}
            {step === 2 && "Services from your category"}
            {step === 3 && "Staff (optional)"}
            {step === 4 && "WhatsApp"}
          </h1>

          {error ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</div>
          ) : null}

          {step === 1 ? (
            <div className="mt-5 grid gap-4">
              <FormField label="Business name" required>
                <FieldInput placeholder="e.g. Glam Studio" value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField label="Category" required>
                <select
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] outline-none focus-emerald"
                  disabled={loadingCats}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">{loadingCats ? "Loading…" : "Select"}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Business phone (optional)">
                <FieldInput placeholder="10-digit mobile" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </FormField>
              <Button type="button" variant="primary" size="lg" className="w-full" onClick={nextFrom1}>
                Continue
              </Button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-5 grid gap-4">
              <p className="text-[14px] text-zinc-600">
                We&apos;ll add common services for <span className="font-semibold text-zinc-900">{selected?.name}</span>. You can edit
                anytime under Settings → Services.
              </p>
              {previewServices.length ? (
                <ul className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-[13px] text-zinc-800">
                  {previewServices.slice(0, 8).map((s, i) => (
                    <li key={i} className="py-1">
                      • {s.name}{" "}
                      {s.durationMin != null ? <span className="text-zinc-500">({s.durationMin} min)</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-zinc-500">No preset list for this category — add services after setup.</p>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="button" variant="primary" size="md" className="flex-1" onClick={() => setStep(3)}>
                  Continue
                </Button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mt-5 grid gap-4">
              <p className="text-[14px] text-zinc-600">
                Owner is added automatically. Invite more staff later under{" "}
                <span className="font-semibold text-zinc-900">Settings → Staff</span> — skip for now if you work solo.
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="button" variant="primary" size="md" className="flex-1" onClick={() => setStep(4)}>
                  Continue
                </Button>
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="mt-5 grid gap-4">
              <p className="text-[14px] text-zinc-600">
                Connect WhatsApp from the Hub when you&apos;re ready (QR scan). You can skip and do this later — your dashboard will
                guide you.
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setStep(3)}>
                  Back
                </Button>
                <Button type="button" variant="primary" size="md" className="flex-1" loading={saving} onClick={() => void finish()}>
                  Go to dashboard
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
