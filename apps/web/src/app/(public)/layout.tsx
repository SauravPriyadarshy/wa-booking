import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Login | WhatsApp Booking System",
  description: "Log in to manage your bookings, customers and WhatsApp messages.",
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto w-full max-w-md px-4 py-6">{children}</div>
    </div>
  );
}

