/** Fetch site content from API. Used server-side for metadata and page content. */

const apiBase = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export async function getSiteContentGroup(
  group: string,
  locale = "en",
): Promise<Record<string, string>> {
  try {
    const res = await fetch(
      `${apiBase()}/site-content?group=${group}&locale=${locale}`,
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return {};
    return (await res.json()) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function getSiteContentKey(key: string, locale = "en"): Promise<string | null> {
  try {
    const res = await fetch(
      `${apiBase()}/site-content/key/${encodeURIComponent(key)}?locale=${locale}`,
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data === "string" ? data : data?.value ?? null;
  } catch {
    return null;
  }
}

/** Parse a JSON value stored in SiteContent, return fallback on error. */
export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
