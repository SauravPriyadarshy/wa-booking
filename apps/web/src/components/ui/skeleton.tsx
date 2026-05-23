"use client";

import { ReactNode } from "react";

/* ─── Generic skeleton rect ───────────────────────────────────── */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/* ─── Hub / Dashboard skeleton ──────────────────────────────────── */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4 animate-slide-up">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex gap-3 overflow-hidden pb-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-w-[120px] space-y-2 rounded-2xl border border-zinc-100 bg-white p-4">
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-16" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2 rounded-2xl border border-zinc-100 bg-white p-4">
          <div className="flex justify-between gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-48" />
        </div>
      ))}
    </div>
  );
}

/* ─── Booking list skeleton ─────────────────────────────────────── */
export function BookingCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-zinc-100 p-4 space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-36" />
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
      </div>
    </div>
  );
}

/* ─── Customer card skeleton ─────────────────────────────────────── */
export function CustomerCardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-zinc-100 p-4 flex gap-3">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

/* ─── Empty State ───────────────────────────────────────────────── */
type IconName = "calendar" | "users" | "inbox" | "chart" | "support";

const icons: Record<IconName, ReactNode> = {
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10">
      <rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18M8 2v4m8-4v4" strokeLinecap="round" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10">
      <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" strokeLinecap="round" />
      <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" strokeLinecap="round" />
    </svg>
  ),
  inbox: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10">
      <path d="M22 12h-6l-2 3h-4l-2-3H2" strokeLinecap="round" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10">
      <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" />
    </svg>
  ),
  support: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10">
      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" strokeLinecap="round" />
    </svg>
  ),
};

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="h-20 w-20 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
        {icons[icon]}
      </div>
      <h3 className="text-[15px] font-semibold text-zinc-800">{title}</h3>
      {description && (
        <p className="mt-1 text-[13px] text-zinc-500 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
