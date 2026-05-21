import type { ReactNode } from "react";

/** Opaque full-viewport shell so dashboard/map never shows behind auth pages. */
export function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="auth-screen fixed inset-0 z-[10000] isolate overflow-y-auto bg-[#f4f6fb]">
      {children}
    </div>
  );
}

export function AuthScreenLoading() {
  return (
    <AuthScreen>
      <div className="flex min-h-[100dvh] items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    </AuthScreen>
  );
}
