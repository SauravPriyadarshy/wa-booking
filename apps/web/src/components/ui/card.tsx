"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

/* ─── Card ──────────────────────────────────────────────────────── */
type CardDivProps = Pick<
  ComponentPropsWithoutRef<"div">,
  "role" | "id" | "aria-modal" | "aria-labelledby"
>;

interface CardProps extends CardDivProps {
  children: ReactNode;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
  noPad?: boolean;
}

export function Card({
  children,
  interactive,
  onClick,
  className = "",
  noPad,
  role,
  id,
  "aria-modal": ariaModal,
  "aria-labelledby": ariaLabelledby,
}: CardProps) {
  const base =
    "bg-white rounded-2xl border border-zinc-100 shadow-sm transition-all duration-100";
  const hover = interactive
    ? "cursor-pointer hover:shadow-md hover:border-zinc-200 active:scale-[0.99] tap-highlight-none"
    : "";
  const pad = noPad ? "" : "p-4";

  if (interactive && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={[base, hover, pad, "w-full text-left", className].join(" ")}
      >
        {children}
      </button>
    );
  }

  return (
    <div
      role={role}
      id={id}
      aria-modal={ariaModal}
      aria-labelledby={ariaLabelledby}
      className={[base, hover, pad, className].join(" ")}
    >
      {children}
    </div>
  );
}

/* ─── StatCard ──────────────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "emerald" | "amber" | "red" | "blue" | "zinc";
  icon?: ReactNode;
  /** When set, entire card links (min touch-friendly height). */
  href?: string;
}

const accentMap = {
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  blue: "bg-blue-50 text-blue-700",
  zinc: "bg-zinc-100 text-zinc-600",
};

export function StatCard({ label, value, sub, accent = "zinc", icon, href, className = "" }: StatCardProps & { className?: string }) {
  const inner = (
    <>
      {icon ? (
        <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-sm mb-3 ${accentMap[accent]}`}>
          {icon}
        </div>
      ) : null}
      <div className="text-2xl font-semibold text-zinc-900 leading-none">{value}</div>
      <div className="mt-1 text-[12px] text-zinc-500 font-medium">{label}</div>
      {sub ? <div className="mt-0.5 text-[11px] text-zinc-400">{sub}</div> : null}
    </>
  );

  const shell = [
    "min-w-[120px] flex-shrink-0 rounded-2xl bg-white border border-zinc-100 shadow-sm p-4",
    href ? "tap-highlight-none transition hover:border-emerald-200 hover:shadow-md min-h-[88px] flex flex-col justify-center no-underline text-inherit" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <a href={href} className={shell}>
        {inner}
      </a>
    );
  }

  return <div className={shell}>{inner}</div>;
}
