export const LOCALES = ["en", "hi"] as const;
export type AppLocale = (typeof LOCALES)[number];

export function resolveLocale(raw?: string | null): AppLocale {
  if (raw === "hi" || raw === "mai") return "hi";
  return "en";
}

export function localeShortLabel(locale: AppLocale): string {
  if (locale === "en") return "EN";
  return "हिं";
}

export function localeName(locale: AppLocale): string {
  if (locale === "en") return "English";
  if (locale === "hi") return "Hindi";
  return "Maithili";
}

export function nextLocale(current: AppLocale): AppLocale {
  const i = LOCALES.indexOf(current);
  return LOCALES[(i + 1) % LOCALES.length] ?? "en";
}

/** Pick localized category name from platform JSON row. */
export function categoryDisplayName(
  cat: { name: string; nameHi: string; nameMai?: string },
  locale: AppLocale,
): string {
  if (locale === "en") return cat.name;
  return cat.nameHi;
}
