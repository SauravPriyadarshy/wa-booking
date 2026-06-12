"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { apiBase } from "@/lib/api-base";
import { resolveLocale, type AppLocale } from "@/lib/locale";
import type { StaticBusinessType } from "@/lib/business-success-types";
import {
  getFallbackSimulator,
  normalizeSimulatorPayload,
  type SimulatorData,
} from "@/lib/business-success-fallback";

type SuccessCard = { key: string; name: string; nameHi: string; icon: string; simulatorKey: string };

function readLocale(): AppLocale {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  return resolveLocale(m?.[1]);
}

function healthLabel(level: string, t: ReturnType<typeof useTranslations>) {
  const map: Record<string, string> = {
    excellent: t("healthExcellent"),
    good: t("healthGood"),
    needs_attention: t("healthNeedsAttention"),
    critical: t("healthCritical"),
  };
  return map[level] ?? level;
}

function healthColor(level: string) {
  if (level === "excellent") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (level === "good") return "text-blue-700 bg-blue-50 border-blue-200";
  if (level === "needs_attention") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-700 bg-red-50 border-red-200";
}

type Props = {
  initialTypes: StaticBusinessType[];
};

export function BusinessSuccessClient({ initialTypes }: Props) {
  const t = useTranslations("businessSuccess");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const initial = searchParams.get("type") ?? "";

  const [locale, setLocale] = useState<AppLocale>("en");
  const [cards, setCards] = useState<SuccessCard[]>(
    initialTypes.map((c) => ({ ...c, simulatorKey: c.key })),
  );
  const [selected, setSelected] = useState<string | null>(initial || null);
  const [sim, setSim] = useState<SimulatorData | null>(null);
  const [loadingSim, setLoadingSim] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  useEffect(() => {
    setLocale(readLocale());
    fetch(`${apiBase()}/public/business-success/types`)
      .then(async (r) => {
        if (!r.ok) return;
        const d = (await r.json()) as { types?: SuccessCard[] };
        if (d.types?.length) setCards(d.types);
      })
      .catch(() => {
        /* keep initialTypes */
      });
  }, []);

  useEffect(() => {
    if (!selected) {
      setSim(null);
      setSimError(null);
      return;
    }
    setLoadingSim(true);
    setSimError(null);
    fetch(`${apiBase()}/public/business-success/simulator/${selected}`)
      .then(async (r) => {
        const d = (await r.json()) as Record<string, unknown>;
        const fromApi = normalizeSimulatorPayload(d);
        if (r.ok && fromApi) {
          setSim(fromApi);
          return;
        }
        setSim(getFallbackSimulator(selected));
        if (!r.ok) setSimError(null);
      })
      .catch(() => {
        setSim(getFallbackSimulator(selected));
        setSimError(null);
      })
      .finally(() => setLoadingSim(false));
  }, [selected]);

  const loc = locale === "en" ? "en" : "hi";
  const displayCards = cards.length ? cards : initialTypes.map((c) => ({ ...c, simulatorKey: c.key }));

  return (
    <>
      <section className="bg-gradient-to-b from-emerald-600 to-emerald-700 px-4 py-10 text-white">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-100">{t("badge")}</p>
          <h1 className="mt-2 text-[24px] font-black leading-tight">{t("title")}</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-emerald-50">{t("subtitle")}</p>
        </div>
      </section>

      {!selected ? (
        <section className="shell py-8">
          <h2 className="text-center text-[18px] font-bold text-zinc-900">{t("pickType")}</h2>
          <p className="mt-1 text-center text-[13px] text-zinc-500">{t("pickTypeSub")}</p>
          <noscript>
            <p className="mt-4 text-center text-[13px] text-zinc-600">
              Enable JavaScript for the interactive demo, or{" "}
              <a href="/signup" className="font-semibold text-emerald-700">
                start free
              </a>
              .
            </p>
          </noscript>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {displayCards.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setSelected(c.simulatorKey ?? c.key)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md active:scale-[0.98]"
              >
                <span className="text-3xl">{c.icon}</span>
                <span className="text-center text-[13px] font-bold text-zinc-900">
                  {loc === "en" ? c.name : c.nameHi}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="shell py-6">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mb-4 text-[13px] font-semibold text-emerald-700"
          >
            {tc("back")}
          </button>

          {loadingSim ? (
            <p className="text-center text-[14px] text-zinc-400">{tc("loading")}</p>
          ) : !sim ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
              <p className="text-[14px] text-amber-900">{simError ?? tc("error")}</p>
              <button
                type="button"
                onClick={() => setSim(getFallbackSimulator(selected))}
                className="mt-3 text-[13px] font-semibold text-emerald-700"
              >
                {tc("refresh")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
                <div className="text-[11px] font-bold uppercase text-zinc-400">{t("demoLabel")}</div>
                <h2 className="mt-1 text-[20px] font-black text-zinc-900">
                  {loc === "en" ? sim.businessName : sim.businessNameHi}
                </h2>
                <div className="mt-1 text-[13px] text-zinc-500">
                  {loc === "en" ? sim.categoryLabel : sim.categoryLabelHi}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {sim.stats.map((s) => (
                  <div
                    key={s.label}
                    className={`rounded-xl border p-3 ${
                      s.tone === "warn" ? "border-amber-200 bg-amber-50" : "border-zinc-100 bg-white"
                    }`}
                  >
                    <div className="text-[20px] font-black text-zinc-900">{s.value}</div>
                    <div className="text-[11px] font-semibold text-zinc-500">{loc === "en" ? s.label : s.labelHi}</div>
                  </div>
                ))}
              </div>

              <div className={`rounded-2xl border p-4 ${healthColor(sim.healthLevel)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase opacity-70">{t("healthScore")}</div>
                    <div className="text-[32px] font-black">{sim.healthScore}/100</div>
                  </div>
                  <div className="rounded-full border px-3 py-1 text-[12px] font-bold">{healthLabel(sim.healthLevel, t)}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
                <div className="text-[13px] font-bold text-red-900">{t("revenueLeakage")}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] text-red-800">
                  <div>
                    {t("missedAppts")}: {sim.leakage.missedAppointments}
                  </div>
                  <div>
                    {t("pendingPay")}: {sim.leakage.pendingPayments}
                  </div>
                  <div>
                    {t("unconfirmed")}: {sim.leakage.unconfirmedBookings}
                  </div>
                  <div>
                    {t("inactive")}: {sim.leakage.inactiveCustomers}
                  </div>
                </div>
                <div className="mt-3 text-[15px] font-black text-red-900">
                  {t("estimatedLoss")}: ₹{sim.leakage.estimatedLossInr.toLocaleString("en-IN")}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-white p-4">
                <h3 className="text-[15px] font-bold text-zinc-900">{t("problemsTitle")}</h3>
                <div className="mt-3 space-y-3">
                  {sim.psychology.problems.map((p) => (
                    <div key={p.title} className="rounded-xl bg-zinc-50 p-3">
                      <div className="text-[13px] font-bold text-zinc-900">{loc === "en" ? p.title : p.titleHi}</div>
                      <div className="mt-1 text-[12px] text-zinc-600">{loc === "en" ? p.why : p.whyHi}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                <h3 className="text-[15px] font-bold text-emerald-900">{t("helpsTitle")}</h3>
                <div className="mt-3 space-y-3">
                  {sim.psychology.helps.map((h) => (
                    <div key={h.title} className="rounded-xl bg-white p-3">
                      <div className="text-[13px] font-bold text-emerald-800">{loc === "en" ? h.title : h.titleHi}</div>
                      <div className="mt-1 text-[12px] text-zinc-600">{loc === "en" ? h.benefit : h.benefitHi}</div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[13px] font-semibold text-emerald-800">
                  ⏱ {loc === "en" ? sim.psychology.timeSaved : sim.psychology.timeSavedHi}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-white p-4">
                <h3 className="text-[13px] font-bold text-zinc-900">{t("todayPreview")}</h3>
                <ul className="mt-2 divide-y divide-zinc-50">
                  {sim.sampleSchedule.map((row) => (
                    <li key={row.time} className="flex items-center gap-3 py-2.5">
                      <span className="w-14 shrink-0 text-[11px] font-bold text-zinc-400">{row.time}</span>
                      <span className="flex-1 text-[13px] text-zinc-800">{loc === "en" ? row.title : row.titleHi}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          row.status === "warn" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {row.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/signup"
                  className="flex h-12 items-center justify-center rounded-2xl bg-emerald-600 text-[15px] font-bold text-white shadow-lg"
                >
                  {t("startFree")}
                </Link>
                <p className="text-center text-[12px] text-zinc-500">{t("readOnlyNote")}</p>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}

export function BusinessSuccessFallback() {
  const tc = useTranslations("common");
  return <div className="py-20 text-center text-zinc-400">{tc("loading")}</div>;
}
