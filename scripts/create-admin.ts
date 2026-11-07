/** Usage: ADMIN_EMAIL=.. ADMIN_NAME=.. ADMIN_PASSWORD=.. [ADMIN_ROLE=owner] tsx scripts/create-admin.ts */
import "dotenv/config";
import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const { ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD, ADMIN_ROLE = "owner" } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_NAME || !ADMIN_PASSWORD) throw new Error("ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD required");
  if (ADMIN_PASSWORD.length < 12) throw new Error("Password must be at least 12 characters");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  const passwordHash = await hash(ADMIN_PASSWORD, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const email = ADMIN_EMAIL.trim().toLowerCase();
  await db.adminUser.upsert({
    where: { email },
    create: { email, name: ADMIN_NAME, passwordHash, role: ADMIN_ROLE },
    update: { name: ADMIN_NAME, passwordHash, role: ADMIN_ROLE, active: true, failedLogins: 0, lockedUntil: null },
  });
  console.log(`admin ready: ${email} (${ADMIN_ROLE})`);
  await db.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
