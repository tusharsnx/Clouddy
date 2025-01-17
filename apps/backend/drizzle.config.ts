import { defineConfig } from "drizzle-kit";
import { envs } from "./envs.ts";

export default defineConfig({
  out: "./resources/db/drizzle",
  schema: "./resources/db/schemas.ts",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: envs.DB_ENDPOINT,
  },
});
