export type ServiceError =
  | "NotFound"
  | "Unauthorized"
  | "Unauthenticated"
  | "BadRequest"
  | "OperationFailed";
export type ControllerError = "BadRequest" | "InternalServerError";
export type ApplicationErrorType = ServiceError | ControllerError;

export class ApplicationError extends Error {
  type: ApplicationErrorType;
  reason: unknown;

  constructor(type: ApplicationErrorType, message: string, reason?: unknown) {
    super(message);
    this.type = type;
    this.reason = reason;
  }
}
