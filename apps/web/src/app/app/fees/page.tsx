"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FeesRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/coaching/fees");
  }, [router]);
  return <div className="py-8 text-center text-[14px] text-zinc-500">Redirecting to fee dashboard…</div>;
}
