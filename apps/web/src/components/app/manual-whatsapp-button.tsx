"use client";

type Props = {
  label?: string;
  onClick: () => void;
  size?: "sm" | "md";
  className?: string;
};

export function ManualWhatsAppButton({ label = "Send WhatsApp", onClick, size = "sm", className = "" }: Props) {
  const sizeClass = size === "md" ? "px-4 py-2 text-[13px]" : "px-3 py-1.5 text-[11px]";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1 rounded-xl border border-[#25D366] bg-[#25D366]/5 font-semibold text-[#128C7E] transition hover:bg-[#25D366]/10 active:scale-[0.98] ${sizeClass} ${className}`}
    >
      <span aria-hidden>💬</span>
      {label}
    </button>
  );
}
