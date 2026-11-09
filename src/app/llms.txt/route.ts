import { connection } from "next/server";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";
import { posts } from "@/content/blog";
import { excessSummary } from "@/content/damage-excess";

/** llms.txt — concise, factual summary for AI answer engines (GEO). Generated live from the database. */
export async function GET() {
  await connection();
  const [models, locations, extras, pages] = await Promise.all([
    db.vehicleModel.findMany({ where: { active: true }, orderBy: [{ dailyRate: "asc" }, { make: "asc" }], include: { _count: { select: { vehicles: { where: { status: "ACTIVE" } } } } } }),
    db.location.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.extra.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    db.page.findMany({ where: { showInSitemap: true, slug: { not: "north-cyprus-guide" } }, select: { slug: true, title: true }, orderBy: { slug: "asc" } }),
  ]);
  const name = (j: unknown) => (j && typeof j === "object" ? ((j as Record<string, string>).en ?? "") : String(j ?? ""));
  const fleet = models.reduce((s, m) => s + m._count.vehicles, 0);
  const body = `# ${SITE.name}

> ${SITE.name} is a car rental company in North Cyprus (TRNC) with its office in ${SITE.address.locality}, ${SITE.address.region}. ${SITE.tagline}. Car rentals start from £${SITE.terms.fromPrice} per day. Pick-up at the Kyrenia office, Ercan Airport, Larnaca Airport and Paphos Airport, or delivery to hotels and villas.

## Key facts
- Fleet: ${fleet} cars across ${models.length} models (economy, mid-size, SUV, 7+ seats, luxury)
- Prices: daily rates in GBP from £${Math.min(...models.map((m) => Number(m.dailyRate)))} to £${Math.max(...models.map((m) => Number(m.dailyRate)))}
- Rates include: ${SITE.terms.includes.join(", ")}
- Damage excess by car class: ${excessSummary("en")}
- Minimum driver age: ${SITE.terms.minAge}; all international and national licences accepted
- Payment: ${SITE.terms.payment}
- Cancellation: ${SITE.terms.cancellation}
- Driving into South Cyprus is allowed with the South Cyprus option
- Live availability and instant online booking on the website
- Contact (phone and WhatsApp): ${SITE.phone} (primary), ${SITE.phone2}; email ${SITE.email}
- Address: ${SITE.address.street}, ${SITE.address.locality}, ${SITE.address.region}, ${SITE.address.country}
- Opening hours: ${SITE.hours}

## Pick-up locations
${locations.map((l) => `- ${name(l.name)}: ${l.address}`).join("\n")}

## Extras
${extras.map((x) => `- ${name(x.name)}: £${x.price.toFixed(2)} ${x.pricing === "PER_DAY" ? "per day" : "per rental"}`).join("\n")}

## Cars and daily prices (GBP)
${models.map((m) => `- [${m.make} ${m.model}](${SITE.url}/en/cars/${m.slug}): £${m.dailyRate.toFixed(2)}/day, ${m.transmission.toLowerCase()}, ${m.fuel.toLowerCase()}, ${m.seats} seats`).join("\n")}

## Pages
- [Find a car / live availability](${SITE.url}/en/cars)
- [Car prices](${SITE.url}/en/car-prices)
- [Contact](${SITE.url}/en/contact)
${pages.map((p) => `- [${p.title}](${SITE.url}/en/${p.slug})`).join("\n")}

## North Cyprus travel guide
- [North Cyprus Travel Guide](${SITE.url}/en/north-cyprus-guide): regions, sights, beaches, seasons and festivals, entry rules, driving, money and emergency numbers (police 155, ambulance 112, fire 199)

## Travel blog
${posts().map((p) => `- [${p.title}](${SITE.url}/en/blog/${p.slug}): ${p.description}`).join("\n")}

## Languages
English, Turkish (/tr), German (/de), Russian (/ru)
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
