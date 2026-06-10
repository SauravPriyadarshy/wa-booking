import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "WhatsApp Booking System for Indian Businesses | BookNow",
    template: "%s | BookNow",
  },
  description:
    "Manage bookings, customers, and WhatsApp reminders in one place. Free for salons, clinics, and home services. Setup in 5 minutes.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_WEB_URL ?? "https://wa-booking-web.vercel.app"),
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
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);

  return (
    <html lang={locale} className={`h-full antialiased ${fontSans.variable}`}>
      <body className="flex min-h-full flex-col bg-zinc-50 font-sans text-zinc-900">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
