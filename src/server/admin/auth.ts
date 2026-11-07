import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { hash, verify } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/redis";

const COOKIE = "atoll_admin";
const SESSION_HOURS = 12;
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export type Admin = { id: string; email: string; name: string; role: "owner" | "staff" };

export const hashPassword = (pw: string) => hash(pw, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
let dummy: Promise<string> | null = null; // real hash so unknown users cost the same verify time
const dummyHash = () => (dummy ??= hashPassword(randomBytes(16).toString("hex")));

async function clientMeta() {
  const h = await headers();
  return { ip: h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? "unknown", ua: (h.get("user-agent") ?? "").slice(0, 200) };
}

/** Returns an error code or null on success (sets the session cookie). Generic errors: no user enumeration. */
export async function login(email: string, password: string): Promise<"INVALID" | "LOCKED" | "RATE_LIMITED" | null> {
  const { ip, ua } = await clientMeta();
  if (!(await rateLimit(`admin-login:${ip}`, 10, 900))) return "RATE_LIMITED";
  const user = await db.adminUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  // Always run a hash verify to keep timing similar for unknown users.
  const ok = await verify(user?.passwordHash ?? (await dummyHash()), password).catch(() => false);
  if (!user || !user.active) return "INVALID";
  if (user.lockedUntil && user.lockedUntil > new Date()) return "LOCKED";
  if (!ok) {
    const fails = user.failedLogins + 1;
    await db.adminUser.update({ where: { id: user.id }, data: { failedLogins: fails, lockedUntil: fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null } });
    await audit(user.id, "login_failed", "AdminUser", user.id, { ip });
    return fails >= MAX_FAILS ? "LOCKED" : "INVALID";
  }
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3_600_000);
  await db.$transaction([
    db.adminSession.create({ data: { tokenHash: sha(token), userId: user.id, expiresAt, ip, userAgent: ua } }),
    db.adminUser.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } }),
    db.adminSession.deleteMany({ where: { userId: user.id, expiresAt: { lt: new Date() } } }),
  ]);
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/admin", expires: expiresAt });
  await audit(user.id, "login", "AdminUser", user.id, { ip });
  return null;
}

export async function getAdmin(): Promise<Admin | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const s = await db.adminSession.findUnique({ where: { tokenHash: sha(token) }, include: { user: true } });
  if (!s || s.expiresAt <= new Date() || !s.user.active) return null;
  return { id: s.user.id, email: s.user.email, name: s.user.name, role: s.user.role === "owner" ? "owner" : "staff" };
}

export async function requireAdmin(role?: "owner"): Promise<Admin> {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  if (role === "owner" && a.role !== "owner") throw new Error("FORBIDDEN");
  return a;
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.adminSession.deleteMany({ where: { tokenHash: sha(token) } });
  jar.delete({ name: COOKIE, path: "/admin" });
}

export async function audit(actorId: string | null, action: string, entity: string, entityId?: string | null, data?: object) {
  const { ip } = await clientMeta().catch(() => ({ ip: null as string | null }));
  await db.auditLog.create({ data: { actorId, action, entity, entityId: entityId ?? null, data: data ?? undefined, ip } }).catch(() => {});
}
