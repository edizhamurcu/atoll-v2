import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/server/admin/auth";
import { logoutAction } from "../actions";

const NAV = [
  ["/admin", "Bugün"],
  ["/admin/bookings", "Rezervasyonlar"],
  ["/admin/bookings/new", "Yeni rezervasyon"],
  ["/admin/calendar", "Takvim"],
  ["/admin/fleet", "Filo"],
  ["/admin/reviews", "Yorumlar"],
  ["/admin/sales", "Satılık araçlar"],
] as const;

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-10 text-ink-soft">Yükleniyor…</div>}>
      <Guard>{children}</Guard>
    </Suspense>
  );
}

async function Guard({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[14rem_1fr]">
      <aside className="border-b border-ink/10 bg-paper md:min-h-dvh md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4 md:block">
          <Link href="/admin"><Image src="/brand/atoll-logo.png" alt="Atoll" width={318} height={141} className="h-10 w-auto" /></Link>
          <nav aria-label="Yönetim" className="flex gap-1 overflow-x-auto md:mt-8 md:flex-col">
            {NAV.map(([href, label]) => (
              <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-stone hover:text-ink">{label}</Link>
            ))}
          </nav>
        </div>
        <div className="hidden border-t border-ink/10 p-4 text-sm md:block">
          <p className="font-medium">{admin.name}</p>
          <p className="text-ink-soft">{admin.role === "owner" ? "Yönetici" : "Personel"}</p>
          <form action={logoutAction}><button className="mt-3 text-aegean underline">Çıkış</button></form>
        </div>
      </aside>
      <div className="min-w-0 p-5 md:p-8">{children}</div>
    </div>
  );
}
