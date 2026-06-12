"use client";

import { useTranslations } from "next-intl";
import { LangSwitcher } from "@/components/lang-switcher";

export function MarketingNav({ loginHref = "/login" }: { loginHref?: string }) {
  const t = useTranslations("marketing");

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/95 backdrop-blur">
      <div className="shell flex h-14 items-center justify-between gap-3">
        <a href="/" className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-sm font-bold text-white">
            WA
          </div>
          <span className="truncate text-[15px] font-semibold text-zinc-900">BookNow</span>
        </a>
        <div className="flex shrink-0 items-center gap-2">
          <LangSwitcher />
          <a
            href={loginHref}
            className="h-9 rounded-xl border border-zinc-200 px-4 text-[13px] font-semibold leading-9 text-zinc-700"
          >
            {t("login")}
          </a>
        </div>
      </div>
    </nav>
  );
}
