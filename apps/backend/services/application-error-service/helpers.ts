import { ApplicationError, type ApplicationErrorType } from "./types.ts";

export function assertNotUndefined<T>(
  value: unknown,
  type: ApplicationErrorType,
  message: string,
  reason?: unknown,
): asserts value {
  if (value === undefined) {
    throw new ApplicationError(type, message, reason);
  }
}

export function assertTrue(
  value: boolean,
  type: ApplicationErrorType,
  message: string,
  reason?: unknown,
): asserts value {
  if (!value) {
    throw new ApplicationError(type, message, reason);
  }
}
