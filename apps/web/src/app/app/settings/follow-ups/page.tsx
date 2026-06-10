"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiBase } from "@/lib/api-base";
import { Card } from "@/components/ui";

const INTERVALS = ["7", "15", "30", "90"] as const;

export default function FollowUpsSettingsPage() {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const [intervals, setIntervals] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${apiBase()}/settings/follow-ups`, { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: { intervals?: Record<string, boolean> }) => setIntervals(d.intervals ?? {}))
      .catch(() => setErr(tc("error")))
      .finally(() => setLoading(false));
  }, [tc]);

  async function save(next: Record<string, boolean>) {
    setSaving(true);
    setErr(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiBase()}/settings/follow-ups`, {
        method: "PATCH",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ intervals: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? tc("error"));
      setIntervals(data.intervals ?? next);
    } catch (e) {
      setErr(e instanceof Error ? e.message : tc("error"));
    } finally {
      setSaving(false);
    }
  }

  function toggle(days: string) {
    const next = { ...intervals, [days]: !intervals[days] };
    setIntervals(next);
    void save(next);
  }

  return (
    <div className="space-y-4">
      <a href="/app/settings" className="text-[13px] font-semibold text-emerald-700">
        {tc("back")}
      </a>
      <h1 className="mt-3 text-[20px] font-semibold text-zinc-900">{t("followUps")}</h1>
      <p className="mt-1 text-[13px] text-zinc-500">{t("followUpsDesc")}</p>

      {err ? (
        <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-800">{err}</div>
      ) : null}

      <Card className="mt-5 !p-4">
        {loading ? (
          <div className="text-[13px] text-zinc-500">{tc("loading")}</div>
        ) : (
          <ul className="grid gap-3">
            {INTERVALS.map((days) => (
              <li key={days}>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => toggle(days)}
                  className={`flex w-full min-h-12 items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    intervals[days]
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-zinc-100 bg-zinc-50"
                  }`}
                >
                  <span className="text-[14px] font-semibold text-zinc-800">
                    {t("intervalDays", { days })}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      intervals[days] ? "bg-emerald-600 text-white" : "bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    {intervals[days] ? "ON" : "OFF"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-4 text-[12px] leading-relaxed text-zinc-500">{t("inactiveNote")}</p>
    </div>
  );
}
