import type { Request } from "express";
import { envs } from "../../envs.ts";
import type { UserModel } from "../../resources/db/schemas.ts";
import { assertTrue } from "../application-error-service/helpers.ts";
import { UserService } from "../user-service.ts";
import { AuthService } from "./service.ts";

export async function authenticate(req: Request): Promise<UserModel> {
  const token = req.cookies[envs.TOKEN_ID] as string | undefined;
  assertTrue(
    token !== undefined && token !== "",
    "Unauthenticated",
    "Token missing.",
  );

  const { id: userId } = await AuthService.verifyToken(token);
  return await UserService.getUser(userId);
}
