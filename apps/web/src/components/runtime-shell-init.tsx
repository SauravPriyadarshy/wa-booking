"use client";

import { useEffect } from "react";
import { detectRuntimeShell, isInstalledShell } from "@/lib/runtime-shell";

export function RuntimeShellInit() {
  useEffect(() => {
    const shell = detectRuntimeShell();
    const root = document.documentElement;
    root.dataset.shell = shell;
    root.dataset.display = isInstalledShell(shell) ? "standalone" : "browser";

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
  }, []);

  return null;
}
