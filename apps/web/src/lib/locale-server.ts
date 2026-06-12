import { cookies } from "next/headers";
import { resolveLocale, type AppLocale } from "@/lib/locale";

export async function getServerLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  return resolveLocale(cookieStore.get("locale")?.value);
}
