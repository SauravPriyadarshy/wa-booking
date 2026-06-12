import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LangSwitcher } from "@/components/lang-switcher";

export const metadata: Metadata = {
  title: "Reset Password | BookNow",
  description: "Reset your BookNow password using a WhatsApp verification code.",
};

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto flex w-full max-w-md items-center justify-end px-4 pt-4">
        <LangSwitcher />
      </div>
      <div className="mx-auto w-full max-w-md px-4 py-2 pb-10">{children}</div>
    </div>
  );
}
