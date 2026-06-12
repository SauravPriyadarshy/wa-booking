"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiBase } from "@/lib/api-base";
import { normalizeIndiaPhone } from "@/lib/phone-in";
import { IndiaPhoneInput, StepHint } from "@/components/ui";

function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "reset">("phone");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const phone = normalizeIndiaPhone(phoneRaw);

  async function requestCode() {
    setError(null);
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
      const data = (await res.json()) as { message?: string | string[] };
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
        throw new Error(msg ?? t("otpSendFailed"));
      }
      setStep("reset");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("otpSendFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword() {
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
      const data = (await res.json()) as { token?: string; message?: string | string[] };
      if (!res.ok || !data.token) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
        throw new Error(msg ?? t("otpError"));
      }
      localStorage.setItem("token", data.token);
      router.replace("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("otpError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-6">
      <div className="rounded-3xl bg-white/80 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur">
        <StepHint icon="🔐" title={t("forgotHintTitle")} body={t("forgotHintBody")} />

        <div className="mt-4 text-sm text-zinc-500">{t("forgotPassword")}</div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
          {step === "phone" ? t("forgotPassword") : t("resetPasswordBtn")}
        </h1>
        <p className="mt-1 text-[13px] text-zinc-600">
          {step === "phone" ? t("forgotSubtitle") : t("resetSubtitle")}
        </p>

        {step === "phone" ? (
          <div className="mt-5 grid gap-3">
            <label className="grid gap-1">
              <div className="text-xs font-medium text-zinc-700">{t("phone")}</div>
              <IndiaPhoneInput value={phoneRaw} onChange={setPhoneRaw} placeholder={t("phonePlaceholder")} />
            </label>
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</div>
            ) : null}
            <button
              type="button"
              disabled={loading}
              onClick={() => void requestCode()}
              className="mt-1 grid h-12 place-items-center rounded-2xl bg-emerald-600 font-medium text-white transition active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? t("sendingOtp") : t("sendResetCode")}
            </button>
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            <p className="text-[13px] text-zinc-600">{t("otpSentWhatsApp", { phone })}</p>
            <label className="grid gap-1">
              <div className="text-xs font-medium text-zinc-700">{t("otpPlaceholder")}</div>
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
            <label className="grid gap-1">
              <div className="text-xs font-medium text-zinc-700">{t("newPassword")}</div>
              <input
                type="password"
                className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                autoComplete="new-password"
                placeholder={t("passwordHint")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="grid gap-1">
              <div className="text-xs font-medium text-zinc-700">{t("confirmPassword")}</div>
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
              onClick={() => void resetPassword()}
              className="mt-1 grid h-12 place-items-center rounded-2xl bg-emerald-600 font-medium text-white transition active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? t("savingPassword") : t("resetPasswordBtn")}
            </button>
          </div>
        )}

        <p className="mt-5 text-center text-[13px] text-zinc-600">
          <Link href="/login" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
            {t("backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const tc = useTranslations("common");
  return (
    <Suspense fallback={<div className="pt-6 text-center text-[14px] text-zinc-500">{tc("loading")}</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
