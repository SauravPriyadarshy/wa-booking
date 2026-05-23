"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { apiBase } from "@/lib/api-base";
import { ToastProvider } from "@/components/ui";

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

/* ─── Nav icons ────────────────────────────────────────────────── */
function HubIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 22V12h6v10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BookingsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
      <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CustomersIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
      <circle cx="9" cy="7" r="4" strokeLinecap="round" />
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 8v6m-3-3h6" strokeLinecap="round" />
    </svg>
  );
}
function MoreIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}
function WhatsAppIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
      <path
        d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
      <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SupportIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
      <circle cx="12" cy="12" r="10" strokeLinecap="round" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" strokeLinecap="round" />
    </svg>
  );
}
function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="h-5 w-5">
      <circle cx="12" cy="12" r="3" strokeLinecap="round" />
      <path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        strokeLinecap="round"
      />
    </svg>
  );
}

const NAV_TABS = [
  { href: "/app", label: "Hub", module: "hub", Icon: HubIcon },
  { href: "/app/bookings", label: "Bookings", module: "bookings", Icon: BookingsIcon },
  { href: "/app/customers", label: "Customers", module: "customers", Icon: CustomersIcon },
  { href: "/app/more", label: "More", module: null, Icon: MoreIcon },
] as const;

const SIDEBAR_LINKS = [
  { href: "/app", label: "Hub", module: "hub" as const, Icon: HubIcon },
  { href: "/app/bookings", label: "Bookings", module: "bookings" as const, Icon: BookingsIcon },
  { href: "/app/customers", label: "Customers", module: "customers" as const, Icon: CustomersIcon },
  { href: "/app/whatsapp", label: "WhatsApp", module: "whatsapp-connect" as const, Icon: WhatsAppIcon },
  { href: "/app/support", label: "Support", module: "support" as const, Icon: SupportIcon },
  { href: "/app/analytics", label: "Insights", module: "analytics" as const, Icon: ChartIcon },
  { href: "/app/settings", label: "Settings", module: "more" as const, Icon: SettingsIcon },
] as const;

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
                    <Icon active={active} />
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
                      <Icon active={active} />
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
