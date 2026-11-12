import { afterEach, describe, expect, it } from "vitest";
import { sendMail, staffRecipients } from "./mail";

describe("staff e-mail recipients", () => {
  afterEach(() => {
    delete process.env.NOTIFY_EMAILS;
  });
  it("uses NOTIFY_EMAILS, ignoring blanks and invalid entries", () => {
    process.env.NOTIFY_EMAILS = " a@x.com, ,not-an-email, b@y.co ";
    expect(staffRecipients()).toEqual(["a@x.com", "b@y.co"]);
  });
  it("falls back to the site e-mail", () => {
    expect(staffRecipients()).toEqual(["info@atollrentacar.com"]);
  });
  it("does nothing (and does not throw) when SMTP is not configured", async () => {
    delete process.env.SMTP_HOST;
    expect(await sendMail({ to: "a@x.com", subject: "s", text: "t" })).toBe(false);
  });
});
