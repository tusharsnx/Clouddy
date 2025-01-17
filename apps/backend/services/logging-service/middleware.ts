import type { NextFunction, Request, Response } from "express";

export async function LoggingMiddlware(
  req: Request,
  resp: Response,
  next: NextFunction,
) {
  const date = new Date();
  console.log(`[${date.toISOString()}]:\t[${req.method}]:\t${req.url}`);
  next();
}
