import jwt from "jsonwebtoken";
import { z } from "zod";
import { envs } from "../../envs.ts";
import type { UserModel } from "../../resources/db/schemas.ts";
import { assertTrue } from "../application-error-service/helpers.ts";

const TokenAudience = "clouddy";
export const TokenMaxAgeSec = 5 * 60; // 5 minutes
const TokenIssuer = "clouddy";

export const TokenPayloadSchema = z.object({
  id: z.string(),
});
export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

export const AuthService = {
  async getSignedToken(user: UserModel) {
    const payload: TokenPayload = { id: user.id };
    return jwt.sign(payload, envs.TOKEN_SECRET, {
      audience: TokenAudience,
      issuer: TokenIssuer,
      expiresIn: `${TokenMaxAgeSec}m`,
    });
  },

  async verifyToken(token: string): Promise<TokenPayload> {
    const payload = jwt.verify(token, envs.TOKEN_SECRET, {
      audience: TokenAudience,
      issuer: TokenIssuer,
      maxAge: TokenMaxAgeSec,
    });
    const { success, data: parsed } = TokenPayloadSchema.safeParse(payload);
    assertTrue(success, "Unauthenticated", "Invalid token.");
    return parsed;
  },
};
