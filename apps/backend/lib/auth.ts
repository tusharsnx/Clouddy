import type { CookieOptions, Request, Response } from "express";
import { isDev } from "#/constants.ts";
import {
  ApplicationError,
  assertNotUndefined,
  assertTrue,
} from "#/lib/app-error.ts";
import {
  type TokenPayload,
  createToken,
  deleteSession,
  getSessionByRefreshToken,
  saveSession,
  updateSession,
  verifyToken,
} from "#/lib/session.ts";
import { UserService } from "#/lib/user.ts";
import type { User } from "#/routes/models.ts";
import { createRandomId } from "#/utils/misc.ts";

const AccessTokenName = "access_token";
const RefreshTokenName = "refresh_token";
const AccessTokenExpiration = 60 * 60; // 1 hour
const RefreshTokenExpiration = 7 * 24 * 60 * 60; // 7 days

export function getCookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: true,
    maxAge: maxAge * 1000,
    path: "/",

    // We use cross site cookies in dev to ease local development.
    sameSite: isDev ? "none" : "lax",
  };
}

async function setSessionCookie(uid: string, resp: Response, sid?: string) {
  // Create a new session if no sid is provided
  const sessionId = sid ?? createRandomId();

  const accessPayload = {
    sid: sessionId,
    tid: createRandomId(),
    uid,
  } satisfies TokenPayload;

  const refreshPayload = {
    sid: sessionId,
    tid: createRandomId(),
    uid,
  } satisfies TokenPayload;

  // Save the session
  const result = sid
    ? await updateSession(sid, {
        refreshTokenId: refreshPayload.tid,
      })
    : await saveSession(refreshPayload);

  assertTrue(
    result.rowCount === 1,
    "OperationFailed",
    "Failed to save session.",
  );

  const accessToken = await createToken(accessPayload, AccessTokenExpiration);
  const refreshToken = await createToken(
    refreshPayload,
    RefreshTokenExpiration,
  );

  resp.cookie(
    AccessTokenName,
    accessToken,
    getCookieOptions(AccessTokenExpiration),
  );
  resp.cookie(
    RefreshTokenName,
    refreshToken,
    getCookieOptions(RefreshTokenExpiration),
  );
}

async function revokeSessionCookie(sid: string, resp: Response) {
  // Delete the session from db
  await deleteSession(sid);

  // Delete the cookies
  const options = getCookieOptions(0);
  resp.cookie(AccessTokenName, "", options);
  resp.cookie(RefreshTokenName, "", options);
}

// Logs in the user and save the session in db.
// In case of invalid access token, this can be called to re-login the user.
export async function login(uid: string, req: Request, resp: Response) {
  await setSessionCookie(uid, resp);
}

// Logs out the user and delete the session from db.
export async function logout(sid: string, req: Request, resp: Response) {
  await revokeSessionCookie(sid, resp);
}

export type UserSession = {
  sid: string;
  user: User;
};

// Authenticates the user and validate the session.
export async function authenticate(
  req: Request,
  resp: Response,
): Promise<UserSession> {
  const accessToken = req.cookies.access_token as string | undefined;
  const refreshToken = req.cookies.refresh_token as string | undefined;

  const hasAccessToken = accessToken !== undefined && accessToken !== "";
  const hasRefreshToken = refreshToken !== undefined && refreshToken !== "";

  // Ensure we have at least one of the tokens.
  assertTrue(
    hasAccessToken || hasRefreshToken,
    "Unauthenticated",
    "Token missing.",
  );

  // Try the access token
  if (hasAccessToken) {
    const payload = await verifyToken(accessToken);
    if (payload) {
      return {
        sid: payload.sid,
        user: await UserService.getUser(payload.uid),
      };
    }

    // Short circuit if we don't have a refresh token
    if (!hasRefreshToken) {
      throw new ApplicationError("Unauthenticated", "Token invalid.");
    }
  }

  assertTrue(hasRefreshToken, "Unauthenticated", "Token missing.");

  // We only reach here if the access token was invalid or missing,
  // but a refresh token is available.

  // Verify refresh token
  const payload = await verifyToken(refreshToken);
  assertNotUndefined(payload, "Unauthenticated", "Invalid token.");

  // Check refresh token isn't revoked in db
  const dbSession = await getSessionByRefreshToken(payload.tid);
  assertNotUndefined(dbSession, "Unauthenticated", "Invalid token.");

  const { uid, sid } = payload;

  // Extend the session by setting new tokens
  await setSessionCookie(uid, resp, sid);

  const user = await UserService.getUser(uid);

  // Add session id so we can log out the user if needed
  return { user, sid };
}
