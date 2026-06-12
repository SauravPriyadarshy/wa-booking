"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiBase } from "@/lib/api-base";
import { normalizeIndiaPhone } from "@/lib/phone-in";
import { IndiaPhoneInput, StepHint } from "@/components/ui";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [phoneRaw, setPhoneRaw] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const phone = normalizeIndiaPhone(phoneRaw);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (phone.length < 12) {
      setError(t("phoneInvalid"));
      return;
    }
    if (password.length < 4) {
      setError(t("passwordRequired"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const errBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (errBody as { message?: string | string[] })?.message;
        const text = Array.isArray(msg) ? msg.join(", ") : typeof msg === "string" ? msg : t("loginFailed");
        throw new Error(text);
      }
      const data = errBody as { token: string };
      localStorage.setItem("token", data.token);
      router.replace("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loginFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-6">
      <div className="rounded-3xl bg-white/80 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur">
        <StepHint icon="👋" title={t("loginHintTitle")} body={t("loginHintBody")} />

        <div className="mt-4 text-sm text-zinc-500">{t("loginTitle")}</div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{t("login")}</h1>
        <p className="mt-1 text-[13px] text-zinc-600">{t("loginSubtitle")}</p>

        <form className="mt-5 grid gap-3" onSubmit={(e) => void onSubmit(e)}>
          <label className="grid gap-1">
            <div className="text-xs font-medium text-zinc-700">{t("phone")}</div>
            <IndiaPhoneInput value={phoneRaw} onChange={setPhoneRaw} placeholder={t("phonePlaceholder")} />
          </label>

          <label className="grid gap-1">
            <div className="text-xs font-medium text-zinc-700">{t("password")}</div>
            <input
              className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 outline-none focus:ring-4 focus:ring-emerald-100"
              type="password"
              placeholder={t("passwordHint")}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <div className="text-right">
            <Link href="/forgot-password" className="text-[13px] font-semibold text-emerald-700 hover:underline">
              {t("forgotPassword")}
            </Link>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 grid h-12 place-items-center rounded-2xl bg-emerald-600 font-medium text-white transition active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? t("loggingIn") : t("login")}
          </button>

          <p className="text-center text-[13px] text-zinc-600">
            {t("newBusinessPrompt")}{" "}
            <Link href="/signup" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
              {t("startWithMobile")}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
