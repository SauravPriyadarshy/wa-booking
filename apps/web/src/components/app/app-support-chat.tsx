"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { apiBase } from "@/lib/api-base";
import { resolveLocale, type AppLocale } from "@/lib/locale";

type GuideEntry = {
  keywords: string[];
  answerEn: string;
  answerHi: string;
};

const KNOWLEDGE: GuideEntry[] = [
  {
    keywords: ["booking", "book", "appointment", "slot"],
    answerEn: "Open Bookings → tap New booking at the top. Pick customer, service, date, and time. Past slots and booked times are greyed out.",
    answerHi: "Bookings kholein → upar New booking dabayein. Customer, service, date aur time chunein. Purane aur booked slots grey dikhenge.",
  },
  {
    keywords: ["whatsapp", "wa", "connect", "qr"],
    answerEn: "Go to WhatsApp in the bottom nav → Get QR / connect → scan with WhatsApp → Linked devices. Reminders send automatically after connect.",
    answerHi: "WhatsApp tab → Get QR / connect → WhatsApp se Linked devices scan karein. Connect ke baad reminders automatic jaate hain.",
  },
  {
    keywords: ["plan", "plus", "pro", "upgrade", "limit"],
    answerEn: "Free plan: 50 customers, 1 staff. Plus unlocks health score, reactivation, coaching. Enter an activation code during onboarding or ask admin.",
    answerHi: "Free: 50 customers, 1 staff. Plus mein health score, reactivation, coaching. Onboarding par activation code daalein ya admin se puchhein.",
  },
  {
    keywords: ["customer", "crm", "add"],
    answerEn: "Customers tab → add from the list or quick-add name + phone when creating a booking.",
    answerHi: "Customers tab → list se add karein ya booking banate waqt name + phone se quick add.",
  },
  {
    keywords: ["help", "how", "kaise", "setup"],
    answerEn: "Finish onboarding (business name → category → services → hours → WhatsApp). Hub shows today's bookings and quick actions.",
    answerHi: "Onboarding poora karein (naam → category → services → hours → WhatsApp). Hub par aaj ki bookings aur quick actions milte hain.",
  },
];

const QUICK = [
  { en: "How do I add a booking?", hi: "Booking kaise add karein?" },
  { en: "Connect WhatsApp", hi: "WhatsApp connect kaise?" },
  { en: "Plans & limits", hi: "Plan aur limit?" },
];

function readLocale(): AppLocale {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|;\s*)locale=([^;]+)/);
  return resolveLocale(m?.[1]);
}

function matchAnswer(input: string, locale: AppLocale): string {
  const q = input.toLowerCase();
  for (const entry of KNOWLEDGE) {
    if (entry.keywords.some((k) => q.includes(k))) {
      return locale === "en" ? entry.answerEn : entry.answerHi;
    }
  }
  return locale === "en"
    ? "I can help with bookings, WhatsApp, plans, and customers. Need a person? Tap Send to admin below."
    : "Main bookings, WhatsApp, plan aur customers mein madad kar sakta hoon. Insaan chahiye? Neeche Send to admin dabayein.";
}

type Message = { role: "user" | "bot"; text: string };

export function AppSupportChat() {
  const t = useTranslations("appSupport");
  const [open, setOpen] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [input, setInput] = useState("");
  const [adminQuery, setAdminQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [adminSent, setAdminSent] = useState(false);
  const locale = useMemo(() => readLocale(), [open]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((m) => [...m, { role: "user", text: trimmed }, { role: "bot", text: matchAnswer(trimmed, locale) }]);
    setInput("");
  }

  async function sendToAdmin() {
    const title = adminQuery.trim();
    if (title.length < 5) return;
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Login required");
      const res = await fetch(`${apiBase()}/support/tickets`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, priority: "NORMAL", internalNotes: "Submitted from in-app help chat" }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(d.message ?? "Failed");
      }
      setAdminSent(true);
      setMessages((m) => [...m, { role: "bot", text: t("adminSent") }]);
      setShowAdmin(false);
      setAdminQuery("");
    } catch {
      setMessages((m) => [...m, { role: "bot", text: t("adminFailed") }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-xl shadow-lg ring-4 ring-white transition hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
        aria-label={t("openLabel")}
      >
        💬
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="flex max-h-[min(520px,90vh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-emerald-600 px-4 py-3 text-white">
              <div>
                <div className="text-[14px] font-bold">{t("title")}</div>
                <div className="text-[11px] text-emerald-100">{t("subtitle")}</div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-[18px] hover:bg-white/10" aria-label={t("close")}>
                ×
              </button>
            </div>

            <div className="flex max-h-[240px] flex-col gap-2 overflow-y-auto p-3">
              {messages.length === 0 ? (
                <p className="text-[13px] leading-relaxed text-zinc-500">{t("welcome")}</p>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[90%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                      m.role === "user" ? "ml-auto bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    {m.text}
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap gap-1 border-t border-zinc-100 px-3 py-2">
              {QUICK.map((p) => (
                <button
                  key={p.en}
                  type="button"
                  onClick={() => send(locale === "en" ? p.en : p.hi)}
                  className="rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 hover:border-emerald-300"
                >
                  {locale === "en" ? p.en : p.hi}
                </button>
              ))}
            </div>

            {showAdmin ? (
              <div className="border-t border-zinc-100 p-3">
                <textarea
                  value={adminQuery}
                  onChange={(e) => setAdminQuery(e.target.value)}
                  placeholder={t("adminPlaceholder")}
                  className="min-h-[72px] w-full rounded-xl border border-zinc-200 px-3 py-2 text-[14px] outline-none focus:border-emerald-400"
                />
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => setShowAdmin(false)} className="flex-1 rounded-xl border border-zinc-200 py-2 text-[13px] font-semibold text-zinc-600">
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    disabled={sending || adminQuery.trim().length < 5}
                    onClick={() => void sendToAdmin()}
                    className="flex-1 rounded-xl bg-emerald-600 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
                  >
                    {sending ? t("sending") : t("sendAdmin")}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <form
                  className="flex gap-2 border-t border-zinc-100 p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(input);
                  }}
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t("placeholder")}
                    className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-[14px] outline-none focus:border-emerald-400"
                  />
                  <button type="submit" className="rounded-xl bg-emerald-600 px-4 text-[13px] font-bold text-white">
                    →
                  </button>
                </form>
                {!adminSent ? (
                  <button
                    type="button"
                    onClick={() => setShowAdmin(true)}
                    className="border-t border-zinc-100 py-2.5 text-center text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    {t("contactAdmin")}
                  </button>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
