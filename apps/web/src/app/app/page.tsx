"use client";

import { useEffect, useState } from "react";
import { apiBase } from "@/lib/api-base";
import { HubDashboard } from "@/components/app/hub-dashboard";
import { DashboardSkeleton } from "@/components/ui";

type UserInfo = {
  role: "SUPER_ADMIN" | "BUSINESS_ADMIN" | "STAFF" | null;
  hasBusiness: boolean;
};

const SUPER_LINKS = [
  { href: "/app/superadmin/businesses", label: "Manage Businesses", sub: "Create new service providers (doctor, spa, salon…)", icon: "🏢" },
  { href: "/app/superadmin/features", label: "Feature Flags", sub: "Enable/disable modules per business", icon: "⚙️" },
  { href: "/app/superadmin/content", label: "Content Editor", sub: "Landing page, SEO, WhatsApp templates, city pages", icon: "✏️" },
] as const;

function SuperAdminHome() {
  return (
    <div className="px-4 pb-28 pt-4 md:pb-8">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">Super Admin</div>
      <h1 className="mt-1 text-[22px] font-semibold text-zinc-900">Admin Dashboard</h1>
      <p className="mt-1 text-[13px] text-zinc-500">Manage all businesses, content, and feature flags from here.</p>

      <div className="mt-5 grid gap-3">
        {SUPER_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="flex items-start gap-3 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md active:scale-[0.99]"
          >
            <span className="mt-0.5 text-2xl">{l.icon}</span>
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-zinc-900">{l.label}</div>
              <div className="mt-0.5 text-[12px] text-zinc-500">{l.sub}</div>
            </div>
            <span className="ml-auto mt-1 shrink-0 text-zinc-300">›</span>
          </a>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
        <div className="text-[12px] font-semibold text-zinc-500 uppercase tracking-wide">Quick Info</div>
        <div className="mt-2 space-y-1 text-[13px] text-zinc-600">
          <div>• Create a new business → set its admin username & password → share login link</div>
          <div>• After creation, login as business admin to add services, staff & business hours</div>
          <div>• Enable/disable features (WhatsApp, analytics, AI) per business via Feature Flags</div>
          <div>• Edit all site content (landing page, templates) without code via Content Editor</div>
        </div>
      </div>

      <button
        type="button"
        className="mt-6 block w-full py-2 text-center text-[13px] font-medium text-zinc-400"
        onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
      >
        Log out
      </button>
    </div>
  );
}

export default function AppHome() {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { setUser({ role: null, hasBusiness: false }); return; }

    (async () => {
      try {
        const [meRes, bizRes] = await Promise.all([
          fetch(`${apiBase()}/me`, { headers: { authorization: `Bearer ${t}` } }),
          fetch(`${apiBase()}/businesses/me`, { headers: { authorization: `Bearer ${t}` } }),
        ]);
        const me = await meRes.json();
        setUser({ role: me?.user?.role ?? null, hasBusiness: bizRes.ok });
      } catch {
        setUser({ role: null, hasBusiness: false });
      }
    })();
  }, []);

  if (user === null) return <DashboardSkeleton />;

  // Super admin gets their own dedicated dashboard
  if (user.role === "SUPER_ADMIN") return <SuperAdminHome />;

  // Business user without a business yet → onboarding
  if (!user.hasBusiness) {
    return (
      <div className="px-4 py-4">
        <div className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="text-[13px] font-medium text-zinc-500">Start here</div>
          <div className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            Create your business
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
            You&apos;re one step away from your booking link and QR. Most businesses finish in under three minutes.
          </p>
          <a
            href="/app/onboarding"
            className="mt-4 flex h-11 items-center justify-center rounded-xl bg-emerald-600 text-[15px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Start setup
          </a>
        </div>
        <a
          href="/login"
          className="mt-4 block text-center text-[13px] font-medium text-emerald-700"
          onClick={() => localStorage.removeItem("token")}
        >
          Logout
        </a>
      </div>
    );
  }

  return (
    <div>
      <HubDashboard />
      <div className="px-4 pb-2">
        <a
          href="/login"
          className="block py-3 text-center text-[13px] font-medium text-zinc-500"
          onClick={() => localStorage.removeItem("token")}
        >
          Log out
        </a>
      </div>
    </div>
  );
}
