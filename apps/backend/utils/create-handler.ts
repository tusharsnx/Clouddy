import type { NextFunction, Request, Response } from "express";

export function createSafeHandler<Req extends Request, Res extends Response>(
  handler: (req: Req, resp: Res, next: NextFunction) => Promise<void> | void,
) {
  return async (req: Req, resp: Res, next: NextFunction) => {
    try {
      await handler(req, resp, next);
    } catch (e) {
      next(e);
    }
  };
}
