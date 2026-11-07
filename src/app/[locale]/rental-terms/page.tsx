import type { Metadata } from "next";

export const metadata: Metadata = { title: "Rental terms" };

// Content migrated from the WordPress pages (Rental terms, Delivery charges, Fuel options, Extra insurance, Driving in South Cyprus).
// TODO(content): TR/DE/RU translations to be reviewed by Atoll staff.
const DELIVERY = [
  ["Ercan Airport", "£0", "£0", "£0"],
  ["Alsancak, Çatalköy, Ozanköy, Kyrenia, Karmi, Karaoğlanoğlu", "£0", "£0", "£0"],
  ["Nicosia, Esentepe, Tatlısu, Karşıyaka, Lapta", "£20", "£15", "£0"],
  ["Famagusta, Boğaz, Kayalar, Lefke, Gaziveren, Güzelyurt", "£60", "£55", "£50"],
  ["İskele", "£60", "£55", "£50"],
];

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 pt-10">
      <h1 className="text-4xl font-extrabold md:text-5xl">Rental terms</h1>

      <section id="delivery" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-bold">Delivery and collection</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <caption className="sr-only">Delivery charge by area and rental length</caption>
            <thead className="border-b border-ink/15 text-ink-soft">
              <tr><th scope="col" className="py-2 pr-4 font-medium">Area</th><th scope="col" className="py-2 font-medium">1–3 days</th><th scope="col" className="py-2 font-medium">4–5 days</th><th scope="col" className="py-2 font-medium">6+ days</th></tr>
            </thead>
            <tbody>
              {DELIVERY.map(([a, ...f]) => (
                <tr key={a} className="border-b border-ink/8"><th scope="row" className="py-2.5 pr-4 font-normal">{a}</th>{f.map((x, i) => <td key={i} className="tabular-nums">{x}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-ink-soft">Areas not listed are outside our delivery area.</p>
      </section>

      <section id="fuel" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-bold">Fuel</h2>
        <p className="mt-3">All cars run on unleaded petrol unless stated otherwise. We hand over the car with £20 worth of fuel, which is charged if you return it empty; fuel is not refundable. Alternatively, at our Kyrenia office only, you can return the car with the same fuel level you received it with.</p>
      </section>

      <section id="insurance" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-bold">Tyre and windscreen cover</h2>
        <p className="mt-3">The optional cover pays for damage to the windscreen and one tyre. If several tyres are damaged at the same time, the cover applies to one tyre and the hirer pays for the rest. This cover is not valid in South Cyprus.</p>
      </section>

      <section id="south-cyprus" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-bold">Driving in South Cyprus</h2>
        <p className="mt-3">You can take Atoll cars to South Cyprus with the South Cyprus option (£50 per rental). Insurance bought at the checkpoint is required by law. If you land at Larnaca and stay in Kyrenia, we can also arrange your airport transfer.</p>
      </section>
    </article>
  );
}
