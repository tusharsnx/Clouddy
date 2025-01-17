import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApplicationError } from "./types.ts";

function handleApplicationError(err: ApplicationError, resp: Response) {
  switch (err.type) {
    case "NotFound":
      resp
        .status(StatusCodes.NOT_FOUND)
        .json({ message: err.message, reason: err.reason });
      break;
    case "Unauthenticated":
      resp
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: err.message, reason: err.reason });
      break;
    case "Unauthorized":
      resp
        .status(StatusCodes.FORBIDDEN)
        .json({ message: err.message, reason: err.reason });
      break;
    case "BadRequest":
      resp
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: err.message, reason: err.reason });
      break;
    case "OperationFailed":
      resp
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message, reason: err.reason });
      break;
    default:
      resp
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: err.message, reason: err.reason });
  }
}

export async function ApplicationErrorServiceMiddleware(
  err: unknown,
  req: Request,
  resp: Response,
  next: NextFunction,
) {
  if (err instanceof ApplicationError) {
    handleApplicationError(err, resp);
    return;
  }

  // Log unknown errors
  console.error("Unknown error:");
  console.dir(err, { depth: 10 });

  resp.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
}
