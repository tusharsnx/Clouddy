export type ApplicationErrorType =
  | "NotFound"
  | "Unauthorized"
  | "Unauthenticated"
  | "BadRequest"
  | "OperationFailed"
  | "InternalServerError";

export class ApplicationError extends Error {
  type: ApplicationErrorType;
  reason: unknown;
  fault: "server" | "client";

  constructor(type: ApplicationErrorType, message: string, reason?: unknown) {
    super(message);
    this.type = type;
    this.reason = reason;
    this.fault =
      type === "OperationFailed" || type === "InternalServerError"
        ? "server"
        : "client";
  }
}

export function assertNotUndefined(
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

export const canRetry = (e: ApplicationError) => e.fault === "server";
