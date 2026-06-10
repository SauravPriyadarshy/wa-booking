/** Detect PWA / Capacitor / Cordova / in-app WebView shells for layout tweaks. */

export type RuntimeShell = "browser" | "pwa" | "capacitor" | "cordova" | "webview";

export function detectRuntimeShell(): RuntimeShell {
  if (typeof window === "undefined") return "browser";

  const w = window as Window & {
    Capacitor?: { isNativePlatform?: () => boolean };
    cordova?: unknown;
  };

  if (w.Capacitor?.isNativePlatform?.()) return "capacitor";
  if (w.cordova) return "cordova";

  const ua = navigator.userAgent || "";
  if (/; wv\)|WebView|FBAN|FBAV|Instagram|Line\//i.test(ua)) return "webview";

  if (window.matchMedia("(display-mode: standalone)").matches) return "pwa";
  if ((navigator as Navigator & { standalone?: boolean }).standalone) return "pwa";

  return "browser";
}

export function isInstalledShell(shell: RuntimeShell) {
  return shell !== "browser";
}
