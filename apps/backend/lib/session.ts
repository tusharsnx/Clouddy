import { eq } from "drizzle-orm";
import * as jose from "jose";
import { z } from "zod";
import { envs } from "#/envs.ts";
import { db } from "#/resources/db/client.ts";
import { tables } from "#/resources/db/tables.ts";
import type { UpdateSession } from "#/routes/models.ts";
import { getEncryptionKey } from "#/utils/misc.ts";

const JWTSecret = await getEncryptionKey(envs.TOKEN_SECRET);
const JWTEncAlgorithm = "dir";
const JWTContentEncAlgorithm = "A256GCM";

const TokenPayloadSchema = z.object({
  sid: z.string(),
  tid: z.string(),
  uid: z.string(),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

export async function createToken(payload: TokenPayload, maxAge: number) {
  const jwt = await new jose.EncryptJWT(payload)
    .setProtectedHeader({ alg: JWTEncAlgorithm, enc: JWTContentEncAlgorithm })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .encrypt(JWTSecret);
  return jwt;
}

export async function verifyToken(
  token: string,
): Promise<TokenPayload | undefined> {
  try {
    const jwt = await jose.jwtDecrypt(token, JWTSecret, {
      keyManagementAlgorithms: [JWTEncAlgorithm],
      contentEncryptionAlgorithms: [JWTContentEncAlgorithm],
    });
    const parsed = TokenPayloadSchema.safeParse(jwt.payload);
    return parsed.data;
  } catch {
    return undefined;
  }
}

export async function getSessionByRefreshToken(tid: string) {
  return await db.query.sessions.findFirst({
    where: eq(tables.sessions.refreshTokenId, tid),
  });
}

export async function updateSessionRefreshToken(sid: string, tid: string) {
  return await db
    .update(tables.sessions)
    .set({
      refreshTokenId: tid,
    })
    .where(eq(tables.sessions.id, sid));
}

export async function saveSession(session: TokenPayload) {
  return await db.insert(tables.sessions).values({
    id: session.sid,
    refreshTokenId: session.tid,
    userId: session.uid,
  });
}

export async function updateSession(sid: string, data: UpdateSession) {
  return await db
    .update(tables.sessions)
    .set(data)
    .where(eq(tables.sessions.id, sid));
}

export async function deleteSession(sid: string) {
  return await db.delete(tables.sessions).where(eq(tables.sessions.id, sid));
}
