import { loadDarbhangaConfig, loadPlatformConfig } from "@/lib/platform-content";
import { MarketingSection, MarketingShell } from "@/components/layout/marketing-shell";
import { signupUrl, type DarbhangaPack } from "@/lib/darbhanga-pack";

type Props = {
  config: Awaited<ReturnType<typeof loadDarbhangaConfig>>;
  platform: Awaited<ReturnType<typeof loadPlatformConfig>>;
};

export async function DarbhangaBundleLanding() {
  const [config, platform] = await Promise.all([loadDarbhangaConfig("hi"), loadPlatformConfig()]);
  return <DarbhangaBundleView config={config} platform={platform} />;
}

function DarbhangaBundleView({ config, platform }: Props) {
  const waMsg = encodeURIComponent(config.waDemoMessage);

  return (
    <MarketingShell>
      <div className="bg-gradient-to-b from-emerald-600 to-emerald-700 text-white">
        <div className="shell py-10 md:py-14">
          <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
            {config.badge}
          </div>
          <h1 className="mt-4 text-[32px] font-black leading-tight tracking-tight md:text-[40px]">{config.heroTitle}</h1>
          <p className="mt-3 text-[18px] font-semibold text-emerald-100">{config.heroTagline}</p>
          <p className="mt-2 max-w-2xl text-[14px] leading-7 text-emerald-50/90">{config.heroSubtitle}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-[12px] font-semibold">
            <span className="rounded-full bg-white/20 px-3 py-1">₹0 shuru</span>
            <span className="rounded-full bg-white/20 px-3 py-1">No app for customer</span>
            <span className="rounded-full bg-white/20 px-3 py-1">Hindi support</span>
          </div>
        </div>
      </div>

      <MarketingSection>
        <h2 className="text-[13px] font-bold uppercase tracking-widest text-zinc-400">Apna pack chuno — sirf ek</h2>
        <p className="mt-1 text-[15px] font-semibold text-zinc-800">Teen cheez milegi. Baaki sab baad mein।</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {config.packs.map((pack: DarbhangaPack) => (
            <div
              key={pack.key}
              className="flex flex-col overflow-hidden rounded-2xl border-2 border-zinc-100 bg-white shadow-sm transition hover:border-emerald-300"
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
              <ul className="flex-1 space-y-2 px-4 py-4">
                {pack.bulletsHi.map((b, i) => (
                  <li key={b} className="flex items-center gap-2.5 text-[14px] font-medium text-zinc-800">
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
      </MarketingSection>

      <MarketingSection muted>
        <h2 className="text-[18px] font-bold text-zinc-900">Kaise chalega?</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {config.steps.map(({ n, t, d }) => (
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
      </MarketingSection>

      <MarketingSection>
        <h2 className="text-[18px] font-bold text-zinc-900">Darbhanga wale bolte hain</h2>
        <blockquote className="mt-4 max-w-2xl rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
          <p className="text-[14px] leading-7 text-zinc-800">&ldquo;{config.testimonialQuote}&rdquo;</p>
          <footer className="mt-3 text-[12px] font-semibold text-zinc-500">{config.testimonialAuthor}</footer>
        </blockquote>
      </MarketingSection>

      <MarketingSection>
        <div className="text-center">
          <p className="text-[14px] text-zinc-600">Demo ya sawaal? Seedha call karo।</p>
          <a
            href={`tel:+91${platform.contactPhone}`}
            className="mt-3 inline-flex h-14 items-center rounded-2xl bg-zinc-900 px-8 text-[20px] font-black tracking-wide text-white shadow-lg"
          >
            📞 {platform.contactPhone}
          </a>
          <p className="mt-3 text-[12px] text-zinc-400">ya WhatsApp</p>
          <a
            href={`https://wa.me/${platform.whatsappNumber}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex h-11 items-center gap-2 rounded-2xl bg-[#25D366] px-6 text-[14px] font-bold text-white"
          >
            WhatsApp pe likho →
          </a>
        </div>
      </MarketingSection>

      <div className="shell pb-8 text-center text-[11px] text-zinc-400">
        <a href="/" className="hover:underline">BookNow Home</a>
        {" · "}
        <a href="/city/laheriasarai" className="hover:underline">Laheriasarai</a>
      </div>
    </MarketingShell>
  );
}
