export type ServiceError =
  | "NotFound"
  | "Unauthorized"
  | "Unauthenticated"
  | "BadRequest"
  | "OperationFailed";
export type ControllerError = "BadRequest" | "InternalServerError";
type ErrorType = ServiceError | ControllerError;

export class ApplicationError extends Error {
  type: ErrorType;
  reason: unknown;

  constructor(type: ErrorType, message: string, reason?: unknown) {
    super(message);
    this.type = type;
    this.reason = reason;
  }
}
