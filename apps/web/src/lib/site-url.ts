/** Canonical public web origin (no trailing slash). */
export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_WEB_URL ??
    "https://wa-booking-web.vercel.app"
  ).replace(/\/$/, "");
}
