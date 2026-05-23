"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "icon";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-200",
  secondary:
    "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:bg-zinc-300 disabled:opacity-50",
  ghost:
    "bg-transparent text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200 disabled:opacity-50",
  danger:
    "bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200 disabled:opacity-50",
  icon: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 active:bg-zinc-300 disabled:opacity-50",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-lg",
  md: "h-9 px-4 text-[14px] rounded-xl",
  lg: "h-11 px-5 text-[15px] rounded-xl",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-100 active:scale-[0.98] disabled:cursor-not-allowed tap-highlight-none focus-emerald select-none",
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(" ")}
    >
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : null}
      {children}
    </button>
  );
}
