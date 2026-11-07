import { json, handleError } from "@/server/http";
import { listModels, serializeModel, type Locale } from "@/server/catalog";

export async function GET(req: Request) {
  try {
    const locale = (new URL(req.url).searchParams.get("locale") ?? "en") as Locale;
    const models = await listModels();
    return json({ data: models.map((m) => serializeModel(m, locale)) });
  } catch (e) {
    return handleError(e);
  }
}
