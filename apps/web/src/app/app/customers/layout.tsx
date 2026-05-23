import { Suspense, type ReactNode } from "react";

export default function CustomersLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-10 text-center text-[13px] text-zinc-500">Loading customers…</div>
      }
    >
      {children}
    </Suspense>
  );
}
