import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };

function client(): PrismaClient {
  if (g.prisma) return g.prisma;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // Session TZ pinned to UTC: the pg adapter sends timestamps without offset.
  g.prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: 10, options: "-c timezone=UTC" }) });
  return g.prisma;
}

/** Lazy: nothing connects at import/build time. */
export const db = new Proxy({} as PrismaClient, {
  get(_t, prop) {
    const c = client();
    const v = Reflect.get(c, prop, c);
    return typeof v === "function" ? v.bind(c) : v;
  },
});
