"use client";

import { useTransition } from "react";

function getLocale() {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  return m?.[1] ?? "en";
}

export function LangSwitcher() {
  const [, startTransition] = useTransition();

  function toggle() {
    const current = getLocale();
    const next = current === "en" ? "hi" : "en";
    document.cookie = `locale=${next};path=/;max-age=${60 * 60 * 24 * 365}`;
    startTransition(() => {
      window.location.reload();
    });
  }

  const current = getLocale();

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-[12px] font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
      title="Switch language"
    >
      {current === "en" ? "हिं" : "EN"}
    </button>
  );
}
