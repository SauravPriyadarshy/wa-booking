import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LangSwitcher } from "@/components/lang-switcher";

export const metadata: Metadata = {
  title: "Start Free — BookNow | WhatsApp Booking for Indian Businesses",
  description:
    "Setup your WhatsApp booking page in 5 minutes. Free for salons, clinics, coaching centers and home services across India.",
  openGraph: {
    title: "Start Free — BookNow",
    description: "Setup your WhatsApp booking page in 5 minutes. Free forever.",
    locale: "en_IN",
    siteName: "BookNow",
  },
};

export default function SignupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto flex w-full max-w-md items-center justify-end px-4 pt-4">
        <LangSwitcher />
      </div>
      <div className="mx-auto w-full max-w-md px-4 py-2">{children}</div>
    </div>
  );
}
