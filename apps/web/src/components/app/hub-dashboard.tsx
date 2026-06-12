"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
import { DarbhangaLaunchStrip } from "@/components/app/darbhanga-launch-strip";
import { ManualWhatsAppButton } from "@/components/app/manual-whatsapp-button";
import { VerticalDemoStrip } from "@/components/app/vertical-demo-strip";
import { useWhatsAppLink } from "@/hooks/use-whatsapp-link";
import { packByKey } from "@/lib/darbhanga-pack";
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
      categoryKey?: string | null;
      focusedMode?: boolean;
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

type ClinicSnapshot = {
  patientsToday: number;
  noShowToday: number;
  followUpsDue: number;
  waitingCount: number;
  revenueTodayCents: number;
};

type PlanInfo = {
  effectivePlan: string;
  features: string[];
  usage: { customers: number; staff: number; bookingsThisMonth: number };
  limits: { maxStaff: number | null; maxCustomers: number | null; maxBookingsPerMonth: number | null };
};

type InboxItem =
  | { type: "lead"; id: string; title: string; subtitle: string; updatedAt: string }
  | { type: "ticket"; id: string; title: string; subtitle: string; updatedAt: string };

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

function hubGreeting(
  t: (key: string, values?: Record<string, string>) => string,
  categoryKey: string | null,
  displayName: string,
): { title: string; subtitle: string } {
  if (categoryKey === "clinic") {
    return { title: t("greetingClinic", { name: displayName }), subtitle: t("greetingClinicSub") };
  }
  if (categoryKey === "coaching") {
    return { title: t("greetingCoaching", { name: displayName }), subtitle: t("greetingCoachingSub") };
  }
  if (categoryKey === "salon" || categoryKey === "spa" || categoryKey === "home_service") {
    return { title: t("greetingSalon", { name: displayName }), subtitle: t("greetingSalonSub") };
  }
  return { title: t("greetingDefault", { name: displayName }), subtitle: t("greetingDefaultSub") };
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
  const th = useTranslations("hub");
  const token = useMemo(() => (typeof window === "undefined" ? null : localStorage.getItem("token")), []);
  const [ui, setUi] = useState<UiConfig | null>(null);
  const [wa, setWa] = useState<WaStatus | null>(null);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [leakage, setLeakage] = useState<RevenueLeakagePayload | null>(null);
  const [coaching, setCoaching] = useState<CoachingSnapshot | null>(null);
  const [clinic, setClinic] = useState<ClinicSnapshot | null>(null);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
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
  const [launchMode, setLaunchMode] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [packLabel, setPackLabel] = useState("WhatsApp Pack");
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [focusedMode, setFocusedMode] = useState(false);
  const { showManualFallback, openBookingConfirm } = useWhatsAppLink();

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("launch") === "1";
    const fromStorage = localStorage.getItem("darbhangaLaunch") === "1";
    const dismissed = localStorage.getItem("darbhangaLaunchDismissed") === "1";
    if ((fromUrl || fromStorage) && !dismissed) {
      setLaunchMode(true);
      if (fromUrl) localStorage.setItem("darbhangaLaunch", "1");
    }
    const storedPack = localStorage.getItem("darbhangaPack");
    const label =
      packByKey(storedPack)?.titleHi ??
      packByKey(localStorage.getItem("darbhangaPack"))?.titleHi;
    if (label) setPackLabel(label);
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
        const [meRes, cfg, s, dash, qr, , healthRes, leakageRes, coachingRes, clinicRes, inboxRes, planRes] = await Promise.all([
          api("/me").catch(() => null),
          api("/me/ui"),
          api("/whatsapp/status").catch(() => null),
          api("/hub/dashboard"),
          api("/hub/quick-replies").catch(() => []),
          api("/staff").catch(() => []),
          api("/hub/health").catch(() => null),
          api("/hub/revenue-leakage").catch(() => null),
          api("/hub/coaching-snapshot").catch(() => null),
          api("/hub/clinic-snapshot").catch(() => null),
          api("/hub/inbox").catch(() => ({ items: [] })),
          api("/plans/me").catch(() => null),
        ]);

        const me = meRes as {
          user?: { name?: string | null; username?: string | null; role?: string };
          business?: { categoryKey?: string | null; name?: string | null };
        } | null;
        setCategoryKey(me?.business?.categoryKey ?? null);
        const catKey = me?.business?.categoryKey ?? null;
        const storedPack = typeof window !== "undefined" ? localStorage.getItem("darbhangaPack") : null;
        setPackLabel(
          packByKey(storedPack)?.titleHi ??
            packByKey(catKey ?? undefined)?.titleHi ??
            "WhatsApp Pack",
        );
        if (me?.user) {
          setMeUser({ name: me.user.name, username: me.user.username, role: me.user.role });
        }
        setBusinessLabel(me?.business?.name?.trim() || "");
        const uiCfg = cfg as UiConfig;
        setUi(uiCfg);
        setFocusedMode(uiCfg.ok ? Boolean(uiCfg.focusedMode) : false);
        setWa((s as WaStatus) ?? null);
        setDashboard(dash as DashboardPayload);
        setQuick((qr as QuickReply[]) ?? []);
        setHealth((healthRes as HealthPayload) ?? null);
        setLeakage((leakageRes as RevenueLeakagePayload) ?? null);
        const cat = me?.business?.categoryKey ?? null;
        setCoaching(cat === "coaching" ? ((coachingRes as CoachingSnapshot) ?? null) : null);
        setClinic(cat === "clinic" ? ((clinicRes as ClinicSnapshot) ?? null) : null);
        const inbox = inboxRes as { items?: InboxItem[] };
        setInboxItems((inbox?.items ?? []).slice(0, 6));
        const p = planRes as PlanInfo | null;
        if (p?.effectivePlan) {
          setPlan({
            effectivePlan: p.effectivePlan,
            features: p.features ?? [],
            usage: p.usage ?? { customers: 0, staff: 0, bookingsThisMonth: 0 },
            limits: p.limits ?? { maxStaff: null, maxCustomers: null, maxBookingsPerMonth: null },
          });
        }
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
  const greeting = hubGreeting(th, categoryKey, greetingName);

  function dismissLaunchMode() {
    localStorage.setItem("darbhangaLaunchDismissed", "1");
    setLaunchMode(false);
  }

  function copyBookingLink() {
    if (!bookingUrl) return;
    void navigator.clipboard.writeText(bookingUrl).then(
      () => toast.success(th("linkCopied")),
      () => toast.error("Copy nahi hua"),
    );
  }

  const showHealthInLaunch =
    !launchMode || (health != null && (health.level === "needs_attention" || health.level === "critical"));
  const hasLeakage =
    leakage != null &&
    (leakage.missedAppointments > 0 ||
      leakage.pendingFollowups > 0 ||
      leakage.pendingFees > 0 ||
      leakage.inactiveCustomers > 0 ||
      leakage.unansweredLeads > 0);

  const isFocusedVertical = focusedMode && (categoryKey === "clinic" || categoryKey === "coaching" || categoryKey === "salon");

  return (
    <div className="pb-8 pt-4">
      {/* 1. Header */}
      <div className="animate-slide-up">
        <h1 className="text-[20px] font-semibold tracking-tight text-zinc-900">{greeting.title}</h1>
        <p className="mt-0.5 text-[13px] font-medium text-zinc-500">{greeting.subtitle}</p>
        <p className="mt-0.5 text-[12px] capitalize text-zinc-400">{d.dateLabel}</p>
      </div>

      {err ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">{err}</div>
      ) : null}

      {isFocusedVertical ? (
        <VerticalDemoStrip categoryKey={categoryKey} bookingSlug={ui?.ok ? ui.slug : null} />
      ) : null}

      {isFocusedVertical && ui?.ok && ui.slug && bookingUrl ? (
        <div className="mt-4">
          <BookingLinkPanel
            bookingUrl={bookingUrl}
            businessName={businessLabel}
            slug={ui.slug}
            canRegenerateSlug={meUser?.role === "BUSINESS_ADMIN" || meUser?.role === "SUPER_ADMIN"}
            api={api}
            onUiRefresh={refreshUiConfig}
          />
        </div>
      ) : null}

      {!isFocusedVertical && !waConnected ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">💬</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-amber-900">{th("waConnectTitle")}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-amber-800">{th("waConnectSub")}</p>
            </div>
            <a
              href="/app/whatsapp"
              className="shrink-0 rounded-lg bg-amber-900 px-3 py-2 text-[12px] font-bold text-white"
            >
              {th("waConnectCta")}
            </a>
          </div>
        </div>
      ) : null}

      {launchMode ? (
        <div className="mt-4">
          <DarbhangaLaunchStrip
            packLabel={packLabel}
            waConnected={waConnected}
            bookingUrl={bookingUrl}
            onCopyLink={copyBookingLink}
            onDismiss={dismissLaunchMode}
          />
        </div>
      ) : null}

      {launchMode && ui?.ok && ui.slug && bookingUrl ? (
        <div className="mt-4">
          <BookingLinkPanel
            bookingUrl={bookingUrl}
            businessName={businessLabel}
            slug={ui.slug}
            canRegenerateSlug={meUser?.role === "BUSINESS_ADMIN" || meUser?.role === "SUPER_ADMIN"}
            api={api}
            onUiRefresh={refreshUiConfig}
          />
        </div>
      ) : null}

      {isFocusedVertical ? (
        <section className="mt-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">Today at a glance</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
            {categoryKey === "clinic" && clinic ? (
              <>
                <WorkspaceCard label="In queue" count={clinic.waitingCount} sub="waiting" href="/app/queue" accent="text-blue-600" urgent={clinic.waitingCount > 0} />
                <WorkspaceCard label="Patients" count={clinic.patientsToday} sub="today" href="/app/queue" accent="text-emerald-600" />
                <WorkspaceCard label="Bookings" count={d.stats.bookingsToday} sub="scheduled" href="/app/bookings" accent="text-zinc-700" />
              </>
            ) : null}
            {categoryKey === "coaching" && coaching ? (
              <>
                <WorkspaceCard label="Students" count={coaching.totalStudents} sub="active" href="/app/students" accent="text-blue-600" />
                <WorkspaceCard label="Fees due" count={coaching.feesDue} sub={formatInrFromCents(coaching.feesDueCents)} href="/app/coaching/fees" accent="text-red-600" urgent={coaching.feesDue > 0} />
                <WorkspaceCard label="Matrix" count="→" sub="batches" href="/app/coaching/matrix" accent="text-purple-600" />
              </>
            ) : null}
            {categoryKey === "salon" ? (
              <>
                <WorkspaceCard label="Bookings" count={d.stats.bookingsToday} sub="today" href="/app/bookings" accent="text-emerald-600" />
                <WorkspaceCard label="Pending" count={d.stats.pendingConfirmations} sub="confirm" href="/app/bookings?view=list&status=PENDING" accent="text-amber-600" urgent={d.stats.pendingConfirmations > 0} />
                <WorkspaceCard label="Customers" count="→" sub="CRM" href="/app/customers" accent="text-blue-600" />
              </>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* 2. Today Workspace — simplified in launch mode */}
      {!isFocusedVertical && launchMode && !showAdvanced ? (
        <section className="mt-5">
          <div className="grid grid-cols-3 gap-2">
            <WorkspaceCard
              label="Aaj"
              count={d.stats.bookingsToday}
              sub="booking"
              href={`/app/bookings?date=${encodeURIComponent(today)}&view=day`}
              accent="text-emerald-600"
            />
            <WorkspaceCard
              label="Pending"
              count={d.stats.pendingConfirmations}
              sub="confirm"
              href="/app/bookings?view=list&status=PENDING"
              accent="text-amber-600"
              urgent={d.stats.pendingConfirmations > 0}
            />
            <WorkspaceCard
              label="Customers"
              count="→"
              sub="list dekho"
              href="/app/customers"
              accent="text-blue-600"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced(true)}
            className="mt-3 w-full rounded-xl border border-dashed border-zinc-200 py-2.5 text-[12px] font-semibold text-zinc-500"
          >
            और features देखें ↓
          </button>
        </section>
      ) : (
        <section className="mt-5">
          {launchMode ? (
            <button
              type="button"
              onClick={() => setShowAdvanced(false)}
              className="mb-2 text-[12px] font-semibold text-zinc-400"
            >
              ↑ Simple view
            </button>
          ) : null}
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">Today Workspace</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
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
            {(d.stats.noShowToday ?? 0) > 0 ? (
              <WorkspaceCard
                label="No-shows Today"
                count={d.stats.noShowToday ?? 0}
                sub="follow up"
                href="/app/bookings?view=list&status=NO_SHOW"
                accent="text-red-600"
                urgent
              />
            ) : null}
          </div>
        </section>
      )}

      {/* Clinic KPIs — only for clinic category (hidden in simple launch mode) */}
      {!isFocusedVertical && (!launchMode || showAdvanced) && categoryKey === "clinic" && clinic ? (
        <section className="mt-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">Clinic Today</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            <WorkspaceCard label="Patients" count={clinic.patientsToday} sub="today" href="/app/queue" accent="text-blue-600" />
            <WorkspaceCard label="In Queue" count={clinic.waitingCount} sub="waiting" href="/app/queue" accent="text-emerald-600" urgent={clinic.waitingCount > 0} />
            <WorkspaceCard label="Follow-ups" count={clinic.followUpsDue} sub="due" href="/app/leads" accent="text-amber-600" urgent={clinic.followUpsDue > 0} />
            <WorkspaceCard label="Revenue" count={formatInrFromCents(clinic.revenueTodayCents)} sub="today" href="/app/payments" accent="text-zinc-700" />
          </div>
        </section>
      ) : null}

      {/* Coaching KPIs — only for coaching category (hidden in simple launch mode) */}
      {!isFocusedVertical && (!launchMode || showAdvanced) && categoryKey === "coaching" && coaching ? (
        <section className="mt-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">Coaching Today</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            <WorkspaceCard label="Students" count={coaching.totalStudents} sub="active" href="/app/students" accent="text-blue-600" />
            <WorkspaceCard label="Fees Due" count={coaching.feesDue} sub={formatInrFromCents(coaching.feesDueCents)} href="/app/coaching/fees" accent="text-red-600" urgent={coaching.feesDue > 0} />
            <WorkspaceCard label="Attendance" count={coaching.attendancePct != null ? `${coaching.attendancePct}%` : "—"} sub="today" href="/app/coaching/attendance" accent="text-emerald-600" />
            <WorkspaceCard label="Academic Matrix" count="→" sub="streams & batches" href="/app/coaching/matrix" accent="text-purple-600" />
          </div>
        </section>
      ) : null}

      {/* Leads & tickets strip */}
      {!isFocusedVertical && inboxItems.length > 0 ? (
        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-400">Leads & Tickets</h2>
            <a href="/app/leads" className="text-[12px] font-semibold text-emerald-700">
              View all
            </a>
          </div>
          <ul className="mt-2 grid gap-2">
            {inboxItems.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <a
                  href={item.type === "lead" ? "/app/leads" : "/app/support"}
                  className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold text-zinc-900">{item.title}</div>
                    <div className="truncate text-[12px] text-zinc-500">{item.subtitle}</div>
                  </div>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-600">
                    {item.type}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Stats strip (compact) — hidden in launch simple mode */}
      {(!launchMode || showAdvanced) ? (
      <div className="mt-5 -mx-1 flex gap-3 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <StatCard
          label={th("kpiBookings")}
          value={d.stats.bookingsToday}
          accent="emerald"
          sub="bookings"
          href={`/app/bookings?date=${encodeURIComponent(today)}&view=day`}
        />
        <StatCard
          label={th("kpiPending")}
          value={d.stats.pendingConfirmations}
          accent={d.stats.pendingConfirmations > 0 ? "amber" : "zinc"}
          sub="confirm"
          href="/app/bookings?view=list&status=PENDING"
        />
        <StatCard
          label={th("kpiRevenue")}
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
      ) : null}

      {/* 3. Health Score widget */}
      {health && showHealthInLaunch ? (
        <div className="mt-5">
          <HealthScoreWidget {...health} />
        </div>
      ) : null}
      {leakage && (!launchMode || hasLeakage) ? (
        <div className="mt-4">
          <RevenueLeakageWidget data={leakage} />
        </div>
      ) : null}

      {/* Quick replies */}
      {quick.length > 0 ? (
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-zinc-900">Quick replies</h2>
            <a href="/app/templates" className="text-[12px] font-semibold text-emerald-700">
              Manage
            </a>
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {quick.slice(0, 6).map((q) => (
              <a
                key={q.id}
                href="/app/templates"
                className="shrink-0 rounded-xl border border-zinc-100 bg-white px-3 py-2 text-[12px] font-semibold text-zinc-700"
              >
                {q.title}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {/* 5. Today's schedule */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-zinc-900">{th("scheduleTitle")}</h2>
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
              title={th("noBookings")}
              description={th("noBookingsDesc")}
              action={
                <a
                  href="/app/bookings?new=1"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-[13px] font-semibold text-white"
                >
                  {th("addBooking")}
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
                <li key={row.id} className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
                  <a
                    href={`/app/bookings?date=${encodeURIComponent(today)}&view=day`}
                    className={`block p-3 transition hover:bg-zinc-50 ${lineThrough ? "opacity-70" : ""}`}
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
                  {showManualFallback &&
                  row.phone &&
                  (row.status === "PENDING" || row.status === "CONFIRMED") ? (
                    <div className="border-t border-zinc-100 px-3 py-2">
                      <ManualWhatsAppButton
                        label="Send booking WhatsApp"
                        size="md"
                        className="w-full"
                        onClick={() => openBookingConfirm(row.phone!, row.serviceName)}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 5. Quick actions */}
      <section className="mt-6">
        <h2 className="text-[15px] font-semibold text-zinc-900">Quick actions</h2>
        <div className="mt-3 grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
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
            href="/app/whatsapp"
            className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm transition hover:border-green-200 hover:bg-green-50 active:scale-95 tap-highlight-none"
          >
            <MessageCircle className={`h-6 w-6 ${waConnected ? "text-emerald-600" : "text-red-500"}`} />
            <span className="text-center text-[12px] font-semibold leading-tight text-zinc-700">
              {waConnected ? th("waLinked") : th("waLinkPhone")}
            </span>
          </a>
        </div>
      </section>

      {/* 6. AI suggestion card */}
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

      {/* 8. Booking link panel — top in launch mode, bottom otherwise */}
      {!launchMode && ui?.ok && ui.slug && bookingUrl ? (
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
