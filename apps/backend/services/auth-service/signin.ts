import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { z } from "zod";
import { envs } from "../../envs.ts";
import type { CreateUserModel } from "../../resources/db/schemas.ts";
import { UserService } from "../user-service.ts";
import { AuthService, TokenMaxAgeSec } from "./service.ts";

const startegy = new GoogleStrategy(
  {
    clientID: envs.GOOGLE_CLIENT_ID,
    clientSecret: envs.GOOGLE_CLIENT_SECRET,
    callbackURL: envs.GOOGLE_REDIRECT_URI,
    scope: ["email", "profile"],
    passReqToCallback: false,
  },
  (accessToken, refreshToken, profile, done) => {
    try {
      const p = z
        .object({
          _json: z.object({
            name: z.string().nonempty(),
            email: z.string().nonempty(),
            picture: z.string().nonempty(),
          }),
        })
        .parse(profile);

      const user: CreateUserModel = {
        name: p._json.name,
        email: p._json.email,
        picture: p._json.picture,
      };

      done(null, user);
    } catch (e) {
      done(e);
    }
  },
);

passport.use("google", startegy);

// This is called when the passport successfully authenticates user
// based on received oauth code from google. We parse important data
// (CreateUserModel) from Profile and pass it on to verify's `done`
// callback (see GoogleStrategy registeration at the top). That data is
// pass to this function as `userData`.
async function passportAuthenticationHandler(
  passportErr: unknown,
  userData: CreateUserModel,
  resp: Response,
  next: NextFunction,
) {
  if (passportErr) {
    return next(passportErr);
  }

  const user = await UserService.getOrCreateUser({
    name: userData.name,
    email: userData.email,
    picture: userData.picture,
  });
  const token = await AuthService.getSignedToken(user);

  // Write the token in the cookies
  resp.cookie(envs.TOKEN_ID, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    expires: new Date(Date.now() + TokenMaxAgeSec * 1000),
  });

  resp.status(StatusCodes.NO_CONTENT).send();
}

export function signInMiddleware(
  req: Request,
  resp: Response,
  next: NextFunction,
) {
  // A terrible API design. We need to take the profile and write a
  // cookie based on that, but you can only access the profile inside
  // the callback (which is the third argument below). Too many layers
  // just to read the data received from google.
  const middleware = passport.authenticate(
    "google",

    // We roll our own session management. passport (or express-) session
    // management is horrible due to it global nature. Passport modified
    // Request interface to add a session and user objects which can't be
    // modified further to statify our needs. It's a mess.
    { session: false },

    (err, user) => passportAuthenticationHandler(err, user, resp, next),
  );

  // passport's middleware throws if the code or token is invalid.
  try {
    middleware(req, resp, next);
  } catch (e) {
    next(e);
  }
}
