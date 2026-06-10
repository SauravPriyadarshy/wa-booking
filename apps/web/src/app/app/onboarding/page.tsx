"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiBase } from "@/lib/api-base";
import { Button, FormField, FieldInput } from "@/components/ui";
import { DARBHANGA_PACKS, DARBHANGA_SHARE_TEMPLATE, packByKey, type DarbhangaPackKey } from "@/lib/darbhanga-pack";

type Category = { id: string; key: string; name: string };

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 px-4 py-8 text-center text-[14px] text-zinc-500">Loading…</div>}>
      <OnboardingForm />
    </Suspense>
  );
}

function OnboardingForm() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const packParam = searchParams.get("pack") as DarbhangaPackKey | null;
  const isDarbhanga = ref === "darbhanga" || !!packParam || searchParams.get("city") === "darbhanga";

  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPack, setSelectedPack] = useState<DarbhangaPackKey>(
    packParam && packByKey(packParam) ? packParam : "salon",
  );
  const [categoryId, setCategoryId] = useState("");
  const [bookingSlug, setBookingSlug] = useState("");

  const pack = packByKey(selectedPack)!;

  const resolvedCategoryId = useMemo(() => {
    if (!isDarbhanga) return categoryId;
    const match = categories.find((c) => pack.categoryKeys.includes(c.key));
    return match?.id ?? categoryId;
  }, [isDarbhanga, categories, pack.categoryKeys, categoryId]);

  useEffect(() => {
    if (isDarbhanga) {
      localStorage.setItem("darbhangaLaunch", "1");
      localStorage.setItem("darbhangaPack", selectedPack);
    }
  }, [isDarbhanga, selectedPack]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase()}/categories`);
        const data = (await res.json()) as Category[];
        setCategories(data);
        if (isDarbhanga && packParam) {
          const match = data.find((c) => packByKey(packParam)?.categoryKeys.includes(c.key));
          if (match) setCategoryId(match.id);
        }
      } finally {
        setLoadingCats(false);
      }
    })();
  }, [isDarbhanga, packParam]);

  function nextFrom1() {
    setError(null);
    if (name.trim().length < 2) {
      setError(isDarbhanga ? "Shop ka naam likho" : "Enter your business name");
      return;
    }
    if (!isDarbhanga && !categoryId) {
      setError("Pick a category");
      return;
    }
    if (isDarbhanga && !resolvedCategoryId) {
      setError("Category load ho rahi hai — thoda wait karo");
      return;
    }
    setStep(2);
  }

  async function finish() {
    setError(null);
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Pehle login karo");
      const catId = isDarbhanga ? resolvedCategoryId : categoryId;
      const res = await fetch(`${apiBase()}/businesses`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), categoryId: catId, phone: phone.trim() || undefined }),
      });
      const data = (await res.json()) as { slug?: string; message?: string };
      if (!res.ok) throw new Error(data?.message ?? "Setup failed");

      if (isDarbhanga) {
        localStorage.setItem("darbhangaLaunch", "1");
        localStorage.setItem("darbhangaPack", selectedPack);
        setBookingSlug(data.slug ?? "");
        setDone(true);
        return;
      }
      window.location.href = "/app";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Setup failed");
    } finally {
      setSaving(false);
    }
  }

  const bookingUrl =
    typeof window !== "undefined" && bookingSlug
      ? `${window.location.origin}/${bookingSlug}`
      : "";

  if (done && isDarbhanga) {
    const shareText = bookingUrl ? DARBHANGA_SHARE_TEMPLATE(name.trim(), bookingUrl) : "";
    return (
      <div className="min-h-screen bg-emerald-50 px-4 py-8">
        <div className="mx-auto max-w-md text-center">
          <div className="text-5xl">🎉</div>
          <h1 className="mt-4 text-[24px] font-black text-zinc-900">Ho gaya!</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
            {pack.titleHi} ready hai। Ab sirf link share karo — booking aani shuru ho jayegi।
          </p>
          {bookingUrl ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-white p-4 text-left">
              <div className="text-[11px] font-bold uppercase text-zinc-400">Aapka link</div>
              <div className="mt-1 break-all text-[13px] font-semibold text-emerald-800">{bookingUrl}</div>
              <button
                type="button"
                className="mt-3 w-full rounded-xl bg-emerald-600 py-3 text-[14px] font-bold text-white"
                onClick={() => void navigator.clipboard.writeText(bookingUrl)}
              >
                Link copy karo
              </button>
            </div>
          ) : null}
          {shareText ? (
            <div className="mt-3 rounded-2xl border border-zinc-100 bg-white p-4 text-left">
              <div className="text-[11px] font-bold uppercase text-zinc-400">WhatsApp message (copy karo)</div>
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-zinc-700">{shareText}</p>
              <button
                type="button"
                className="mt-3 w-full rounded-xl border border-emerald-200 py-3 text-[14px] font-bold text-emerald-700"
                onClick={() => void navigator.clipboard.writeText(shareText)}
              >
                Message copy karo
              </button>
            </div>
          ) : null}
          <a
            href="/app?launch=1"
            className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-zinc-900 text-[15px] font-bold text-white"
          >
            Dashboard kholo →
          </a>
        </div>
      </div>
    );
  }

  const totalSteps = isDarbhanga ? 2 : 4;

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        {isDarbhanga ? (
          <div className="mb-4 rounded-xl bg-emerald-100 px-3 py-2 text-center text-[12px] font-bold text-emerald-800">
            दरभंगा WhatsApp Pack · {pack.titleHi}
          </div>
        ) : null}

        <div className="mb-4 flex gap-1">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${step >= s ? "bg-emerald-500" : "bg-zinc-200"}`}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            {isDarbhanga ? `Step ${step} / 2` : `Step ${step} of 4`}
          </p>
          <h1 className="mt-1 text-[20px] font-semibold text-zinc-900">
            {isDarbhanga
              ? step === 1
                ? "Shop ka naam aur pack"
                : "Bas — shuru karo"
              : step === 1
                ? "Business basics"
                : step === 2
                  ? "Services from your category"
                  : step === 3
                    ? "Staff (optional)"
                    : "WhatsApp"}
          </h1>

          {error ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</div>
          ) : null}

          {step === 1 && isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <FormField label="Shop / clinic / coaching ka naam" required>
                <FieldInput
                  placeholder="जैसे: Ravi Hair Studio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormField>
              <div>
                <div className="text-[13px] font-medium text-zinc-800">Apna pack (sirf ek)</div>
                <div className="mt-2 grid gap-2">
                  {DARBHANGA_PACKS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setSelectedPack(p.key)}
                      className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition ${
                        selectedPack === p.key
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-zinc-100 bg-white hover:border-emerald-200"
                      }`}
                    >
                      <span className="text-2xl">{p.icon}</span>
                      <div>
                        <div className="text-[14px] font-bold text-zinc-900">{p.titleHi}</div>
                        <ul className="mt-1 space-y-0.5">
                          {p.bulletsHi.map((b) => (
                            <li key={b} className="text-[11px] text-zinc-500">
                              ✓ {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <Button type="button" variant="primary" size="lg" className="w-full" onClick={nextFrom1}>
                Aage badho →
              </Button>
            </div>
          ) : null}

          {step === 2 && isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <p className="text-[14px] leading-relaxed text-zinc-600">
                <span className="font-semibold text-zinc-900">{name}</span> ke liye{" "}
                <span className="font-semibold text-emerald-700">{pack.titleHi}</span> setup ho jayega। Services auto add
                hongi। WhatsApp baad mein jod sakte ho।
              </p>
              <FormField label="Shop mobile (optional)">
                <FieldInput
                  placeholder="9876543210"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </FormField>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="button" variant="primary" size="md" className="flex-1" loading={saving} onClick={() => void finish()}>
                  Shuru karo 🚀
                </Button>
              </div>
            </div>
          ) : null}

          {/* Non-Darbhanga: keep compact 2-step fallback (was 4, now 2 for everyone else too) */}
          {step === 1 && !isDarbhanga ? (
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
              <Button type="button" variant="primary" size="lg" className="w-full" onClick={nextFrom1}>
                Continue
              </Button>
            </div>
          ) : null}

          {step === 2 && !isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <FormField label="Business phone (optional)">
                <FieldInput placeholder="10-digit mobile" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </FormField>
              <p className="text-[13px] text-zinc-500">Services auto-added from category. WhatsApp connect from Hub later.</p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setStep(1)}>
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
