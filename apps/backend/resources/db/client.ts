import { drizzle } from "drizzle-orm/neon-serverless";
import { envs } from "../../envs.ts";
import * as schema from "./schemas.ts";

export const DBClient = drizzle({
  connection: envs.DB_ENDPOINT,
  schema,
  casing: "snake_case",
});
