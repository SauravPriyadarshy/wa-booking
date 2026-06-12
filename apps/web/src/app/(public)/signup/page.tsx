"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiBase } from "@/lib/api-base";
import { normalizeIndiaPhone } from "@/lib/phone-in";
import { packByKey, type DarbhangaPackKey } from "@/lib/darbhanga-pack";
import { IndiaPhoneInput, StepHint } from "@/components/ui";

type Step = "phone" | "code";
type OtpChannel = "whatsapp" | "email";

function SignupForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const pack = searchParams.get("pack") as DarbhangaPackKey | null;
  const isDarbhanga = ref === "darbhanga" || !!packByKey(pack ?? undefined);

  const [step, setStep] = useState<Step>("phone");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
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
    setDevCodeHint(null);
    if (phone.length < 12) {
      setError(t("phoneInvalid"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/auth/otp/request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, channel: "whatsapp" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        channel?: OtpChannel;
        devCode?: string;
        message?: string | string[];
      };
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
        throw new Error(msg ?? t("otpSendFailed"));
      }
      if (data.devCode) setDevCodeHint(data.devCode);
      setStep("code");
    } catch (e) {
      if (e instanceof TypeError && /fetch/i.test(e.message)) {
        setError(t("serverUnavailable"));
      } else {
        setError(e instanceof Error ? e.message : t("otpSendFailed"));
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndCreateAccount() {
    setError(null);
    if (code.trim().length < 4) {
      setError(t("otpInvalid"));
      return;
    }
    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/auth/otp/verify`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, code: code.trim(), password }),
      });
      const data = (await res.json()) as {
        token?: string;
        user?: { businessId?: string | null };
        message?: string | string[];
      };
      if (!res.ok || !data.token) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
        throw new Error(msg ?? t("otpError"));
      }
      localStorage.setItem("token", data.token);
      const dest = data.user?.businessId ? "/app" : onboardingHref();
      router.replace(isDarbhanga || !data.user?.businessId ? onboardingHref() : dest);
    } catch (e) {
      if (e instanceof TypeError && /fetch/i.test(e.message)) {
        setError(t("serverUnavailable"));
      } else {
        setError(e instanceof Error ? e.message : t("otpError"));
      }
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

        <StepHint
          icon="🚀"
          title={step === "phone" ? t("signupHintTitle") : t("signupVerifyHintTitle")}
          body={step === "phone" ? t("signupHintBody") : t("signupVerifyHintBody")}
        />

        <h1 className="mt-4 text-[22px] font-semibold tracking-tight text-zinc-900">
          {step === "code" ? t("createAccountTitle") : t("signupTitle")}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">
          {step === "code" ? t("createAccountSubtitle") : t("signupSubtitle")}
        </p>

        {step === "phone" ? (
          <div className="mt-6 grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-[13px] font-medium text-zinc-800">{t("phone")}</span>
              <IndiaPhoneInput value={phoneRaw} onChange={setPhoneRaw} placeholder={t("phonePlaceholder")} />
            </label>
            <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[13px] font-medium text-emerald-800">
              {t("otpViaWhatsApp")}
            </p>
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
            <p className="text-[13px] text-zinc-600">{t("otpSentWhatsApp", { phone })}</p>
            {devCodeHint ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                {t("devOtpHint", { code: devCodeHint })}
              </div>
            ) : null}
            <p className="text-[12px] text-zinc-500">{t("otpFallback1234")}</p>
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
            <label className="grid gap-1.5">
              <span className="text-[13px] font-medium text-zinc-800">{t("createPassword")}</span>
              <input
                type="password"
                className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                autoComplete="new-password"
                placeholder={t("passwordHint")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-[13px] font-medium text-zinc-800">{t("confirmPassword")}</span>
              <input
                type="password"
                className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                autoComplete="new-password"
                placeholder={t("passwordHint")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</div>
            ) : null}
            <button
              type="button"
              disabled={loading}
              onClick={() => void verifyAndCreateAccount()}
              className="h-12 rounded-2xl bg-emerald-600 text-[15px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 active:scale-[0.99]"
            >
              {loading ? t("creatingAccount") : t("createAccountBtn")}
            </button>
            <button
              type="button"
              className="text-center text-[13px] font-medium text-emerald-800"
              onClick={() => {
                setStep("phone");
                setCode("");
                setDevCodeHint(null);
                setError(null);
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
