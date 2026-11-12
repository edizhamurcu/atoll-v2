import { readdirSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));

describe("route-exists", () => {
  it("knows every code-owned page under app/[locale] (otherwise the proxy answers 404)", async () => {
    const { STATIC_ROUTES } = await import("./route-exists");
    const dirs = readdirSync("src/app/[locale]", { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith("[")).map((d) => d.name);
    for (const d of dirs) expect(STATIC_ROUTES.has(d), d).toBe(true);
  });
});
