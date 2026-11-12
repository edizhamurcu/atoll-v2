/**
 * AI assistant — tests with a SCRIPTED FAKE model (no network, no Anthropic key).
 * They prove the backend: tools return engine prices, loop/budget limits, drafts need the visitor's click.
 * They do NOT prove the real model's wording; that is the separate live check (see docs).
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type { Message, MessageCreateParamsNonStreaming } from "@anthropic-ai/sdk/resources/messages/messages";
import { db } from "@/lib/db";
import { chatConfig, configProblem } from "./config";
import { costOf } from "./usage";
import { runTool } from "./tools";
import { history, runTurn, type ChatEvent, type ModelCall } from "./engine";
import { confirmRequest, dismissRequest, purgeOld } from "./store";
import { buildQuote } from "@/server/booking";

const ENV = { CHAT_ENABLED: "true", ANTHROPIC_API_KEY: "sk-ant-test", ANTHROPIC_MODEL: "claude-haiku-5-5", CHAT_PRICE_INPUT_PER_MTOK: "1", CHAT_PRICE_OUTPUT_PER_MTOK: "5", CHAT_DAILY_BUDGET_USD: "2", CHAT_MONTHLY_BUDGET_USD: "30", CHAT_MAX_TOOL_ROUNDS: "2" } as unknown as NodeJS.ProcessEnv;
const cfg = chatConfig(ENV);
const SID = "a".repeat(32);
const dates = { pickupDate: "2027-07-01", pickupTime: "10:00", returnDate: "2027-07-05", returnTime: "10:00" };

const usage = { input_tokens: 1000, output_tokens: 200, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
const msg = (content: Message["content"], stop: Message["stop_reason"]): Message => ({ id: "m", type: "message", role: "assistant", model: "fake", content, stop_reason: stop, stop_sequence: null, usage } as unknown as Message);
const text = (t: string) => msg([{ type: "text", text: t, citations: null } as never], "end_turn");
const tool = (name: string, input: unknown, id = "tu1") => msg([{ type: "tool_use", id, name, input } as never], "tool_use");

/** Fake model: returns the scripted replies in order and records what it was sent. */
function fake(script: (Message | Error)[]) {
  const calls: MessageCreateParamsNonStreaming[] = [];
  const call: ModelCall = async (params, onText) => {
    calls.push(structuredClone(params));
    const next = script.shift() ?? text("(end of script)");
    if (next instanceof Error) throw next;
    for (const b of next.content) if (b.type === "text") onText(b.text);
    return next;
  };
  return { call, calls };
}

async function turn(t: string, f: ReturnType<typeof fake>, c = cfg) {
  const events: ChatEvent[] = [];
  await runTurn({ sessionId: SID, locale: "en", text: t, cfg: c, call: f.call, emit: (e) => events.push(e), signal: new AbortController().signal });
  return events;
}

async function reset() {
  await db.chatSession.deleteMany();
  await db.chatUsage.deleteMany();
  await db.review.deleteMany();
  await db.bookingExtra.deleteMany();
  await db.booking.deleteMany();
  await db.vehicleBlock.deleteMany();
  await db.vehicle.deleteMany();
  await db.seasonRate.deleteMany();
  await db.vehicleModel.deleteMany();
  await db.location.deleteMany();
  await db.extra.deleteMany();
  await db.setting.deleteMany();
  await db.saleCar.deleteMany();
  await db.location.create({ data: { slug: "test-office", name: { en: "Office" }, address: "x", sortOrder: 0 } });
  await db.extra.create({ data: { code: "baby_seat", name: { en: "Baby seat" }, pricing: "PER_DAY", price: "3", maxQty: 2 } });
  const m = await db.vehicleModel.create({ data: { slug: "test-vitz", make: "Toyota", model: "Vitz", class: "ECONOMY", bodyType: "HATCHBACK", transmission: "AUTOMATIC", fuel: "PETROL", seats: 5, dailyRate: "30" } });
  await db.vehicle.create({ data: { modelId: m.id, plate: "TST1" } });
  await db.saleCar.create({ data: { make: "BMW", model: "X6", year: 2020, mileageKm: 0, fuel: "DIESEL", transmission: "AUTOMATIC", note: "Örnek ilan / Sample listing", photos: [] } });
  await db.chatSession.create({ data: { id: SID, locale: "en" } });
}

describe("assistant config and cost (unit)", () => {
  it("refuses to run without key, model, prices or budgets", () => {
    expect(configProblem(cfg)).toBeNull();
    expect(configProblem(chatConfig({ ...ENV, CHAT_ENABLED: "false" }))).toBe("ENV_DISABLED");
    expect(configProblem(chatConfig({ ...ENV, ANTHROPIC_API_KEY: "" }))).toBe("NO_KEY");
    expect(configProblem(chatConfig({ ...ENV, ANTHROPIC_MODEL: "" }))).toBe("NO_MODEL");
    expect(configProblem(chatConfig({ ...ENV, CHAT_PRICE_OUTPUT_PER_MTOK: "" }))).toBe("NO_PRICES");
    expect(configProblem(chatConfig({ ...ENV, CHAT_DAILY_BUDGET_USD: "" }))).toBe("NO_BUDGET");
  });
  it("computes cost exactly, cache tokens at 1.25x / 0.1x input by default", () => {
    expect(costOf({ input_tokens: 1_000_000, output_tokens: 1_000_000 }, cfg.price).toFixed(6)).toBe("6.000000");
    expect(costOf({ input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 1_000_000, cache_read_input_tokens: 1_000_000 }, cfg.price).toFixed(6)).toBe("1.350000");
  });
  it("clamps limits from the environment", () => {
    expect(chatConfig({ CHAT_MAX_TOOL_ROUNDS: "99" } as unknown as NodeJS.ProcessEnv).maxToolRounds).toBe(8);
    expect(chatConfig({} as unknown as NodeJS.ProcessEnv).maxInputChars).toBe(1000);
  });
});

describe("assistant tools and loop (real Postgres, fake model)", () => {
  beforeEach(reset);
  afterAll(async () => {
    await db.$disconnect();
  });

  it("search tool returns the booking engine's own total and a prefilled booking link", async () => {
    const r = await runTool("search_rental_cars", dates, { sessionId: SID, locale: "en" });
    expect(r.isError).toBeUndefined();
    const { quote } = await buildQuote({ modelSlug: "test-vitz", pickupAt: new Date("2027-07-01T10:00:00+03:00"), returnAt: new Date("2027-07-05T10:00:00+03:00"), pickupLocation: "test-office", returnLocation: "test-office", extras: [] });
    const card = r.cards![0] as Extract<NonNullable<typeof r.cards>[number], { type: "rental" }>;
    expect(card.total).toBe(quote.grandTotal);
    expect(card.href).toMatch(/^\/en\/cars\/test-vitz\?pickupLocation=test-office&returnLocation=test-office&pickupAt=2027-07-01T07%3A00%3A00.000Z/);
  });

  it("rejects bad tool input and unknown tools as tool errors, never throwing", async () => {
    expect((await runTool("search_rental_cars", { pickupDate: "01/07/2027", returnDate: "x" }, { sessionId: SID, locale: "en" })).isError).toBe(true);
    expect((await runTool("get_rental_quote", { ...dates, modelSlug: "../etc" }, { sessionId: SID, locale: "en" })).isError).toBe(true);
    expect((await runTool("get_rental_quote", { ...dates, modelSlug: "nope" }, { sessionId: SID, locale: "en" })).content).toContain("MODEL_NOT_FOUND");
    expect((await runTool("delete_everything", {}, { sessionId: SID, locale: "en" })).content).toContain("UNKNOWN_TOOL");
  });

  it("sale stock passes the 'sample listing' note through so it is not presented as real", async () => {
    const r = await runTool("search_cars_for_sale", { make: "bmw" }, { sessionId: SID, locale: "tr" });
    expect(JSON.parse(r.content).cars[0]).toMatchObject({ make: "BMW", price: "on request", note: expect.stringContaining("Sample") });
    expect(r.cards![0]).toMatchObject({ type: "sale", href: "/tr/car-sales#stock" });
  });

  it("full turn: tool call → cards with engine price → streamed answer → stored, usage and cost recorded", async () => {
    const f = fake([tool("search_rental_cars", dates), text("The Toyota Vitz is free for those dates.")]);
    const ev = await turn("Car for 1-5 July?", f);
    expect(ev.map((e) => e.type)).toEqual(["cards", "text", "done"]);
    expect(f.calls[1].messages.at(-1)).toMatchObject({ role: "user", content: [{ type: "tool_result", tool_use_id: "tu1" }] });
    expect((f.calls[0].system as { cache_control?: unknown }[])[0].cache_control).toEqual({ type: "ephemeral" });
    const stored = await db.chatMessage.findMany({ where: { sessionId: SID }, orderBy: { createdAt: "asc" } });
    expect(stored.map((m) => [m.role, m.tools])).toEqual([["user", []], ["assistant", ["search_rental_cars"]]]);
    const u = await db.chatUsage.findFirstOrThrow();
    expect(u.requests).toBe(2);
    expect(u.costUsd.toString()).toBe("0.004"); // 2 × (1000×$1 + 200×$5)/1M
  });

  it("stops the tool loop after CHAT_MAX_TOOL_ROUNDS and forces a text answer", async () => {
    const f = fake([tool("list_fleet", {}), tool("list_fleet", {}, "tu2"), text("Here is our fleet.")]);
    await turn("fleet?", f);
    expect(f.calls).toHaveLength(3);
    expect(f.calls[0].tool_choice).toBeUndefined();
    expect(f.calls[2].tool_choice).toEqual({ type: "none" });
  });

  it("does not call the model when the daily budget is used up", async () => {
    await db.chatUsage.create({ data: { day: new Date(new Date().toISOString().slice(0, 10)), costUsd: "1.999" } });
    const f = fake([text("should not happen")]);
    const ev = await turn("hi", f);
    expect(f.calls).toHaveLength(0);
    expect(ev).toContainEqual({ type: "error", code: "BUDGET" });
    expect((await db.chatMessage.findFirstOrThrow({ where: { role: "assistant" } })).unanswered).toBe(true);
  });

  it("API failure → contact fallback event, error counted, question flagged unanswered", async () => {
    const ev = await turn("hi", fake([new Error("529 overloaded")]));
    expect(ev).toEqual([{ type: "error", code: "UNAVAILABLE" }, { type: "done" }]);
    expect((await db.chatUsage.findFirstOrThrow()).errors).toBe(1);
    // the failure marker is not sent back to the model next time
    expect(await history(SID, 10)).toEqual([{ role: "user", content: "hi" }]);
  });

  it("prepare_request makes a DRAFT only; only the owner session's confirm submits it, once", async () => {
    const f = fake([tool("prepare_request", { kind: "TEST_DRIVE", name: "Ali Veli", phone: "+90 533 000 00 00", details: "BMW X6 test drive" }), text("Please press Confirm.")]);
    const ev = await turn("test drive please", f);
    const d = ev.find((e) => e.type === "draft") as Extract<ChatEvent, { type: "draft" }>;
    expect((await db.chatRequest.findUniqueOrThrow({ where: { id: d.draft.id } })).status).toBe("DRAFT");
    expect(await confirmRequest(d.draft.id, "b".repeat(32))).toBe("NOT_FOUND");
    expect(await confirmRequest(d.draft.id, SID)).toBe("OK");
    expect(await confirmRequest(d.draft.id, SID)).toBe("OK");
    const r = await db.chatRequest.findUniqueOrThrow({ where: { id: d.draft.id } });
    expect(r.status).toBe("SUBMITTED");
    expect(await dismissRequest(d.draft.id, SID)).toBe(false);
  });

  it("validates request contact data (no free-form junk reaches staff)", async () => {
    const r = await runTool("prepare_request", { kind: "HANDOFF", name: "A", phone: "call me", details: "x" }, { sessionId: SID, locale: "en" });
    expect(r.isError).toBe(true);
    expect(await db.chatRequest.count()).toBe(0);
  });

  it("history alternates roles and starts with the user", async () => {
    await db.chatMessage.createMany({ data: [
      { sessionId: SID, role: "assistant", text: "orphan", createdAt: new Date(1000) },
      { sessionId: SID, role: "user", text: "a", createdAt: new Date(2000) },
      { sessionId: SID, role: "user", text: "b", createdAt: new Date(3000) },
      { sessionId: SID, role: "assistant", text: "c", createdAt: new Date(4000) },
    ] });
    expect(await history(SID, 10)).toEqual([{ role: "user", content: "a\n\nb" }, { role: "assistant", content: "c" }]);
  });

  it("retention purge removes old conversations with their messages", async () => {
    await db.chatSession.create({ data: { id: "c".repeat(32), lastAt: new Date(Date.now() - 100 * 86_400_000) } });
    await db.chatMessage.create({ data: { sessionId: "c".repeat(32), role: "user", text: "old" } });
    expect(await purgeOld(cfg, true)).toBe(1);
    expect(await db.chatMessage.count({ where: { text: "old" } })).toBe(0);
    expect(await db.chatSession.count({ where: { id: SID } })).toBe(1);
  });
});
