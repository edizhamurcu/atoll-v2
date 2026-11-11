/**
 * One-off importer: WordPress (Motors car rental) export JSON -> Atoll v2 database.
 * Usage: tsx scripts/import-wp.ts <wp-export.json> [--dry-run]
 * Idempotent: upserts by legacy WP ids / plates / slugs. Media files are expected under /media/<relative path>.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { randomBytes, createHash } from "node:crypto";
import { fromZonedTime } from "date-fns-tz";
import { PrismaPg } from "@prisma/adapter-pg";
import { rentalInfoHtml } from "./wp-format";
import { PrismaClient, type VehicleClass, type BodyType, type Transmission, type FuelType } from "../src/generated/prisma/client";

/** Daily rates set by the owner on the new site; they win over the WordPress price on every import. */
const PRICE_PINS: Record<string, number> = {
  "mazda-carol": 25, // 2026-11-11
  "suzuki-alto": 25, // 2026-11-11
};

const TZ = process.env.BUSINESS_TZ ?? "Asia/Famagusta";
const BUFFER_MIN = 120;
const file = process.argv[2];
const dry = process.argv.includes("--dry-run");
if (!file) throw new Error("usage: import-wp.ts <wp-export.json>");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, options: "-c timezone=UTC" }) });

type WpVehicle = { wpId: number; title: string; slug: string; price: string; attrs: Record<string, string>; images: string[]; offices: string; desc: string; imageMeta?: Record<string, { w: number | null; h: number | null }> };


type WpOrder = {
  wpId: number; status: string; created: string; total: string; carWpId: number | null; days: number | null;
  options: { id: string | number | null; qty: number; name: string }[];
  pickupLoc: number | string | null; returnLoc: number | string | null; pickup: string | null; return: string | null;
  email: string; first: string; last: string; phone: string; country: string; license: string; note: string;
};
const data = JSON.parse(readFileSync(file, "utf8")) as {
  vehicles: WpVehicle[]; offices: { wpId: number; title: string; address: string; lat: string | null; lng: string | null; phone: string | null; hours: string }[];
  options: { wpId: number; title: string; price: string }[]; orders: WpOrder[];
  seasonRates?: { variation_id: string; starttime: string; endtime: string; price: string }[];
};
// The live export stores some numeric ids as strings (MySQL rows): coerce once so Int columns and map lookups match.
const num = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
// Options come either as a list or as a map keyed by option id (with id null inside).
const opts = (v: unknown): WpOrder["options"] =>
  Array.isArray(v) ? v : v && typeof v === "object" ? Object.entries(v as Record<string, { id?: unknown }>).map(([k, x]) => ({ ...x, id: x.id ?? k }) as WpOrder["options"][number]) : [];
data.orders = data.orders.map((o) => ({ ...o, wpId: Number(o.wpId), carWpId: num(o.carWpId), days: num(o.days), options: opts(o.options) }));

// ---------- normalisation ----------
const NAME_FIX: Record<string, string> = { "TOYOTA CORROLLA": "TOYOTA COROLLA", "HYUNDAI ?30": "HYUNDAI I30", "HYUNDAI ?X35": "HYUNDAI IX35", "HYUNDAI İ30": "HYUNDAI I30", "HYUNDAI İX35": "HYUNDAI IX35", "MERC E220": "MERCEDES E220", "MERC C200": "MERCEDES C200", "MERC A180D": "MERCEDES A180D", "MERC C 220 SE D": "MERCEDES C220 SE D", "LANDROVER SPORT": "LAND ROVER RANGE ROVER SPORT", "LANDROVER DISCOVERY": "LAND ROVER DISCOVERY" };
const titleCase = (s: string) => s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase()).replace(/\b(Bmw|Vw|Se|Suv|Nv\d+|Ix\d+|I\d+|X\d|T)\b/gi, (w) => w.toUpperCase());
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const cls = (v = ""): VehicleClass => (({ "economic": "ECONOMY", "middle class": "MIDDLE", "luxury": "LUXURY", "suv": "SUV", "7+ persons": "PEOPLE_CARRIER", "luxury/suv": "LUXURY", "sport car": "SPORT", "top gradle": "PREMIUM" }) as Record<string, VehicleClass>)[v.toLowerCase()] ?? "ECONOMY";
const body = (v = ""): BodyType => (({ hatchback: "HATCHBACK", sedan: "SEDAN", stationwagon: "ESTATE", suv: "SUV", van: "VAN" }) as Record<string, BodyType>)[v.toLowerCase()] ?? "HATCHBACK";
const gear = (v = ""): Transmission => (/manual/i.test(v) ? "MANUAL" : "AUTOMATIC");
const fuel = (v = ""): FuelType => (({ petrol: "PETROL", diesel: "DIESEL", hybrid: "HYBRID", electrical: "ELECTRIC", autogas: "LPG" }) as Record<string, FuelType>)[v.toLowerCase()] ?? "PETROL";
const seats = (v = "") => Number.parseInt(v, 10) || 5;
const engine = (v = "") => { const n = Number.parseFloat(v); if (!n) return null; return n > 20 ? Math.round(n / 100) / 10 : n; };
const media = (rel: string) => `/media/${rel}`;

// Office address is 157 Karaoğlanoğlu Caddesi (owner correction 2026-11-09); the WP export still says 154.
const fixAddress = (a: string) => a.replace(/\b154 Karaoğlanoğlu/, "157 Karaoğlanoğlu");

// Group plates into models. Same name + different price => separate models (e.g. Corolla 1.3 @30 vs 1.8 @45).
function modelKey(v: WpVehicle) {
  const name = NAME_FIX[v.title.toUpperCase()] ?? v.title.toUpperCase().replace(/\s+/g, " ");
  return { name, key: `${name}|${Number(v.price)}` };
}
const groups = new Map<string, { name: string; price: number; items: WpVehicle[] }>();
for (const v of data.vehicles) {
  const { name, key } = modelKey(v);
  const g = groups.get(key) ?? { name, price: Number(v.price), items: [] };
  g.items.push(v);
  groups.set(key, g);
}
const nameCounts = new Map<string, number>();
for (const g of groups.values()) nameCounts.set(g.name, (nameCounts.get(g.name) ?? 0) + 1);

const mode = <T,>(xs: T[]) => [...xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<T, number>())].sort((a, b) => b[1] - a[1])[0]?.[0];

async function main() {
  // ---------- locations ----------
  const LOC: Record<number, { slug: string; name: Record<string, string>; airport: boolean; sort: number }> = {
    48: { slug: "alsancak-office", name: { en: "Alsancak (Kyrenia) office", tr: "Alsancak (Girne) ofis", de: "Büro Alsancak (Kyrenia)", ru: "Офис Алсанджак (Кирения)" }, airport: false, sort: 1 },
    47: { slug: "ercan-airport", name: { en: "Ercan Airport", tr: "Ercan Havalimanı", de: "Flughafen Ercan", ru: "Аэропорт Эрджан" }, airport: true, sort: 2 },
    46: { slug: "larnaca-airport", name: { en: "Larnaca Airport", tr: "Larnaka Havalimanı", de: "Flughafen Larnaka", ru: "Аэропорт Ларнака" }, airport: true, sort: 3 },
    509: { slug: "paphos-airport", name: { en: "Paphos Airport", tr: "Baf Havalimanı", de: "Flughafen Paphos", ru: "Аэропорт Пафос" }, airport: true, sort: 4 },
  };
  const hours = { mon: ["09:00", "21:00"], tue: ["09:00", "21:00"], wed: ["09:00", "21:00"], thu: ["09:00", "21:00"], fri: ["09:00", "21:00"], sat: ["09:00", "19:00"], sun: null };
  const locId = new Map<number, string>();
  for (const o of data.offices) {
    const meta = LOC[o.wpId] ?? { slug: slugify(o.title), name: { en: o.title }, airport: /airport/i.test(o.title), sort: 9 };
    const row = dry ? { id: `dry-${o.wpId}` } : await db.location.upsert({
      where: { legacyWpId: o.wpId },
      create: { legacyWpId: o.wpId, slug: meta.slug, name: meta.name, address: fixAddress(o.address), lat: o.lat ?? undefined, lng: o.lng ?? undefined, phone: o.phone, hours, isAirport: meta.airport, sortOrder: meta.sort },
      update: { address: fixAddress(o.address), lat: o.lat ?? undefined, lng: o.lng ?? undefined, phone: o.phone },
    });
    locId.set(o.wpId, row.id);
  }
  const home = locId.get(48) ?? null;

  // ---------- models + vehicles ----------
  const vehicleByWp = new Map<number, { id: string; modelId: string }>();
  let sort = 0;
  for (const g of [...groups.values()].sort((a, b) => a.price - b.price || a.name.localeCompare(b.name))) {
    const a = (k: string) => mode(g.items.map((i) => i.attrs[k]).filter(Boolean)) ?? "";
    const dup = (nameCounts.get(g.name) ?? 1) > 1;
    const eng = engine(a("engine"));
    const display = titleCase(g.name) + (dup && eng ? ` ${eng.toFixed(1)}` : "");
    const [make, ...rest] = display.split(" ");
    const slug = slugify(display) + (dup && !eng ? `-${g.price}` : "");
    const price = PRICE_PINS[slug] ?? g.price; // owner overrides survive a re-import
    // Gallery: every photo of every plate of this model, featured images first (as on the old product pages).
    const featured = g.items.map((i) => i.images[0]).filter(Boolean);
    const images = [...new Set([...featured, ...g.items.flatMap((i) => i.images)])].slice(0, 16).map(media);
    const info = mode(g.items.map((i) => i.desc).filter(Boolean));
    const description = info ? { en: rentalInfoHtml(info) } : undefined;
    const model = dry ? { id: `dry-${slug}` } : await db.vehicleModel.upsert({
      where: { slug },
      create: { slug, make: make === "Land" ? "Land Rover" : make, model: make === "Land" ? rest.slice(1).join(" ") : rest.join(" "), class: cls(a("vehicle-class")), bodyType: body(a("vehicle-type")), transmission: gear(a("gear-type")), fuel: fuel(a("fuel-type")), seats: seats(a("seats")), airCon: true, engineLitres: eng ?? undefined, images, description, dailyRate: price, sortOrder: sort++ },
      update: { images, description, dailyRate: price, class: cls(a("vehicle-class")), bodyType: body(a("vehicle-type")), transmission: gear(a("gear-type")), fuel: fuel(a("fuel-type")), seats: seats(a("seats")), engineLitres: eng ?? undefined },
    });
    for (const v of g.items) {
      const plate = (v.attrs.plate || `WP${v.wpId}`).toUpperCase().replace(/\s+/g, "");
      const year = Number.parseInt(v.attrs.years ?? "", 10) || null;
      const row = dry ? { id: `dry-v${v.wpId}` } : await db.vehicle.upsert({
        where: { plate },
        create: { plate, modelId: model.id, color: v.attrs.color || null, year, legacyWpId: v.wpId, homeLocationId: home },
        update: { modelId: model.id, color: v.attrs.color || null, year, legacyWpId: v.wpId },
      });
      vehicleByWp.set(v.wpId, { id: row.id, modelId: model.id });
    }
    console.log(`model ${display.padEnd(32)} £${String(price).padStart(3)}  x${g.items.length}  ${slug}`);
  }

  // ---------- extras ----------
  // `price` overrides the WordPress price for new bookings (legacy orders keep the WP price they were sold at).
  const EXTRA: Record<number, { code: string; name: Record<string, string>; pricing: "PER_DAY" | "PER_RENTAL"; maxQty: number; sort: number; price?: string }> = {
    488: { code: "baby_seat", name: { en: "Baby seat", tr: "Bebek koltuğu", de: "Babysitz", ru: "Детское кресло" }, pricing: "PER_DAY", maxQty: 2, sort: 1, price: "2.00" }, // £2/day — owner decision 2026-11-09 (WP: £3)
    58: { code: "booster_seat", name: { en: "Booster seat", tr: "Yükseltici koltuk", de: "Sitzerhöhung", ru: "Бустер" }, pricing: "PER_DAY", maxQty: 2, sort: 2, price: "2.00" }, // £2/day — owner decision 2026-11-09 (WP: £2.50)
    1088: { code: "tyre_screen_cover", name: { en: "Tyre & windscreen cover", tr: "Lastik ve cam güvencesi", de: "Reifen- & Scheibenschutz", ru: "Защита шин и стекла" }, pricing: "PER_DAY", maxQty: 1, sort: 3 },
    57: { code: "south_cyprus", name: { en: "Driving in South Cyprus", tr: "Güney Kıbrıs kullanımı", de: "Fahrt in Südzypern", ru: "Поездки на юг Кипра" }, pricing: "PER_RENTAL", maxQty: 1, sort: 4 },
    1841: { code: "transfer_ercan", name: { en: "Ercan Airport transfer to Alsancak (one way)", tr: "Ercan → Alsancak transfer (tek yön)", de: "Transfer Ercan → Alsancak (einfach)", ru: "Трансфер Эрджан → Алсанджак" }, pricing: "PER_RENTAL", maxQty: 1, sort: 5 },
    53: { code: "transfer_larnaca", name: { en: "Larnaca Airport transfer to Alsancak (one way)", tr: "Larnaka → Alsancak transfer (tek yön)", de: "Transfer Larnaka → Alsancak (einfach)", ru: "Трансфер Ларнака → Алсанджак" }, pricing: "PER_RENTAL", maxQty: 1, sort: 6 },
    1842: { code: "transfer_paphos", name: { en: "Paphos Airport transfer to Alsancak (one way)", tr: "Baf → Alsancak transfer (tek yön)", de: "Transfer Paphos → Alsancak (einfach)", ru: "Трансфер Пафос → Алсанджак" }, pricing: "PER_RENTAL", maxQty: 1, sort: 7 },
  };
  const extraByWp = new Map<string, { id: string; price: number; pricing: string }>();
  for (const o of data.options) {
    const meta = EXTRA[o.wpId];
    if (!meta) continue;
    const row = dry ? { id: `dry-x${o.wpId}` } : await db.extra.upsert({
      where: { code: meta.code },
      create: { code: meta.code, name: meta.name, pricing: meta.pricing, price: meta.price ?? o.price, maxQty: meta.maxQty, sortOrder: meta.sort },
      update: { price: meta.price ?? o.price },
    });
    extraByWp.set(String(o.wpId), { id: row.id, price: Number(o.price), pricing: meta.pricing });
  }

  // ---------- delivery zones (from the "Delivery charges" page) ----------
  const ZONES = [
    { slug: "kyrenia-area", name: "Kyrenia area", areas: ["Alsancak", "Çatalköy", "Ozanköy", "Kyrenia", "Karmi", "Karaoğlanoğlu"], tiers: [{ minDays: 1, fee: "0.00" }] },
    { slug: "nicosia-esentepe", name: "Nicosia & east coast", areas: ["Nicosia", "Esentepe", "Tatlısu", "Karşıyaka", "Lapta"], tiers: [{ minDays: 1, fee: "20.00" }, { minDays: 4, fee: "15.00" }, { minDays: 6, fee: "0.00" }] },
    { slug: "famagusta-west", name: "Famagusta, Bogaz & west", areas: ["Famagusta", "Boğaz", "Kayalar", "Lefke", "Gaziveren", "Güzelyurt"], tiers: [{ minDays: 1, fee: "60.00" }, { minDays: 4, fee: "55.00" }, { minDays: 6, fee: "50.00" }] },
    { slug: "iskele", name: "Iskele", areas: ["İskele"], tiers: [{ minDays: 1, fee: "60.00" }, { minDays: 4, fee: "55.00" }, { minDays: 6, fee: "50.00" }] },
  ];
  if (!dry) for (const [i, z] of ZONES.entries()) await db.deliveryZone.upsert({ where: { slug: z.slug }, create: { ...z, sortOrder: i }, update: { areas: z.areas, tiers: z.tiers } });

  // ---------- season rates (WP rental_price_date; unix seconds, inclusive) ----------
  // Imported oldest-first so createdAt order = WP id order (newest wins on overlap, like the theme).
  if (!dry && data.seasonRates?.length) {
    const ymd = (sec: string) => new Date(Number(sec) * 1000).toLocaleDateString("en-CA", { timeZone: TZ });
    let n = 0;
    const seen = new Set<string>();
    for (const r of [...data.seasonRates].sort((a, b) => Number((a as { id?: string }).id ?? 0) - Number((b as { id?: string }).id ?? 0))) {
      const v = vehicleByWp.get(Number(r.variation_id));
      if (!v) continue;
      const key = `${v.modelId}|${r.starttime}|${r.endtime}`;
      if (seen.has(key)) continue; // same model from several plates
      seen.add(key);
      const startDate = new Date(`${ymd(r.starttime)}T00:00:00Z`), endDate = new Date(`${ymd(r.endtime)}T00:00:00Z`);
      const exists = await db.seasonRate.findFirst({ where: { modelId: v.modelId, startDate, endDate } });
      if (!exists) {
        await db.seasonRate.create({ data: { modelId: v.modelId, startDate, endDate, dailyRate: r.price, name: "Imported from WordPress", createdAt: new Date(Date.now() + n) } });
        n++;
      }
    }
    console.log(`season rates imported=${n}`);
  }

  // ---------- legacy orders ----------
  const parse = (s: string | null) => {
    if (!s) return null;
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{1,2}):(\d{2})/); // m/d/Y g:i
    if (!m) return null;
    return fromZonedTime(`${m[3]}-${m[1]}-${m[2]}T${m[4].padStart(2, "0")}:${m[5]}:00`, TZ);
  };
  const now = new Date();
  const stats = { imported: 0, active: 0, skipped: 0, conflicts: [] as number[] };
  for (const o of data.orders) {
    const car = o.carWpId ? vehicleByWp.get(o.carWpId) : undefined;
    const pickupAt = parse(o.pickup), returnAt = parse(o.return);
    if (!car || !pickupAt || !returnAt || returnAt <= pickupAt) { stats.skipped++; continue; }
    const future = returnAt > now;
    const status = o.status === "completed" ? "COMPLETED" : future ? "CONFIRMED" : "COMPLETED";
    const email = (o.email || `legacy-${o.wpId}@invalid.local`).trim().toLowerCase();
    if (dry) { stats.imported++; if (status === "CONFIRMED") stats.active++; continue; }
    if (await db.booking.findUnique({ where: { legacyWpOrderId: o.wpId } })) { stats.imported++; continue; }
    const customer = await db.customer.upsert({
      where: { email },
      create: { email, firstName: o.first || "-", lastName: o.last || "-", phone: o.phone || "-", country: o.country || null, licenseNumber: o.license || null },
      update: {},
    });
    const extras = o.options.map((x) => ({ x, e: extraByWp.get(String(x.id)) })).filter((r) => r.e);
    const days = o.days ?? Math.max(1, Math.ceil((returnAt.getTime() - pickupAt.getTime()) / 86_400_000));
    const base = {
      ref: `ATL-W${o.wpId}`, status: status as "COMPLETED" | "CONFIRMED", modelId: car.modelId, customerId: customer.id,
      pickupLocationId: locId.get(Number(o.pickupLoc)) ?? home!, returnLocationId: locId.get(Number(o.returnLoc)) ?? locId.get(Number(o.pickupLoc)) ?? home!,
      pickupAt, returnAt, blockedUntil: new Date(returnAt.getTime() + BUFFER_MIN * 60_000), days,
      rentalTotal: o.total, grandTotal: o.total, priceBreakdown: { legacy: true, wpOrderId: o.wpId, total: o.total },
      paymentMode: "pay_on_pickup", accessTokenHash: createHash("sha256").update(randomBytes(24)).digest("hex"),
      notes: [o.note, `Imported from WordPress order #${o.wpId} (${o.status})`].filter(Boolean).join("\n"),
      source: "wordpress", legacyWpOrderId: o.wpId, createdAt: new Date(o.created), confirmedAt: new Date(o.created),
      extras: { create: extras.map(({ x, e }) => ({ extraId: e!.id, quantity: Math.max(1, Number(x.qty) || 1), unitPrice: e!.price, total: e!.pricing === "PER_DAY" ? e!.price * days : e!.price })) },
    };
    // Old system allowed double booking. If the original plate is taken, try another car of the same model.
    const candidates = [car.id, ...(await db.vehicle.findMany({ where: { modelId: car.modelId, status: "ACTIVE", id: { not: car.id } }, select: { id: true } })).map((v) => v.id)];
    let ok = false;
    for (const vehicleId of status === "CONFIRMED" ? candidates : [car.id]) {
      try {
        await db.booking.create({ data: { ...base, vehicleId } });
        ok = true;
        break;
      } catch (e) {
        if (!String((e as Error).message).match(/booking_no_overlap|23P01|exclusion/)) throw e;
      }
    }
    if (!ok) stats.conflicts.push(o.wpId);
    else { stats.imported++; if (status === "CONFIRMED") stats.active++; }
  }
  console.log(`\nmodels=${groups.size} vehicles=${data.vehicles.length} locations=${locId.size} extras=${extraByWp.size}`);
  console.log(`orders imported=${stats.imported} active(future)=${stats.active} skipped=${stats.skipped} conflicts=${JSON.stringify(stats.conflicts)}`);
}

main().finally(() => db.$disconnect());
