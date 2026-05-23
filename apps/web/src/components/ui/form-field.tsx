"use client";

import { ReactNode, InputHTMLAttributes } from "react";

export function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-[12px] font-semibold text-zinc-700">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      {children}
      {error ? <p className="text-[12px] font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

export function FieldInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[15px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus-emerald",
        props.className ?? "",
      ].join(" ")}
    />
  );
}
