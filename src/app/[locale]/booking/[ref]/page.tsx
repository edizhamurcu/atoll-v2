import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { Checkout } from "@/components/checkout";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function BookingPage({ params }: PageProps<"/[locale]/booking/[ref]">) {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-stone-deep" />}>
        <BookingInner params={params} />
      </Suspense>
    </div>
  );
}

async function BookingInner({ params }: { params: PageProps<"/[locale]/booking/[ref]">["params"] }) {
  const { ref } = await params;
  await connection(); // read the Turnstile key at request time, not build time
  const siteKey = process.env.TURNSTILE_SECRET_KEY ? process.env.TURNSTILE_SITE_KEY : undefined;
  return <Checkout refCode={ref} turnstileSiteKey={siteKey || undefined} />;
}
