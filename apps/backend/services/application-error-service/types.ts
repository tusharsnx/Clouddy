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
