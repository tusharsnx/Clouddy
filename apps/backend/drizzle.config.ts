import { defineConfig } from "drizzle-kit";
import { envs } from "./envs.ts";

export default defineConfig({
  out: "./resources/db/drizzle",
  schema: "./resources/db/schemas.drizzle.ts",
  dialect: "postgresql",
  casing: "snake_case",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: envs.DB_ENDPOINT,
  },
});
