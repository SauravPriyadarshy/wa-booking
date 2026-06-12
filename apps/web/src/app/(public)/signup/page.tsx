"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiBase } from "@/lib/api-base";
import { normalizeIndiaPhone } from "@/lib/phone-in";
import { packByKey, type DarbhangaPackKey } from "@/lib/darbhanga-pack";

type Step = "phone" | "code";
type OtpChannel = "whatsapp" | "email";

function SignupForm() {
  const t = useTranslations("auth");
  const tm = useTranslations("marketing");
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const pack = searchParams.get("pack") as DarbhangaPackKey | null;
  const isDarbhanga = ref === "darbhanga" || !!packByKey(pack ?? undefined);

  const [step, setStep] = useState<Step>("phone");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState<OtpChannel>("whatsapp");
  const [code, setCode] = useState("");
  const [devHint, setDevHint] = useState<string | null>(null);
  const [sentVia, setSentVia] = useState<OtpChannel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const phone = normalizeIndiaPhone(phoneRaw);

  useEffect(() => {
    if (ref) sessionStorage.setItem("signupRef", ref);
    if (pack) sessionStorage.setItem("signupPack", pack);
  }, [ref, pack]);

  function onboardingHref() {
    const params = new URLSearchParams();
    const storedRef = ref ?? sessionStorage.getItem("signupRef");
    const storedPack = pack ?? sessionStorage.getItem("signupPack");
    if (storedRef) params.set("ref", storedRef);
    if (storedPack) params.set("pack", storedPack);
    const q = params.toString();
    return q ? `/app/onboarding?${q}` : "/app/onboarding";
  }

  async function requestCode() {
    setError(null);
    if (phone.length < 12) {
      setError(t("phoneInvalid"));
      return;
    }
    if (channel === "email" && !email.trim()) {
      setError(t("emailRequired"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/auth/otp/request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          phone,
          channel,
          ...(channel === "email" ? { email: email.trim() } : {}),
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        devCode?: string;
        channel?: OtpChannel;
        message?: string | string[];
      };
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
        throw new Error(msg ?? t("otpSendFailed"));
      }
      setSentVia(data.channel ?? channel);
      setDevHint(typeof data.devCode === "string" ? data.devCode : null);
      setStep("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("otpSendFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setError(null);
    if (code.trim().length < 4) {
      setError(t("otpInvalid"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/auth/otp/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, code: code.trim() }),
      });
      const data = (await res.json()) as { token?: string; message?: string | string[] };
      if (!res.ok || !data.token) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
        throw new Error(msg ?? t("otpError"));
      }
      localStorage.setItem("token", data.token);
      router.replace(isDarbhanga ? onboardingHref() : "/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("otpError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-6">
      <div className="rounded-3xl border border-emerald-100/80 bg-white/90 p-5 shadow-[0_10px_40px_rgba(5,150,105,0.12)] backdrop-blur">
        {isDarbhanga ? (
          <div className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-center text-[12px] font-bold text-emerald-800">
            दरभंगा WhatsApp Pack
            {packByKey(pack ?? undefined) ? ` · ${packByKey(pack ?? undefined)!.titleHi}` : ""}
          </div>
        ) : null}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
          {isDarbhanga ? tm("mobileSignup") : t("signupTitle")}
        </p>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-zinc-900">
          {step === "code" ? t("otpTitle") : t("signupTitle")}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">
          {step === "code" ? t("otpSubtitle") : t("signupSubtitle")}
        </p>

        {step === "phone" ? (
          <div className="mt-6 grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-[13px] font-medium text-zinc-800">{t("phone")}</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-zinc-500 select-none">
                  +91
                </span>
                <input
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 text-[16px] outline-none ring-emerald-100 focus:border-emerald-400 focus:ring-4"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  autoComplete="tel"
                  placeholder={t("phonePlaceholder")}
                  value={phoneRaw}
                  onChange={(e) => setPhoneRaw(e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
              </div>
            </label>

            <div className="grid gap-1.5">
              <span className="text-[13px] font-medium text-zinc-800">{t("otpDelivery")}</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel("whatsapp")}
                  className={`h-11 rounded-xl border text-[13px] font-semibold transition ${
                    channel === "whatsapp"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-zinc-200 bg-white text-zinc-600"
                  }`}
                >
                  {t("otpViaWhatsApp")}
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("email")}
                  className={`h-11 rounded-xl border text-[13px] font-semibold transition ${
                    channel === "email"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-zinc-200 bg-white text-zinc-600"
                  }`}
                >
                  {t("otpViaEmail")}
                </button>
              </div>
            </div>

            {channel === "email" ? (
              <label className="grid gap-1.5">
                <span className="text-[13px] font-medium text-zinc-800">{t("email")}</span>
                <input
                  className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-[16px] outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  type="email"
                  autoComplete="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</div>
            ) : null}
            <button
              type="button"
              disabled={loading}
              onClick={() => void requestCode()}
              className="h-12 rounded-2xl bg-emerald-600 text-[15px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 active:scale-[0.99]"
            >
              {loading ? t("sendingOtp") : t("getOtpButton")}
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            <p className="text-[13px] text-zinc-600">
              {sentVia === "email" ? t("otpSentEmail", { email }) : t("otpSentPhone", { phone })}
              {devHint ? (
                <span className="mt-1 block rounded-lg bg-emerald-50 px-2 py-1.5 text-[12px] font-medium text-emerald-900">
                  {t("devOtpHint", { code: devHint })}
                </span>
              ) : null}
              <span className="mt-2 block text-[12px] text-zinc-500">{t("otpFallback1234")}</span>
            </p>
            <label className="grid gap-1.5">
              <span className="text-[13px] font-medium text-zinc-800">{t("otpPlaceholder")}</span>
              <input
                className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-[18px] font-mono tracking-widest outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                inputMode="numeric"
                maxLength={8}
                autoComplete="one-time-code"
                placeholder="••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </label>
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</div>
            ) : null}
            <button
              type="button"
              disabled={loading}
              onClick={() => void verifyCode()}
              className="h-12 rounded-2xl bg-emerald-600 text-[15px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 active:scale-[0.99]"
            >
              {loading ? t("verifyingOtp") : t("verifyButton")}
            </button>
            <button
              type="button"
              className="text-center text-[13px] font-medium text-emerald-800"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError(null);
                setDevHint(null);
              }}
            >
              {t("changeNumber")}
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-[13px] text-zinc-600">
          {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
            {t("loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  const tc = useTranslations("common");
  return (
    <Suspense fallback={<div className="pt-6 text-center text-[14px] text-zinc-500">{tc("loading")}</div>}>
      <SignupForm />
    </Suspense>
  );
}
