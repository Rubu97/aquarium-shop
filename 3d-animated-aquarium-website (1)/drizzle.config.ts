import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Set DATABASE_URL (or DATABASE_DIRECT_URL) before running Drizzle Kit.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url: databaseUrl },
});
