"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiBase } from "@/lib/api-base";
import {
  CalendarDays,
  Users,
  MessageCircle,
  AlertCircle,
  ChevronRight,
  Star,
  Zap,
} from "lucide-react";
import { BookingLinkPanel } from "@/components/app/booking-link-panel";
import {
  StatCard,
  StatusBadge,
  EmptyState,
  DashboardSkeleton,
  toast,
} from "@/components/ui";

type UiConfig =
  | { ok: false }
  | {
      ok: true;
      modules: string[];
      slug: string | null;
      quickActions: { key: string; label: string }[];
    };

type WaStatus = { status?: string; qrDataUrl?: string };

type QuickReply = { id: string; title: string; body: string; tags: string[] };

type DashboardPayload = {
  displayName: string;
  dateLabel: string;
  stats: {
    bookingsToday: number;
    pendingConfirmations: number;
    revenueTodayCents: number;
    freeSlotsApprox: number | null;
    needsReplyCount: number;
    pendingPayments?: number;
    followUpsDue?: number;
    missedCustomers?: number;
    staffAvailable?: number;
    noShowToday?: number;
  };
  suggestion: null | {
    id: string;
    message: string;
    actionLabel: string;
    actionHref: string;
  };
  schedule: Array<{
    id: string;
    startAt: string;
    endAt: string;
    status: string;
    customerName: string;
    phone: string | null;
    serviceName: string;
    staffName: string | null;
    paymentPending: boolean;
  }>;
};

type HealthPayload = {
  score: number;
  level: "excellent" | "good" | "needs_attention" | "critical";
  categoryKey?: string | null;
  actions: Array<{ key: string; label: string; href: string }>;
};

type RevenueLeakagePayload = {
  missedAppointments: number;
  pendingFollowups: number;
  pendingFees: number;
  pendingFeesCents: number;
  inactiveCustomers: number;
  unansweredLeads: number;
  pendingPayments: number;
  estimatedLossCents: number;
  actions: Array<{ key: string; label: string; href: string }>;
};

type CoachingSnapshot = {
  totalStudents: number;
  feesDue: number;
  feesDueCents: number;
  monthCollectedCents: number;
  attendancePct: number | null;
  newAdmissions: number;
};

/* ─── Helpers ───────────────────────────────────────────────────── */

function formatInrFromCents(cents: number) {
  const rupees = cents / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}k`;
  return `₹${Math.round(rupees).toLocaleString("en-IN")}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function appointmentBadgeStatus(status: string): "confirmed" | "pending" | "cancelled" | "completed" | "no_show" {
  const u = status.toUpperCase();
  if (u === "CONFIRMED") return "confirmed";
  if (u === "PENDING") return "pending";
  if (u === "CANCELLED") return "cancelled";
  if (u === "COMPLETED") return "completed";
  if (u === "NO_SHOW") return "no_show";
  return "pending";
}

function getGreeting(categoryKey: string | null, displayName: string): { title: string; subtitle: string } {
  const greetings: Record<string, { title: string; subtitle: string }> = {
    salon: { title: `नमस्ते ${displayName}! 💈`, subtitle: "Today's salon schedule" },
    clinic: { title: `Good morning, Dr. ${displayName}!`, subtitle: "Today's patient queue" },
    coaching: { title: `नमस्ते ${displayName}! 📚`, subtitle: "Today's classes & fees" },
    spa: { title: `Welcome back, ${displayName}! 🧖`, subtitle: "Today's spa bookings" },
    home_service: { title: `Good morning, ${displayName}! 🔧`, subtitle: "Today's jobs" },
  };
  return greetings[categoryKey ?? ""] ?? { title: `नमस्ते ${displayName}!`, subtitle: "Today's workspace" };
}

function suggestionDismissKey(id: string) {
  const day = new Date().toISOString().slice(0, 10);
  return `hub-suggestion-dismiss:${id}:${day}`;
}

function padDate(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayISO() {
  const n = new Date();
  return padDate(n.getFullYear(), n.getMonth() + 1, n.getDate());
}

/* ─── Health score level style map (static classes for Tailwind) ── */
const LEVEL_STYLES = {
  excellent: { textClass: "text-emerald-600", stroke: "#059669", iconClass: "text-emerald-500" },
  good: { textClass: "text-blue-600", stroke: "#2563eb", iconClass: "text-blue-500" },
  needs_attention: { textClass: "text-amber-600", stroke: "#d97706", iconClass: "text-amber-500" },
  critical: { textClass: "text-red-600", stroke: "#dc2626", iconClass: "text-red-500" },
} as const;

const LEVEL_LABELS: Record<HealthPayload["level"], string> = {
  excellent: "Excellent",
  good: "Good",
  needs_attention: "Needs Attention",
  critical: "Critical",
};

/* ─── Workspace action card ─────────────────────────────────────── */
function WorkspaceCard({
  label,
  count,
  sub,
  href,
  accent,
  urgent,
}: {
  label: string;
  count: string | number;
  sub: string;
  href: string;
  accent: string;
  urgent?: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex min-h-[72px] flex-col justify-between rounded-2xl border p-3 shadow-sm transition active:scale-[0.98] tap-highlight-none ${
        urgent ? "border-amber-200 bg-amber-50" : "border-zinc-100 bg-white hover:border-emerald-100"
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
        {urgent ? <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" /> : null}
      </div>
      <div>
        <div className={`text-[22px] font-bold leading-none ${accent}`}>{count}</div>
        <div className="mt-0.5 text-[11px] text-zinc-400">{sub}</div>
      </div>
    </a>
  );
}

/* ─── Revenue Leakage widget ──────────────────────────────────── */
function RevenueLeakageWidget({ data }: { data: RevenueLeakagePayload }) {
  if (
    data.missedAppointments === 0 &&
    data.pendingFollowups === 0 &&
    data.pendingFees === 0 &&
    data.inactiveCustomers === 0 &&
    data.unansweredLeads === 0
  ) {
    return null;
  }
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Revenue Leakage</div>
          <div className="mt-0.5 text-[20px] font-bold text-red-700">
            ~{formatInrFromCents(data.estimatedLossCents)} at risk
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
        {data.missedAppointments > 0 && (
          <div className="rounded-xl bg-white/80 px-2.5 py-2">
            <span className="font-bold text-zinc-900">{data.missedAppointments}</span> missed appts
          </div>
        )}
        {data.pendingFollowups > 0 && (
          <div className="rounded-xl bg-white/80 px-2.5 py-2">
            <span className="font-bold text-zinc-900">{data.pendingFollowups}</span> follow-ups
          </div>
        )}
        {data.pendingFees > 0 && (
          <div className="rounded-xl bg-white/80 px-2.5 py-2">
            <span className="font-bold text-zinc-900">{data.pendingFees}</span> fees pending
          </div>
        )}
        {data.inactiveCustomers > 0 && (
          <div className="rounded-xl bg-white/80 px-2.5 py-2">
            <span className="font-bold text-zinc-900">{data.inactiveCustomers}</span> inactive
          </div>
        )}
      </div>
      {data.actions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {data.actions.slice(0, 2).map((a) => (
            <a
              key={a.key}
              href={a.href}
              className="rounded-xl bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white"
            >
              {a.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
function HealthScoreWidget({ score, level, actions }: HealthPayload) {
  const styles = LEVEL_STYLES[level];
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Business Health</div>
          <div className={`mt-0.5 text-[22px] font-bold ${styles.textClass}`}>{score}/100</div>
          <div className={`text-[12px] font-semibold ${styles.textClass}`}>{LEVEL_LABELS[level]}</div>
        </div>
        <div className="relative h-16 w-16">
          <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f4f4f5" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke={styles.stroke}
              strokeWidth="3"
              strokeDasharray={`${score} 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Star className={`h-6 w-6 ${styles.iconClass}`} />
          </div>
        </div>
      </div>
      {actions.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {actions.slice(0, 2).map((a) => (
            <a
              key={a.key}
              href={a.href}
              className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2 text-[12px] font-semibold text-zinc-700 hover:bg-zinc-100"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              {a.label}
              <ChevronRight className="ml-auto h-3 w-3 text-zinc-400" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── HubDashboard ──────────────────────────────────────────────── */
export function HubDashboard() {
  const token = useMemo(() => (typeof window === "undefined" ? null : localStorage.getItem("token")), []);
  const [ui, setUi] = useState<UiConfig | null>(null);
  const [wa, setWa] = useState<WaStatus | null>(null);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [leakage, setLeakage] = useState<RevenueLeakagePayload | null>(null);
  const [coaching, setCoaching] = useState<CoachingSnapshot | null>(null);
  const [quick, setQuick] = useState<QuickReply[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [meUser, setMeUser] = useState<{
    name?: string | null;
    username?: string | null;
    role?: string;
  } | null>(null);
  const [businessLabel, setBusinessLabel] = useState("");

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  const api = useCallback(
    async (path: string, init?: RequestInit) => {
      if (!token) throw new Error("Please login");
      const res = await fetch(`${apiBase()}${path}`, {
        ...init,
        headers: { ...(init?.headers ?? {}), authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { message?: string })?.message ?? "Request failed");
      return data;
    },
    [token],
  );

  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        const [meRes, cfg, s, dash, qr, , healthRes, leakageRes, coachingRes] = await Promise.all([
          api("/me").catch(() => null),
          api("/me/ui"),
          api("/whatsapp/status").catch(() => null),
          api("/hub/dashboard"),
          api("/hub/quick-replies").catch(() => []),
          api("/staff").catch(() => []),
          api("/hub/health").catch(() => null),
          api("/hub/revenue-leakage").catch(() => null),
          api("/hub/coaching-snapshot").catch(() => null),
        ]);

        const me = meRes as {
          user?: { name?: string | null; username?: string | null; role?: string };
          business?: { categoryKey?: string | null; name?: string | null };
        } | null;
        setCategoryKey(me?.business?.categoryKey ?? null);
        if (me?.user) {
          setMeUser({ name: me.user.name, username: me.user.username, role: me.user.role });
        }
        setBusinessLabel(me?.business?.name?.trim() || "");
        setUi(cfg as UiConfig);
        setWa((s as WaStatus) ?? null);
        setDashboard(dash as DashboardPayload);
        setQuick((qr as QuickReply[]) ?? []);
        setHealth((healthRes as HealthPayload) ?? null);
        setLeakage((leakageRes as RevenueLeakagePayload) ?? null);
        const cat = me?.business?.categoryKey ?? null;
        setCoaching(cat === "coaching" ? ((coachingRes as CoachingSnapshot) ?? null) : null);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed");
        setUi({ ok: false });
      }
    })();
  }, [api]);

  useEffect(() => {
    if (typeof window === "undefined" || !dashboard?.suggestion) return;
    setSuggestionDismissed(localStorage.getItem(suggestionDismissKey(dashboard.suggestion.id)) === "1");
  }, [dashboard?.suggestion]);

  const refreshUiConfig = useCallback(async () => {
    const cfg = (await api("/me/ui")) as UiConfig;
    setUi(cfg);
  }, [api]);

  const bookingUrl = useMemo(() => {
    const o = origin || (typeof window !== "undefined" ? window.location.origin : "");
    if (!o || !ui?.ok || !ui.slug) return "";
    return `${o}/${ui.slug}`;
  }, [origin, ui]);

  const showWhatsAppConnect = ui?.ok && ui.modules.includes("whatsapp-connect");

  const greetingName = useMemo(() => {
    const rawName = meUser?.name?.trim();
    if (rawName) {
      const first = rawName.split(/\s+/).find(Boolean);
      if (first) return first;
    }
    const rawU = meUser?.username?.trim();
    if (rawU) {
      const spaced = rawU.replace(/[._-]+/g, " ").trim();
      if (spaced) return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
    }
    const dn = dashboard?.displayName?.trim();
    if (dn && dn.toLowerCase() !== "there") return dn;
    return "there";
  }, [meUser, dashboard?.displayName]);

  function dismissSuggestion(id: string) {
    localStorage.setItem(suggestionDismissKey(id), "1");
    setSuggestionDismissed(true);
  }

  if (!dashboard && !err) {
    return <DashboardSkeleton />;
  }

  if (!dashboard && err) {
    return (
      <div className="px-4 py-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-[13px] text-red-800">{err}</div>
      </div>
    );
  }

  const d = dashboard!;
  const today = todayISO();
  const sug = d.suggestion && !suggestionDismissed ? d.suggestion : null;
  const waConnected = (wa?.status ?? "").toUpperCase() === "CONNECTED";
  const greeting = getGreeting(categoryKey, greetingName);

  return (
    <div className="px-4 pb-8 pt-4">
      {/* 1. Header — greeting + WA status badge */}
      <div className="animate-slide-up flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-zinc-900">{greeting.title}</h1>
          <p className="mt-0.5 text-[13px] font-medium text-zinc-500">{greeting.subtitle}</p>
          <p className="mt-0.5 text-[12px] capitalize text-zinc-400">{d.dateLabel}</p>
        </div>
        <div className="shrink-0 pt-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              waConnected ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-500"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${waConnected ? "bg-emerald-500" : "bg-zinc-400"}`}
            />
            {waConnected ? "WA Live" : "WA Off"}
          </span>
        </div>
      </div>

      {err ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">{err}</div>
      ) : null}

      {/* 2. Today Workspace — actionable cards */}
      <section className="mt-5">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">Today Workspace</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <WorkspaceCard
            label="Today's Bookings"
            count={d.stats.bookingsToday}
            sub="tap to view"
            href={`/app/bookings?date=${encodeURIComponent(today)}&view=day`}
            accent="text-emerald-600"
          />
          <WorkspaceCard
            label="Pending Confirm"
            count={d.stats.pendingConfirmations}
            sub="need action"
            href="/app/bookings?view=list&status=PENDING"
            accent="text-amber-600"
            urgent={d.stats.pendingConfirmations > 0}
          />
          <WorkspaceCard
            label="Pending Payments"
            count={d.stats.pendingPayments ?? 0}
            sub="to verify"
            href="/app/payments"
            accent="text-orange-600"
            urgent={(d.stats.pendingPayments ?? 0) > 0}
          />
          <WorkspaceCard
            label="Follow-ups Due"
            count={d.stats.followUpsDue ?? 0}
            sub="leads waiting"
            href="/app/leads"
            accent="text-blue-600"
            urgent={(d.stats.followUpsDue ?? 0) > 0}
          />
          <WorkspaceCard
            label="Missed Customers"
            count={d.stats.missedCustomers ?? 0}
            sub="30+ days inactive"
            href="/app/customers?filter=inactive"
            accent="text-zinc-700"
            urgent={(d.stats.missedCustomers ?? 0) > 0}
          />
          <WorkspaceCard
            label="Staff Available"
            count={d.stats.staffAvailable ?? 0}
            sub="ready today"
            href="/app/staff"
            accent="text-emerald-700"
          />
        </div>
      </section>

      {/* Coaching KPIs — only for coaching category */}
      {categoryKey === "coaching" && coaching ? (
        <section className="mt-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">Coaching Today</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <WorkspaceCard label="Students" count={coaching.totalStudents} sub="active" href="/app/students" accent="text-blue-600" />
            <WorkspaceCard label="Fees Due" count={coaching.feesDue} sub={formatInrFromCents(coaching.feesDueCents)} href="/app/fees" accent="text-red-600" urgent={coaching.feesDue > 0} />
            <WorkspaceCard label="Attendance" count={coaching.attendancePct != null ? `${coaching.attendancePct}%` : "—"} sub="today" href="/app/students" accent="text-emerald-600" />
            <WorkspaceCard label="New Admissions" count={coaching.newAdmissions} sub="last 30 days" href="/app/students" accent="text-purple-600" />
          </div>
        </section>
      ) : null}

      {/* Stats strip (compact) */}
      <div className="mt-5 -mx-1 flex gap-3 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <StatCard
          label="Today"
          value={d.stats.bookingsToday}
          accent="emerald"
          sub="bookings"
          href={`/app/bookings?date=${encodeURIComponent(today)}&view=day`}
        />
        <StatCard
          label="Pending"
          value={d.stats.pendingConfirmations}
          accent={d.stats.pendingConfirmations > 0 ? "amber" : "zinc"}
          sub="confirm"
          href="/app/bookings?view=list&status=PENDING"
        />
        <StatCard
          label="Revenue"
          value={formatInrFromCents(d.stats.revenueTodayCents)}
          accent="zinc"
          sub="today"
          href="/app/payments"
        />
        <StatCard
          label="Slots"
          value={d.stats.freeSlotsApprox != null ? d.stats.freeSlotsApprox : "—"}
          accent="blue"
          sub="approx. free"
          href={`/app/bookings?date=${encodeURIComponent(today)}&view=day`}
        />
      </div>

      {/* 3. Health Score widget */}
      {health ? (
        <div className="mt-5">
          <HealthScoreWidget {...health} />
        </div>
      ) : null}

      {/* 4. Revenue Leakage widget */}
      {leakage ? (
        <div className="mt-4">
          <RevenueLeakageWidget data={leakage} />
        </div>
      ) : null}

      {/* 5. Today's schedule */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-zinc-900">Today&apos;s schedule</h2>
          <a
            href={`/app/bookings?date=${encodeURIComponent(today)}&view=day`}
            className="text-[12px] font-semibold text-emerald-700"
          >
            Calendar
          </a>
        </div>

        {d.schedule.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-zinc-100 bg-white">
            <EmptyState
              icon="calendar"
              title="आज कोई बुकिंग नहीं"
              description="Booking link share करें या नई बुकिंग add करें।"
              action={
                <a
                  href="/app/bookings?new=1"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-[13px] font-semibold text-white"
                >
                  Add booking
                </a>
              }
            />
          </div>
        ) : (
          <ul className="mt-3 grid gap-2">
            {d.schedule.map((row) => {
              const st = appointmentBadgeStatus(row.status);
              const lineThrough = st === "cancelled" || st === "no_show";
              return (
                <li key={row.id}>
                  <a
                    href={`/app/bookings?date=${encodeURIComponent(today)}&view=day`}
                    className={`block rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm transition hover:border-zinc-200 hover:shadow-md ${lineThrough ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 text-[13px] font-semibold tabular-nums text-zinc-500">
                            {formatTime(row.startAt)}
                          </span>
                          <span
                            className={`truncate text-[14px] font-semibold text-zinc-900 ${lineThrough ? "line-through decoration-zinc-400" : ""}`}
                          >
                            {row.customerName}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-[12px] text-zinc-600">
                          {row.serviceName}
                          {row.staffName ? ` · ${row.staffName}` : ""}
                        </div>
                        {row.phone ? (
                          <div className="mt-1 truncate text-[11px] text-zinc-400">{row.phone}</div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={st} size="sm" />
                        {row.paymentPending ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            Payment
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 5. Quick actions */}
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold text-zinc-900">Quick actions</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <a
            href="/app/bookings?new=1"
            className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 active:scale-95 tap-highlight-none"
          >
            <CalendarDays className="h-6 w-6 text-emerald-600" />
            <span className="text-center text-[12px] font-semibold leading-tight text-zinc-700">New Booking</span>
          </a>
          <a
            href="/app/customers"
            className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 active:scale-95 tap-highlight-none"
          >
            <Users className="h-6 w-6 text-blue-600" />
            <span className="text-center text-[12px] font-semibold leading-tight text-zinc-700">Customers</span>
          </a>
          <a
            href={showWhatsAppConnect ? "/app/inbox" : "/app/whatsapp"}
            className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm transition hover:border-green-200 hover:bg-green-50 active:scale-95 tap-highlight-none"
          >
            <MessageCircle className="h-6 w-6 text-green-600" />
            <span className="text-center text-[12px] font-semibold leading-tight text-zinc-700">WhatsApp</span>
          </a>
        </div>
      </section>

      {/* 6. WhatsApp Status Card */}
      {showWhatsAppConnect ? (
        <section className="mt-6">
          <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${waConnected ? "bg-emerald-100" : "bg-zinc-100"}`}>
                  <MessageCircle className={`h-5 w-5 ${waConnected ? "text-emerald-600" : "text-zinc-400"}`} />
                </div>
                <div>
                  <div className="text-[14px] font-bold text-zinc-900">
                    {waConnected ? "WhatsApp Connected" : wa?.status === "QR_REQUIRED" ? "Scan QR to Connect" : "WhatsApp Disconnected"}
                  </div>
                  <div className="text-[12px] text-zinc-500">
                    {waConnected
                      ? `${d.stats.needsReplyCount} messages need reply`
                      : "Reconnect to send automatic reminders"}
                  </div>
                </div>
              </div>
              <a
                href={waConnected ? "/app/inbox" : "/app/whatsapp"}
                className={`shrink-0 rounded-xl px-3 py-2 text-[12px] font-bold text-white ${waConnected ? "bg-zinc-900" : "bg-emerald-600"}`}
              >
                {waConnected ? "Inbox" : "Reconnect"}
              </a>
            </div>
          </div>
        </section>
      ) : null}

      {/* 7. AI suggestion card */}
      {sug ? (
        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-700" />
              <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Suggestion</div>
            </div>
            <button
              type="button"
              onClick={() => dismissSuggestion(sug.id)}
              className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              Dismiss
            </button>
          </div>
          <p className="mt-2 text-[14px] leading-snug text-zinc-800">{sug.message}</p>
          <div className="mt-3">
            <a
              href={sug.actionHref}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              {sug.actionLabel}
            </a>
          </div>
        </div>
      ) : null}

      {/* 8. Booking link panel */}
      {ui?.ok && ui.slug && bookingUrl ? (
        <BookingLinkPanel
          bookingUrl={bookingUrl}
          businessName={businessLabel}
          slug={ui.slug}
          canRegenerateSlug={meUser?.role === "BUSINESS_ADMIN" || meUser?.role === "SUPER_ADMIN"}
          api={api}
          onUiRefresh={refreshUiConfig}
        />
      ) : null}

      {/* Logout */}
      <div className="mt-8 pb-2 text-center">
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className="text-[12px] font-medium text-zinc-400 underline-offset-2 hover:text-zinc-600 hover:underline"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
