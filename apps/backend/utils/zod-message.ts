import type { z } from "zod";

export function getZodErrorMessage(e: z.ZodError) {
  return e.errors
    .map((err) => `${err.path.join(".")}: ${err.message}`)
    .join("\n");
}
