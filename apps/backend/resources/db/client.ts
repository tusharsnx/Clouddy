import { drizzle } from "drizzle-orm/neon-serverless";
import { envs } from "#/envs.ts";
import * as schemas from "#/resources/db/schemas.drizzle.ts";

export const db = drizzle({
  connection: envs.DB_ENDPOINT,
  schema: schemas,
  casing: "snake_case",
});
