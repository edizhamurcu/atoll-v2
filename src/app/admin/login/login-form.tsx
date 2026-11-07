"use client";
import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, run, pending] = useActionState(loginAction, null);
  return (
    <form action={run} className="mt-6 space-y-4">
      <div>
        <label className="label" htmlFor="email">E-posta</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" defaultValue={state?.email} />
      </div>
      <div>
        <label className="label" htmlFor="password">Şifre</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" autoFocus={Boolean(state?.error)} />
      </div>
      {state?.error && <p role="alert" className="text-sm font-medium text-alert">{state.error}</p>}
      <button className="btn-ink w-full" disabled={pending}>{pending ? "Giriş yapılıyor…" : "Giriş yap"}</button>
    </form>
  );
}
