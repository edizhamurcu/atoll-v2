"use client";
import { useActionState } from "react";
import type { ActionState } from "./actions";

/** Form bound to a server action that returns { error | ok }; shows the result inline. */
export function ActionForm({ action, children, className, submit, pendingText = "İşleniyor…", tone = "ink" }: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>; children?: React.ReactNode; className?: string; submit: string; pendingText?: string; tone?: "ink" | "danger" | "quiet";
}) {
  const [state, run, pending] = useActionState(action, null);
  const btn = tone === "danger" ? "btn-primary" : tone === "quiet" ? "btn-quiet" : "btn-ink";
  return (
    <form action={run} className={className}>
      {children}
      <button className={`${btn} !py-2 text-sm`} disabled={pending}>{pending ? pendingText : submit}</button>
      {state?.error && <p role="alert" className="mt-2 text-sm font-medium text-alert">{state.error}</p>}
      {state?.ok && <p role="status" className="mt-2 text-sm font-medium text-aegean">{state.ok}</p>}
    </form>
  );
}
