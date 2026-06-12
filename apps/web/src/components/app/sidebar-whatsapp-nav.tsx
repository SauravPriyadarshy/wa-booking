"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { apiBase } from "@/lib/api-base";

function linkActive(pathname: string, href: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  const h = href.replace(/\/$/, "") || "/";
  return p === h || p.startsWith(`${h}/`);
}

export function SidebarWhatsAppNav() {
  const pathname = usePathname();
  const tn = useTranslations("nav");
  const href = "/app/whatsapp";
  const active = linkActive(pathname, href);
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${apiBase()}/whatsapp/status`, {
          headers: { authorization: `Bearer ${token}` },
        });
        const data = (await res.json()) as { status?: string };
        if (!cancelled) setConnected((data.status ?? "").toUpperCase() === "CONNECTED");
      } catch {
        if (!cancelled) setConnected(false);
      }
    }
    void poll();
    const id = setInterval(() => void poll(), 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const dotColor = connected === null ? "bg-zinc-300" : connected ? "bg-emerald-500" : "bg-red-500";

  return (
    <a
      href={href}
      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-colors tap-highlight-none ${
        active ? "bg-emerald-50 text-emerald-800" : "text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      <span className={`relative ${active ? "text-emerald-600" : "text-zinc-400"}`}>
        <MessageCircle className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
        <span
          className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${dotColor}`}
          aria-hidden
        />
      </span>
      {tn("whatsapp")}
    </a>
  );
}
