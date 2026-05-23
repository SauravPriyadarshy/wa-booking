import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "WhatsApp Booking System for Indian Businesses | BookNow",
    template: "%s | BookNow",
  },
  description:
    "Manage bookings, customers, and WhatsApp reminders in one place. Free for salons, clinics, and home services. Setup in 5 minutes.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_WEB_URL ?? "https://booknow.app"),
  openGraph: {
    siteName: "BookNow",
    type: "website",
    locale: "en_IN",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const messages = await getMessages();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
