"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiBase } from "@/lib/api-base";
import { BookingCalendar } from "@/components/app/booking-calendar";
import { NewBookingSheet } from "@/components/app/new-booking-sheet";
import {
  BookingCardSkeleton,
  Button,
  Card,
  EmptyState,
  StatusBadge,
} from "@/components/ui";

type Customer = { id: string; name: string | null; phone: string | null };
type Service = { id: string; name: string; durationMin: number };
type Staff = { user: { name: string | null } } | null;

type Booking = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  startAt: string;
  endAt: string;
  cancelReason?: string | null;
  customer: Customer;
  service: Service;
  staff?: Staff;
};

const BOOKING_STATUSES = new Set<Booking["status"]>(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]);

type DayAppointment = Booking;

type DayResponse = {
  date: string;
  isHoliday?: boolean;
  hours: { isClosed: boolean; startMin: number; endMin: number };
  appointments: DayAppointment[];
};

type TimelineRow =
  | { kind: "free"; startMin: number; endMin: number }
  | { kind: "booking"; booking: DayAppointment };

function padDate(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function todayISO() {
  const n = new Date();
  return padDate(n.getFullYear(), n.getMonth() + 1, n.getDate());
}

function shiftDateISO(iso: string, deltaDays: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + deltaDays);
  return padDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

function addMonthsForCalendar(y: number, m: number, delta: number) {
  const d = new Date(y, m - 1 + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
}

function formatSlotTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatMinLabel(mins: number) {
  const h = Math.floor(mins / 60);
  const mi = mins % 60;
  const d = new Date(2000, 0, 1, h, mi);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDayTitle(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function minutesClock(iso: string) {
  const t = new Date(iso);
  return t.getHours() * 60 + t.getMinutes();
}

function buildTimeline(dateISO: string, workStartMin: number, workEndMin: number, appointments: DayAppointment[]): TimelineRow[] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!m) return [];
  const y = +m[1];
  const mo = +m[2];
  const d = +m[3];
  const dayStart = new Date(y, mo - 1, d, 0, 0, 0, 0).getTime();
  const dayEnd = new Date(y, mo - 1, d, 23, 59, 59, 999).getTime();

  const clipToDayMins = (iso: string, end: boolean) => {
    const t = new Date(iso).getTime();
    const c = Math.min(Math.max(t, dayStart), dayEnd);
    const dt = new Date(c);
    let mins = dt.getHours() * 60 + dt.getMinutes();
    mins = Math.max(workStartMin, Math.min(workEndMin, mins));
    if (end && new Date(iso).getTime() >= dayEnd) mins = workEndMin;
    return mins;
  };

  const sorted = [...appointments].sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
  const rows: TimelineRow[] = [];
  let cursor = workStartMin;

  for (const b of sorted) {
    const bStart = clipToDayMins(b.startAt, false);
    let bEnd = Math.max(bStart + 5, clipToDayMins(b.endAt, true));
    bEnd = Math.min(workEndMin, Math.max(workStartMin, bEnd));
    const bs = Math.min(Math.max(bStart, workStartMin), workEndMin);

    if (bs >= workEndMin || bEnd <= workStartMin) continue;

    if (cursor < bs) {
      rows.push({ kind: "free", startMin: cursor, endMin: bs });
    }
    rows.push({ kind: "booking", booking: b });
    cursor = Math.max(cursor, bEnd);
  }
  if (cursor < workEndMin) {
    rows.push({ kind: "free", startMin: cursor, endMin: workEndMin });
  }
  return rows;
}

function badgeStatus(s: Booking["status"]): "confirmed" | "pending" | "cancelled" | "completed" | "no_show" {
  const u = s.toLowerCase();
  if (u === "confirmed") return "confirmed";
  if (u === "pending") return "pending";
  if (u === "cancelled") return "cancelled";
  if (u === "completed") return "completed";
  if (u === "no_show") return "no_show";
  return "pending";
}

async function api(path: string, init?: RequestInit) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Please login");
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { ...(init?.headers ?? {}), authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { message?: string })?.message ?? "Request failed");
  return data;
}

export default function BookingsPage() {
  const searchParams = useSearchParams();
  const [view, setView] = useState<"day" | "list">("day");
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [listStatusFilter, setListStatusFilter] = useState<Booking["status"] | "ALL">("ALL");
  const [dayData, setDayData] = useState<DayResponse | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDefaultCustomerId, setSheetDefaultCustomerId] = useState<string | undefined>();
  const [holidays, setHolidays] = useState<{ dateISO: string }[]>([]);
  const [services, setServices] = useState<{ id: string; name: string; isActive?: boolean }[]>([]);
  const [slotsPreview, setSlotsPreview] = useState<{ startAt: string }[]>([]);
  const [me, setMe] = useState<{ ok: boolean; user?: { role: string } } | null>(null);
  const [calendarStart, setCalendarStart] = useState(() => {
    const n = new Date();
    return { y: n.getFullYear(), m: n.getMonth() + 1 };
  });
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [holidayName, setHolidayName] = useState("");
  const [cancelBookingsOnHoliday, setCancelBookingsOnHoliday] = useState(true);
  const [holidaySaving, setHolidaySaving] = useState(false);

  const commitSelectedDate = useCallback((iso: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return;
    setSelectedDate(iso);
    setCalendarStart((prev) => {
      const y = Number(iso.slice(0, 4));
      const mo = Number(iso.slice(5, 7));
      const second = addMonthsForCalendar(prev.y, prev.m, 1);
      const inFirst = y === prev.y && mo === prev.m;
      const inSecond = y === second.y && mo === second.m;
      if (inFirst || inSecond) return prev;
      return { y, m: mo };
    });
  }, []);

  const loadDay = useCallback(async () => {
    const data = (await api(`/appointments/day?date=${encodeURIComponent(selectedDate)}`)) as DayResponse;
    setDayData(data);
  }, [selectedDate]);

  const loadUpcoming = useCallback(async () => {
    const up = (await api("/appointments/upcoming")) as Booking[];
    setBookings(up);
  }, []);

  const loadAll = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [h, svc] = await Promise.all([
        api("/settings/holidays").catch(() => []),
        api("/services").catch(() => []),
      ]);
      setHolidays(Array.isArray(h) ? (h as { dateISO: string }[]) : []);
      setServices(
        Array.isArray(svc)
          ? (svc as { id: string; name: string; isActive?: boolean }[]).filter((x) => x.isActive !== false)
          : [],
      );
      await Promise.all([loadDay(), loadUpcoming()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }, [loadDay, loadUpcoming]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadAll();
    });
  }, [loadAll]);

  useEffect(() => {
    queueMicrotask(() => {
      void api("/me")
        .then((r) => setMe(r as { ok: boolean; user?: { role: string } }))
        .catch(() => setMe({ ok: false }));
    });
  }, []);

  const firstServiceId = services[0]?.id;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      if (!firstServiceId || !dayData || dayData.isHoliday || dayData.hours.isClosed) {
        setSlotsPreview([]);
        return;
      }
      try {
        const rows = (await api(
          `/appointments/slots?serviceId=${encodeURIComponent(firstServiceId)}&date=${encodeURIComponent(selectedDate)}`,
        )) as { startAt: string }[];
        if (!cancelled) setSlotsPreview(Array.isArray(rows) ? rows.slice(0, 32) : []);
      } catch {
        if (!cancelled) setSlotsPreview([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firstServiceId, selectedDate, dayData]);

  useEffect(() => {
    queueMicrotask(() => {
      const v = searchParams.get("view");
      if (v === "list" || v === "day") setView(v);
      const dt = searchParams.get("date");
      if (dt && /^\d{4}-\d{2}-\d{2}$/.test(dt)) commitSelectedDate(dt);
      const st = searchParams.get("status");
      if (st && BOOKING_STATUSES.has(st as Booking["status"])) {
        setListStatusFilter(st as Booking["status"]);
        setView("list");
      } else if (st === null || st === "") {
        setListStatusFilter("ALL");
      }
    });
  }, [searchParams, commitSelectedDate]);

  useEffect(() => {
    queueMicrotask(() => {
      if (searchParams.get("new") === "1") {
        setSheetOpen(true);
        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", "/app/bookings");
        }
      }
    });
  }, [searchParams]);

  async function setStatus(id: string, status: Booking["status"]) {
    setBusyId(id);
    setError(null);
    try {
      await api(`/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  const timeline = useMemo(() => {
    if (!dayData || dayData.hours.isClosed || dayData.isHoliday) return [];
    return buildTimeline(dayData.date, dayData.hours.startMin, dayData.hours.endMin, dayData.appointments);
  }, [dayData]);

  const holidayDateStrings = useMemo(() => holidays.map((h) => h.dateISO), [holidays]);

  const canManageHolidays =
    Boolean(me?.ok && me.user?.role && ["BUSINESS_ADMIN", "SUPER_ADMIN"].includes(me.user.role));

  async function declareHoliday() {
    setHolidaySaving(true);
    setError(null);
    try {
      await api("/settings/holidays", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dateISO: selectedDate,
          name: holidayName.trim() || undefined,
          cancelAffectedBookings: cancelBookingsOnHoliday,
        }),
      });
      setHolidayDialogOpen(false);
      setHolidayName("");
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save holiday");
    } finally {
      setHolidaySaving(false);
    }
  }

  const listRows = useMemo(() => {
    if (listStatusFilter === "ALL") return bookings;
    return bookings.filter((b) => b.status === listStatusFilter);
  }, [bookings, listStatusFilter]);

  useEffect(() => {
    if (!holidayDialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHolidayDialogOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [holidayDialogOpen]);

  return (
    <div className="px-4 pb-28 pt-4 md:pb-8">
      <div className="flex items-center justify-between gap-2">
        <Link href="/app" className="text-[13px] font-semibold text-emerald-700">
          ← Hub
        </Link>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="rounded-full bg-emerald-600 px-4 py-2 text-[12px] font-semibold text-white shadow-sm md:hidden"
        >
          + Add
        </button>
      </div>

      <h1 className="mt-3 text-[20px] font-semibold tracking-tight text-zinc-900">Bookings</h1>

      <div className="mt-4 flex rounded-xl bg-zinc-100 p-1">
        <button
          type="button"
          onClick={() => setView("day")}
          className={`flex-1 rounded-lg py-2 text-[13px] font-semibold transition ${
            view === "day" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-600"
          }`}
        >
          Day
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          className={`flex-1 rounded-lg py-2 text-[13px] font-semibold transition ${
            view === "list" ? "bg-white text-emerald-800 shadow-sm" : "text-zinc-600"
          }`}
        >
          List
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</div>
      ) : null}

      {view === "day" ? (
        <div className="mt-5 space-y-4">
          <BookingCalendar
            selectedDate={selectedDate}
            onSelectDate={commitSelectedDate}
            holidayDates={holidayDateStrings}
            visibleStart={calendarStart}
            onVisibleStartChange={setCalendarStart}
            todayISO={todayISO()}
          />

          {!loading && dayData && !dayData.isHoliday && !dayData.hours.isClosed && firstServiceId ? (
            <Card className="!p-4">
              <div className="text-[13px] font-semibold text-zinc-900">Available start times</div>
              <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
                Preview for <span className="font-medium text-zinc-700">{services[0]?.name}</span>. Staff assignment
                and confirmation happen in New booking.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {slotsPreview.length === 0 ? (
                  <span className="text-[12px] text-zinc-500">No open slots for this service today.</span>
                ) : (
                  slotsPreview.map((s) => (
                    <span
                      key={s.startAt}
                      className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-[12px] font-semibold tabular-nums text-emerald-900"
                    >
                      {formatSlotTime(s.startAt)}
                    </span>
                  ))
                )}
              </div>
            </Card>
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous day"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-lg text-zinc-700 shadow-sm tap-highlight-none"
              onClick={() => commitSelectedDate(shiftDateISO(selectedDate, -1))}
            >
              ‹
            </button>
            <div className="min-w-0 flex-1 text-center">
              <div className="truncate text-[15px] font-semibold text-zinc-900">{formatDayTitle(selectedDate)}</div>
              <div className="text-[11px] font-medium text-zinc-400">{selectedDate}</div>
            </div>
            <button
              type="button"
              aria-label="Next day"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-lg text-zinc-700 shadow-sm tap-highlight-none"
              onClick={() => commitSelectedDate(shiftDateISO(selectedDate, 1))}
            >
              ›
            </button>
          </div>

          {canManageHolidays && dayData && !dayData.isHoliday ? (
            <div className="flex justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={() => setHolidayDialogOpen(true)}>
                Mark this day as holiday…
              </Button>
            </div>
          ) : null}

          {loading || !dayData ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-100" />
              ))}
            </div>
          ) : dayData.isHoliday ? (
            <div className="space-y-3">
              <Card className="border-amber-100 bg-amber-50/90 !p-3">
                <div className="text-[13px] font-semibold text-amber-950">Holiday — new bookings are closed</div>
                <p className="mt-1 text-[12px] leading-relaxed text-amber-900/95">
                  Bookings cancelled when this holiday was declared are listed below so you can reschedule customers
                  into another day with open slots.
                </p>
              </Card>
              {dayData.appointments.length === 0 ? (
                <EmptyState
                  icon="calendar"
                  title="No bookings on this holiday date"
                  description="If you add the holiday without cancelling bookings, nothing will appear here."
                  action={
                    <Button type="button" variant="secondary" size="md" onClick={() => commitSelectedDate(todayISO())}>
                      Jump to today
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {dayData.appointments.map((b) => (
                    <Card key={b.id} className="!p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-semibold text-zinc-900">
                            {b.customer.name ?? "Walk-in"}
                          </div>
                          <div className="truncate text-[12px] text-zinc-600">{b.service.name}</div>
                          <div className="mt-0.5 text-[11px] tabular-nums text-zinc-500">
                            {new Date(b.startAt).toLocaleString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </div>
                          {b.customer.phone ? (
                            <div className="mt-0.5 text-[11px] text-zinc-400">{b.customer.phone}</div>
                          ) : null}
                          {b.cancelReason === "HOLIDAY" ? (
                            <div className="mt-1 text-[11px] font-medium text-amber-800">Cancelled — holiday</div>
                          ) : null}
                        </div>
                        <StatusBadge status={badgeStatus(b.status)} size="sm" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {b.status === "CANCELLED" ? (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setSheetDefaultCustomerId(b.customer.id);
                              setSheetOpen(true);
                            }}
                          >
                            Reschedule
                          </Button>
                        ) : null}
                        {b.status === "PENDING" ? (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            loading={busyId === b.id}
                            onClick={() => void setStatus(b.id, "CONFIRMED")}
                          >
                            Confirm
                          </Button>
                        ) : null}
                        {b.status === "CONFIRMED" || b.status === "PENDING" ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            loading={busyId === b.id}
                            onClick={() => void setStatus(b.id, "COMPLETED")}
                          >
                            Complete
                          </Button>
                        ) : null}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : dayData.hours.isClosed ? (
            <div>
              <EmptyState
                icon="calendar"
                title="Closed this day"
                description="Pick another date or update business hours in settings."
                action={
                  <Button type="button" variant="secondary" size="md" onClick={() => commitSelectedDate(todayISO())}>
                    Jump to today
                  </Button>
                }
              />
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-[13px] text-zinc-500">No slots to show.</div>
          ) : (
            <div className="space-y-0 border-l-2 border-emerald-200 pl-3">
              {timeline.map((row, idx) =>
                row.kind === "free" ? (
                  <div key={`f-${idx}-${row.startMin}`} className="relative flex min-h-[36px] items-center gap-3 py-1.5">
                    <span className="w-14 shrink-0 text-[12px] font-medium tabular-nums text-zinc-400">
                      {formatMinLabel(row.startMin)}
                    </span>
                    <div className="h-px flex-1 bg-zinc-200" />
                    <span className="text-[11px] font-medium text-zinc-400">Free</span>
                  </div>
                ) : (
                  <div key={row.booking.id} className="relative py-1.5">
                    <div className="absolute -left-[11px] top-3 h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
                    <div className="flex gap-3">
                      <span className="w-14 shrink-0 pt-1 text-[12px] font-semibold tabular-nums text-zinc-600">
                        {formatMinLabel(minutesClock(row.booking.startAt))}
                      </span>
                      <Card className="flex-1 !p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate text-[14px] font-semibold text-zinc-900">
                              {row.booking.customer.name ?? "Walk-in"}
                            </div>
                            <div className="truncate text-[12px] text-zinc-600">{row.booking.service.name}</div>
                            {row.booking.staff?.user?.name ? (
                              <div className="mt-0.5 text-[11px] text-zinc-500">{row.booking.staff.user.name}</div>
                            ) : null}
                            {row.booking.customer.phone ? (
                              <div className="mt-0.5 text-[11px] text-zinc-400">{row.booking.customer.phone}</div>
                            ) : null}
                          </div>
                          <StatusBadge status={badgeStatus(row.booking.status)} size="sm" />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {row.booking.status === "PENDING" ? (
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              loading={busyId === row.booking.id}
                              onClick={() => void setStatus(row.booking.id, "CONFIRMED")}
                            >
                              Confirm
                            </Button>
                          ) : null}
                          {row.booking.status === "CONFIRMED" || row.booking.status === "PENDING" ? (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              loading={busyId === row.booking.id}
                              onClick={() => void setStatus(row.booking.id, "COMPLETED")}
                            >
                              Complete
                            </Button>
                          ) : null}
                          {row.booking.status !== "CANCELLED" && row.booking.status !== "COMPLETED" ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              loading={busyId === row.booking.id}
                              onClick={() => void setStatus(row.booking.id, "NO_SHOW")}
                            >
                              No-show
                            </Button>
                          ) : null}
                          {row.booking.status !== "CANCELLED" && row.booking.status !== "COMPLETED" ? (
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              loading={busyId === row.booking.id}
                              onClick={() => void setStatus(row.booking.id, "CANCELLED")}
                            >
                              Cancel
                            </Button>
                          ) : null}
                        </div>
                      </Card>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {loading ? (
            <>
              <BookingCardSkeleton />
              <BookingCardSkeleton />
            </>
          ) : bookings.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No upcoming bookings"
              description="Switch to Day view or create a booking."
              action={
                <Button type="button" variant="primary" size="md" onClick={() => setSheetOpen(true)}>
                  New booking
                </Button>
              }
            />
          ) : listRows.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No bookings match this filter"
              description="Try another status or open the full list."
              action={
                <Link
                  href="/app/bookings?view=list"
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-[13px] font-semibold text-white"
                >
                  Show all
                </Link>
              }
            />
          ) : (
            listRows.map((b) => (
              <Card key={b.id} className="!p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold text-zinc-900">
                      {b.customer.name ?? "Customer"} · {b.service.name}
                    </div>
                    <div className="mt-0.5 text-[12px] text-zinc-500">
                      {new Date(b.startAt).toLocaleString("en-IN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {b.staff?.user?.name ? (
                      <div className="mt-0.5 text-[11px] text-zinc-400">{b.staff.user.name}</div>
                    ) : null}
                  </div>
                  <StatusBadge status={badgeStatus(b.status)} size="sm" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {b.status === "PENDING" ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      loading={busyId === b.id}
                      onClick={() => void setStatus(b.id, "CONFIRMED")}
                    >
                      Confirm
                    </Button>
                  ) : null}
                  {b.status === "CONFIRMED" || b.status === "PENDING" ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      loading={busyId === b.id}
                      onClick={() => void setStatus(b.id, "COMPLETED")}
                    >
                      Complete
                    </Button>
                  ) : null}
                  {b.status !== "CANCELLED" && b.status !== "COMPLETED" ? (
                    <Button type="button" variant="ghost" size="sm" loading={busyId === b.id} onClick={() => void setStatus(b.id, "NO_SHOW")}>
                      No-show
                    </Button>
                  ) : null}
                  {b.status !== "CANCELLED" && b.status !== "COMPLETED" ? (
                    <Button type="button" variant="danger" size="sm" loading={busyId === b.id} onClick={() => void setStatus(b.id, "CANCELLED")}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <div className="mt-6 hidden md:block">
        <Button type="button" variant="primary" size="lg" className="w-full max-w-xs" onClick={() => setSheetOpen(true)}>
          New booking
        </Button>
      </div>

      {holidayDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setHolidayDialogOpen(false);
          }}
        >
          <Card
            role="dialog"
            aria-modal="true"
            aria-labelledby="holiday-dialog-title"
            className="relative z-10 w-full max-w-md !p-5 shadow-lg outline-none"
          >
            <div id="holiday-dialog-title" className="text-[16px] font-semibold text-zinc-900">
              Mark holiday
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-600">
              <span className="font-medium text-zinc-800">{selectedDate}</span> will be closed for new bookings.
            </p>
            <label className="mt-4 block text-[12px] font-medium text-zinc-700">
              Label (optional)
              <input
                type="text"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                placeholder="e.g. Diwali"
                className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-[14px] outline-none ring-emerald-500/30 focus:ring-2"
              />
            </label>
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-[13px] text-zinc-800">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-emerald-600"
                checked={cancelBookingsOnHoliday}
                onChange={(e) => setCancelBookingsOnHoliday(e.target.checked)}
              />
              <span>
                Cancel pending and confirmed bookings on this day so you can reschedule them. (Recommended)
              </span>
            </label>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="secondary" size="md" disabled={holidaySaving} onClick={() => setHolidayDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" size="md" loading={holidaySaving} onClick={() => void declareHoliday()}>
                Save holiday
              </Button>
            </div>
          </Card>
        </div>
      ) : null}

      <NewBookingSheet
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSheetDefaultCustomerId(undefined);
        }}
        defaultDate={selectedDate}
        defaultCustomerId={sheetDefaultCustomerId}
        onCreated={() => void loadAll()}
      />
    </div>
  );
}
