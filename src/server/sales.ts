import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import sharp from "sharp";
import { z } from "zod";
import { db } from "@/lib/db";
import type { BodyType, FuelType, SaleStatus, Transmission } from "@/generated/prisma/client";

/** Writable folder for sale-car photos (docker: /app/stock, a host bind mount shared by both replicas). */
export const STOCK_DIR = process.env.STOCK_DIR || path.join(process.cwd(), "stock");
const NAME = /^[a-z0-9]{16}\.webp$/;
export const stockPhotoUrl = (file: string) => `/api/v1/stock/photo/${file}`;

export async function readStockPhoto(file: string): Promise<Buffer | null> {
  if (!NAME.test(file)) return null;
  try {
    return await readFile(path.join(STOCK_DIR, file));
  } catch {
    return null;
  }
}

/** Any common image in, 1600 px WebP out (EXIF orientation applied, metadata stripped). */
export async function saveStockPhoto(input: Buffer): Promise<string> {
  const file = `${randomBytes(8).toString("hex")}.webp`;
  const out = await sharp(input, { limitInputPixels: 60_000_000 }).rotate().resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  await mkdir(STOCK_DIR, { recursive: true });
  await writeFile(path.join(STOCK_DIR, file), out);
  return file;
}

export async function deleteStockPhoto(file: string) {
  if (NAME.test(file)) await unlink(path.join(STOCK_DIR, file)).catch(() => {});
}

export type PublicSaleCar = {
  id: string; make: string; model: string; year: number; mileageKm: number; fuel: FuelType; transmission: Transmission;
  bodyType: BodyType | null; colour: string | null; price: string | null; note: string | null; photos: string[]; status: SaleStatus;
};

/** Cars shown on the sales page: available first, then reserved; sold and hidden ones never. */
export async function listSaleCars(): Promise<PublicSaleCar[]> {
  await connection();
  const rows = await db.saleCar.findMany({ where: { status: { in: ["AVAILABLE", "RESERVED"] } }, orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }] });
  return rows.map((r) => ({ ...r, price: r.price ? r.price.toFixed(0) : null, photos: r.photos.map(stockPhotoUrl) }));
}

/* ---------- admin ---------- */

export const SaleCarInput = z.object({
  make: z.string().trim().min(1).max(40),
  model: z.string().trim().min(1).max(60),
  year: z.coerce.number().int().min(1950).max(2100),
  mileageKm: z.coerce.number().int().min(0).max(2_000_000),
  fuel: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "LPG"]),
  transmission: z.enum(["AUTOMATIC", "MANUAL"]),
  bodyType: z.enum(["HATCHBACK", "SEDAN", "ESTATE", "SUV", "VAN"]).optional().or(z.literal("").transform(() => undefined)),
  colour: z.string().trim().max(30).optional(),
  price: z.string().trim().regex(/^\d{0,7}(\.\d{1,2})?$/).optional(),
  note: z.string().trim().max(200).optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export async function listSaleCarsAdmin() {
  await connection();
  return db.saleCar.findMany({ orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }] });
}
