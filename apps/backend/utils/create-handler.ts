import type { NextFunction, Request, Response } from "express";
import {
  type AuthnRequest,
  authenticateRequest,
} from "../services/auth-service/middleware.ts";

export function createHandler(
  handler: (req: Request, resp: Response) => Promise<void> | void,
) {
  return async (req: Request, resp: Response, next: NextFunction) => {
    try {
      await handler(req, resp);
    } catch (e) {
      next(e);
    }
  };
}

export function createAuthnHandler(
  handler: (req: AuthnRequest, resp: Response) => void | Promise<void>,
) {
  return async (req: Request, resp: Response, next: NextFunction) => {
    try {
      const authnReq = await authenticateRequest(req);
      await handler(authnReq, resp);
    } catch (e) {
      next(e);
    }
  };
}
