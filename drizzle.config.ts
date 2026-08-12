import { defineConfig } from "drizzle-kit";
import { DATABASE_AUTH_TOKEN, DATABASE_URL } from "./src/db/path";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "turso",
  dbCredentials: {
    url: DATABASE_URL,
    authToken: DATABASE_AUTH_TOKEN,
  },
});
