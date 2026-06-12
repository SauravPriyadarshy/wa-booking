"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiBase } from "@/lib/api-base";
import { Button, Card, EmptyState } from "@/components/ui";
import { UpgradeBanner } from "@/components/app/upgrade-banner";

type Bucket = {
  days: number;
  count: number;
  customers: Array<{ id: string; name: string | null; phone: string | null; lastVisitAt: string | null }>;
};

type ReactivationPayload = {
  buckets: Bucket[];
  actions: Array<{ key: string; label: string; href: string }>;
};

const OFFER_MESSAGES: Record<number, string> = {
  30: "Namaste! Bahut din se nahi aaye. Agla visit par 10% off — book karein: ",
  60: "Namaste! Aapko miss kar rahe hain. Special 15% off agle booking par. Link: ",
  90: "Namaste! Long time! Wapas aaiye — 20% welcome-back offer. Book: ",
};

const REMINDER_MESSAGES: Record<number, string> = {
  30: "Namaste! Aapka next appointment book kar lein — hum ready hain. ",
  60: "Namaste! Kuch time ho gaya — kya aap wapas aana chahenge? ",
  90: "Namaste! Bahut din ho gaye — ek visit schedule karein? ",
};

function waLink(phone: string | null, message: string, slug: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  const p = digits.startsWith("91") ? digits : `91${digits}`;
  const link = slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/${slug}` : "";
  return `https://wa.me/${p}?text=${encodeURIComponent(message + link)}`;
}

function ReactivationInner() {
  const t = useTranslations("reactivation");
  const searchParams = useSearchParams();
  const action = searchParams.get("action") ?? "reminder";
  const [data, setData] = useState<ReactivationPayload | null>(null);
  const [activeDays, setActiveDays] = useState<30 | 60 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);

  const api = useCallback(async (path: string) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Login required");
    const res = await fetch(`${apiBase()}${path}`, { headers: { authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.message ?? "Failed");
    return json;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [react, me] = await Promise.all([
          api("/hub/reactivation") as Promise<ReactivationPayload>,
          api("/me") as Promise<{ business?: { slug?: string } }>,
        ]);
        setData(react);
        setSlug(me?.business?.slug ?? null);
      } catch (e) {
        if (e instanceof Error && e.message.toLowerCase().includes("plus")) {
          setLocked(true);
        }
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [api]);

  const bucket = data?.buckets.find((b) => b.days === activeDays);

  if (loading) {
    return <div className="py-12 text-center text-[14px] text-zinc-400">{t("loading")}</div>;
  }

  if (!data) {
    if (locked) {
      return (
        <UpgradeBanner
          title={t("title")}
          message="Customer reactivation Plus ya Pro plan par available hai. Activation code se upgrade karein."
          cta="Plans dekhein →"
          href="/signup"
        />
      );
    }
    return <EmptyState icon="inbox" title={t("errorTitle")} description={t("errorSub")} />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[20px] font-bold text-zinc-900">{t("title")}</h1>
        <p className="mt-1 text-[13px] text-zinc-500">{t("subtitle")}</p>
      </div>

      <div className="flex gap-2">
        {([30, 60, 90] as const).map((d) => {
          const b = data.buckets.find((x) => x.days === d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => setActiveDays(d)}
              className={`flex-1 rounded-xl border-2 py-3 text-center transition ${
                activeDays === d ? "border-emerald-500 bg-emerald-50" : "border-zinc-100 bg-white"
              }`}
            >
              <div className="text-[18px] font-black text-zinc-900">{b?.count ?? 0}</div>
              <div className="text-[11px] font-semibold text-zinc-500">{t("daysInactive", { days: d })}</div>
            </button>
          );
        })}
      </div>

      <Card className="!p-4">
        <div className="text-[13px] font-bold text-zinc-900">{t("actions")}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={action === "reminder" ? "primary" : "ghost"}
            size="sm"
            onClick={() => {
              window.history.replaceState({}, "", "/app/reactivation?action=reminder");
            }}
          >
            {t("sendReminder")}
          </Button>
          <Button
            type="button"
            variant={action === "offer" ? "primary" : "ghost"}
            size="sm"
            onClick={() => {
              window.history.replaceState({}, "", "/app/reactivation?action=offer");
            }}
          >
            {t("sendOffer")}
          </Button>
          <a href="/app/leads">
            <Button type="button" variant="ghost" size="sm">
              {t("scheduleFollowup")}
            </Button>
          </a>
        </div>
      </Card>

      {!bucket?.customers.length ? (
        <EmptyState icon="users" title={t("emptyTitle")} description={t("emptySub", { days: activeDays })} />
      ) : (
        <ul className="space-y-2">
          {bucket.customers.map((c) => {
            const templates = action === "offer" ? OFFER_MESSAGES : REMINDER_MESSAGES;
            const href = waLink(c.phone, templates[activeDays] ?? templates[30], slug);
            return (
              <li key={c.id}>
                <Card className="!p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[14px] font-semibold text-zinc-900">{c.name ?? t("unknown")}</div>
                      <div className="text-[12px] text-zinc-500">{c.phone ?? t("noPhone")}</div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-[#25D366] px-3 py-2 text-[12px] font-bold text-white"
                        >
                          WhatsApp
                        </a>
                      ) : null}
                      <a
                        href={`/app/customers/${c.id}`}
                        className="rounded-xl border border-zinc-200 px-3 py-2 text-[12px] font-semibold text-zinc-700"
                      >
                        {t("view")}
                      </a>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function ReactivationPage() {
  const t = useTranslations("reactivation");
  return (
    <Suspense fallback={<div className="py-12 text-center text-zinc-400">{t("loading")}</div>}>
      <ReactivationInner />
    </Suspense>
  );
}
