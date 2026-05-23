"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiBase } from "@/lib/api-base";
import { ChevronRight } from "lucide-react";
import { getIndustryModuleKeys, hrefForIndustryModule, INDUSTRY_MODULE_LABELS } from "@/types/industry";
import { BookingLinkPanel } from "@/components/app/booking-link-panel";
import {
  Button,
  Card,
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

type HubInbox = {
  items: Array<{
    type: "lead" | "ticket";
    id: string;
    title: string;
    subtitle: string;
    status: string;
    suggestions?: Array<{ key: string; label: string }>;
    updatedAt: string;
    assignedToStaffId?: string | null;
  }>;
};

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

type Staff = { id: string; user: { name: string | null }; title: string | null; isAvailable: boolean };

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

/** Weekday + calendar date on first line; clock time on second (stable across browsers). */
function formatHubDateTimeParts(iso: string): { dateLine: string; timeLine: string } {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return { dateLine: "", timeLine: "" };
    const dateLine = d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const timeLine = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return { dateLine, timeLine };
  } catch {
    return { dateLine: "", timeLine: "" };
  }
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

export function HubDashboard() {
  const token = useMemo(() => (typeof window === "undefined" ? null : localStorage.getItem("token")), []);
  const [ui, setUi] = useState<UiConfig | null>(null);
  const [wa, setWa] = useState<WaStatus | null>(null);
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [inbox, setInbox] = useState<HubInbox | null>(null);
  const [quick, setQuick] = useState<QuickReply[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [meUser, setMeUser] = useState<{
    name?: string | null;
    username?: string | null;
    role?: string;
  } | null>(null);
  const [businessLabel, setBusinessLabel] = useState("");
  const [nowParts, setNowParts] = useState<{ dateLine: string; timeLine: string }>({ dateLine: "", timeLine: "" });
  const [activationDismissed, setActivationDismissed] = useState(false);

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setActivationDismissed(localStorage.getItem("hub-activation-dismiss") === "1");
  }, []);

  useEffect(() => {
    const tick = () => setNowParts(formatHubDateTimeParts(new Date().toISOString()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => clearInterval(id);
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
        const [meRes, cfg, s, dash, ib, qr] = await Promise.all([
          api("/me").catch(() => null),
          api("/me/ui"),
          api("/whatsapp/status").catch(() => null),
          api("/hub/dashboard"),
          api("/hub/inbox").catch(() => ({ items: [] })),
          api("/hub/quick-replies").catch(() => []),
        ]);
        const me = meRes as {
          user?: { name?: string | null; username?: string | null; role?: string };
          business?: { categoryKey?: string | null; name?: string | null };
        } | null;
        const cat = me?.business?.categoryKey;
        setCategoryKey(cat ?? null);
        if (me?.user) {
          setMeUser({ name: me.user.name, username: me.user.username, role: me.user.role });
        }
        setBusinessLabel(me?.business?.name?.trim() || "");
        setUi(cfg as UiConfig);
        setWa((s as WaStatus) ?? null);
        setDashboard(dash as DashboardPayload | null);
        setInbox(ib as HubInbox);
        setQuick((qr as QuickReply[]) ?? []);

        const st = await api("/staff").catch(() => []);
        setStaff((st as Staff[]) ?? []);
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

  function dismissSuggestion(id: string) {
    localStorage.setItem(suggestionDismissKey(id), "1");
    setSuggestionDismissed(true);
  }

  async function refreshInbox() {
    try {
      const ib = (await api("/hub/inbox")) as HubInbox;
      setInbox(ib);
    } catch {
      /* ignore */
    }
  }

  async function quickCreateLead() {
    const phone = window.prompt("Customer phone (optional)")?.trim() || "";
    const name = window.prompt("Customer name (optional)")?.trim() || "";
    setBusy(true);
    setErr(null);
    try {
      await api("/hub/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: phone || undefined, name: name || undefined }),
      });
      await refreshInbox();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function quickCreateTicket() {
    const title = window.prompt("Ticket title (e.g. Reschedule request)")?.trim() || "";
    if (!title) return;
    setBusy(true);
    setErr(null);
    try {
      await api("/hub/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, priority: "NORMAL" }),
      });
      await refreshInbox();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function setLeadStage(id: string, stage: string) {
    setBusy(true);
    setErr(null);
    try {
      await api(`/leads/${encodeURIComponent(id)}/stage`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      await refreshInbox();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function setTicketStatus(id: string, status: string) {
    setBusy(true);
    setErr(null);
    try {
      await api(`/support/tickets/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await refreshInbox();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function assignTicket(id: string, assignedToStaffId: string) {
    setBusy(true);
    setErr(null);
    try {
      await api(`/support/tickets/${encodeURIComponent(id)}/assign`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ assignedToStaffId: assignedToStaffId === "NONE" ? null : assignedToStaffId }),
      });
      await refreshInbox();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function reloadDashboard() {
    try {
      const dash = await api("/hub/dashboard");
      setDashboard(dash as DashboardPayload);
    } catch {
      /* ignore */
    }
  }

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

  const showActivationHint =
    Boolean(ui?.ok) &&
    !activationDismissed &&
    ((showWhatsAppConnect && !waConnected) || (d.stats.bookingsToday === 0 && d.schedule.length === 0));

  return (
    <div className="px-4 pb-2 pt-4">
      {/* Greeting */}
      <div className="animate-slide-up">
        <h1 className="text-[20px] font-semibold tracking-tight text-zinc-900">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
          {greetingName}
          <span className="font-normal text-zinc-400"> 👋</span>
        </h1>
        <p className="mt-1 text-[13px] font-medium capitalize text-zinc-500">{d.dateLabel}</p>
      </div>

      {err ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">{err}</div>
      ) : null}

      {showActivationHint ? (
        <div className="mt-4 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold text-emerald-900">Almost live — finish these</p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-emerald-950/90">
                {showWhatsAppConnect && !waConnected ? (
                  <li className="flex gap-2">
                    <span className="font-bold text-emerald-600">1.</span>
                    <span>Connect WhatsApp so chats and reminders land in one place.</span>
                  </li>
                ) : null}
                {d.stats.bookingsToday === 0 && d.schedule.length === 0 ? (
                  <li className="flex gap-2">
                    <span className="font-bold text-emerald-600">{showWhatsAppConnect && !waConnected ? "2." : "1."}</span>
                    <span>Add your first booking — builds trust with your team.</span>
                  </li>
                ) : null}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                {showWhatsAppConnect && !waConnected ? (
                  <a
                    href="/app/whatsapp"
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    Connect WhatsApp
                  </a>
                ) : null}
                {d.stats.bookingsToday === 0 && d.schedule.length === 0 ? (
                  <a
                    href="/app/bookings?new=1"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-300 bg-white px-4 text-[13px] font-semibold text-emerald-900 transition hover:bg-emerald-50"
                  >
                    New booking
                  </a>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem("hub-activation-dismiss", "1");
                setActivationDismissed(true);
              }}
              className="shrink-0 text-[11px] font-semibold text-emerald-800/80 underline-offset-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {/* Stat strip */}
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

      <div className="mt-5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Workspace modules</div>
        <p className="mt-0.5 text-[11px] text-zinc-500">Based on your category — more dashboards coming soon.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {getIndustryModuleKeys(categoryKey).map((key) => (
            <a
              key={key}
              href={hrefForIndustryModule(key)}
              className="inline-flex min-h-[36px] items-center rounded-full border border-zinc-100 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-800 tap-highlight-none"
            >
              {INDUSTRY_MODULE_LABELS[key] ?? key}
            </a>
          ))}
        </div>
      </div>

      {/* AI-style suggestion */}
      {sug ? (
        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Suggestion</div>
            <button
              type="button"
              onClick={() => dismissSuggestion(sug.id)}
              className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              Dismiss
            </button>
          </div>
          <p className="mt-2 text-[14px] leading-snug text-zinc-800">{sug.message}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={sug.actionHref}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              {sug.actionLabel}
            </a>
          </div>
        </div>
      ) : null}

      {/* Today’s schedule */}
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
              title="No bookings today"
              description="Share your booking link or add one in a few taps."
              action={
                <a
                  href={`/app/bookings?date=${encodeURIComponent(today)}&view=day`}
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

      {/* WhatsApp strip */}
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-zinc-900">WhatsApp</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              waConnected ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {waConnected ? "Connected" : wa?.status ?? "Offline"}
          </span>
        </div>

        <Card className="mt-3 !p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[20px] font-semibold leading-none text-zinc-900">{d.stats.needsReplyCount}</div>
              <div className="mt-1 text-[12px] font-medium text-zinc-500">likely need a reply</div>
            </div>
            <a
              href="/app/inbox"
              className="flex h-10 shrink-0 items-center rounded-xl bg-zinc-900 px-3 text-[12px] font-semibold text-white"
            >
              Inbox
            </a>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {quick.slice(0, 8).map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard?.writeText(q.body);
                    toast.success("Copied — paste in WhatsApp");
                  } catch {
                    toast.error("Could not copy");
                  }
                }}
                className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                {q.title}
              </button>
            ))}
            {quick.length === 0 ? (
              <span className="text-[12px] text-zinc-500">Add quick replies under Templates.</span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-100 pt-3">
            {showWhatsAppConnect ? (
              <a
                href="/app/whatsapp"
                className="text-[12px] font-semibold text-emerald-700 underline-offset-2 hover:underline"
              >
                Connection &amp; QR
              </a>
            ) : null}
            <a href="/app/templates" className="text-[12px] font-semibold text-emerald-700 underline-offset-2 hover:underline">
              Manage templates
            </a>
          </div>
        </Card>
      </section>

      {/* Booking link + QR (slug changes only when an admin creates a new link) */}
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

      {/* Leads & tickets — inbox strip */}
      <details className="mt-6 group overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-950/[0.04]">
        <summary className="cursor-pointer list-none bg-gradient-to-b from-zinc-50 to-white px-3 py-2.5 [&::-webkit-details-marker]:hidden">
          <div className="flex items-start gap-2">
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-90" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold tracking-tight text-zinc-900">Leads &amp; tickets</div>
              <p className="mt-0.5 text-[10px] font-medium leading-snug text-zinc-500">
                Inbox preview — tap a row or <span className="text-zinc-700">View</span> for the full list.
              </p>
              <div className="mt-2 flex flex-col gap-0.5 border-t border-zinc-200/60 pt-2">
                <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">Current</span>
                <span className="text-[11px] font-medium leading-snug text-zinc-700">{nowParts.dateLine || "—"}</span>
                <span className="text-[11px] font-semibold tabular-nums leading-snug text-zinc-900">{nowParts.timeLine || ""}</span>
              </div>
            </div>
            <span className="shrink-0 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 group-open:hidden">
              Open
            </span>
            <span className="hidden shrink-0 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 group-open:inline">
              Close
            </span>
          </div>
        </summary>
        <div className="border-t border-zinc-100 bg-zinc-50/40 px-2.5 pb-3 pt-2.5">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-zinc-400">Quick actions</p>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="!h-8 !min-h-0 !px-2 !text-[11px] shadow-sm"
              disabled={busy}
              onClick={() => void reloadDashboard()}
            >
              Refresh hub
            </Button>
            <a
              href="/app/bookings"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-200/90 bg-white text-[11px] font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50"
            >
              New booking
            </a>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="!h-8 !min-h-0 !px-2 !text-[11px] shadow-sm"
              loading={busy}
              onClick={() => void quickCreateLead()}
            >
              Add lead
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="!h-8 !min-h-0 !px-2 !text-[11px] shadow-sm"
              loading={busy}
              onClick={() => void quickCreateTicket()}
            >
              New ticket
            </Button>
          </div>

          {!inbox ? (
            <div className="mt-3 rounded-lg border border-dashed border-zinc-200 bg-white/80 px-3 py-2 text-center text-[11px] text-zinc-500">
              Loading inbox…
            </div>
          ) : inbox.items.length === 0 ? (
            <div className="mt-3 rounded-lg border border-dashed border-zinc-200 bg-white/80 px-3 py-2 text-center text-[11px] text-zinc-600">
              No open leads or tickets.
            </div>
          ) : (
            <ul className="mt-3 grid max-h-[min(52vh,380px)] gap-2 overflow-y-auto pr-0.5">
              {inbox.items.slice(0, 12).map((it) => {
                const detailHref = it.type === "lead" ? `/app/leads#${it.id}` : `/app/support#${it.id}`;
                const assignValue =
                  it.type === "ticket" ? (it.assignedToStaffId ? it.assignedToStaffId : "NONE") : "NONE";
                const activity = formatHubDateTimeParts(it.updatedAt);
                const typeClass =
                  it.type === "lead"
                    ? "bg-emerald-50 text-emerald-900 ring-emerald-200/70"
                    : "bg-slate-100 text-slate-800 ring-slate-200/80";
                return (
                  <li
                    key={`${it.type}:${it.id}`}
                    className="rounded-lg border border-zinc-200/80 bg-white p-2.5 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={detailHref}
                        className="min-w-0 flex-1 rounded-md py-0.5 pr-1 transition hover:bg-zinc-50 tap-highlight-none"
                      >
                        <div className="truncate text-[13px] font-semibold leading-snug tracking-tight text-zinc-900">
                          {it.title}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] leading-snug text-zinc-600">{it.subtitle}</div>
                      </a>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${typeClass}`}
                      >
                        {it.type === "lead" ? "Lead" : "Ticket"}
                      </span>
                    </div>
                    <div className="mt-2 rounded-md border border-zinc-100 bg-zinc-50/80 px-2 py-1.5">
                      <div className="text-[9px] font-semibold uppercase tracking-wide text-zinc-400">Last activity</div>
                      <div className="mt-0.5 text-[11px] font-medium leading-snug text-zinc-700">{activity.dateLine}</div>
                      <div className="text-[11px] font-semibold tabular-nums leading-snug text-zinc-900">{activity.timeLine}</div>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      {it.type === "lead" ? (
                        <select
                          disabled={busy}
                          value={it.status}
                          onChange={(e) => void setLeadStage(it.id, e.target.value)}
                          className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2 text-[12px] font-semibold text-zinc-800 outline-none focus:ring-2 focus:ring-emerald-200/80"
                        >
                          {["NEW", "INTERESTED", "FOLLOW_UP", "CONVERTED", "LOST"].map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          disabled={busy}
                          value={it.status}
                          onChange={(e) => void setTicketStatus(it.id, e.target.value)}
                          className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2 text-[12px] font-semibold text-zinc-800 outline-none focus:ring-2 focus:ring-emerald-200/80"
                        >
                          {["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"].map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                      )}
                      <a
                        href={detailHref}
                        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-3 text-[12px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        View
                      </a>
                    </div>
                    {it.type === "ticket" && staff.length ? (
                      <select
                        disabled={busy}
                        value={assignValue}
                        onChange={(e) => void assignTicket(it.id, e.target.value)}
                        className="mt-2 h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-[12px] font-semibold text-zinc-800 outline-none focus:ring-2 focus:ring-emerald-200/80"
                      >
                        <option value="NONE">Assign staff…</option>
                        {staff.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.user.name ?? "Staff"}
                            {s.title ? ` · ${s.title}` : ""}
                            {!s.isAvailable ? " (off)" : ""}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </details>

      {!showWhatsAppConnect ? (
        <p className="mt-4 text-center text-[11px] text-zinc-400">WhatsApp setup is managed by your admin.</p>
      ) : null}
    </div>
  );
}
