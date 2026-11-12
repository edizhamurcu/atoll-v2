import { getTranslations } from "next-intl/server";
import { listSaleCars } from "@/server/sales";
import { SaleStock, type StockLabels } from "@/components/sale-stock";
import { SITE } from "@/lib/site";

const KEYS = ["title", "lead", "count", "allMakes", "allBodies", "allFuels", "allGears", "maxPrice", "any", "sort", "sortNew", "sortPriceUp", "sortPriceDown", "sortKm", "ask", "reserved", "whatsapp", "none", "reset", "photos", "close", "km", "year", "PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG", "AUTOMATIC", "MANUAL", "HATCHBACK", "SEDAN", "ESTATE", "SUV", "VAN"] as const;

/** OSK stock grid (#stock). With no cars listed yet it renders only the anchor, and the page keeps its "call us" block. */
export async function SaleStockSection({ locale }: { locale: string }) {
  const cars = await listSaleCars();
  if (!cars.length) return <span id="stock" />;
  const [t, s] = await Promise.all([getTranslations({ locale, namespace: "stock" }), getTranslations({ locale, namespace: "sales" })]);
  const l = Object.fromEntries(KEYS.map((k) => [k, t.raw(k) as string])) as StockLabels;
  return (
    <section aria-labelledby="stock" className="mt-20 scroll-mt-28">
      <h2 id="stock" className="text-3xl font-extrabold">{l.title}</h2>
      <p className="mt-3 max-w-3xl text-lg text-ink-soft">{l.lead}</p>
      <div className="mt-6">
        <SaleStock cars={cars} l={l} locale={locale} waBase={s("waText")} waNumber={SITE.whatsapp} />
      </div>
    </section>
  );
}
