import "server-only";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";
import { db } from "@/lib/db";
import { SITE } from "@/lib/site";
import { BUSINESS_TZ } from "@/lib/contact";
import { stateToQuery } from "@/lib/search-params";
import { listModels, search, serializeModel, t, type Locale } from "@/server/catalog";
import { buildQuote, BookingError } from "@/server/booking";
import { availabilityByModel } from "@/server/availability";
import { getSettings } from "@/server/settings";
import { querySaleCars } from "@/server/sales";
import { CAMPAIGNS } from "@/content/campaigns";
import { DAMAGE_EXCESS, excessSummary } from "@/content/damage-excess";
import { localizedRentalInfo } from "@/content/rental-info";
import { guide } from "@/content/guide";
import { southGuide } from "@/content/travel/south-guide";
import { drivingSouth } from "@/content/travel/driving-south";
import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages";

/**
 * Backend tools. The model only proposes inputs; every input is validated here with zod and every fact
 * (price, availability, policy, contact) comes from the database or the site's own content, never from the model.
 * Nothing here books, sells or charges. `prepare_request` only stores a DRAFT that the visitor must confirm in the widget.
 */

export type Card =
  | { type: "rental"; slug: string; name: string; class: string; seats: number; transmission: string; fuel: string; image: string | null; available: boolean | null; total: string | null; days: number | null; averageDaily: string | null; fromDaily: string; href: string; campaign: boolean }
  | { type: "sale"; id: string; title: string; year: number; mileageKm: number; fuel: string; transmission: string; price: string | null; photo: string | null; status: string; note: string | null; href: string };

export type Draft = { id: string; kind: string; name: string; phone: string; email: string | null; preferred: string | null; details: string };

export type ToolContext = { sessionId: string; locale: Locale; now?: Date };
export type ToolResult = { content: string; cards?: Card[]; draft?: Draft; unanswered?: boolean; isError?: boolean };

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM").default("10:00");
const slug = z.string().regex(/^[a-z0-9-]{1,80}$/);
const CLASSES = ["ECONOMY", "MIDDLE", "LUXURY", "SUV", "PEOPLE_CARRIER", "SPORT", "PREMIUM"] as const;

const local = (d: string, tm: string) => fromZonedTime(`${d}T${tm}:00`, BUSINESS_TZ);
const path = (locale: Locale, p: string) => `/${locale}${p}`;
const mediaUrl = (u: string | undefined) => (u && (u.startsWith("/") || u.startsWith("https://")) ? u : null);
const stripHtml = (h: string) => h.replace(/<li>/g, "\n- ").replace(/<\/(p|h\d|ul)>/g, "\n").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\n{3,}/g, "\n\n").trim();
const ERR = (code: string, msg: string): ToolResult => ({ content: JSON.stringify({ error: code, message: msg }), isError: true });

async function defaultLocation() {
  const l = await db.location.findFirst({ where: { active: true }, orderBy: { sortOrder: "asc" } });
  return l?.slug ?? null;
}

/* ---------------- tool definitions (what the model sees) ---------------- */

const RentalSearch = z.object({
  pickupDate: date, pickupTime: time, returnDate: date, returnTime: time,
  pickupLocation: slug.optional(), returnLocation: slug.optional(), deliveryZone: slug.optional(),
  class: z.enum(CLASSES).optional(),
  minSeats: z.number().int().min(1).max(9).optional(),
  transmission: z.enum(["AUTOMATIC", "MANUAL"]).optional(),
  maxResults: z.number().int().min(1).max(6).default(4),
});
const Quote = z.object({
  modelSlug: slug, pickupDate: date, pickupTime: time, returnDate: date, returnTime: time,
  pickupLocation: slug.optional(), returnLocation: slug.optional(), deliveryZone: slug.optional(),
  extras: z.array(z.object({ code: z.string().regex(/^[a-z0-9_]{1,40}$/), quantity: z.number().int().min(1).max(10) })).max(10).default([]),
});
const VehicleDetails = z.object({ modelSlug: slug });
const ListFleet = z.object({ class: z.enum(CLASSES).optional() });
const Policy = z.object({ topic: z.enum(["requirements", "excess_insurance", "fuel", "cancellation_payment", "included", "campaigns", "hours_contact", "osk_contact"]) });
const SaleSearch = z.object({
  make: z.string().trim().max(40).optional(),
  fuel: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG"]).optional(),
  transmission: z.enum(["AUTOMATIC", "MANUAL"]).optional(),
  bodyType: z.enum(["HATCHBACK", "SEDAN", "ESTATE", "SUV", "VAN"]).optional(),
  maxPrice: z.number().positive().max(10_000_000).optional(),
});
const Travel = z.object({ topic: z.enum(["north_cyprus", "south_cyprus", "driving_in_south_cyprus"]) });
const phone = z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "phone number");
export const RequestInput = z.object({
  kind: z.enum(["HANDOFF", "RENTAL_CALLBACK", "SALES_INQUIRY", "TEST_DRIVE", "SERVICE_APPOINTMENT"]),
  name: z.string().trim().min(2).max(80),
  phone,
  email: z.email().max(200).optional(),
  preferred: z.string().trim().max(120).optional(),
  details: z.string().trim().min(3).max(800),
});
const Unanswered = z.object({ question: z.string().trim().min(2).max(500) });

const schema = (props: Record<string, unknown>, required: string[] = []): Tool.InputSchema => ({ type: "object", properties: props, required, additionalProperties: false });
const s = (description: string, extra: Record<string, unknown> = {}) => ({ type: "string", description, ...extra });
const dateProps = {
  pickupDate: s("Pick-up date YYYY-MM-DD (business time zone, North Cyprus)"),
  pickupTime: s("Pick-up time HH:MM, 24h; default 10:00"),
  returnDate: s("Return date YYYY-MM-DD"),
  returnTime: s("Return time HH:MM, 24h; default 10:00"),
  pickupLocation: s("Location slug from list_locations_and_extras; default: main office"),
  returnLocation: s("Location slug; default: same as pick-up"),
  deliveryZone: s("Delivery zone slug from list_locations_and_extras, only if the customer wants delivery"),
};

export const TOOLS: Tool[] = [
  {
    name: "search_rental_cars",
    description: "Atoll Rent A Car: live availability and the exact all-in rental price for given dates. Use whenever the customer asks what is available or what it costs for specific dates. Returns cars with totals computed by the booking engine and a booking link.",
    input_schema: schema({ ...dateProps, class: s("Optional class filter", { enum: CLASSES }), minSeats: { type: "integer", minimum: 1, maximum: 9 }, transmission: s("Optional", { enum: ["AUTOMATIC", "MANUAL"] }), maxResults: { type: "integer", minimum: 1, maximum: 6 } }, ["pickupDate", "returnDate"]),
  },
  {
    name: "get_rental_quote",
    description: "Exact price breakdown for one car model and dates, optionally with extras (child seat etc.) and delivery. Also says whether the model is free for those dates.",
    input_schema: schema({ modelSlug: s("Model slug from search results or list_fleet"), ...dateProps, extras: { type: "array", items: { type: "object", properties: { code: { type: "string" }, quantity: { type: "integer", minimum: 1, maximum: 10 } }, required: ["code", "quantity"], additionalProperties: false } } }, ["modelSlug", "pickupDate", "returnDate"]),
  },
  {
    name: "list_fleet",
    description: "All rental car models with specs and the base daily rate (without dates). Use for general fleet questions when no dates are given.",
    input_schema: schema({ class: s("Optional class filter", { enum: CLASSES }) }),
  },
  {
    name: "get_vehicle_details",
    description: "Specs, damage excess, fuel policy and rental information of one rental car model.",
    input_schema: schema({ modelSlug: s("Model slug") }, ["modelSlug"]),
  },
  {
    name: "list_locations_and_extras",
    description: "Pick-up/return locations (with fees), delivery zones (with fees) and optional extras (with prices).",
    input_schema: schema({}),
  },
  {
    name: "get_policy",
    description: "Official rental rules and contact details: driver requirements, damage excess and insurance, fuel, cancellation and payment, what is included, current campaigns, opening hours and contacts, OSK Auto contacts.",
    input_schema: schema({ topic: s("Topic", { enum: ["requirements", "excess_insurance", "fuel", "cancellation_payment", "included", "campaigns", "hours_contact", "osk_contact"] }) }, ["topic"]),
  },
  {
    name: "search_cars_for_sale",
    description: "OSK Auto (car sales, same building as Atoll): cars currently listed for sale, with price if published.",
    input_schema: schema({ make: s("e.g. BMW"), fuel: s("", { enum: ["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG"] }), transmission: s("", { enum: ["AUTOMATIC", "MANUAL"] }), bodyType: s("", { enum: ["HATCHBACK", "SEDAN", "ESTATE", "SUV", "VAN"] }), maxPrice: { type: "number", description: "GBP" } }),
  },
  {
    name: "get_travel_info",
    description: "Content of the site's travel guides (North Cyprus guide, South Cyprus guide, driving in South Cyprus with an Atoll car, incl. the border rules). Use for sightseeing and border questions.",
    input_schema: schema({ topic: s("Guide", { enum: ["north_cyprus", "south_cyprus", "driving_in_south_cyprus"] }) }, ["topic"]),
  },
  {
    name: "prepare_request",
    description: "Prepare a request for the staff: HANDOFF (talk to a person), RENTAL_CALLBACK, SALES_INQUIRY, TEST_DRIVE or SERVICE_APPOINTMENT. Only after the customer gave name and phone. This creates a DRAFT only: the customer must press the confirm button in the chat window; until then nothing is sent. Never say it was sent or booked.",
    input_schema: schema({ kind: s("", { enum: ["HANDOFF", "RENTAL_CALLBACK", "SALES_INQUIRY", "TEST_DRIVE", "SERVICE_APPOINTMENT"] }), name: s("Customer name"), phone: s("Customer phone with country code"), email: s("Optional e-mail"), preferred: s("Preferred day/time as the customer said it"), details: s("Short summary for the staff: car, dates, question") }, ["kind", "name", "phone", "details"]),
  },
  {
    name: "note_unanswered",
    description: "Record a question you could not answer from the tools, so staff can add the information. Call it before telling the customer you don't know.",
    input_schema: schema({ question: s("The customer's question") }, ["question"]),
  },
];

/* ---------------- implementations ---------------- */

function rentalCard(m: ReturnType<typeof serializeModel>, locale: Locale, q: URLSearchParams | null, extra: Partial<Extract<Card, { type: "rental" }>> = {}): Card {
  return {
    type: "rental", slug: m.slug, name: m.name, class: m.class, seats: m.seats, transmission: m.transmission, fuel: m.fuel,
    image: mediaUrl(m.images[0]), available: null, total: null, days: null, averageDaily: null, fromDaily: m.dailyRate,
    href: path(locale, `/cars/${m.slug}${q ? `?${q}` : ""}`), campaign: m.campaign, ...extra,
  };
}

async function windowQuery(i: { pickupDate: string; pickupTime: string; returnDate: string; returnTime: string; pickupLocation?: string; returnLocation?: string; deliveryZone?: string }) {
  const loc = i.pickupLocation ?? (await defaultLocation());
  if (!loc) throw new BookingError("LOCATION_NOT_FOUND", "No active location");
  const st = { pickupLocation: loc, returnLocation: i.returnLocation ?? loc, pickupDate: i.pickupDate, pickupTime: i.pickupTime, returnDate: i.returnDate, returnTime: i.returnTime, deliveryZone: i.deliveryZone ?? null };
  return { st, q: stateToQuery(st), pickupAt: local(i.pickupDate, i.pickupTime), returnAt: local(i.returnDate, i.returnTime) };
}

const IMPL: Record<string, (input: unknown, ctx: ToolContext) => Promise<ToolResult>> = {
  async search_rental_cars(raw, ctx) {
    const i = RentalSearch.parse(raw);
    const w = await windowQuery(i);
    const r = await search({ pickupAt: w.pickupAt, returnAt: w.returnAt, pickupLocation: w.st.pickupLocation, returnLocation: w.st.returnLocation, deliveryZone: w.st.deliveryZone, class: i.class, locale: ctx.locale });
    if ("error" in r) return ERR(r.error ?? "ERROR", "Unknown location; call list_locations_and_extras");
    const rows = r.results
      .filter((m) => m.availability.available && m.quote)
      .filter((m) => (i.minSeats ? m.seats >= i.minSeats : true) && (i.transmission ? m.transmission === i.transmission : true))
      .sort((a, b) => Number(a.quote!.total) - Number(b.quote!.total));
    const top = rows.slice(0, i.maxResults);
    return {
      content: JSON.stringify({
        currency: "GBP", days: r.days, pickup: `${i.pickupDate} ${i.pickupTime}`, return: `${i.returnDate} ${i.returnTime}`, location: w.st.pickupLocation,
        availableModels: rows.length,
        cars: top.map((m) => ({ slug: m.slug, name: m.name, class: m.class, seats: m.seats, transmission: m.transmission, fuel: m.fuel, total: m.quote!.total, averageDaily: m.quote!.averageDaily, deposit: m.quote!.deposit, discountPercent: m.quote!.discountPercent, campaignFreeDays: m.quote!.campaignFreeDays, freeCars: m.availability.count })),
        note: "Totals include the rental, location fees and discounts; extras not included. Cards with booking links are shown to the customer automatically.",
      }),
      cards: top.map((m) => rentalCard(m, ctx.locale, w.q, { available: true, total: m.quote!.total, days: m.quote!.days, averageDaily: m.quote!.averageDaily })),
    };
  },

  async get_rental_quote(raw, ctx) {
    const i = Quote.parse(raw);
    const w = await windowQuery(i);
    const { quote } = await buildQuote({ modelSlug: i.modelSlug, pickupAt: w.pickupAt, returnAt: w.returnAt, pickupLocation: w.st.pickupLocation, returnLocation: w.st.returnLocation, deliveryZone: w.st.deliveryZone, extras: i.extras });
    const [m] = await listModels({ slug: i.modelSlug });
    const settings = await getSettings();
    const a = m ? (await availabilityByModel({ start: w.pickupAt, end: new Date(w.returnAt.getTime() + settings.bufferMinutes * 60_000) }, [m.id])).get(m.id) : undefined;
    const available = (a?.available ?? 0) > 0;
    return {
      content: JSON.stringify({ currency: "GBP", model: m ? `${m.make} ${m.model}` : i.modelSlug, available, quote }),
      cards: m ? [rentalCard(serializeModel(m, ctx.locale), ctx.locale, w.q, { available, total: quote.grandTotal, days: quote.days, averageDaily: quote.averageDaily })] : undefined,
    };
  },

  async list_fleet(raw, ctx) {
    const i = ListFleet.parse(raw);
    const models = (await listModels({ class: i.class })).map((m) => serializeModel(m, ctx.locale)).filter((m) => m.fleetSize > 0);
    return {
      content: JSON.stringify({ currency: "GBP", note: "dailyRate is the base daily rate before season rates, discounts and campaigns; ask for dates for an exact price.", models: models.map((m) => ({ slug: m.slug, name: m.name, class: m.class, seats: m.seats, doors: m.doors, bags: m.bags, transmission: m.transmission, fuel: m.fuel, dailyRate: m.dailyRate, campaign: m.campaign })) }),
      cards: models.slice(0, 6).map((m) => rentalCard(m, ctx.locale, null)),
    };
  },

  async get_vehicle_details(raw, ctx) {
    const i = VehicleDetails.parse(raw);
    const [m] = await listModels({ slug: i.modelSlug });
    if (!m) return ERR("MODEL_NOT_FOUND", "No such model; use list_fleet");
    const v = serializeModel(m, ctx.locale);
    const info = stripHtml(localizedRentalInfo(t(m.description, "en"), ctx.locale).html).slice(0, 2500);
    return {
      content: JSON.stringify({ slug: v.slug, name: v.name, class: v.class, seats: v.seats, doors: v.doors, bags: v.bags, transmission: v.transmission, fuel: v.fuel, engineLitres: v.engineLitres, airCon: v.airCon, years: v.years, colors: v.colors, baseDailyRate: v.dailyRate, damageExcessGBP: DAMAGE_EXCESS[v.class as keyof typeof DAMAGE_EXCESS]?.amount ?? null, rentalInformation: info, page: path(ctx.locale, `/cars/${v.slug}`) }),
      cards: [rentalCard(v, ctx.locale, null)],
    };
  },

  async list_locations_and_extras(_raw, ctx) {
    const [locs, zones, extras] = await Promise.all([
      db.location.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      db.deliveryZone.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
      db.extra.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    ]);
    return {
      content: JSON.stringify({
        currency: "GBP",
        locations: locs.map((l) => ({ slug: l.slug, name: t(l.name, ctx.locale), address: l.address, airport: l.isAirport, pickupFee: l.pickupFee.toFixed(2), returnFee: l.returnFee.toFixed(2) })),
        deliveryZones: zones.map((z) => ({ slug: z.slug, name: z.name, areas: z.areas, feeByMinDays: z.tiers })),
        extras: extras.map((e) => ({ code: e.code, name: t(e.name, ctx.locale), pricing: e.pricing, price: e.price.toFixed(2), maxQty: e.maxQty })),
      }),
    };
  },

  async get_policy(raw, ctx) {
    const { topic } = Policy.parse(raw);
    const T = SITE.terms;
    const data: Record<string, unknown> = {
      requirements: { minAge: T.minAge, bring: ["passport or ID card", "driving licence"] },
      excess_insurance: { damageExcessByClass: excessSummary(ctx.locale), note: "Excess = the most you pay for body damage covered by CDW, if the rental agreement terms are followed. Glass, wheels, interior, underside, towing and items in the car are not covered by it." },
      fuel: { policy: "Prepaid fuel: the car is handed over with a set amount of fuel, paid in advance in cash; it can be returned empty; no refund for remaining fuel. Amount per model: get_vehicle_details." },
      cancellation_payment: { cancellation: T.cancellation, payment: T.payment },
      included: { includes: T.includes },
      campaigns: { campaigns: CAMPAIGNS.map((c) => ({ models: c.models, minDays: c.minDays, freeDays: c.freeDays })), note: "Applied automatically by the booking engine; not combined with long-rental discounts." },
      hours_contact: { hours: SITE.hours, phone: SITE.phone, phone2: SITE.phone2, whatsapp: SITE.whatsapp, email: SITE.email, address: `${SITE.address.street}, ${SITE.address.locality}, ${SITE.address.region}, ${SITE.address.country}`, contactPage: path(ctx.locale, "/contact") },
      osk_contact: {
        company: "OSK Auto by Karaçay",
        address: `Same building as Atoll: ${SITE.address.street}, ${SITE.address.locality}, ${SITE.address.region}`,
        services: ["new and used car sales", "mechanical servicing and repairs", "body and paint", "auto electrics", "car wash"],
        // Owner, 2026-11-12: same hours and contacts for sales and every service department.
        hours: "Monday–Friday 09:00–21:00, Saturday 09:00–19:00, Sunday closed",
        phones: [SITE.phone, SITE.phone2], whatsapp: [SITE.phone, SITE.phone2], email: SITE.email,
        page: path(ctx.locale, "/car-sales"),
      },
    };
    return { content: JSON.stringify(data[topic]) };
  },

  async search_cars_for_sale(raw, ctx) {
    const i = SaleSearch.parse(raw);
    const cars = (await querySaleCars()).filter((c) =>
      (!i.make || c.make.toLowerCase().includes(i.make.toLowerCase())) && (!i.fuel || c.fuel === i.fuel) && (!i.transmission || c.transmission === i.transmission) &&
      (!i.bodyType || c.bodyType === i.bodyType) && (!i.maxPrice || (c.price !== null && Number(c.price) <= i.maxPrice)));
    return {
      content: JSON.stringify({ currency: "GBP", count: cars.length, cars: cars.slice(0, 8).map((c) => ({ id: c.id, make: c.make, model: c.model, year: c.year, mileageKm: c.mileageKm, fuel: c.fuel, transmission: c.transmission, bodyType: c.bodyType, colour: c.colour, price: c.price ?? "on request", status: c.status, note: c.note })), note: "If a car's note says it is a sample listing, say so and do not quote its year, mileage or price as real." }),
      cards: cars.slice(0, 6).map((c) => ({ type: "sale" as const, id: c.id, title: `${c.make} ${c.model}`, year: c.year, mileageKm: c.mileageKm, fuel: c.fuel, transmission: c.transmission, price: c.price, photo: c.photos[0] ?? null, status: c.status, note: c.note, href: path(ctx.locale, "/car-sales#stock") })),
    };
  },

  async get_travel_info(raw, ctx) {
    const { topic } = Travel.parse(raw);
    const page = topic === "north_cyprus" ? guide(ctx.locale) : topic === "south_cyprus" ? southGuide(ctx.locale) : drivingSouth(ctx.locale);
    const url = path(ctx.locale, topic === "north_cyprus" ? "/north-cyprus-guide" : topic === "south_cyprus" ? "/south-cyprus-guide" : "/driving-in-south-cyprus");
    return { content: JSON.stringify({ page: url, text: flatten(page).slice(0, 7000) }) };
  },

  async prepare_request(raw, ctx) {
    const i = RequestInput.parse(raw);
    const open = await db.chatRequest.count({ where: { sessionId: ctx.sessionId, status: "DRAFT" } });
    if (open >= 3) return ERR("TOO_MANY_DRAFTS", "Ask the customer to confirm or dismiss the open request first");
    const r = await db.chatRequest.create({ data: { sessionId: ctx.sessionId, kind: i.kind, name: i.name, phone: i.phone, email: i.email?.toLowerCase(), preferred: i.preferred, details: i.details, locale: ctx.locale } });
    return {
      content: JSON.stringify({ status: "DRAFT_AWAITING_CUSTOMER_CONFIRMATION", note: "Nothing has been sent. Tell the customer to check the details and press the confirm button under them." }),
      draft: { id: r.id, kind: r.kind, name: r.name, phone: r.phone, email: r.email, preferred: r.preferred, details: r.details },
    };
  },

  async note_unanswered(raw) {
    Unanswered.parse(raw);
    return { content: JSON.stringify({ recorded: true, next: "Offer the phone/WhatsApp contacts or prepare_request(HANDOFF)." }), unanswered: true };
  },
};

const SKIP = new Set(["photo", "heroPhoto", "mapLabels", "credits", "touristTypes", "updatedDate"]);
/** All strings of a content object, in order, as plain text (keys like photo ids are skipped). */
export function flatten(v: unknown, key = ""): string {
  if (SKIP.has(key)) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map((x) => flatten(x)).filter(Boolean).join("\n");
  if (v && typeof v === "object") return Object.entries(v).map(([k, x]) => flatten(x, k)).filter(Boolean).join("\n");
  return "";
}

/** Runs one tool call. Validation and business errors go back to the model as tool errors (it can retry or apologise); nothing throws. */
export async function runTool(name: string, input: unknown, ctx: ToolContext): Promise<ToolResult> {
  const fn = IMPL[name];
  if (!fn) return ERR("UNKNOWN_TOOL", name);
  try {
    return await fn(input, ctx);
  } catch (e) {
    if (e instanceof z.ZodError) return ERR("INVALID_INPUT", e.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; "));
    if (e instanceof BookingError) return ERR(e.code, e.message);
    console.error("[chat] tool", name, e instanceof Error ? e.message : e);
    return ERR("TOOL_FAILED", "Temporary error; offer the contact options");
  }
}
