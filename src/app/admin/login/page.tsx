import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="w-full max-w-sm rounded-[var(--radius-panel)] bg-paper p-8 shadow-[0_18px_40px_-24px_rgba(13,52,64,.35)]">
        <Image src="/brand/atoll-logo.png" alt="Atoll Rent a Car" width={318} height={141} className="mx-auto h-16 w-auto" priority />
        <h1 className="mt-6 text-center text-2xl font-bold">Yönetim paneli</h1>
        <LoginForm />
      </div>
    </div>
  );
}
