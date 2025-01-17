import type { z } from "zod";
import { assertTrue } from "../services/application-error-service/helpers.ts";
import { createHandler } from "./create-handler.ts";
import { getZodErrorMessage } from "./zod-message.ts";

export function validateBody(schema: z.ZodType) {
  return createHandler((req, resp) => {
    const { success, error } = schema.safeParse(req.body);
    assertTrue(
      success,
      "BadRequest",
      `Invalid body: ${getZodErrorMessage(error as z.ZodError)}`,
    );
  });
}

export function validateQuery(schema: z.ZodType) {
  return createHandler((req, resp) => {
    const { success, error } = schema.safeParse(req.query);
    assertTrue(
      success,
      "BadRequest",
      `Invalid query parameters: ${getZodErrorMessage(error as z.ZodError)}`,
    );
  });
}
