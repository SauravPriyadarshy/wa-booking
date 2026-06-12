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
  BarChart2,
  Settings,
  ClipboardList,
  GraduationCap,
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
        categoryName: string | null;
      };
    };

type UiConfig =
  | { ok: false }
  | {
      ok: true;
      modules: string[];
      categoryKey: string | null;
      focusedMode?: boolean;
      slug: string | null;
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

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  module: string;
  Icon: LucideIcon;
  tab: boolean;
  side: boolean;
  categories?: string[];
}> = [
  { href: "/app", label: "Hub", module: "hub", Icon: Home, tab: true, side: true },
  { href: "/app/queue", label: "Queue", module: "queue", Icon: ClipboardList, tab: true, side: true, categories: ["clinic"] },
  {
    href: "/app/coaching/matrix",
    label: "Matrix",
    module: "matrix",
    Icon: GraduationCap,
    tab: true,
    side: true,
    categories: ["coaching"],
  },
  { href: "/app/bookings", label: "Bookings", module: "bookings", Icon: CalendarDays, tab: true, side: true },
  { href: "/app/customers", label: "Customers", module: "customers", Icon: Users, tab: true, side: true },
  { href: "/app/students", label: "Students", module: "students", Icon: Users, tab: true, side: true, categories: ["coaching"] },
  { href: "/app/coaching/fees", label: "Fees", module: "fees", Icon: CalendarDays, tab: false, side: true, categories: ["coaching"] },
  { href: "/app/coaching/reports", label: "Reports", module: "reports", Icon: BarChart2, tab: false, side: true, categories: ["coaching"] },
  { href: "/app/settings", label: "Settings", module: "settings", Icon: Settings, tab: false, side: true },
  { href: "/app/more", label: "More", module: "more", Icon: MoreHorizontal, tab: true, side: false },
];

function VerticalBanner({ categoryKey, name }: { categoryKey: string; name: string }) {
  const config: Record<string, { icon: string; title: string; sub: string; className: string }> = {
    clinic: {
      icon: "🏥",
      title: "Clinic Mode",
      sub: "Live queue · walk-ins · token alerts via WhatsApp",
      className: "border-blue-200 bg-blue-50 text-blue-900",
    },
    coaching: {
      icon: "📚",
      title: "Coaching Mode",
      sub: "Batches · attendance · fees · parent alerts",
      className: "border-purple-200 bg-purple-50 text-purple-900",
    },
    salon: {
      icon: "✂️",
      title: "Salon Mode",
      sub: "Bookings · customers · WhatsApp reminders",
      className: "border-pink-200 bg-pink-50 text-pink-900",
    },
  };
  const c = config[categoryKey];
  if (!c) return null;
  return (
    <div className={`rounded-2xl border px-4 py-3 ${c.className}`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{c.icon}</span>
        <div>
          <div className="text-[13px] font-bold">{c.title}</div>
          <div className="text-[11px] opacity-80">{name} — {c.sub}</div>
        </div>
      </div>
    </div>
  );
}

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
  const categoryKey = ui?.ok ? ui.categoryKey : me?.ok ? me.business?.categoryKey : null;
  const focusedMode = ui?.ok ? ui.focusedMode : false;
  const isSuperAdmin = me?.ok && me.user.role === "SUPER_ADMIN";
  const businessName = me?.ok && me.business?.name ? me.business.name : "Dashboard";

  const navFilter = (item: (typeof NAV_ITEMS)[number]) => {
    if (!modules.has(item.module)) return false;
    if (item.categories && categoryKey && !item.categories.includes(categoryKey)) return false;
    if (categoryKey === "coaching" && item.href === "/app/customers" && item.tab) return false;
    return true;
  };

  const visibleTabs = NAV_ITEMS.filter((t) => t.tab && navFilter(t)).map((t) => ({
    ...t,
    label: t.label === "Hub" ? tn("today") : t.label === "Customers" ? (categoryKey === "coaching" ? "CRM" : tn("customers")) : t.label,
  }));

  const visibleSidebar = NAV_ITEMS.filter((t) => t.side && navFilter(t));

  return (
    <ToastProvider>
      <div className="min-h-screen bg-zinc-50 md:flex">
        <aside className="sticky top-0 hidden h-screen w-[240px] flex-shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
          <div className="border-b border-zinc-100 px-4 py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Workspace</div>
                <div className="mt-1 truncate text-[15px] font-semibold text-zinc-900">{businessName}</div>
              </div>
              <LangSwitcher />
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
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
            {isSuperAdmin ? (
              <div className="pt-3">
                <a
                  href="/app/superadmin"
                  className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800"
                >
                  <span aria-hidden>⚡</span> Super Admin Panel
                </a>
              </div>
            ) : null}

            {focusedMode && categoryKey ? (
              <div className="pt-3">
                <VerticalBanner categoryKey={categoryKey} name={businessName} />
              </div>
            ) : null}

            <main className="app-main animate-slide-up flex-1">{children}</main>

            <AppSupportChat />

            <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-100 bg-white/95 pb-safe backdrop-blur-md md:hidden">
              <div
                className="shell grid gap-0 py-1 !px-2"
                style={{ gridTemplateColumns: `repeat(${Math.max(visibleTabs.length, 1)}, 1fr)` }}
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
                      <span className={`text-[10px] font-semibold leading-none ${active ? "text-emerald-600" : "text-zinc-400"}`}>
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
