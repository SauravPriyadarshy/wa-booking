"use client";

import { useEffect, useState } from "react";
import { Link2, MessageCircle, CalendarDays, ChevronDown } from "lucide-react";
import { apiBase } from "@/lib/api-base";

type Props = {
  packLabel: string;
  waConnected: boolean;
  bookingUrl: string;
  onCopyLink: () => void;
  onDismiss?: () => void;
  contactPhone?: string;
};

export function DarbhangaLaunchStrip({
  packLabel,
  waConnected,
  bookingUrl,
  onCopyLink,
  onDismiss,
  contactPhone: contactPhoneProp,
}: Props) {
  const [contactPhone, setContactPhone] = useState(contactPhoneProp ?? "7500002221");

  useEffect(() => {
    if (contactPhoneProp) {
      setContactPhone(contactPhoneProp);
      return;
    }
    fetch(`${apiBase()}/site-content/bundle?locale=en`)
      .then((r) => r.json())
      .then((d: { platform?: Record<string, string> }) => {
        const phone = d.platform?.["platform.contact_phone"];
        if (phone) setContactPhone(phone);
      })
      .catch(() => {});
  }, [contactPhoneProp]);

  return (
    <section className="animate-slide-up rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">Darbhanga Pack</div>
          <h2 className="mt-0.5 text-[17px] font-black text-zinc-900">{packLabel} — ab yeh karo</h2>
          <p className="mt-1 text-[12px] text-zinc-600">Teen step। Bas itna। Baaki features neeche &ldquo;और&rdquo; mein hai।</p>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold text-zinc-400 hover:bg-zinc-100"
          >
            Hide
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={onCopyLink}
          disabled={!bookingUrl}
          className="flex min-h-[56px] items-center gap-3 rounded-xl bg-emerald-600 px-4 text-left text-white shadow-md transition hover:bg-emerald-700 disabled:opacity-50 active:scale-[0.99]"
        >
          <Link2 className="h-6 w-6 shrink-0" />
          <div>
            <div className="text-[14px] font-bold">1. Link share karo</div>
            <div className="text-[11px] text-emerald-100">WhatsApp group / customer ko bhejo</div>
          </div>
        </button>

        <a
          href={waConnected ? "/app/inbox" : "/app/whatsapp"}
          className={`flex min-h-[56px] items-center gap-3 rounded-xl px-4 text-left shadow-sm transition active:scale-[0.99] ${
            waConnected
              ? "border border-emerald-200 bg-white text-zinc-900"
              : "border-2 border-amber-300 bg-amber-50 text-zinc-900"
          }`}
        >
          <MessageCircle className={`h-6 w-6 shrink-0 ${waConnected ? "text-emerald-600" : "text-amber-600"}`} />
          <div>
            <div className="text-[14px] font-bold">
              2. WhatsApp {waConnected ? "connected ✓" : "jodo — QR scan"}
            </div>
            <div className="text-[11px] text-zinc-500">Reminder automatic jayega</div>
          </div>
        </a>

        <a
          href="/app/bookings"
          className="flex min-h-[56px] items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 text-left text-zinc-900 shadow-sm transition hover:border-emerald-200 active:scale-[0.99]"
        >
          <CalendarDays className="h-6 w-6 shrink-0 text-blue-600" />
          <div>
            <div className="text-[14px] font-bold">3. Aaj ki booking dekho</div>
            <div className="text-[11px] text-zinc-500">Yahan se confirm karo</div>
          </div>
        </a>
      </div>

      <details className="mt-3 group">
        <summary className="flex cursor-pointer list-none items-center justify-center gap-1 py-2 text-[12px] font-semibold text-zinc-500 marker:content-none">
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          Samajh nahi aaya? Demo WhatsApp pe
        </summary>
        <p className="pb-2 text-center text-[11px] text-zinc-400">
          Help chahiye?{" "}
          <a href={`tel:+91${contactPhone}`} className="font-semibold text-emerald-700">
            Call {contactPhone}
          </a>
        </p>
      </details>
    </section>
  );
}
