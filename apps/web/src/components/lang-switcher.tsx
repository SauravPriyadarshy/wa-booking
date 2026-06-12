"use client";

import { useTransition } from "react";
import { LOCALES, localeShortLabel, resolveLocale, type AppLocale } from "@/lib/locale";

function getLocaleCookie(): AppLocale {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  return resolveLocale(m?.[1]);
}

export function LangSwitcher() {
  const [, startTransition] = useTransition();
  const current = getLocaleCookie();

  function pick(next: AppLocale) {
    if (next === current) return;
    document.cookie = `locale=${next};path=/;max-age=${60 * 60 * 24 * 365}`;
    startTransition(() => {
      window.location.reload();
    });
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full bg-zinc-100 p-1 text-sm shadow-sm"
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => pick(l)}
          className={`min-w-[2.5rem] rounded-full px-3 py-1 text-[11px] font-bold transition ${
            current === l ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          }`}
          aria-pressed={current === l}
        >
          {localeShortLabel(l)}
        </button>
      ))}
    </div>
  );
}
