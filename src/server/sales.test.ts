import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

process.env.STOCK_DIR = mkdtempSync(path.join(tmpdir(), "stock-"));

describe("sale stock photos and input", async () => {
  const { SaleCarInput, readStockPhoto, saveStockPhoto } = await import("./sales");
  it("converts an upload to <=1600 px WebP with a random safe name and reads it back", async () => {
    const jpg = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#c3262f" } }).jpeg().toBuffer();
    const name = await saveStockPhoto(jpg);
    expect(name).toMatch(/^[a-z0-9]{16}\.webp$/);
    const meta = await sharp((await readStockPhoto(name))!).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(1600);
  });
  it("refuses path tricks and non-images", async () => {
    expect(await readStockPhoto("../../etc/passwd")).toBeNull();
    expect(await readStockPhoto("abc.webp")).toBeNull();
    await expect(saveStockPhoto(Buffer.from("not an image"))).rejects.toThrow();
  });
  it("validates car fields; empty price means 'on request'", () => {
    const ok = { make: "Toyota", model: "Corolla", year: "2019", mileageKm: "45000", fuel: "PETROL", transmission: "AUTOMATIC", bodyType: "" };
    expect(SaleCarInput.parse(ok).bodyType).toBeUndefined();
    expect(SaleCarInput.safeParse({ ...ok, year: "1800" }).success).toBe(false);
    expect(SaleCarInput.safeParse({ ...ok, price: "12,500" }).success).toBe(false);
    expect(SaleCarInput.parse({ ...ok, price: "12500" }).price).toBe("12500");
  });
});
