"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { apiBase } from "@/lib/api-base";

type MeResponse =
  | { ok: false }
  | {
      ok: true;
      user: { role: "SUPER_ADMIN" | "BUSINESS_ADMIN" | "STAFF" };
      business: null | { categoryKey: string | null; enabledFeatures: string[]; planFeatures?: string[] };
    };

type UiConfig =
  | { ok: false }
  | { ok: true; focusedMode?: boolean; categoryKey: string | null; modules: string[] };

function Card({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <a href={href} className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-zinc-500">{subtitle}</div>
    </a>
  );
}

const FOCUSED = new Set(["clinic", "coaching", "salon"]);

export default function MorePage() {
  const t = useTranslations("morePage");
  const tn = useTranslations("nav");
  const th = useTranslations("hub");
  const ts = useTranslations("staff");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [ui, setUi] = useState<UiConfig | null>(null);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const [meRes, uiRes] = await Promise.all([
          fetch(`${apiBase()}/me`, { headers: { authorization: `Bearer ${token}` } }),
          fetch(`${apiBase()}/me/ui`, { headers: { authorization: `Bearer ${token}` } }),
        ]);
        setMe((await meRes.json()) as MeResponse);
        setUi((await uiRes.json()) as UiConfig);
      } catch {
        setMe({ ok: false });
      }
    })();
  }, []);

  const cat = me?.ok && me.business ? me.business.categoryKey : null;
  const role = me?.ok ? me.user.role : null;
  const focusedMode = ui?.ok ? ui.focusedMode && FOCUSED.has(cat ?? "") : false;

  return (
    <div className="space-y-4">
      <div className="text-sm text-zinc-500">{t("title")}</div>

      <div className="mt-3 grid gap-3">
        <Card href="/app/settings" title={tn("settings")} subtitle={t("settingsSub")} />
        <Card href="/app/services" title={th("services")} subtitle={t("servicesSub")} />
        <Card href="/app/staff" title={ts("title")} subtitle={t("staffSub")} />

        {!focusedMode ? (
          <>
            <Card href="/app/leads" title={th("leads")} subtitle={t("leadsSub")} />
            <Card href="/app/reactivation" title={t("reactivationTitle")} subtitle={t("reactivationSub")} />
            <Card href="/app/support" title={th("support")} subtitle={t("supportSub")} />
            <Card href="/app/templates" title={th("templates")} subtitle={t("templatesSub")} />
            <Card href="/app/payments" title={th("payments")} subtitle={t("paymentsSub")} />
            <Card href="/app/analytics" title={th("analytics")} subtitle={t("analyticsSub")} />
            <Card href="/app/whatsapp" title={tn("whatsapp")} subtitle={t("whatsappSub")} />
          </>
        ) : (
          <Card href="/app/whatsapp" title="WhatsApp alerts" subtitle="How token & parent alerts work" />
        )}

        {cat === "clinic" ? (
          <Card href="/app/queue" title={`🏥 ${th("clinicToday")}`} subtitle={t("queueSub")} />
        ) : null}

        {cat === "coaching" ? (
          <>
            <Card href="/app/students" title="Students" subtitle={t("studentsSub")} />
            <Card href="/app/coaching/matrix" title="Academic Matrix" subtitle="Streams, courses & batches" />
            <Card href="/app/coaching/fees" title={th("payments")} subtitle={t("feesSub")} />
            <Card href="/app/coaching/attendance" title="Attendance" subtitle="Daily roll call & parent alerts" />
          </>
        ) : null}

        {role === "SUPER_ADMIN" ? (
          <Card href="/app/superadmin" title={t("superAdmin")} subtitle={t("superAdminSub")} />
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }}
        className="mt-2 w-full rounded-2xl border border-red-200 bg-red-50 py-3 text-[15px] font-semibold text-red-600"
      >
        Log out
      </button>
    </div>
  );
}
