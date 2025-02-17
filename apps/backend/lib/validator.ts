import type { Request } from "express";
import type { z } from "zod";
import { assertTrue } from "#/lib/app-error.ts";

type ValidateInput = Partial<Record<"body" | "query", z.ZodTypeAny>>;

type ValidateOutput<I extends ValidateInput> = {
  [K in keyof I]: I[K] extends z.ZodTypeAny ? z.infer<I[K]> : never;
};

export function validate<I extends ValidateInput>(
  req: Request,
  schemas: I,
): ValidateOutput<I> {
  return (["body", "query"] as const)
    .filter((key) => key in schemas)
    .reduce(
      (acc, key) => {
        const schema = schemas[key];
        if (!schema) throw new Error("Keys were not filtered correctly");

        const { success, data, error } = schema.safeParse(req[key]);
        assertTrue(success, "BadRequest", `Invalid ${key}`, error);
        return Object.assign(acc, { [key]: data });
      },
      {} as ValidateOutput<I>,
    );
}
