import type { z } from "zod";
import { assertTrue } from "../services/application-error-service/helpers.ts";

export function validate<Output>(schema: z.ZodType<Output>, value: unknown) {
  const { success, data, error } = schema.safeParse(value);
  assertTrue(success, "BadRequest", "Invalid query parameters", error);
  return data;
}
