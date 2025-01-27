import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import passport from "passport";
import { TokenName, isDev } from "../constants.ts";
import {
  assertNotUndefined,
  assertTrue,
} from "../services/application-error-service/helpers.ts";
import { initLoginProviders } from "../services/login.ts";
import { authenticate } from "../services/session.ts";
import { getCookieOptions, getToken } from "../services/session.ts";
import { UserService } from "../services/user-service.ts";
import { createSafeHandler } from "../utils/create-handler.ts";
import type { CreateUserModel } from "./models.ts";

const router = Router();

router.get(
  "/me",
  createSafeHandler(async (req, resp) => {
    const user = await authenticate(req);
    resp.status(StatusCodes.OK).json(user);
  }),
);

// Initialize login providers
initLoginProviders();

const loginHandler = createSafeHandler(
  // We don't need passport's session management
  passport.authenticate("google", { session: false }),
);

/**
 * Redirects to Google OAuth endpoint.
 */
router.get("/login/google", loginHandler);

/**
 * Google OAuth callback.
 */
router.get("/login/google/callback", loginHandler);

/**
 * Logs out the user.
 */
router.get(
  "/logout",
  createSafeHandler((req, resp) => {
    // User is logged in when the token cookies is found.
    // So, reset the cookie to log out the user.

    const host = req.header("X-Forwarded-Host") ?? req.header("host");
    resp.cookie(TokenName, "", getCookieOptions(host, true));
    resp.status(StatusCodes.NO_CONTENT).send();
  }),
);

// Extra routes only available in development
if (isDev) {
  const TestUsers = [
    { name: "Test User 1", email: "testuser1@gmail.com", picture: "" },
    { name: "Test User 2", email: "testuser2@gmail.com", picture: "" },
  ] as const satisfies CreateUserModel[];

  router.get(
    "/dev/code/:id",
    createSafeHandler(async (req, resp) => {
      const id = Number(req.params.id);
      assertTrue(
        !Number.isNaN(id) && id > 0 && id < TestUsers.length,
        "BadRequest",
        "Invalid test user id.",
      );

      const userData = TestUsers[id - 1];
      assertNotUndefined(userData, "NotFound", "Test user not found.");

      const user = await UserService.getOrCreateUser(userData);
      const host = req.header("X-Forwarded-Host") ?? req.header("host");
      resp.cookie(TokenName, await getToken(user), getCookieOptions(host));

      resp.status(StatusCodes.OK).json({ user });
    }),
  );
}

export const authRouter = router;
