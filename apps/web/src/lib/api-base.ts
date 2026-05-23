export function apiBase() {
  // For Vercel: set NEXT_PUBLIC_API_URL=https://your-api-domain
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
}

