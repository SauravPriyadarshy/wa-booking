"use client";

import Link from "next/link";

type Props = {
  title: string;
  message: string;
  cta?: string;
  href?: string;
  compact?: boolean;
};

export function UpgradeBanner({ title, message, cta = "Upgrade to Plus →", href = "/signup", compact }: Props) {
  return (
    <div
      className={`rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className={`font-bold text-amber-900 ${compact ? "text-[13px]" : "text-[14px]"}`}>{title}</div>
      <p className={`mt-1 text-amber-800/90 ${compact ? "text-[12px]" : "text-[13px]"} leading-relaxed`}>{message}</p>
      <Link
        href={href}
        className={`mt-3 inline-flex items-center font-bold text-emerald-700 ${compact ? "text-[12px]" : "text-[13px]"}`}
      >
        {cta}
      </Link>
    </div>
  );
}

export function PlanUsageBar({
  label,
  used,
  max,
}: {
  label: string;
  used: number;
  max: number | null;
}) {
  if (max == null) return null;
  const pct = Math.min(100, Math.round((used / max) * 100));
  const warn = pct >= 80;
  return (
    <div className="rounded-xl border border-zinc-100 bg-white p-3">
      <div className="flex justify-between text-[12px]">
        <span className="font-semibold text-zinc-700">{label}</span>
        <span className={warn ? "font-bold text-amber-700" : "text-zinc-500"}>
          {used}/{max}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full ${warn ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
