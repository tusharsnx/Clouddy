import type { Response } from "express";
import { envs } from "../../envs.ts";
import { TokenMaxAgeSec } from "./service.ts";

export function writeToken(resp: Response, token: string) {
  resp.cookie(envs.TOKEN_ID, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    expires: new Date(Date.now() + TokenMaxAgeSec * 1000),
  });
}
