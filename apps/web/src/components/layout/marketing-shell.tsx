import type { ReactNode } from "react";

export function MarketingNav({ loginHref = "/login" }: { loginHref?: string }) {
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/95 backdrop-blur">
      <div className="shell flex h-14 items-center justify-between">
        <a href="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-sm font-bold text-white">WA</div>
          <span className="text-[15px] font-semibold text-zinc-900">BookNow</span>
        </a>
        <a
          href={loginHref}
          className="h-9 rounded-xl border border-zinc-200 px-4 text-[13px] font-semibold leading-9 text-zinc-700"
        >
          Login
        </a>
      </div>
    </nav>
  );
}

export function MarketingShell({ children, banner }: { children: ReactNode; banner?: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      {banner}
      {children}
    </div>
  );
}

export function MarketingSection({
  children,
  className = "",
  muted,
}: {
  children: ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <section className={muted ? `bg-zinc-50 py-8 md:py-10 ${className}` : `py-8 md:py-10 ${className}`}>
      <div className="shell">{children}</div>
    </section>
  );
}
