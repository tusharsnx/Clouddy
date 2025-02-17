import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { ApplicationError } from "#/lib/app-error.ts";
import { getZodErrorMessage } from "#/utils/zod-message.ts";

type ErrorResponsePayload = {
  message: string;
  reason?: string;
};

function handleApplicationError(err: ApplicationError, resp: Response) {
  // Get status code
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  switch (err.type) {
    case "NotFound":
      statusCode = StatusCodes.NOT_FOUND;
      break;
    case "Unauthenticated":
      statusCode = StatusCodes.UNAUTHORIZED;
      break;
    case "Unauthorized":
      statusCode = StatusCodes.FORBIDDEN;
      break;
    case "BadRequest":
      statusCode = StatusCodes.BAD_REQUEST;
      break;
    case "OperationFailed":
      statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
      break;
  }

  // Construct response payload
  const payload: ErrorResponsePayload = {
    message: err.message,
  };

  // Add reason if available
  if (err.reason instanceof Error) {
    let reasonMsg = err.reason.message;
    if (err.reason instanceof z.ZodError) {
      reasonMsg = getZodErrorMessage(err.reason);
    }

    payload.reason = reasonMsg;
  }

  // Send response
  resp.status(statusCode).json(payload);
}

export async function ApplicationErrorServiceMiddleware(
  err: unknown,
  req: Request,
  resp: Response,
  next: NextFunction,
) {
  if (resp.headersSent) {
    // Headers already sent. Don't send anything else.
    resp.send();
    return;
  }

  if (err instanceof ApplicationError) {
    handleApplicationError(err, resp);
    return;
  }

  // Log unknown errors
  console.error("Unknown error:");
  console.dir(err, { depth: 10 });

  resp.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
}
