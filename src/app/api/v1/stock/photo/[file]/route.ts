import { readStockPhoto } from "@/server/sales";

/** Sale-car photos from STOCK_DIR. Names are random and never reused, so they can be cached for a year. */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const buf = await readStockPhoto((await params).file);
  if (!buf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(buf), { headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" } });
}
