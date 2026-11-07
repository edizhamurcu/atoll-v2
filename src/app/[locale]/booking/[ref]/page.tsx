import { Suspense } from "react";
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
  return <Checkout refCode={ref} />;
}
