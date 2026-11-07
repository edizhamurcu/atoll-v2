import { defineConfig } from "vitest/config";
import path from "node:path";
import "dotenv/config";

// Integration tests wipe tables: they must never run against the dev/prod database.
const testDb = process.env.DATABASE_URL_TEST;
if (!testDb || testDb === process.env.DATABASE_URL) throw new Error("Set DATABASE_URL_TEST to a separate database");

export default defineConfig({
  test: {
    environment: "node",
    env: { DATABASE_URL: testDb },
    fileParallelism: false,
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "test/empty.ts"),
    },
  },
});
