import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";

/** Facts only, counted live: active cars and models, office, opening days, WhatsApp lines, mileage. */
export async function TrustStrip({ locale }: { locale: string }) {
  await connection();
  const [vehicles, models] = await Promise.all([
    db.vehicle.count({ where: { status: "ACTIVE", model: { active: true } } }),
    db.vehicleModel.count({ where: { active: true, vehicles: { some: { status: "ACTIVE" } } } }),
  ]);
  const t = await getTranslations({ locale, namespace: "trust" });
  const items = [t("fleet", { vehicles, models }), t("office"), t("hours"), t("whatsapp"), t("km")];
  return (
    <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-ink-soft">
      {items.map((x) => (
        <li key={x} className="flex items-center gap-2"><span aria-hidden className="size-1.5 rounded-full bg-bougain" />{x}</li>
      ))}
    </ul>
  );
}

export const TrustStripSkeleton = () => <div className="mx-auto h-5 max-w-2xl animate-pulse rounded-full bg-paper" />;
