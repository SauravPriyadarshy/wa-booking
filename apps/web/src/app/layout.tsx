import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { RuntimeShellInit } from "@/components/runtime-shell-init";
import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  preload: true,
});

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "https://wa-booking-web.vercel.app";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#059669",
  colorScheme: "light",
};

export const metadata: Metadata = {
  title: {
    default: "WhatsApp Booking System for Indian Businesses | BookNow",
    template: "%s | BookNow",
  },
  description:
    "Manage bookings, customers, and WhatsApp reminders in one place. Free for salons, clinics, and home services. Setup in 5 minutes.",
  metadataBase: new URL(WEB_URL),
  applicationName: "BookNow",
  appleWebApp: {
    capable: true,
    title: "BookNow",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    siteName: "BookNow",
    type: "website",
    locale: "en_IN",
  },
  robots: { index: true, follow: true },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()]);

  return (
    <html lang={locale} className={`h-full antialiased ${fontSans.variable}`}>
      <body className="flex min-h-full flex-col bg-zinc-50 font-sans text-zinc-900">
        <RuntimeShellInit />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
