"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { resolveLocale, type AppLocale } from "@/lib/locale";

type GuideEntry = {
  keywords: string[];
  answerEn: string;
  answerHi: string;
};

const KNOWLEDGE: GuideEntry[] = [
  {
    keywords: ["help", "madad", "kaise", "how", "benefit", "fayda"],
    answerEn: "BookNow helps you manage bookings, customers, WhatsApp reminders, and follow-ups from one mobile dashboard. Most owners save 1–3 hours daily.",
    answerHi: "BookNow se booking, customer, WhatsApp reminder aur follow-up ek hi mobile dashboard se ho jaata hai. Zyada tar owners roz 1–3 ghanta bachate hain.",
  },
  {
    keywords: ["plan", "price", "free", "plus", "pro", "cost", "kitna"],
    answerEn: "Start Free with 1 staff and basic CRM. Plus adds unlimited customers, health score, and reactivation tools. Pro adds reports, AI guide, and branches.",
    answerHi: "Free se shuru karein — 1 staff, basic CRM. Plus mein unlimited customer, health score, reactivation. Pro mein reports aur advanced features.",
  },
  {
    keywords: ["setup", "time", "minute", "technical", "knowledge", "samay"],
    answerEn: "Setup takes under 5 minutes. No technical knowledge needed — pick your business type, add services, connect WhatsApp. Staff can use it with zero training.",
    answerHi: "Setup 5 minute se kam. Koi technical knowledge nahi chahiye — business type chunein, services add karein, WhatsApp connect karein. Staff bina training use kar sakte hain.",
  },
  {
    keywords: ["staff", "team", "employee", "karmachari"],
    answerEn: "Yes! Staff get their own login with limited access. Salon stylists, clinic reception, coaching teachers — everyone can use it on their phone.",
    answerHi: "Haan! Staff ko alag login milta hai. Salon, clinic, coaching — sab apne phone se use kar sakte hain.",
  },
  {
    keywords: ["whatsapp", "wa", "message", "reminder"],
    answerEn: "WhatsApp sends automatic booking confirmations, 24h reminders, fee reminders, and inactive customer messages — all from your business number.",
    answerHi: "WhatsApp se auto booking confirm, 24 ghante pehle reminder, fee reminder, aur inactive customer message — sab aapke business number se.",
  },
  {
    keywords: ["coaching", "clinic", "salon", "home", "doctor"],
    answerEn: "We have ready packs for coaching (fees + attendance), clinics (queue + follow-ups), salons (reactivation), and home services (technician scheduling).",
    answerHi: "Coaching ke liye fees + attendance, clinic ke liye queue + follow-up, salon ke liye reactivation, home service ke liye technician schedule — sab ready hai.",
  },
  {
    keywords: ["demo", "try", "dekh", "success", "business"],
    answerEn: "Try our Business Success demo — pick your business type and see a live interactive preview with real scenarios. No signup needed!",
    answerHi: "Business Success demo dekhein — apna business type chunein aur live preview dekhein. Signup ki zaroorat nahi!",
  },
];

const QUICK_PROMPTS = [
  { key: "help", en: "How will this help me?", hi: "Yeh mujhe kaise madad karega?" },
  { key: "plan", en: "Which plan should I choose?", hi: "Kaunsa plan lu?" },
  { key: "setup", en: "How long does setup take?", hi: "Setup kitna time?" },
  { key: "staff", en: "Can staff use it?", hi: "Staff use kar sakte hain?" },
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
    ? "I can help with plans, setup time, WhatsApp features, and how BookNow fits your business. Try asking about coaching, clinic, or salon!"
    : "Main plans, setup, WhatsApp features aur aapke business ke liye BookNow ke baare mein bata sakta hoon. Coaching, clinic ya salon puchhiye!";
}

type Message = { role: "user" | "bot"; text: string };

export function BusinessGuideWidget() {
  const tg = useTranslations("businessGuide");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const locale = useMemo(() => readLocale(), [open]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const reply = matchAnswer(trimmed, locale);
    setMessages((m) => [...m, { role: "user", text: trimmed }, { role: "bot", text: reply }]);
    setInput("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-2xl shadow-lg ring-4 ring-white transition hover:scale-105 active:scale-95 md:bottom-6"
        aria-label={tg("openLabel")}
      >
        💬
      </button>

      {open ? (
        <div className="fixed bottom-40 right-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl md:bottom-20">
          <div className="flex items-center justify-between bg-emerald-600 px-4 py-3 text-white">
            <div>
              <div className="text-[14px] font-bold">{tg("title")}</div>
              <div className="text-[11px] text-emerald-100">{tg("subtitle")}</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-[18px] hover:bg-white/10" aria-label={tg("close")}>
              ×
            </button>
          </div>

          <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto p-3">
            {messages.length === 0 ? (
              <p className="text-[13px] leading-relaxed text-zinc-500">{tg("welcome")}</p>
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
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => send(locale === "en" ? p.en : p.hi)}
                className="rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-zinc-600 hover:border-emerald-300 hover:text-emerald-700"
              >
                {locale === "en" ? p.en : p.hi}
              </button>
            ))}
          </div>

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
              placeholder={tg("placeholder")}
              className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-[14px] outline-none focus:border-emerald-400"
            />
            <button type="submit" className="rounded-xl bg-emerald-600 px-4 text-[13px] font-bold text-white">
              →
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
