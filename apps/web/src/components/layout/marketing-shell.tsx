import type { ReactNode } from "react";
import { MarketingNav } from "@/components/layout/marketing-nav";
import { BusinessGuideWidget } from "@/components/marketing/business-guide";

export { MarketingNav };

export function MarketingShell({ children, banner, guide = true }: { children: ReactNode; banner?: ReactNode; guide?: boolean }) {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      {banner}
      {children}
      {guide ? <BusinessGuideWidget /> : null}
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
