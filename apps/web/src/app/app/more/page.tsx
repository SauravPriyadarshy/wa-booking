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

function Card({ href, title, subtitle }: { href: string; title: string; subtitle: string }) {
  return (
    <a href={href} className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-xs text-zinc-500">{subtitle}</div>
    </a>
  );
}

export default function MorePage() {
  const t = useTranslations("morePage");
  const tn = useTranslations("nav");
  const th = useTranslations("hub");
  const ts = useTranslations("staff");
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    (async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${apiBase()}/me`, {
          headers: { authorization: `Bearer ${token}` },
        });
        setMe((await res.json()) as MeResponse);
      } catch {
        setMe({ ok: false });
      }
    })();
  }, []);

  const enabled = me?.ok && me.business ? new Set(me.business.enabledFeatures) : new Set<string>();
  const cat = me?.ok && me.business ? me.business.categoryKey : null;
  const role = me?.ok ? me.user.role : null;
  const planFeatures = me?.ok && me.business ? new Set(me.business.planFeatures ?? []) : new Set<string>();
  const hasCoaching =
    (cat === "coaching" || enabled.has("coaching")) && planFeatures.has("coaching_module");

  return (
    <div className="space-y-4">
      <div className="text-sm text-zinc-500">{t("title")}</div>

      <div className="mt-3 grid gap-3">
        <Card href="/app/settings" title={tn("settings")} subtitle={t("settingsSub")} />
        <Card href="/app/services" title={th("services")} subtitle={t("servicesSub")} />
        <Card href="/app/staff" title={ts("title")} subtitle={t("staffSub")} />
        <Card href="/app/leads" title={th("leads")} subtitle={t("leadsSub")} />
        <Card href="/app/reactivation" title={t("reactivationTitle")} subtitle={t("reactivationSub")} />
        <Card href="/app/support" title={th("support")} subtitle={t("supportSub")} />
        <Card href="/app/templates" title={th("templates")} subtitle={t("templatesSub")} />
        <Card href="/app/payments" title={th("payments")} subtitle={t("paymentsSub")} />
        <Card href="/app/analytics" title={th("analytics")} subtitle={t("analyticsSub")} />

        {enabled.has("whatsapp") ? (
          <Card href="/app/whatsapp" title={tn("whatsapp")} subtitle={t("whatsappSub")} />
        ) : (
          <div className="rounded-3xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            <div className="text-sm font-semibold">{tn("whatsapp")}</div>
            <div className="text-xs text-zinc-500">{t("whatsappDisabled")}</div>
          </div>
        )}

        {cat === "clinic" || enabled.has("queue") ? (
          <Card href="/app/queue" title={`🏥 ${th("clinicToday")}`} subtitle={t("queueSub")} />
        ) : null}

        {hasCoaching ? (
          <>
            <Card href="/app/students" title={tn("customers")} subtitle={t("studentsSub")} />
            <Card href="/app/fees" title={th("payments")} subtitle={t("feesSub")} />
          </>
        ) : null}

        {role === "SUPER_ADMIN" ? (
          <Card href="/app/superadmin" title={t("superAdmin")} subtitle={t("superAdminSub")} />
        ) : null}
      </div>
    </div>
  );
}
