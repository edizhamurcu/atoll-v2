import { db } from "@/lib/db";
import { audit, requireAdmin } from "@/server/admin/auth";
import { saveStockPhoto } from "@/server/sales";

const MAX = 10 * 1024 * 1024; // nginx client_max_body_size is 10m
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif"]);

/** One photo per request (the admin page uploads files one by one), converted to 1600 px WebP. */
export async function POST(req: Request) {
  const a = await requireAdmin();
  const f = await req.formData();
  const id = f.get("id"), file = f.get("file");
  if (typeof id !== "string" || !(file instanceof File)) return Response.json({ error: "BAD_REQUEST" }, { status: 400 });
  if (file.size > MAX || (file.type && !TYPES.has(file.type))) return Response.json({ error: "BAD_FILE" }, { status: 415 });
  const car = await db.saleCar.findUnique({ where: { id }, select: { photos: true } });
  if (!car) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  if (car.photos.length >= 20) return Response.json({ error: "TOO_MANY" }, { status: 409 });
  let name: string;
  try {
    name = await saveStockPhoto(Buffer.from(await file.arrayBuffer()));
  } catch {
    return Response.json({ error: "NOT_AN_IMAGE" }, { status: 415 });
  }
  await db.saleCar.update({ where: { id }, data: { photos: { push: name } } });
  await audit(a.id, "sale_photo_add", "SaleCar", id, { file: name });
  return Response.json({ ok: true, file: name }, { status: 201 });
}
