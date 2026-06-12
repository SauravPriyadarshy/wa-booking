"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiBase } from "@/lib/api-base";

type FormValues = { username: string; password: string };

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        username: z.string().min(1, t("username")),
        password: z.string().min(1, t("password")),
      }),
    [t],
  );

  const defaults = useMemo<FormValues>(() => ({ username: "", password: "" }), []);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase()}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
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
        <div className="text-sm text-zinc-500">{t("loginTitle")}</div>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">{t("login")}</h1>

        <form className="mt-5 grid gap-3" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="grid gap-1">
            <div className="text-xs font-medium text-zinc-700">{t("username")}</div>
            <input
              className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 outline-none focus:ring-4 focus:ring-emerald-100"
              placeholder={t("usernamePlaceholder")}
              autoComplete="username"
              {...form.register("username")}
            />
            {form.formState.errors.username?.message ? (
              <div className="text-xs text-red-600">{form.formState.errors.username.message}</div>
            ) : null}
          </label>

          <label className="grid gap-1">
            <div className="text-xs font-medium text-zinc-700">{t("password")}</div>
            <input
              className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 outline-none focus:ring-4 focus:ring-emerald-100"
              type="password"
              placeholder="••••••••"
              {...form.register("password")}
            />
            {form.formState.errors.password?.message ? (
              <div className="text-xs text-red-600">{form.formState.errors.password.message}</div>
            ) : null}
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          ) : null}

          <button
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
