export function apiBase() {
  const env = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (env) return env;

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:3000`;
    }
    return "https://wa-booking-api.vercel.app";
  }

  return "http://localhost:3000";
}
