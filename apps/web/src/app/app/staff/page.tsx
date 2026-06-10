"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiBase } from "@/lib/api-base";
import { EmptyState } from "@/components/ui";
import { ChevronDown, ChevronUp } from "lucide-react";

type StaffHour = { weekday: number; startMin: number; endMin: number; isOff: boolean };

type Staff = {
  id: string;
  title: string | null;
  specialization: string | null;
  consultationFeeCents: number | null;
  consultationDurationMin: number;
  isAvailable: boolean;
  user: { id: string; name: string | null };
  hours: StaffHour[];
};

const WEEKDAYS = [
  { id: 1, key: "mon" },
  { id: 2, key: "tue" },
  { id: 3, key: "wed" },
  { id: 4, key: "thu" },
  { id: 5, key: "fri" },
  { id: 6, key: "sat" },
  { id: 0, key: "sun" },
] as const;

function minToTime(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export default function StaffPage() {
  const t = useTranslations("staff");
  const tc = useTranslations("common");
  const [items, setItems] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isClinic = categoryKey === "clinic";

  const schema = useMemo(
    () =>
      z.object({
        name: z.string().min(2),
        title: z.string().optional(),
        specialization: z.string().optional(),
        feeRupees: z.string().optional(),
        durationMin: z.string().optional(),
      }),
    [],
  );
  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", title: "", specialization: "", feeRupees: "", durationMin: "15" },
  });

  async function api(path: string, init?: RequestInit) {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Please login");
    const res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: { ...(init?.headers ?? {}), authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? "Request failed");
    return data;
  }

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const data = (await api("/staff")) as Staff[];
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : tc("error"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch(`${apiBase()}/me`, { headers: { authorization: `Bearer ${token}` } });
        const data = await res.json();
        setCategoryKey(data?.business?.categoryKey ?? null);
      } catch {
        /* ignore */
      }
    })();
  }, [tc]);

  async function create(values: FormValues) {
    setSaving(true);
    setError(null);
    try {
      const fee = values.feeRupees ? Math.round(Number(values.feeRupees) * 100) : undefined;
      await api("/staff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          title: values.title,
          specialization: values.specialization || values.title,
          consultationFeeCents: Number.isFinite(fee) ? fee : undefined,
          consultationDurationMin: values.durationMin ? Number(values.durationMin) : 15,
        }),
      });
      form.reset({ name: "", title: "", specialization: "", feeRupees: "", durationMin: "15" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : tc("error"));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(staffId: string, next: boolean) {
    try {
      await api(`/staff/${staffId}/availability`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isAvailable: next }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : tc("error"));
    }
  }

  async function saveProfile(staff: Staff, patch: Partial<Staff> & { name?: string; feeRupees?: string }) {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      if (patch.name) body.name = patch.name;
      if (patch.specialization !== undefined) body.specialization = patch.specialization;
      if (patch.title !== undefined) body.title = patch.title;
      if (patch.consultationDurationMin !== undefined) body.consultationDurationMin = patch.consultationDurationMin;
      if ("durationMin" in patch && patch.durationMin !== undefined) {
        body.consultationDurationMin = Number(patch.durationMin);
      }
      if (patch.feeRupees !== undefined) {
        body.consultationFeeCents = Math.round(Number(patch.feeRupees || 0) * 100);
      }
      await api(`/staff/${staff.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : tc("error"));
    } finally {
      setSaving(false);
    }
  }

  async function saveHours(staffId: string, weekday: number, startMin: number, endMin: number, isOff: boolean) {
    try {
      await api(`/staff/${staffId}/hours`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ weekday, startMin, endMin, isOff }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : tc("error"));
    }
  }

  return (
    <div className="space-y-4">
      <a href="/app/settings" className="text-[13px] font-semibold text-emerald-700">
        {tc("back")}
      </a>
      <h1 className="mt-3 text-[20px] font-semibold text-zinc-900">
        {isClinic ? t("doctorsTitle") : t("title")}
      </h1>

      <div className="mt-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
        <div className="text-[15px] font-semibold">{isClinic ? t("addDoctor") : t("addStaff")}</div>
        <form id="staff-form" className="mt-3 grid gap-2" onSubmit={form.handleSubmit(create)}>
          <input
            className="h-11 rounded-xl border border-zinc-200 px-3 text-[14px] outline-none focus:border-emerald-500"
            placeholder={t("name")}
            {...form.register("name")}
          />
          {isClinic ? (
            <>
              <input
                className="h-11 rounded-xl border border-zinc-200 px-3 text-[14px] outline-none focus:border-emerald-500"
                placeholder={t("specialization")}
                {...form.register("specialization")}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="h-11 rounded-xl border border-zinc-200 px-3 text-[14px] outline-none focus:border-emerald-500"
                  placeholder={t("fee")}
                  inputMode="numeric"
                  {...form.register("feeRupees")}
                />
                <input
                  className="h-11 rounded-xl border border-zinc-200 px-3 text-[14px] outline-none focus:border-emerald-500"
                  placeholder={t("duration")}
                  inputMode="numeric"
                  {...form.register("durationMin")}
                />
              </div>
            </>
          ) : (
            <input
              className="h-11 rounded-xl border border-zinc-200 px-3 text-[14px] outline-none focus:border-emerald-500"
              placeholder={t("role")}
              {...form.register("title")}
            />
          )}
          <button
            disabled={saving}
            className="h-11 rounded-xl bg-emerald-600 text-[14px] font-semibold text-white disabled:opacity-60"
          >
            {saving ? tc("saving") : tc("add")}
          </button>
        </form>
      </div>

      {error ? (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">{error}</div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {loading ? (
          <div className="text-[13px] text-zinc-500">{tc("loading")}</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="users"
            title={isClinic ? t("doctorEmptyTitle") : t("emptyTitle")}
            description={isClinic ? t("doctorEmptyDesc") : t("emptyDesc")}
            action={
              <button
                type="button"
                onClick={() => document.getElementById("staff-form")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex h-10 items-center rounded-xl bg-emerald-600 px-4 text-[13px] font-semibold text-white"
              >
                {isClinic ? t("addDoctor") : t("emptyAction")}
              </button>
            }
          />
        ) : (
          items.map((s) => (
            <DoctorCard
              key={s.id}
              staff={s}
              isClinic={isClinic}
              expanded={expandedId === s.id}
              onToggleExpand={() => setExpandedId(expandedId === s.id ? null : s.id)}
              onToggleAvail={(next) => toggle(s.id, next)}
              onSaveProfile={(patch) => saveProfile(s, patch)}
              onSaveHours={(wd, start, end, off) => saveHours(s.id, wd, start, end, off)}
              t={t}
              tc={tc}
              saving={saving}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DoctorCard({
  staff,
  isClinic,
  expanded,
  onToggleExpand,
  onToggleAvail,
  onSaveProfile,
  onSaveHours,
  t,
  tc,
  saving,
}: {
  staff: Staff;
  isClinic: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleAvail: (next: boolean) => void;
  onSaveProfile: (patch: { name?: string; specialization?: string; feeRupees?: string; durationMin?: string }) => void;
  onSaveHours: (weekday: number, startMin: number, endMin: number, isOff: boolean) => void;
  t: ReturnType<typeof useTranslations>;
  tc: ReturnType<typeof useTranslations>;
  saving: boolean;
}) {
  const [name, setName] = useState(staff.user.name ?? "");
  const [spec, setSpec] = useState(staff.specialization ?? staff.title ?? "");
  const [fee, setFee] = useState(
    staff.consultationFeeCents != null ? String(Math.round(staff.consultationFeeCents / 100)) : "",
  );
  const [duration, setDuration] = useState(String(staff.consultationDurationMin ?? 15));

  const feeLabel =
    staff.consultationFeeCents != null
      ? `₹${Math.round(staff.consultationFeeCents / 100).toLocaleString("en-IN")}`
      : null;

  return (
    <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold text-zinc-900">
            {isClinic && staff.user.name ? `Dr. ${staff.user.name}` : staff.user.name ?? "Staff"}
          </div>
          <div className="mt-0.5 text-[12px] text-zinc-500">
            {staff.specialization ?? staff.title ?? "—"}
            {feeLabel ? ` · ${feeLabel}` : ""}
            {isClinic ? ` · ${staff.consultationDurationMin} min` : ""}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              staff.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
            }`}
            onClick={() => onToggleAvail(!staff.isAvailable)}
          >
            {staff.isAvailable ? t("available") : t("off")}
          </button>
          {isClinic ? (
            <button type="button" onClick={onToggleExpand} className="text-zinc-400">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          ) : null}
        </div>
      </div>

      {isClinic && expanded ? (
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <div className="grid gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 px-3 text-[13px]"
              placeholder={t("name")}
            />
            <input
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 px-3 text-[13px]"
              placeholder={t("specialization")}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="h-10 rounded-xl border border-zinc-200 px-3 text-[13px]"
                placeholder={t("fee")}
                inputMode="numeric"
              />
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-10 rounded-xl border border-zinc-200 px-3 text-[13px]"
                placeholder={t("duration")}
                inputMode="numeric"
              />
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                onSaveProfile({ name, specialization: spec, feeRupees: fee, durationMin: duration })
              }
              className="h-10 rounded-xl bg-zinc-900 text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {t("saveProfile")}
            </button>
          </div>

          <div className="mt-4">
            <div className="text-[12px] font-semibold uppercase tracking-wide text-zinc-400">{t("hours")}</div>
            <ul className="mt-2 grid gap-2">
              {WEEKDAYS.map(({ id, key }) => {
                const row = staff.hours.find((h) => h.weekday === id);
                const isOff = row?.isOff ?? false;
                const start = row ? minToTime(row.startMin) : "09:00";
                const end = row ? minToTime(row.endMin) : "18:00";
                return (
                  <li key={id} className="flex flex-wrap items-center gap-2 rounded-xl bg-zinc-50 px-2 py-2">
                    <span className="w-10 text-[12px] font-semibold text-zinc-600">{t(key)}</span>
                    <label className="flex items-center gap-1 text-[11px] text-zinc-500">
                      <input
                        type="checkbox"
                        checked={!isOff}
                        onChange={(e) =>
                          onSaveHours(id, timeToMin(start), timeToMin(end), !e.target.checked)
                        }
                      />
                      Open
                    </label>
                    {!isOff ? (
                      <>
                        <input
                          type="time"
                          defaultValue={start}
                          className="rounded-lg border border-zinc-200 px-1 py-0.5 text-[12px]"
                          onBlur={(e) =>
                            onSaveHours(id, timeToMin(e.target.value), timeToMin(end), false)
                          }
                        />
                        <span className="text-zinc-400">–</span>
                        <input
                          type="time"
                          defaultValue={end}
                          className="rounded-lg border border-zinc-200 px-1 py-0.5 text-[12px]"
                          onBlur={(e) =>
                            onSaveHours(id, timeToMin(start), timeToMin(e.target.value), false)
                          }
                        />
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
