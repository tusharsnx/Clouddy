import type { Request } from "express";
import type { z } from "zod";
import { assertTrue } from "#/services/application-error-service/helpers.ts";
import type { PickProps } from "#/types.ts";

export type ValidateSchemas<B, Q> = {
  body?: z.ZodType<B>;
  query?: z.ZodType<Q>;
};

export type Validated<Schemas extends object> = {
  [K in keyof Schemas]: Schemas[K] extends z.ZodType<infer T> ? T : never;
};

export function validate<B, Q, Schemas extends ValidateSchemas<B, Q>>(
  req: Request,
  schemas: Schemas,
): Validated<PickProps<Schemas, z.ZodType>> {
  if (!schemas.body && !schemas.query) return {} as Validated<Schemas>;

  type SchemaOutput<S extends z.ZodType<unknown> | undefined> =
    S extends z.ZodType<infer T> ? T : undefined;

  const result: {
    body?: SchemaOutput<Schemas["body"]>;
    query?: SchemaOutput<Schemas["query"]>;
  } = {};

  if (schemas.body) {
    const { success, data, error } = schemas.body.safeParse(req.body);
    assertTrue(success, "BadRequest", "Invalid body", error);
    result.body = data as SchemaOutput<Schemas["body"]>;
  }

  if (schemas.query) {
    const { success, data, error } = schemas.query.safeParse(req.query);
    assertTrue(success, "BadRequest", "Invalid query parameters", error);
    result.query = data as SchemaOutput<Schemas["query"]>;
  }

  return result as Validated<typeof schemas>;
}
