import { StatusCodes } from "http-status-codes";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { z } from "zod";
import { envs } from "#/envs.ts";
import { login } from "#/services/session/middleware.ts";
import { UserService } from "#/services/user-service.ts";

const GoogleProfileSchema = z
  .object({
    _json: z.object({
      name: z.string().nonempty(),
      email: z.string().nonempty(),
      picture: z.string().nonempty(),
    }),
  })
  .transform((value) => value._json);

function setupProviders() {
  const strategy = new GoogleStrategy(
    {
      clientID: envs.GOOGLE_CLIENT_ID,
      clientSecret: envs.GOOGLE_CLIENT_SECRET,
      callbackURL: envs.GOOGLE_REDIRECT_URI,
      scope: ["email", "profile"],
      passReqToCallback: true,
    },

    async (req, accessToken, refreshToken, profile, done) => {
      const result = GoogleProfileSchema.safeParse(profile);
      if (!result.success) {
        done(result.error);
        return;
      }

      const resp = req.res;
      if (resp === undefined) {
        done(new Error("Response is undefined"));
        return;
      }

      const user = await UserService.getOrCreateUser(result.data);

      await login(user.id, req, resp);

      resp.status(StatusCodes.OK).send({ user: user });
    },
  );

  passport.use("google", strategy);
}

let initDone = false;
export function initLoginProviders() {
  if (initDone) return;
  setupProviders();
  initDone = true;
}
