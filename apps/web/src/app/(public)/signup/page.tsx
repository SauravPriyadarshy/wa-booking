"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiBase } from "@/lib/api-base";
import { normalizeIndiaPhone } from "@/lib/phone-in";

type Step = "phone" | "code";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phoneRaw, setPhoneRaw] = useState("");
  const [code, setCode] = useState("");
  const [devHint, setDevHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const phone = normalizeIndiaPhone(phoneRaw);

  async function requestCode() {
    setError(null);
    if (phone.length < 12) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/auth/otp/request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as { ok?: boolean; devCode?: string; message?: string | string[] };
      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
        throw new Error(msg ?? "Could not send code");
      }
      setDevHint(typeof data.devCode === "string" ? data.devCode : null);
      setStep("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setError(null);
    if (code.trim().length < 4) {
      setError("Enter the 4-digit code");
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
        throw new Error(msg ?? "Invalid code");
      }
      localStorage.setItem("token", data.token);
      router.replace("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-6">
      <div className="rounded-3xl border border-emerald-100/80 bg-white/90 p-5 shadow-[0_10px_40px_rgba(5,150,105,0.12)] backdrop-blur">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">New business</p>
        <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-zinc-900">Start in one minute</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-zinc-600">
          Use your shop mobile. We&apos;ll text a code — no password to remember. Then you add your business name and
          services.
        </p>

        {step === "phone" ? (
          <div className="mt-6 grid gap-3">
            <label className="grid gap-1.5">
              <span className="text-[13px] font-medium text-zinc-800">Mobile number</span>
              <input
                className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-[16px] outline-none ring-emerald-100 focus:border-emerald-400 focus:ring-4"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="98765 43210"
                value={phoneRaw}
                onChange={(e) => setPhoneRaw(e.target.value)}
              />
              {phone.startsWith("+91") && phone.length >= 12 ? (
                <span className="text-[11px] text-zinc-500">Sends to {phone}</span>
              ) : null}
            </label>
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</div>
            ) : null}
            <button
              type="button"
              disabled={loading}
              onClick={() => void requestCode()}
              className="h-12 rounded-2xl bg-emerald-600 text-[15px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60 active:scale-[0.99]"
            >
              {loading ? "Sending…" : "Get verification code"}
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            <p className="text-[13px] text-zinc-600">
              Code sent to <span className="font-semibold text-zinc-900">{phone}</span>
              {devHint ? (
                <span className="mt-1 block rounded-lg bg-amber-50 px-2 py-1.5 text-[12px] font-medium text-amber-900">
                  Demo / dev code: <span className="font-mono">{devHint}</span> (SMS not wired yet)
                </span>
              ) : null}
            </p>
            <label className="grid gap-1.5">
              <span className="text-[13px] font-medium text-zinc-800">4-digit code</span>
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
              {loading ? "Verifying…" : "Continue"}
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
              Change number
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-[13px] text-zinc-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
