"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiBase } from "@/lib/api-base";
import { Button, StepHint } from "@/components/ui";

type WaState = {
  status: string;
  qrDataUrl?: string;
  workerConfigured?: boolean;
};

export default function WhatsAppPage() {
  const t = useTranslations("whatsapp");
  const tc = useTranslations("common");
  const [state, setState] = useState<WaState>({ status: "DISCONNECTED" });
  const [loading, setLoading] = useState(false);
  const [boot, setBoot] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please login");
    const res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: { ...(init?.headers ?? {}), authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { message?: string })?.message ?? "Request failed");
    return data;
  }, []);

  async function refresh() {
    setError(null);
    try {
      const s = (await api("/whatsapp/status").catch(() => ({ status: "DISCONNECTED" }))) as WaState;
      setState(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : tc("error"));
    } finally {
      setBoot(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (state.status !== "QR_REQUIRED") return;
    const id = setInterval(() => {
      void api("/whatsapp/status")
        .then((s) => setState(s as WaState))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, [api, state.status]);

  async function connect() {
    setLoading(true);
    setError(null);
    try {
      const s = (await api("/whatsapp/connect", { method: "POST" })) as WaState;
      setState(s);
      if (s.status === "CONNECTED") void refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : tc("error"));
    } finally {
      setLoading(false);
    }
  }

  const connected = state.status === "CONNECTED";
  const showQr = state.status === "QR_REQUIRED" && state.qrDataUrl;

  return (
    <div className="mx-auto max-w-md space-y-4 pb-8">
      <a href="/app" className="text-[13px] font-semibold text-emerald-700">
        ← {t("backToHub")}
      </a>

      <StepHint icon="💬" title={t("hintTitle")} body={t("hintBody")} />

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[20px] font-semibold text-zinc-900">{t("title")}</h1>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${
            connected ? "bg-emerald-100 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`} />
          {connected ? t("statusConnected") : t("statusOff")}
        </span>
      </div>

      {boot ? <div className="h-32 animate-pulse rounded-2xl bg-zinc-100" /> : null}

      {!boot && connected ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <div className="text-4xl">✅</div>
          <p className="mt-3 text-[15px] font-semibold text-emerald-900">{t("connectedTitle")}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-emerald-800">{t("connectedBody")}</p>
          <Button type="button" variant="secondary" size="md" className="mt-4" onClick={() => void refresh()}>
            {t("checkAgain")}
          </Button>
        </div>
      ) : null}

      {!boot && !connected ? (
        <div className="space-y-4">
          <ol className="space-y-2 rounded-2xl border border-zinc-100 bg-white p-4">
            {[t("step1"), t("step2"), t("step3")].map((text, i) => (
              <li key={i} className="flex gap-3 text-[13px] text-zinc-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-bold text-emerald-800">
                  {i + 1}
                </span>
                <span className="pt-0.5 leading-relaxed">{text}</span>
              </li>
            ))}
          </ol>

          {showQr ? (
            <div className="rounded-2xl border border-zinc-100 bg-white p-4 text-center">
              <p className="mb-3 text-[13px] font-medium text-zinc-700">{t("scanQr")}</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.qrDataUrl} alt="WhatsApp QR" className="mx-auto max-w-[240px] rounded-xl border border-zinc-100" />
              <p className="mt-3 text-[11px] text-zinc-500">{t("scanHint")}</p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
              {error.includes("waking") || error.includes("try again") ? t("tryAgainSoon") : t("setupNote")}
            </div>
          ) : null}

          <Button type="button" variant="primary" size="lg" className="w-full" loading={loading} onClick={() => void connect()}>
            {showQr ? t("refreshQr") : t("showQr")}
          </Button>

          <p className="text-center text-[12px] leading-relaxed text-zinc-500">{t("bookingStillWorks")}</p>
        </div>
      ) : null}
    </div>
  );
}
