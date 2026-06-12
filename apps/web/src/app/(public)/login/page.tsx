"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiBase } from "@/lib/api-base";
import { normalizeIndiaPhone } from "@/lib/phone-in";
import { IndiaPhoneInput, StepHint } from "@/components/ui";

const DEMO_ACCOUNTS = [
  { label: "🏥 Clinic", phone: "9876543211", password: "password123", hint: "Queue · walk-ins · tokens" },
  { label: "📚 Coaching", phone: "9876543212", password: "password123", hint: "Matrix · batches · fees" },
  { label: "✂️ Salon", phone: "9876543210", password: "password123", hint: "Bookings · CRM" },
  { label: "⚡ Super Admin", username: "admin", password: "Test@123", hint: "Platform admin" },
] as const;

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [mode, setMode] = useState<"phone" | "username">("phone");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const phone = normalizeIndiaPhone(phoneRaw);

  async function doLogin(body: Record<string, string>) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "phone") {
      if (phone.length < 12) {
        setError(t("phoneInvalid"));
        return;
      }
      await doLogin({ phone, password });
    } else {
      if (!username.trim()) {
        setError("Username required");
        return;
      }
      await doLogin({ username: username.trim(), password });
    }
  }

  function fillDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    if ("username" in account && account.username) {
      setMode("username");
      setUsername(account.username);
    } else if ("phone" in account) {
      setMode("phone");
      setPhoneRaw(account.phone);
    }
    setPassword(account.password);
    setError(null);
  }

  return (
    <div className="pt-6">
      <div className="rounded-3xl bg-white/80 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur">
        <StepHint icon="👋" title={t("loginHintTitle")} body={t("loginHintBody")} />

        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">Live demo — tap to fill</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.label}
                type="button"
                onClick={() => fillDemo(acc)}
                className="rounded-xl border border-white bg-white px-2 py-2 text-left transition hover:border-emerald-200"
              >
                <div className="text-[12px] font-bold text-zinc-900">{acc.label}</div>
                <div className="text-[10px] text-zinc-500">{acc.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex rounded-xl bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => setMode("phone")}
            className={`flex-1 rounded-lg py-2 text-[12px] font-semibold ${mode === "phone" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-600"}`}
          >
            Mobile
          </button>
          <button
            type="button"
            onClick={() => setMode("username")}
            className={`flex-1 rounded-lg py-2 text-[12px] font-semibold ${mode === "username" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-600"}`}
          >
            Username
          </button>
        </div>

        <div className="mt-4 text-sm text-zinc-500">{t("loginTitle")}</div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{t("login")}</h1>
        <p className="mt-1 text-[13px] text-zinc-600">{t("loginSubtitle")}</p>

        <form className="mt-5 grid gap-3" onSubmit={(e) => void onSubmit(e)}>
          {mode === "phone" ? (
            <label className="grid gap-1">
              <div className="text-xs font-medium text-zinc-700">{t("phone")}</div>
              <IndiaPhoneInput value={phoneRaw} onChange={setPhoneRaw} placeholder={t("phonePlaceholder")} />
            </label>
          ) : (
            <label className="grid gap-1">
              <div className="text-xs font-medium text-zinc-700">Username</div>
              <input
                className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 outline-none focus:ring-4 focus:ring-emerald-100"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                autoComplete="username"
              />
            </label>
          )}

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
