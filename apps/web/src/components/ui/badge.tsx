"use client";

type Status = "confirmed" | "pending" | "cancelled" | "no_show" | "completed";
type Size = "sm" | "md";

interface StatusBadgeProps {
  status: Status | string;
  size?: Size;
}

const statusMap: Record<string, { label: string; classes: string }> = {
  confirmed:  { label: "Confirmed",   classes: "bg-emerald-50 text-emerald-700" },
  completed:  { label: "Completed",   classes: "bg-emerald-100 text-emerald-800" },
  pending:    { label: "Pending",     classes: "bg-amber-50 text-amber-700" },
  cancelled:  { label: "Cancelled",   classes: "bg-red-50 text-red-600" },
  no_show:    { label: "No-show",     classes: "bg-zinc-100 text-zinc-500" },
  // Lead stages
  new:        { label: "New",         classes: "bg-blue-50 text-blue-700" },
  interested: { label: "Interested",  classes: "bg-purple-50 text-purple-700" },
  follow_up:  { label: "Follow-up",   classes: "bg-amber-50 text-amber-700" },
  converted:  { label: "Converted",   classes: "bg-emerald-50 text-emerald-700" },
  lost:       { label: "Lost",        classes: "bg-zinc-100 text-zinc-500" },
  // Support tickets
  open:       { label: "Open",        classes: "bg-red-50 text-red-600" },
  in_progress:{ label: "In Progress", classes: "bg-amber-50 text-amber-700" },
  resolved:   { label: "Resolved",    classes: "bg-emerald-50 text-emerald-700" },
  closed:     { label: "Closed",      classes: "bg-zinc-100 text-zinc-500" },
};

const sizeClasses: Record<Size, string> = {
  sm: "text-[11px] px-2 py-0.5",
  md: "text-[12px] px-2.5 py-1",
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const key = status.toLowerCase();
  const config = statusMap[key] ?? { label: status, classes: "bg-zinc-100 text-zinc-600" };
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${config.classes} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
}

/* ─── Generic chip ─────────────────────────────────────────────── */
interface ChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition tap-highlight-none ${
        active
          ? "bg-emerald-600 text-white"
          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}
