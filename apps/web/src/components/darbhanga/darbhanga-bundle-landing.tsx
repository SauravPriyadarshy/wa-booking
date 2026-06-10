import { DARBHANGA_PACKS, DARBHANGA_WHATSAPP_DEMO, signupUrl } from "@/lib/darbhanga-pack";

const WA_MSG = encodeURIComponent(
  "नमस्ते, Darbhanga WhatsApp Pack demo chahiye — salon/clinic/coaching. Kaise shuru karun?",
);

export function DarbhangaBundleLanding() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <a href="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-xs font-bold text-white">WA</div>
            <span className="text-[14px] font-semibold text-zinc-900">BookNow</span>
          </a>
          <a href="/login" className="h-9 rounded-xl border border-zinc-200 px-4 text-[13px] font-semibold leading-9 text-zinc-700">
            Login
          </a>
        </div>
      </nav>

      {/* Hero — one brutal promise */}
      <div className="bg-gradient-to-b from-emerald-600 to-emerald-700 text-white">
        <div className="mx-auto max-w-lg px-4 py-10">
          <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
            Darbhanga Launch
          </div>
          <h1 className="mt-4 text-[32px] font-black leading-tight tracking-tight">दरभंगा WhatsApp Pack</h1>
          <p className="mt-3 text-[18px] font-semibold text-emerald-100">तीन चीज़। पाँच मिनट। Phone pe kaam।</p>
          <p className="mt-2 text-[14px] leading-7 text-emerald-50/90">
            CRM नहीं। ERP नहीं। सिर्फ booking link, WhatsApp reminder, aur customer list — ek bundle mein।
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-[12px] font-semibold">
            <span className="rounded-full bg-white/20 px-3 py-1">₹0 shuru</span>
            <span className="rounded-full bg-white/20 px-3 py-1">No app for customer</span>
            <span className="rounded-full bg-white/20 px-3 py-1">Hindi support</span>
          </div>
        </div>
      </div>

      {/* Pick ONE pack */}
      <div className="mx-auto max-w-lg px-4 py-8">
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-zinc-400">Apna pack chuno — sirf ek</h2>
        <p className="mt-1 text-[15px] font-semibold text-zinc-800">Teen cheez milegi. Baaki sab baad mein।</p>

        <div className="mt-5 grid gap-4">
          {DARBHANGA_PACKS.map((pack) => (
            <div
              key={pack.key}
              className="overflow-hidden rounded-2xl border-2 border-zinc-100 bg-white shadow-sm transition hover:border-emerald-300"
            >
              <div className="border-b border-zinc-50 bg-zinc-50/80 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{pack.icon}</span>
                  <div>
                    <div className="text-[17px] font-black text-zinc-900">{pack.titleHi}</div>
                    <div className="text-[12px] text-zinc-500">{pack.taglineHi}</div>
                  </div>
                </div>
              </div>
              <ul className="space-y-2 px-4 py-4">
                {pack.bulletsHi.map((b, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-[14px] font-medium text-zinc-800">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-700">
                      {i + 1}
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <div className="border-t border-zinc-50 px-4 py-3">
                <a
                  href={signupUrl(pack.key)}
                  className="flex h-12 items-center justify-center rounded-xl bg-emerald-600 text-[15px] font-bold text-white shadow-md shadow-emerald-200 transition hover:bg-emerald-700 active:scale-[0.99]"
                >
                  {pack.titleHi} — Free shuru karo →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works — 3 steps only */}
      <div className="bg-zinc-50 py-8">
        <div className="mx-auto max-w-lg px-4">
          <h2 className="text-[18px] font-bold text-zinc-900">Kaise chalega?</h2>
          <div className="mt-4 grid gap-3">
            {[
              { n: "1", t: "Mobile se signup", d: "OTP aayega। Shop ka naam aur pack chuno।" },
              { n: "2", t: "Link share karo", d: "WhatsApp group, shop board, ya QR print।" },
              { n: "3", t: "Booking aati hai", d: "Confirm + reminder automatic। Customer list ready।" },
            ].map(({ n, t, d }) => (
              <div key={n} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-[14px] font-black text-white">
                  {n}
                </span>
                <div>
                  <div className="text-[14px] font-bold text-zinc-900">{t}</div>
                  <div className="mt-0.5 text-[13px] leading-5 text-zinc-600">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social proof — Darbhanga only */}
      <div className="mx-auto max-w-lg px-4 py-8">
        <h2 className="text-[18px] font-bold text-zinc-900">Darbhanga wale bolte hain</h2>
        <blockquote className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
          <p className="text-[14px] leading-7 text-zinc-800">
            &ldquo;Pehle WhatsApp pe manually booking leta tha। Ab link share karta hoon — sab system mein। Missed booking band।&rdquo;
          </p>
          <footer className="mt-3 text-[12px] font-semibold text-zinc-500">— Rakesh, Raj Hair Studio, Darbhanga</footer>
        </blockquote>
      </div>

      {/* WhatsApp demo CTA */}
      <div className="border-t border-zinc-100 bg-white py-8">
        <div className="mx-auto max-w-lg px-4 text-center">
          <p className="text-[14px] text-zinc-600">Pehle demo dekhna hai? WhatsApp pe message karo।</p>
          <a
            href={`https://wa.me/${DARBHANGA_WHATSAPP_DEMO}?text=${WA_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-12 items-center gap-2 rounded-2xl bg-[#25D366] px-6 text-[15px] font-bold text-white shadow-lg"
          >
            WhatsApp pe demo →
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-8 text-center text-[11px] text-zinc-400">
        <a href="/" className="hover:underline">BookNow Home</a>
        {" · "}
        <a href="/city/laheriasarai" className="hover:underline">Laheriasarai</a>
      </div>
    </div>
  );
}
