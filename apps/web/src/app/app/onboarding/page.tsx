"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiBase } from "@/lib/api-base";
import { resolveLocale, type AppLocale } from "@/lib/locale";
import { Button, FormField, FieldInput } from "@/components/ui";
import { DARBHANGA_PACKS, packByKey, type DarbhangaPack, type DarbhangaPackKey } from "@/lib/darbhanga-pack";
import { formatShareTemplate } from "@/lib/platform-content";

type Subcategory = { id: string; key: string; name: string; nameHi?: string | null; isOther?: boolean };
type Category = { id: string; key: string; name: string; subcategories?: Subcategory[] };
type Service = { id: string; name: string; durationMin: number; isActive?: boolean };

const STANDARD_STEPS = 7;

function subLabel(sub: Subcategory, locale: AppLocale) {
  if (locale === "en") return sub.name;
  return sub.nameHi || sub.name;
}

export default function OnboardingPage() {
  const tc = useTranslations("common");
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 px-4 py-8 text-center text-[14px] text-zinc-500">{tc("loading")}</div>}>
      <OnboardingForm />
    </Suspense>
  );
}

function readLocaleCookie(): AppLocale {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  return resolveLocale(m?.[1]);
}

function OnboardingForm() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const packParam = searchParams.get("pack") as DarbhangaPackKey | null;
  const isDarbhanga = ref === "darbhanga" || !!packParam || searchParams.get("city") === "darbhanga";

  const [locale, setLocale] = useState<AppLocale>("en");
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [selectedPack, setSelectedPack] = useState<DarbhangaPackKey>(
    packParam && packByKey(packParam) ? packParam : "salon",
  );
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [customSpecialization, setCustomSpecialization] = useState("");
  const [bookingSlug, setBookingSlug] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [staffName, setStaffName] = useState("");
  const [waStatus, setWaStatus] = useState<string>("DISCONNECTED");
  const [waQr, setWaQr] = useState<string | null>(null);
  const [packs, setPacks] = useState<DarbhangaPack[]>(DARBHANGA_PACKS);
  const [shareTemplate, setShareTemplate] = useState(
    "नमस्ते! {shopName} पर online booking शुरू हो गई है।\n\nLink: {link}\n\nQR scan करके book करें — कोई app नहीं चाहिए।",
  );

  const pack = packByKey(selectedPack)!;

  useEffect(() => {
    setLocale(readLocaleCookie());
  }, []);

  useEffect(() => {
    const loc = readLocaleCookie();
    fetch(`${apiBase()}/site-content/bundle?locale=${loc}`)
      .then((r) => r.json())
      .then((d: { darbhanga?: Record<string, string>; platform?: Record<string, string> }) => {
        try {
          const raw = d.darbhanga?.["darbhanga.packs"];
          if (raw) setPacks(JSON.parse(raw) as DarbhangaPack[]);
        } catch {
          /* keep defaults */
        }
        const tpl = d.platform?.["platform.share_template"];
        if (tpl) setShareTemplate(tpl);
      })
      .catch(() => {});
  }, []);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId],
  );

  const selectedSub = useMemo(
    () => selectedCategory?.subcategories?.find((s) => s.id === subcategoryId) ?? null,
    [selectedCategory, subcategoryId],
  );

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

  function authHeaders() {
    const token = localStorage.getItem("token");
    if (!token) throw new Error(t("loginFirst"));
    return { "content-type": "application/json", authorization: `Bearer ${token}` };
  }

  async function apiFetch(path: string, init?: RequestInit) {
    const res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...(init?.headers ?? {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { message?: string })?.message ?? t("setupFailed"));
    return data;
  }

  function stepTitle(s: number) {
    if (isDarbhanga) return s === 1 ? t("darbhangaStep1Title") : t("darbhangaStep2Title");
    const titles = [
      t("step1Title"),
      t("step2Title"),
      t("step3Title"),
      t("step4Title"),
      t("step5Title"),
      t("step6Title"),
      t("step7Title"),
    ];
    return titles[s - 1] ?? t("businessBasics");
  }

  function nextFrom1() {
    setError(null);
    if (name.trim().length < 2) {
      setError(isDarbhanga ? t("enterShopName") : t("enterBusinessName"));
      return;
    }
    if (isDarbhanga) {
      if (!resolvedCategoryId) {
        setError(t("waitCategory"));
        return;
      }
      setStep(2);
      return;
    }
    setStep(2);
  }

  function validateStep2() {
    if (!categoryId) {
      setError(t("pickCategory"));
      return false;
    }
    if (!subcategoryId) {
      setError(t("selectSubcategory"));
      return false;
    }
    if (selectedSub?.isOther && customSpecialization.trim().length < 2) {
      setError(t("customSpecialization"));
      return false;
    }
    return true;
  }

  async function createBusinessAndContinue() {
    setError(null);
    if (!validateStep2()) return;
    setSaving(true);
    try {
      const data = (await apiFetch("/businesses", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          categoryId,
          subcategoryId,
          customSpecialization: selectedSub?.isOther ? customSpecialization.trim() : undefined,
          phone: phone.trim() || undefined,
          activationCode: activationCode.trim() || undefined,
        }),
      })) as { business?: { slug?: string }; templateServicesCreated?: number };

      setBookingSlug(data.business?.slug ?? "");
      const svc = (await apiFetch("/services")) as Service[];
      setServices(svc);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("setupFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function saveDefaultHours() {
    setSaving(true);
    setError(null);
    try {
      for (let weekday = 0; weekday <= 6; weekday++) {
        const isSunday = weekday === 0;
        await apiFetch("/settings/hours", {
          method: "POST",
          body: JSON.stringify({
            weekday,
            startMin: 540,
            endMin: 1080,
            isClosed: isSunday,
          }),
        });
      }
      setStep(5);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("setupFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function saveStaffAndContinue() {
    setSaving(true);
    setError(null);
    try {
      if (staffName.trim().length >= 2) {
        await apiFetch("/staff", {
          method: "POST",
          body: JSON.stringify({ name: staffName.trim() }),
        });
      }
      setStep(6);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("setupFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function connectWhatsApp() {
    setSaving(true);
    setError(null);
    try {
      const s = (await apiFetch("/whatsapp/connect", { method: "POST" })) as {
        status?: string;
        qrDataUrl?: string;
        message?: string;
      };
      setWaStatus(s.status ?? "DISCONNECTED");
      setWaQr(s.qrDataUrl ?? null);
      if (s.status === "CONNECTED") setStep(7);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("setupFailed");
      if (msg.toLowerCase().includes("waking up") || msg.toLowerCase().includes("try again")) {
        setError(t("waWakingUp"));
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  }

  async function refreshWaStatus() {
    try {
      const s = (await apiFetch("/whatsapp/status")) as {
        status?: string;
        qrDataUrl?: string;
      };
      setWaStatus(s.status ?? "DISCONNECTED");
      setWaQr(s.qrDataUrl ?? null);
      if (s.status === "CONNECTED") setStep(7);
    } catch {
      setWaStatus("DISCONNECTED");
    }
  }

  useEffect(() => {
    if (step !== 6 || isDarbhanga) return;
    void refreshWaStatus();
    const id = setInterval(() => void refreshWaStatus(), 4000);
    return () => clearInterval(id);
  }, [step, isDarbhanga]);

  async function finishDarbhanga() {
    setError(null);
    setSaving(true);
    try {
      const data = (await apiFetch("/businesses", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          categoryId: resolvedCategoryId,
          phone: phone.trim() || undefined,
        }),
      })) as { business?: { slug?: string } };

      localStorage.setItem("darbhangaLaunch", "1");
      localStorage.setItem("darbhangaPack", selectedPack);
      setBookingSlug(data.business?.slug ?? "");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("setupFailed"));
    } finally {
      setSaving(false);
    }
  }

  const bookingUrl =
    typeof window !== "undefined" && bookingSlug ? `${window.location.origin}/${bookingSlug}` : "";

  if (done && isDarbhanga) {
    const shareText = bookingUrl ? formatShareTemplate(shareTemplate, name.trim(), bookingUrl) : "";
    return (
      <div className="min-h-screen bg-emerald-50 px-4 py-8">
        <div className="mx-auto max-w-md text-center">
          <div className="text-5xl">🎉</div>
          <h1 className="mt-4 text-[24px] font-black text-zinc-900">{t("doneTitle")}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">{t("packReady", { pack: pack.titleHi })}</p>
          {bookingUrl ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-white p-4 text-left">
              <div className="text-[11px] font-bold uppercase text-zinc-400">{t("yourLink")}</div>
              <div className="mt-1 break-all text-[13px] font-semibold text-emerald-800">{bookingUrl}</div>
              <button
                type="button"
                className="mt-3 w-full rounded-xl bg-emerald-600 py-3 text-[14px] font-bold text-white"
                onClick={() => void navigator.clipboard.writeText(bookingUrl)}
              >
                {t("copyLink")}
              </button>
            </div>
          ) : null}
          {shareText ? (
            <div className="mt-3 rounded-2xl border border-zinc-100 bg-white p-4 text-left">
              <div className="text-[11px] font-bold uppercase text-zinc-400">{t("waMessageLabel")}</div>
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-zinc-700">{shareText}</p>
              <button
                type="button"
                className="mt-3 w-full rounded-xl border border-emerald-200 py-3 text-[14px] font-bold text-emerald-700"
                onClick={() => void navigator.clipboard.writeText(shareText)}
              >
                {t("copyMessage")}
              </button>
            </div>
          ) : null}
          <a href="/app?launch=1" className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-zinc-900 text-[15px] font-bold text-white">
            {t("openDashboard")}
          </a>
        </div>
      </div>
    );
  }

  if (step === 7 && !isDarbhanga) {
    return (
      <div className="min-h-screen bg-emerald-50 px-4 py-8">
        <div className="mx-auto max-w-md text-center">
          <div className="text-5xl">🎉</div>
          <h1 className="mt-4 text-[24px] font-black text-zinc-900">{t("step7Title")}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">{t("doneBody")}</p>
          {bookingUrl ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-white p-4 text-left">
              <div className="text-[11px] font-bold uppercase text-zinc-400">{t("viewBookingLink")}</div>
              <div className="mt-1 break-all text-[13px] font-semibold text-emerald-800">{bookingUrl}</div>
              <button
                type="button"
                className="mt-3 w-full rounded-xl bg-emerald-600 py-3 text-[14px] font-bold text-white"
                onClick={() => void navigator.clipboard.writeText(bookingUrl)}
              >
                {t("copyLink")}
              </button>
            </div>
          ) : null}
          <a href="/app?launch=1" className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-zinc-900 text-[15px] font-bold text-white">
            {t("finishSetup")}
          </a>
        </div>
      </div>
    );
  }

  const totalSteps = isDarbhanga ? 2 : STANDARD_STEPS;

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        {isDarbhanga ? (
          <div className="mb-4 rounded-xl bg-emerald-100 px-3 py-2 text-center text-[12px] font-bold text-emerald-800">
            {t("darbhangaBadge", { pack: pack.titleHi })}
          </div>
        ) : null}

        <div className="mb-4 flex gap-1">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${step >= s ? "bg-emerald-500" : "bg-zinc-200"}`} />
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            {isDarbhanga ? t("stepProgress", { current: step, total: 2 }) : t("step", { current: step, total: STANDARD_STEPS })}
          </p>
          <h1 className="mt-1 text-[20px] font-semibold text-zinc-900">{stepTitle(step)}</h1>

          {error ? (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</div>
          ) : null}

          {/* Darbhanga step 1 */}
          {step === 1 && isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <FormField label={t("shopNameLabel")} required>
                <FieldInput placeholder={t("shopNamePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <div>
                <div className="text-[13px] font-medium text-zinc-800">{t("pickPack")}</div>
                <div className="mt-2 grid gap-2">
                  {packs.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setSelectedPack(p.key)}
                      className={`flex items-start gap-3 rounded-xl border-2 p-3 text-left transition ${
                        selectedPack === p.key ? "border-emerald-500 bg-emerald-50" : "border-zinc-100 bg-white hover:border-emerald-200"
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
                {t("continue")}
              </Button>
            </div>
          ) : null}

          {/* Darbhanga step 2 */}
          {step === 2 && isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <p className="text-[14px] leading-relaxed text-zinc-600">
                {t("darbhangaStep2Body", { name: name.trim(), pack: pack.titleHi })}
              </p>
              <FormField label={t("shopMobileOptional")}>
                <FieldInput placeholder="9876543210" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </FormField>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setStep(1)}>
                  {tc("back").replace("← ", "")}
                </Button>
                <Button type="button" variant="primary" size="md" className="flex-1" loading={saving} onClick={() => void finishDarbhanga()}>
                  {t("startSetup")}
                </Button>
              </div>
            </div>
          ) : null}

          {/* Standard step 1 — business info */}
          {step === 1 && !isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <FormField label={t("businessName")} required>
                <FieldInput placeholder={t("businessNamePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField label={t("businessPhoneOptional")}>
                <FieldInput placeholder="9876543210" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </FormField>
              <FormField label={t("activationCodeOptional")}>
                <FieldInput
                  placeholder={t("activationCodePlaceholder")}
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                />
              </FormField>
              <Button type="button" variant="primary" size="lg" className="w-full" onClick={nextFrom1}>
                {t("continue")}
              </Button>
            </div>
          ) : null}

          {/* Standard step 2 — category + subcategory */}
          {step === 2 && !isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <FormField label={t("category")} required>
                <select
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] outline-none focus-emerald"
                  disabled={loadingCats}
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setSubcategoryId("");
                    setCustomSpecialization("");
                  }}
                >
                  <option value="">{loadingCats ? tc("loading") : t("selectCategory")}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>
              {selectedCategory?.subcategories?.length ? (
                <FormField label={t("subcategory")} required>
                  <select
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] outline-none focus-emerald"
                    value={subcategoryId}
                    onChange={(e) => setSubcategoryId(e.target.value)}
                  >
                    <option value="">{t("selectSubcategory")}</option>
                    {selectedCategory.subcategories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {subLabel(s, locale)}
                      </option>
                    ))}
                  </select>
                </FormField>
              ) : null}
              {selectedSub?.isOther ? (
                <FormField label={t("customSpecialization")} required>
                  <FieldInput
                    placeholder={t("customSpecializationPlaceholder")}
                    value={customSpecialization}
                    onChange={(e) => setCustomSpecialization(e.target.value)}
                  />
                </FormField>
              ) : null}
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setStep(1)}>
                  {tc("back").replace("← ", "")}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="flex-1"
                  loading={saving}
                  onClick={() => void createBusinessAndContinue()}
                >
                  {saving ? t("creatingBusiness") : t("continue")}
                </Button>
              </div>
            </div>
          ) : null}

          {/* Standard step 3 — services */}
          {step === 3 && !isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <p className="text-[14px] text-zinc-600">{t("servicesAdded")}</p>
              <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
                {services.map((s) => (
                  <li key={s.id} className="flex items-center justify-between px-3 py-2.5 text-[14px]">
                    <span className="font-medium text-zinc-800">{s.name}</span>
                    <span className="text-[12px] text-zinc-400">{s.durationMin} min</span>
                  </li>
                ))}
                {services.length === 0 ? (
                  <li className="px-3 py-4 text-center text-[13px] text-zinc-400">{tc("loading")}</li>
                ) : null}
              </ul>
              <Button type="button" variant="primary" size="lg" className="w-full" onClick={() => setStep(4)}>
                {t("continue")}
              </Button>
            </div>
          ) : null}

          {/* Standard step 4 — hours */}
          {step === 4 && !isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[14px] font-medium text-emerald-900">
                {t("hoursPreset")}
              </div>
              <p className="text-[13px] text-zinc-500">{t("hoursNote")}</p>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setStep(3)}>
                  {tc("back").replace("← ", "")}
                </Button>
                <Button type="button" variant="primary" size="md" className="flex-1" loading={saving} onClick={() => void saveDefaultHours()}>
                  {t("continue")}
                </Button>
              </div>
            </div>
          ) : null}

          {/* Standard step 5 — staff */}
          {step === 5 && !isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <p className="text-[14px] text-zinc-600">{t("staffOptional")}</p>
              <FormField label={t("staffNamePlaceholder")}>
                <FieldInput placeholder={t("staffNamePlaceholder")} value={staffName} onChange={(e) => setStaffName(e.target.value)} />
              </FormField>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setStep(6)}>
                  {t("staffSkip")}
                </Button>
                <Button type="button" variant="primary" size="md" className="flex-1" loading={saving} onClick={() => void saveStaffAndContinue()}>
                  {t("continue")}
                </Button>
              </div>
            </div>
          ) : null}

          {/* Standard step 6 — WhatsApp */}
          {step === 6 && !isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <p className="text-[14px] text-zinc-600">{t("waConnectBody")}</p>
              {waStatus === "CONNECTED" ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-[14px] font-semibold text-emerald-800">
                  ✅ {t("waConnected")}
                </div>
              ) : waQr ? (
                <div className="text-center">
                  <p className="mb-2 text-[13px] text-zinc-500">{t("waWaiting")}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={waQr} alt="WhatsApp QR" className="mx-auto max-w-[220px] rounded-xl border border-zinc-200" />
                  <p className="mt-2 text-[11px] text-zinc-500">{t("waScanHint")}</p>
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-center text-[13px] text-zinc-600">
                  {t("waTapConnect")}
                </div>
              )}
              <Button type="button" variant="primary" size="lg" className="w-full" loading={saving} onClick={() => void connectWhatsApp()}>
                {waQr ? t("waRefreshQr") : t("waConnectBtn")}
              </Button>
              <Button type="button" variant="ghost" size="lg" className="w-full" onClick={() => setStep(7)}>
                {t("waSkip")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
