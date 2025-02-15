import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import passport from "passport";
import { isDev } from "#/constants.ts";
import type { CreateUser } from "#/routes/models.ts";
import {
  assertNotUndefined,
  assertTrue,
} from "#/services/application-error-service/helpers.ts";
import { ApplicationError } from "#/services/application-error-service/types.ts";
import { initLoginProviders } from "#/services/login.ts";
import { authenticate, login, logout } from "#/services/session/middleware.ts";
import { UserService } from "#/services/user-service.ts";
import { createSafeHandler } from "#/utils/create-handler.ts";

const router = Router();

router.get(
  "/me",
  createSafeHandler(async (req, resp) => {
    const session = await authenticate(req, resp);
    resp.status(StatusCodes.OK).json(session.user);
  }),
);

// Initialize login providers
initLoginProviders();

const loginHandler = createSafeHandler(
  passport.authenticate("google", { session: false }),
  (e, next) => {
    // Handle passport's invalid token errors
    if (
      e !== null &&
      typeof e === "object" &&
      "code" in e &&
      e.code === "invalid_grant"
    ) {
      next(
        new ApplicationError("Unauthenticated", "Invalid authentication code"),
      );
    }
    next(e);
  },
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
router.post(
  "/logout",
  createSafeHandler(async (req, resp) => {
    const { sid } = await authenticate(req, resp);
    await logout(sid, req, resp);
    resp.status(StatusCodes.NO_CONTENT).send();
  }),
);

// Extra routes only available in development
if (isDev) {
  const TestUsers = [
    { name: "Test User 1", email: "testuser1@gmail.com", picture: "" },
    { name: "Test User 2", email: "testuser2@gmail.com", picture: "" },
  ] as const satisfies CreateUser[];

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

      await login(user.id, req, resp);
      resp.status(StatusCodes.OK).json({ user });
    }),
  );
}

export const authRouter = router;
