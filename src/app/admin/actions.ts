"use server";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { fromZonedTime } from "date-fns-tz";
import { db } from "@/lib/db";
import { audit, login, logout, requireAdmin } from "@/server/admin/auth";
import { createBlock, manualBooking, reassignVehicle, setStatus, TRANSITIONS } from "@/server/admin/ops";
import { BookingError } from "@/server/booking";
import type { BookingStatus } from "@/generated/prisma/client";

export type ActionState = { error?: string; ok?: string; email?: string } | null;
const TZ = process.env.BUSINESS_TZ ?? "Asia/Famagusta";
const local = (d: string, t: string) => fromZonedTime(`${d}T${t}:00`, TZ);
const TR: Record<string, string> = {
  SOLD_OUT: "Bu modelden bu tarihlerde boş araç yok.",
  INVALID_RANGE: "İade tarihi alıştan sonra olmalı.",
  INVALID_DATE: "Geçersiz tarih.",
  LEAD_TIME: "Alış zamanı geçmişte olamaz.",
  TOO_FAR: "Rezervasyon en fazla 18 ay ileri alınabilir.",
  MIN_DAYS: "Minimum kiralama süresinin altında.",
  MAX_DAYS: "Maksimum kiralama süresi aşıldı.",
  MODEL_NOT_FOUND: "Araç modeli bulunamadı.",
  LOCATION_NOT_FOUND: "Lokasyon bulunamadı.",
  EXTRA_NOT_FOUND: "Ekstra bulunamadı.",
  BAD_EXTRA_QTY: "Ekstra adedi geçersiz.",
};
const fail = (e: unknown): ActionState => {
  if (e instanceof BookingError) return { error: TR[e.code] ?? e.message };
  if (e instanceof z.ZodError) return { error: e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ") };
  console.error("[admin]", e instanceof Error ? e.message : e);
  return { error: "Beklenmeyen bir hata oldu" };
};

export async function loginAction(_: ActionState, f: FormData): Promise<ActionState> {
  const email = String(f.get("email") ?? ""), password = String(f.get("password") ?? "");
  const r = await login(email, password);
  // React resets uncontrolled fields after an action: echo the email back so it is kept.
  if (r === "LOCKED") return { error: "Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.", email };
  if (r === "RATE_LIMITED") return { error: "Çok fazla deneme. Biraz bekleyin.", email };
  if (r) return { error: "E-posta veya şifre hatalı.", email };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

export async function statusAction(_: ActionState, f: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  try {
    const ref = z.string().regex(/^ATL-[A-Z0-9]+$/).parse(f.get("ref"));
    const next = z.enum(Object.keys(TRANSITIONS) as [BookingStatus, ...BookingStatus[]]).parse(f.get("status"));
    const b = await setStatus(ref, next);
    await audit(a.id, `status:${b.status}->${next}`, "Booking", b.id);
    refresh();
    return { ok: "Durum güncellendi" };
  } catch (e) {
    return fail(e);
  }
}

export async function reassignAction(_: ActionState, f: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  try {
    const ref = z.string().parse(f.get("ref"));
    const vehicleId = z.string().min(1).parse(f.get("vehicleId"));
    const r = await reassignVehicle(ref, vehicleId);
    await audit(a.id, "reassign", "Booking", r.id, r);
    refresh();
    return { ok: "Araç değiştirildi" };
  } catch (e) {
    return fail(e);
  }
}

const blockSchema = z.object({ vehicleId: z.string().min(1), startDate: z.string(), startTime: z.string(), endDate: z.string(), endTime: z.string(), reason: z.string().trim().min(2).max(120) });
export async function blockAction(_: ActionState, f: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  try {
    const v = blockSchema.parse(Object.fromEntries(f));
    const blk = await createBlock(v.vehicleId, local(v.startDate, v.startTime), local(v.endDate, v.endTime), v.reason);
    await audit(a.id, "block_create", "Vehicle", v.vehicleId, { blockId: blk.id, reason: v.reason });
    refresh();
    return { ok: "Blokaj eklendi" };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteBlockAction(f: FormData) {
  const a = await requireAdmin();
  const id = z.string().parse(f.get("id"));
  const b = await db.vehicleBlock.delete({ where: { id } });
  await audit(a.id, "block_delete", "Vehicle", b.vehicleId, { blockId: id });
  refresh();
}

export async function vehicleStatusAction(f: FormData) {
  const a = await requireAdmin();
  const id = z.string().parse(f.get("id"));
  const status = z.enum(["ACTIVE", "MAINTENANCE", "RETIRED"]).parse(f.get("status"));
  await db.vehicle.update({ where: { id }, data: { status } });
  await audit(a.id, `vehicle_status:${status}`, "Vehicle", id);
  refresh();
}

const manualSchema = z.object({
  modelSlug: z.string().min(1), pickupLocation: z.string().min(1), returnLocation: z.string().min(1),
  pickupDate: z.string(), pickupTime: z.string(), returnDate: z.string(), returnTime: z.string(),
  firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80),
  email: z.email(), phone: z.string().trim().min(7).max(20), notes: z.string().max(1000).optional(),
});
export async function manualBookingAction(_: ActionState, f: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  let ref: string;
  try {
    const v = manualSchema.parse(Object.fromEntries(f));
    const extras = [...f.entries()].filter(([k, val]) => k.startsWith("extra_") && Number(val) > 0).map(([k, val]) => ({ code: k.slice(6), quantity: Number(val) }));
    const b = await manualBooking({
      modelSlug: v.modelSlug, pickupLocation: v.pickupLocation, returnLocation: v.returnLocation,
      pickupAt: local(v.pickupDate, v.pickupTime), returnAt: local(v.returnDate, v.returnTime), extras, locale: "en",
      customer: { firstName: v.firstName, lastName: v.lastName, email: v.email, phone: v.phone, notes: v.notes },
    });
    await audit(a.id, "manual_booking", "Booking", b.id, { ref: b.ref });
    ref = b.ref;
  } catch (e) {
    return fail(e);
  }
  redirect(`/admin/bookings/${ref}`);
}

export async function reviewDecisionAction(f: FormData) {
  const a = await requireAdmin();
  const id = z.string().min(5).max(40).parse(f.get("id"));
  const status = z.enum(["APPROVED", "REJECTED", "PENDING"]).parse(f.get("status"));
  const { decideReview } = await import("@/server/reviews");
  const r = await decideReview(id, status);
  await audit(a.id, `review:${status}`, "Review", r.id);
  refresh();
}

/* ---------- OSK sales stock ---------- */

const saleData = (f: FormData) => {
  const g = (k: string) => {
    const v = f.get(k);
    return typeof v === "string" ? v : undefined;
  };
  return {
    make: g("make"), model: g("model"), year: g("year"), mileageKm: g("mileageKm"), fuel: g("fuel"), transmission: g("transmission"),
    bodyType: g("bodyType") ?? "", colour: g("colour") || undefined, price: g("price") || undefined, note: g("note") || undefined, sortOrder: g("sortOrder") || 0,
  };
};

export async function saleCarSaveAction(_: ActionState, f: FormData): Promise<ActionState> {
  const a = await requireAdmin();
  try {
    const { SaleCarInput } = await import("@/server/sales");
    const v = SaleCarInput.parse(saleData(f));
    const data = { ...v, bodyType: v.bodyType ?? null, colour: v.colour || null, note: v.note || null, price: v.price ? v.price : null };
    const id = f.get("id");
    if (typeof id === "string" && id) {
      await db.saleCar.update({ where: { id }, data });
      await audit(a.id, "sale_update", "SaleCar", id);
    } else {
      const c = await db.saleCar.create({ data });
      await audit(a.id, "sale_create", "SaleCar", c.id);
    }
    refresh();
    return { ok: "Kaydedildi" };
  } catch (e) {
    return fail(e);
  }
}

export async function saleCarStatusAction(f: FormData) {
  const a = await requireAdmin();
  const id = z.string().min(5).max(40).parse(f.get("id"));
  const status = z.enum(["AVAILABLE", "RESERVED", "SOLD", "HIDDEN"]).parse(f.get("status"));
  await db.saleCar.update({ where: { id }, data: { status, soldAt: status === "SOLD" ? new Date() : null } });
  await audit(a.id, `sale_status:${status}`, "SaleCar", id);
  refresh();
}

export async function saleCarPhotoDeleteAction(f: FormData) {
  const a = await requireAdmin();
  const id = z.string().min(5).max(40).parse(f.get("id"));
  const file = z.string().regex(/^[a-z0-9]{16}\.webp$/).parse(f.get("file"));
  const { deleteStockPhoto } = await import("@/server/sales");
  const car = await db.saleCar.findUniqueOrThrow({ where: { id } });
  await db.saleCar.update({ where: { id }, data: { photos: car.photos.filter((p) => p !== file) } });
  await deleteStockPhoto(file);
  await audit(a.id, "sale_photo_delete", "SaleCar", id, { file });
  refresh();
}

export async function saleCarPhotoFirstAction(f: FormData) {
  await requireAdmin();
  const id = z.string().min(5).max(40).parse(f.get("id"));
  const file = z.string().regex(/^[a-z0-9]{16}\.webp$/).parse(f.get("file"));
  const car = await db.saleCar.findUniqueOrThrow({ where: { id } });
  await db.saleCar.update({ where: { id }, data: { photos: [file, ...car.photos.filter((p) => p !== file)] } });
  refresh();
}

export async function saleCarDeleteAction(f: FormData) {
  const a = await requireAdmin("owner");
  const id = z.string().min(5).max(40).parse(f.get("id"));
  const { deleteStockPhoto } = await import("@/server/sales");
  const car = await db.saleCar.delete({ where: { id } });
  await Promise.all(car.photos.map(deleteStockPhoto));
  await audit(a.id, "sale_delete", "SaleCar", id, { make: car.make, model: car.model });
  refresh();
}
