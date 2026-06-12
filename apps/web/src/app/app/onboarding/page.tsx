"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiBase } from "@/lib/api-base";
import { normalizeIndiaPhone } from "@/lib/phone-in";
import { resolveLocale, type AppLocale } from "@/lib/locale";
import { Button, FormField, FieldInput, IndiaPhoneInput, StepHint } from "@/components/ui";
import { DARBHANGA_PACKS, packByKey, type DarbhangaPack, type DarbhangaPackKey } from "@/lib/darbhanga-pack";
import { formatShareTemplate } from "@/lib/platform-content";

type Subcategory = { id: string; key: string; name: string; nameHi?: string | null; isOther?: boolean };
type Category = { id: string; key: string; name: string; subcategories?: Subcategory[] };
type Service = { id: string; name: string; durationMin: number; isActive?: boolean };
type HourRow = { weekday: number; startMin: number; endMin: number; isClosed: boolean };

const STANDARD_STEPS = 5;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function subLabel(sub: Subcategory, locale: AppLocale) {
  if (locale === "en") return sub.name;
  return sub.nameHi || sub.name;
}

function minToTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToMin(time: string) {
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 540;
  return h * 60 + m;
}

function defaultHourRows(): HourRow[] {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    startMin: 540,
    endMin: 1080,
    isClosed: weekday === 0,
  }));
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
  const [phoneRaw, setPhoneRaw] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [selectedPack, setSelectedPack] = useState<DarbhangaPackKey>(
    packParam && packByKey(packParam) ? packParam : "salon",
  );
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [customSpecialization, setCustomSpecialization] = useState("");
  const [bookingSlug, setBookingSlug] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDuration, setNewServiceDuration] = useState("30");
  const [hourRows, setHourRows] = useState<HourRow[]>(defaultHourRows);
  const [staffName, setStaffName] = useState("");
  const [packs, setPacks] = useState<DarbhangaPack[]>(DARBHANGA_PACKS);
  const [shareTemplate, setShareTemplate] = useState(
    "नमस्ते! {shopName} पर online booking शुरू हो गई है।\n\nLink: {link}\n\nQR scan करके book करें — कोई app नहीं चाहिए।",
  );

  const pack = packByKey(selectedPack)!;
  const normalizedPhone = normalizeIndiaPhone(phoneRaw);

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

  useEffect(() => {
    if (step === 4) setHourRows(defaultHourRows());
  }, [step]);

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
    void loadCategories();
  }, [isDarbhanga, packParam]);

  useEffect(() => {
    if (!categoryId || loadingCats) return;
    const cat = categories.find((c) => c.id === categoryId);
    if (cat && (!cat.subcategories || cat.subcategories.length === 0)) {
      void loadCategories(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when category selection changes
  }, [categoryId]);

  async function loadCategories(forceSync = false) {
    setLoadingCats(true);
    try {
      let res = await fetch(`${apiBase()}/categories`, { cache: "no-store" });
      let data = (await res.json()) as Category[];
      const needsSync =
        forceSync || data.some((c) => !Array.isArray(c.subcategories) || c.subcategories.length === 0);
      if (needsSync) {
        const syncRes = await fetch(`${apiBase()}/categories/sync-subcategories`, {
          method: "POST",
          cache: "no-store",
        });
        if (syncRes.ok) {
          data = (await syncRes.json()) as Category[];
        }
      }
      setCategories(data);
      if (isDarbhanga && packParam) {
        const match = data.find((c) => packByKey(packParam)?.categoryKeys.includes(c.key));
        if (match) setCategoryId(match.id);
      }
    } finally {
      setLoadingCats(false);
    }
  }

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
    const titles = [t("step1Title"), t("step2Title"), t("step3Title"), t("step4Title"), t("step5Title")];
    return titles[s - 1] ?? t("businessBasics");
  }

  function nextFrom1() {
    setError(null);
    if (name.trim().length < 2) {
      setError(isDarbhanga ? t("enterShopName") : t("enterBusinessName"));
      return;
    }
    if (!isDarbhanga && normalizedPhone.length < 12) {
      setError(t("enterBusinessPhone"));
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
    const subs = selectedCategory?.subcategories ?? [];
    if (subs.length > 0 && !subcategoryId) {
      setError(t("selectSubcategory"));
      return false;
    }
    if (subs.length === 0) {
      setError(t("subcategoryLoading"));
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
          phone: normalizedPhone,
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

  async function patchService(id: string, patch: { name?: string; durationMin?: number }) {
    const updated = (await apiFetch(`/services/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    })) as Service;
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
  }

  async function addService() {
    setError(null);
    const svcName = newServiceName.trim();
    const durationMin = Number.parseInt(newServiceDuration, 10);
    if (svcName.length < 2) {
      setError(t("serviceNameRequired"));
      return;
    }
    if (!Number.isFinite(durationMin) || durationMin < 5) {
      setError(t("serviceDurationInvalid"));
      return;
    }
    setSaving(true);
    try {
      const created = (await apiFetch("/services", {
        method: "POST",
        body: JSON.stringify({ name: svcName, durationMin }),
      })) as Service;
      setServices((prev) => [...prev, created]);
      setNewServiceName("");
      setNewServiceDuration("30");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("setupFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function saveHoursAndContinue() {
    setSaving(true);
    setError(null);
    try {
      for (const row of hourRows) {
        await apiFetch("/settings/hours", {
          method: "POST",
          body: JSON.stringify(row),
        });
      }
      setStep(5);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("setupFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function finishOnboarding() {
    setSaving(true);
    setError(null);
    try {
      if (staffName.trim().length >= 2) {
        await apiFetch("/staff", {
          method: "POST",
          body: JSON.stringify({ name: staffName.trim() }),
        });
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("setupFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function finishDarbhanga() {
    setError(null);
    setSaving(true);
    try {
      const data = (await apiFetch("/businesses", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          categoryId: resolvedCategoryId,
          phone: phoneRaw.trim() ? normalizeIndiaPhone(phoneRaw) : undefined,
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

  function DoneScreen() {
    return (
      <div className="min-h-screen bg-emerald-50 px-4 py-8">
        <div className="mx-auto max-w-md text-center">
          <div className="text-5xl">🎉</div>
          <h1 className="mt-4 text-[24px] font-black text-zinc-900">{t("doneTitle")}</h1>
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
          <p className="mt-4 text-[13px] text-zinc-500">{t("servicesNote")}</p>
          <a href="/app?launch=1" className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-zinc-900 text-[15px] font-bold text-white">
            {t("finishSetup")}
          </a>
        </div>
      </div>
    );
  }

  if (done && !isDarbhanga) return <DoneScreen />;

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

          {step === 2 && isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <p className="text-[14px] leading-relaxed text-zinc-600">
                {t("darbhangaStep2Body", { name: name.trim(), pack: pack.titleHi })}
              </p>
              <FormField label={t("shopMobileOptional")}>
                <IndiaPhoneInput value={phoneRaw} onChange={setPhoneRaw} />
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

          {step === 1 && !isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <StepHint icon="🏪" title={t("step1HintTitle")} body={t("step1HintBody")} />
              <FormField label={t("businessName")} required>
                <FieldInput placeholder={t("businessNamePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} />
              </FormField>
              <FormField label={t("businessPhone")} required>
                <IndiaPhoneInput value={phoneRaw} onChange={setPhoneRaw} />
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

          {step === 2 && !isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <StepHint icon="🎯" title={t("step2HintTitle")} body={t("step2HintBody")} />
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
              {categoryId ? (
                <FormField label={t("subcategory")} required>
                  {loadingCats ? (
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-4 text-center text-[13px] text-zinc-500">
                      {tc("loading")}
                    </div>
                  ) : (selectedCategory?.subcategories?.length ?? 0) > 0 ? (
                    <>
                      <p className="mb-2 text-[12px] text-zinc-500">{t("subcategoryHelp")}</p>
                      <select
                        className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[14px] outline-none focus-emerald"
                        value={subcategoryId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSubcategoryId(id);
                          const sub = selectedCategory?.subcategories?.find((s) => s.id === id);
                          if (!sub?.isOther) setCustomSpecialization("");
                        }}
                      >
                        <option value="">{t("selectSubcategory")}</option>
                        {selectedCategory!.subcategories!.map((s) => (
                          <option key={s.id} value={s.id}>
                            {subLabel(s, locale)}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-[13px] text-amber-900">
                      <p>{t("subcategoryEmpty")}</p>
                      <button
                        type="button"
                        className="mt-2 font-semibold text-emerald-700 underline"
                        onClick={() => void loadCategories(true)}
                      >
                        {t("reloadSpecializations")}
                      </button>
                    </div>
                  )}
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

          {step === 3 && !isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <StepHint icon="✂️" title={t("step3HintTitle")} body={t("step3HintBody")} />
              <p className="text-[14px] text-zinc-600">{t("servicesAdded")}</p>
              <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
                {services.map((s) => (
                  <div key={s.id} className="grid gap-2 px-3 py-3 sm:grid-cols-[1fr_88px] sm:items-center">
                    <FieldInput
                      value={s.name}
                      onChange={(e) => setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, name: e.target.value } : x)))}
                      onBlur={() => void patchService(s.id, { name: s.name.trim() }).catch(() => {})}
                    />
                    <div className="flex items-center gap-1">
                      <FieldInput
                        type="number"
                        min={5}
                        inputMode="numeric"
                        className="text-center"
                        value={String(s.durationMin)}
                        onChange={(e) =>
                          setServices((prev) =>
                            prev.map((x) => (x.id === s.id ? { ...x, durationMin: Number.parseInt(e.target.value, 10) || x.durationMin } : x)),
                          )
                        }
                        onBlur={() => void patchService(s.id, { durationMin: s.durationMin }).catch(() => {})}
                      />
                      <span className="shrink-0 text-[12px] text-zinc-400">min</span>
                    </div>
                  </div>
                ))}
                {services.length === 0 ? (
                  <div className="px-3 py-4 text-center text-[13px] text-zinc-400">{tc("loading")}</div>
                ) : null}
              </div>
              <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-3">
                <div className="text-[12px] font-semibold text-emerald-800">{t("addService")}</div>
                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_88px_auto] sm:items-end">
                  <FieldInput
                    placeholder={t("serviceNamePlaceholder")}
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                  />
                  <FieldInput
                    type="number"
                    min={5}
                    inputMode="numeric"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                  />
                  <Button type="button" variant="secondary" size="md" loading={saving} onClick={() => void addService()}>
                    {t("addServiceBtn")}
                  </Button>
                </div>
              </div>
              <Button type="button" variant="primary" size="lg" className="w-full" onClick={() => setStep(4)}>
                {t("continue")}
              </Button>
            </div>
          ) : null}

          {step === 4 && !isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <StepHint icon="🕐" title={t("step4HintTitle")} body={t("step4HintBody")} />
              <p className="text-[13px] text-zinc-500">{t("hoursNote")}</p>
              <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-100">
                {hourRows.map((row) => (
                  <div key={row.weekday} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                    <span className="w-10 shrink-0 text-[13px] font-semibold text-zinc-700">{WEEKDAY_LABELS[row.weekday]}</span>
                    <label className="flex items-center gap-1.5 text-[12px] text-zinc-600">
                      <input
                        type="checkbox"
                        checked={row.isClosed}
                        onChange={(e) =>
                          setHourRows((prev) =>
                            prev.map((h) => (h.weekday === row.weekday ? { ...h, isClosed: e.target.checked } : h)),
                          )
                        }
                      />
                      {t("closed")}
                    </label>
                    {!row.isClosed ? (
                      <>
                        <input
                          type="time"
                          className="h-9 rounded-lg border border-zinc-200 px-2 text-[13px]"
                          value={minToTime(row.startMin)}
                          onChange={(e) =>
                            setHourRows((prev) =>
                              prev.map((h) =>
                                h.weekday === row.weekday ? { ...h, startMin: timeToMin(e.target.value) } : h,
                              ),
                            )
                          }
                        />
                        <span className="text-zinc-400">–</span>
                        <input
                          type="time"
                          className="h-9 rounded-lg border border-zinc-200 px-2 text-[13px]"
                          value={minToTime(row.endMin)}
                          onChange={(e) =>
                            setHourRows((prev) =>
                              prev.map((h) =>
                                h.weekday === row.weekday ? { ...h, endMin: timeToMin(e.target.value) } : h,
                              ),
                            )
                          }
                        />
                      </>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setStep(3)}>
                  {tc("back").replace("← ", "")}
                </Button>
                <Button type="button" variant="primary" size="md" className="flex-1" loading={saving} onClick={() => void saveHoursAndContinue()}>
                  {t("continue")}
                </Button>
              </div>
            </div>
          ) : null}

          {step === 5 && !isDarbhanga ? (
            <div className="mt-5 grid gap-4">
              <StepHint icon="👥" title={t("step5HintTitle")} body={t("step5HintBody")} />
              <p className="text-[14px] text-zinc-600">{t("staffOptional")}</p>
              <FormField label={t("staffNamePlaceholder")}>
                <FieldInput placeholder={t("staffNamePlaceholder")} value={staffName} onChange={(e) => setStaffName(e.target.value)} />
              </FormField>
              <div className="flex flex-col gap-2">
                <Button type="button" variant="ghost" size="md" className="w-full" onClick={() => setStep(4)}>
                  {tc("back").replace("← ", "")}
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => void finishOnboarding()}>
                    {t("staffSkip")}
                  </Button>
                  <Button type="button" variant="primary" size="md" className="flex-1" loading={saving} onClick={() => void finishOnboarding()}>
                    {t("continue")}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
