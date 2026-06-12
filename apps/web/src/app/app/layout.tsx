"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiBase } from "@/lib/api-base";
import { ToastProvider } from "@/components/ui";
import { LangSwitcher } from "@/components/lang-switcher";
import { AppSupportChat } from "@/components/app/app-support-chat";
import {
  Home,
  CalendarDays,
  Users,
  MoreHorizontal,
  MessageCircle,
  BarChart2,
  LifeBuoy,
  Settings,
  type LucideIcon,
} from "lucide-react";

type MeResponse =
  | { ok: false }
  | {
      ok: true;
      user: { id: string; role: "SUPER_ADMIN" | "BUSINESS_ADMIN" | "STAFF" };
      business: null | {
        id: string;
        name: string;
        slug: string | null;
        categoryKey: string | null;
        enabledFeatures: string[];
      };
    };

type UiConfig =
  | { ok: false }
  | {
      ok: true;
      modules: string[];
      slug: string | null;
      quickActions: { key: string; label: string }[];
    };

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login";
}

function linkActive(pathname: string, href: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  const h = href.replace(/\/$/, "") || "/";
  if (h === "/app") return p === "/app";
  return p === h || p.startsWith(`${h}/`);
}

type NavLabels = {
  today: string;
  bookings: string;
  customers: string;
  more: string;
  whatsapp: string;
  support: string;
  insights: string;
  settings: string;
};

const NAV_ITEMS: Array<{
  href: string;
  labelKey: keyof NavLabels;
  module: string | null;
  Icon: LucideIcon;
  tab: boolean;
  side: boolean;
}> = [
  { href: "/app", labelKey: "today", module: "hub", Icon: Home, tab: true, side: true },
  { href: "/app/bookings", labelKey: "bookings", module: "bookings", Icon: CalendarDays, tab: true, side: true },
  { href: "/app/customers", labelKey: "customers", module: "customers", Icon: Users, tab: true, side: true },
  { href: "/app/whatsapp", labelKey: "whatsapp", module: "whatsapp-connect", Icon: MessageCircle, tab: true, side: true },
  { href: "/app/more", labelKey: "more", module: null, Icon: MoreHorizontal, tab: true, side: false },
  { href: "/app/support", labelKey: "support", module: "support", Icon: LifeBuoy, tab: false, side: true },
  { href: "/app/analytics", labelKey: "insights", module: "analytics", Icon: BarChart2, tab: false, side: true },
  { href: "/app/settings", labelKey: "settings", module: "more", Icon: Settings, tab: false, side: true },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const tn = useTranslations("nav");
  const [me, setMe] = useState<MeResponse | null>(null);
  const [ui, setUi] = useState<UiConfig | null>(null);

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }, []);

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }
    (async () => {
      try {
        const [meRes, uiRes] = await Promise.all([
          fetch(`${apiBase()}/me`, { headers: { authorization: `Bearer ${token}` } }),
          fetch(`${apiBase()}/me/ui`, { headers: { authorization: `Bearer ${token}` } }),
        ]);
        setMe(await meRes.json());
        setUi(await uiRes.json());
      } catch {
        setMe({ ok: false });
        setUi({ ok: false });
      }
    })();
  }, [token]);

  const modules = ui?.ok ? new Set(ui.modules) : new Set<string>();
  const show = (key: string | null) => !key || modules.size === 0 || modules.has(key);
  const isSuperAdmin = me?.ok && me.user.role === "SUPER_ADMIN";

  const visibleTabs = NAV_ITEMS.filter((t) => t.tab && show(t.module)).map((t) => ({
    ...t,
    label: tn(t.labelKey === "today" ? "today" : t.labelKey),
  }));
  const visibleSidebar = NAV_ITEMS.filter((t) => t.side && show(t.module)).map((t) => ({
    ...t,
    label: tn(t.labelKey === "today" ? "hub" : t.labelKey),
  }));

  return (
    <ToastProvider>
      <div className="min-h-screen bg-zinc-50 md:flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[240px] flex-shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
          <div className="border-b border-zinc-100 px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Workspace</div>
                <div className="mt-1 truncate text-[15px] font-semibold text-zinc-900">
                  {me?.ok && me.business?.name ? me.business.name : "Dashboard"}
                </div>
              </div>
              <LangSwitcher />
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 p-2">
            {visibleSidebar.map(({ href, label, Icon }) => {
              const active = linkActive(pathname, href);
              return (
                <a
                  key={href}
                  href={href}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-colors tap-highlight-none ${
                    active ? "bg-emerald-50 text-emerald-800" : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <span className={active ? "text-emerald-600" : "text-zinc-400"}>
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                  </span>
                  {label}
                </a>
              );
            })}
            <button
              type="button"
              onClick={logout}
              className="mt-2 flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-red-600 transition-colors hover:bg-red-50 tap-highlight-none"
            >
              <span className="text-red-400">⎋</span>
              Log out
            </button>
          </nav>
        </aside>

        <div className="relative flex min-h-screen flex-1 flex-col">
          <div className="shell relative flex flex-1 flex-col">
            {isSuperAdmin && (
              <div className="pt-3">
                <a
                  href="/app/superadmin"
                  className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800"
                >
                  <span aria-hidden>⚡</span> Super Admin Panel
                </a>
              </div>
            )}

            <main className="app-main animate-slide-up flex-1">
              {children}
            </main>

            <AppSupportChat />

            <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-100 bg-white/95 pb-safe backdrop-blur-md md:hidden">
              <div
                className="shell grid gap-0 py-1 !px-2"
                style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)` }}
              >
                {visibleTabs.map(({ href, label, Icon }) => {
                  const active = linkActive(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      prefetch
                      className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 tap-highlight-none transition-colors ${
                        active ? "text-emerald-600" : "text-zinc-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
                      <span
                        className={`text-[10px] font-semibold leading-none ${active ? "text-emerald-600" : "text-zinc-400"}`}
                      >
                        {label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
