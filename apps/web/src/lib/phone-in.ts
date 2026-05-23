/** Normalize to E.164 India for API `IsPhoneNumber('IN')`. */
export function normalizeIndiaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (raw.trim().startsWith("+")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}
