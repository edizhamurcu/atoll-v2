import { afterEach, describe, expect, it, vi } from "vitest";
import { composeNotes, spamReason, verifyTurnstile } from "./antispam";
import { confirmSchema } from "./schemas";
import { NOTE_TOPICS, NOTE_TOPIC_LABELS } from "@/content/booking-notes";
import en from "../../messages/en.json";
import tr from "../../messages/tr.json";
import de from "../../messages/de.json";
import ru from "../../messages/ru.json";

const base = { firstName: "Ayşe", lastName: "Kaya" };

describe("spamReason", () => {
  it("passes normal input, including a single link in notes", () => {
    expect(spamReason(base)).toBeNull();
    expect(spamReason({ ...base, notes: "Hotel: https://maps.app/x" })).toBeNull();
  });
  it("flags links in names and link-stuffed notes", () => {
    expect(spamReason({ firstName: "Buy now www.spam.biz", lastName: "X" })).toBe("link in name");
    expect(spamReason({ ...base, notes: "http://a.io http://b.io http://c.io" })).toBe("too many links in notes");
  });
  it("is stable across repeated calls (global regex state)", () => {
    const spam = { firstName: "http://x.io", lastName: "Y" };
    expect(spamReason(spam)).toBe("link in name");
    expect(spamReason(spam)).toBe("link in name");
    expect(spamReason(base)).toBeNull();
  });
});

describe("composeNotes", () => {
  it("puts the English topic label first, then the text", () => {
    expect(composeNotes("child_seat", "  2 yaş  ")).toBe("Topic: Child / baby seat\n2 yaş");
  });
  it("handles topic-only, text-only and empty", () => {
    expect(composeNotes("late_arrival", "")).toBe("Topic: Late or delayed arrival");
    expect(composeNotes(undefined, "hi")).toBe("hi");
    expect(composeNotes(undefined, "   ")).toBeUndefined();
  });
  it("caps at 1000 chars", () => {
    expect(composeNotes("special_request", "x".repeat(2000))!.length).toBe(1000);
  });
});

describe("confirmSchema anti-spam fields", () => {
  const ok = { paymentMode: "pay_on_pickup", acceptTerms: true, customer: { email: "a@b.co", firstName: "A", lastName: "B", phone: "+90 533 123 45 67" } };
  it("accepts known topics and rejects unknown ones", () => {
    expect(confirmSchema.parse({ ...ok, customer: { ...ok.customer, notesTopic: "child_seat" } }).customer.notesTopic).toBe("child_seat");
    expect(() => confirmSchema.parse({ ...ok, customer: { ...ok.customer, notesTopic: "free_car" } })).toThrow();
  });
  it("lets the honeypot through parsing so the route can reject it generically", () => {
    expect(confirmSchema.parse({ ...ok, website: "http://spam" }).website).toBe("http://spam");
  });
});

describe("verifyTurnstile", () => {
  afterEach(() => {
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.TURNSTILE_SITE_KEY;
  });
  const on = () => { process.env.TURNSTILE_SECRET_KEY = "s"; process.env.TURNSTILE_SITE_KEY = "k"; };
  const reply = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

  it("passes when not configured", async () => {
    expect(await verifyTurnstile(undefined, "1.2.3.4")).toBe(true);
  });
  it("requires a token once configured", async () => {
    on();
    expect(await verifyTurnstile(undefined, "1.2.3.4", reply({ success: true }))).toBe(false);
  });
  it("follows Cloudflare's verdict", async () => {
    on();
    expect(await verifyTurnstile("t", "1.2.3.4", reply({ success: true }))).toBe(true);
    expect(await verifyTurnstile("t", "1.2.3.4", reply({ success: false, "error-codes": ["invalid-input-response"] }))).toBe(false);
  });
  it("fails open when Cloudflare is unreachable", async () => {
    on();
    const down = vi.fn(async () => { throw new Error("ECONNRESET"); }) as unknown as typeof fetch;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await verifyTurnstile("t", "1.2.3.4", down)).toBe(true);
    expect(await verifyTurnstile("t", "1.2.3.4", reply({}, 500))).toBe(true);
    warn.mockRestore();
  });
});

describe("booking form copy", () => {
  it("has a label, a hint and English staff label for every topic in every language", () => {
    for (const m of [en, tr, de, ru]) {
      for (const k of NOTE_TOPICS) {
        expect(m.booking.topics[k]).toBeTruthy();
        expect(m.booking.topicHints[k]).toBeTruthy();
      }
      expect(m.booking.topicHints.none).toBeTruthy();
      expect(Object.keys(m.booking.ph).sort()).toEqual(Object.keys(en.booking.ph).sort());
      expect(Object.keys(m.booking.errors).sort()).toEqual(Object.keys(en.booking.errors).sort());
    }
    for (const k of NOTE_TOPICS) expect(NOTE_TOPIC_LABELS[k]).toMatch(/^[A-Z]/);
  });
  it("uses locale-specific examples rather than the English ones", () => {
    for (const m of [tr, de, ru]) {
      expect(m.booking.ph.firstName).not.toBe(en.booking.ph.firstName);
      expect(m.booking.ph.phone).not.toBe(en.booking.ph.phone);
    }
  });
});
