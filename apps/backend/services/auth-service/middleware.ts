import type { Request } from "express";
import { envs } from "../../envs.ts";
import type { UserModel } from "../../resources/db/schemas.ts";
import { assertTrue } from "../application-error-service/helpers.ts";
import { UserService } from "../user-service.ts";
import { AuthService } from "./service.ts";

export type AuthnRequest = Omit<Request, "user"> & { user: UserModel };
export async function authenticateRequest(
  req: Omit<Request, "user"> & { user?: unknown },
): Promise<AuthnRequest> {
  const token = req.cookies[envs.TOKEN_ID] as string | undefined;
  assertTrue(
    token !== undefined && token !== "",
    "Unauthenticated",
    "Token missing.",
  );

  const { id: userId } = await AuthService.verifyToken(token);
  const user = await UserService.getUser(userId);
  const authnReq = Object.assign(req, { user });
  return authnReq;
}
