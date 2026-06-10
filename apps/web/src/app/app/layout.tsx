"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { apiBase } from "@/lib/api-base";
import { ToastProvider } from "@/components/ui";
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

function linkActive(pathname: string, href: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  const h = href.replace(/\/$/, "") || "/";
  if (h === "/app") return p === "/app";
  return p === h || p.startsWith(`${h}/`);
}

const NAV_TABS: Array<{ href: string; label: string; module: string | null; Icon: LucideIcon }> = [
  { href: "/app", label: "Hub", module: "hub", Icon: Home },
  { href: "/app/bookings", label: "Bookings", module: "bookings", Icon: CalendarDays },
  { href: "/app/customers", label: "Customers", module: "customers", Icon: Users },
  { href: "/app/more", label: "More", module: null, Icon: MoreHorizontal },
];

const SIDEBAR_LINKS: Array<{ href: string; label: string; module: string; Icon: LucideIcon }> = [
  { href: "/app", label: "Hub", module: "hub", Icon: Home },
  { href: "/app/bookings", label: "Bookings", module: "bookings", Icon: CalendarDays },
  { href: "/app/customers", label: "Customers", module: "customers", Icon: Users },
  { href: "/app/whatsapp", label: "WhatsApp", module: "whatsapp-connect", Icon: MessageCircle },
  { href: "/app/support", label: "Support", module: "support", Icon: LifeBuoy },
  { href: "/app/analytics", label: "Insights", module: "analytics", Icon: BarChart2 },
  { href: "/app/settings", label: "Settings", module: "more", Icon: Settings },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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

  const visibleTabs = NAV_TABS.filter((t) => show(t.module));
  const visibleSidebar = SIDEBAR_LINKS.filter((t) => show(t.module));

  return (
    <ToastProvider>
      <div className="min-h-screen bg-zinc-50 md:flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[240px] flex-shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
          <div className="border-b border-zinc-100 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Workspace</div>
            <div className="mt-1 truncate text-[15px] font-semibold text-zinc-900">
              {me?.ok && me.business?.name ? me.business.name : "Dashboard"}
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
          </nav>
        </aside>

        <div className="relative flex min-h-screen flex-1 flex-col">
          <div className="relative mx-auto w-full max-w-md flex-1 md:max-w-5xl">
            {isSuperAdmin && (
              <div className="px-4 pt-3">
                <a
                  href="/app/superadmin/businesses"
                  className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800"
                >
                  <span aria-hidden>⚡</span> Super Admin Panel
                </a>
              </div>
            )}

            <main className="animate-slide-up pb-24 md:pb-8">
              {children}
            </main>

            <a
              href="/app/bookings?new=1"
              className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-2xl font-light text-white shadow-lg shadow-emerald-200/60 tap-highlight-none transition-transform hover:bg-emerald-700 active:scale-95 md:bottom-8 md:right-8"
              aria-label="New booking"
            >
              +
            </a>

            <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-zinc-100 bg-white/95 pb-safe backdrop-blur-md md:hidden">
              <div
                className="mx-auto grid w-full max-w-md gap-0 px-1 py-1"
                style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)` }}
              >
                {visibleTabs.map(({ href, label, Icon }) => {
                  const active = linkActive(pathname, href);
                  return (
                    <a
                      key={href}
                      href={href}
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
                    </a>
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
