import {
  ApplicationError,
  type ControllerError,
  type ServiceError,
} from "./types.ts";

type AnyApplicationError = ServiceError | ControllerError;
export function assertNotUndefined<T>(
  value: unknown,
  type: AnyApplicationError,
  message: string,
  reason?: unknown,
): asserts value {
  if (value === undefined) {
    throw new ApplicationError(type, message, reason);
  }
}

export function assertTrue(
  value: boolean,
  type: AnyApplicationError,
  message: string,
  reason?: unknown,
): asserts value {
  if (!value) {
    throw new ApplicationError(type, message, reason);
  }
}
