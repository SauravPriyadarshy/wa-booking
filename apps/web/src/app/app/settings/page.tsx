"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  Scissors,
  Bell,
  MessageSquare,
  Wallet,
  MessageCircle,
  UserPlus,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { apiBase } from "@/lib/api-base";

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

type SettingLink = {
  href: string;
  title: string;
  sub: string;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [categoryKey, setCategoryKey] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${apiBase()}/me`, { headers: { authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setCategoryKey(d?.business?.categoryKey ?? null))
      .catch(() => {});
  }, []);

  const links: SettingLink[] = [
    {
      href: "/app/settings/profile",
      title: t("profileTitle"),
      sub: t("profileSub"),
      Icon: Building2,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      href: "/app/services",
      title: t("servicesTitle"),
      sub: t("servicesSub"),
      Icon: Scissors,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      href: "/app/staff",
      title: categoryKey === "clinic" ? t("staffClinicTitle") : t("staffTitle"),
      sub: t("staffSub"),
      Icon: Users,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    ...(categoryKey === "clinic"
      ? [
          {
            href: "/app/settings/follow-ups",
            title: t("followUps"),
            sub: t("followUpsSub"),
            Icon: Bell,
            iconBg: "bg-orange-50",
            iconColor: "text-orange-600",
          },
        ]
      : []),
    {
      href: "/app/templates",
      title: t("templatesTitle"),
      sub: t("templatesSub"),
      Icon: MessageSquare,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
    },
    {
      href: "/app/payments",
      title: t("paymentsTitle"),
      sub: t("paymentsSub"),
      Icon: Wallet,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      href: "/app/whatsapp",
      title: t("whatsappTitle"),
      sub: t("whatsappSub"),
      Icon: MessageCircle,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      href: "/app/leads",
      title: t("leadsTitle"),
      sub: t("leadsSub"),
      Icon: UserPlus,
      iconBg: "bg-pink-50",
      iconColor: "text-pink-600",
    },
    {
      href: "/app/more",
      title: t("moreTitle"),
      sub: t("moreSub"),
      Icon: LayoutGrid,
      iconBg: "bg-zinc-100",
      iconColor: "text-zinc-600",
    },
  ];

  return (
    <div className="mx-auto max-w-lg pb-6">
      <a href="/app" className="text-[13px] font-semibold text-emerald-700">
        ← Hub
      </a>
      <h1 className="mt-3 text-[20px] font-semibold text-zinc-900">{t("title")}</h1>
      <p className="mt-1 text-[13px] text-zinc-500">{t("subtitle")}</p>

      <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
        <p className="text-[13px] font-medium text-emerald-900">{t("hintTitle")}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-emerald-800">{t("hintBody")}</p>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {links.map(({ href, title, sub, Icon, iconBg, iconColor }) => (
          <a
            key={href}
            href={href}
            className="group flex items-start gap-3 rounded-2xl border border-zinc-100 bg-white p-3.5 shadow-sm transition hover:border-emerald-200 hover:shadow-md tap-highlight-none"
          >
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${iconBg}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-zinc-900 group-hover:text-emerald-800">{title}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">{sub}</span>
            </span>
          </a>
        ))}
      </div>

      <button
        type="button"
        onClick={logout}
        className="mt-5 w-full rounded-2xl border border-red-200 bg-red-50 py-3 text-[15px] font-semibold text-red-600 transition hover:bg-red-100"
      >
        Log out
      </button>
    </div>
  );
}
