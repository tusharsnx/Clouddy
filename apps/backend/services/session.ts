import type { CookieOptions } from "express";
import type { Request } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { TokenName, isDev } from "../constants.ts";
import { envs } from "../envs.ts";
import type { UserModel } from "../routes/models.ts";
import { assertTrue } from "./application-error-service/helpers.ts";
import { UserService } from "./user-service.ts";

const TokenAudience = "clouddy";
const TokenMaxAgeSec = 30 * 60; // 30 minutes
const TokenIssuer = "clouddy";

export const TokenPayloadSchema = z.object({
  id: z.string(),
});
export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

export async function getToken(user: UserModel) {
  return jwt.sign({ id: user.id } satisfies TokenPayload, envs.TOKEN_SECRET, {
    audience: TokenAudience,
    issuer: TokenIssuer,
    expiresIn: `${TokenMaxAgeSec}m`,
  });
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const payload = jwt.verify(token, envs.TOKEN_SECRET, {
    audience: TokenAudience,
    issuer: TokenIssuer,
    maxAge: TokenMaxAgeSec,
  });
  const { success, data: parsed } = TokenPayloadSchema.safeParse(payload);
  assertTrue(success, "Unauthenticated", "Invalid token.");
  return parsed;
}

export function getCookieOptions(host?: string, expire = false): CookieOptions {
  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: true,
    expires: expire
      ? new Date(0)
      : new Date(Date.now() + TokenMaxAgeSec * 1000),
    path: "/",
    sameSite: "lax",
  };

  // Add the domain attribute iff the host option is present.
  const hostname = host?.split(":")[0];
  // Avoid adding domain attribute if the host is a top-level domain.
  if (hostname?.includes(".")) {
    cookieOptions.domain = hostname;
  }

  // In devel, FE is running on a different port,
  // so we need to use a cross-site cookie.
  if (isDev) {
    cookieOptions.sameSite = "none";
  }

  return cookieOptions;
}

export async function authenticate(req: Request): Promise<UserModel> {
  const token = req.cookies[TokenName] as string | undefined;
  assertTrue(
    token !== undefined && token !== "",
    "Unauthenticated",
    "Token missing.",
  );

  const { id: userId } = await verifyToken(token);
  return await UserService.getUser(userId);
}
