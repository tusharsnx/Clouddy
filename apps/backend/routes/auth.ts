import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { envs } from "../envs.ts";
import {
  assertNotUndefined,
  assertTrue,
} from "../services/application-error-service/helpers.ts";
import { authenticate } from "../services/auth-service/authenticator.ts";
import { AuthService } from "../services/auth-service/service.ts";
import { signInMiddleware } from "../services/auth-service/signin.ts";
import { writeToken } from "../services/auth-service/token-writer.ts";
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

/**
 * Redirects user to google's OAuth endpoint.
 */
router.get("/login/google", signInMiddleware);

/**
 * Receives OAuth exchange code and registers the user.
 */
router.get("/login/google/callback", signInMiddleware);

/**
 * Logs out the user.
 */
router.get(
  "/logout",
  createSafeHandler((req, resp) => {
    // User is logged in when the token cookies is found.
    // So, reset the cookie to log out the user.
    resp.cookie(envs.TOKEN_ID, "", { maxAge: -1 });
    resp.status(StatusCodes.NO_CONTENT).send();
  }),
);

// Extra routes only available in development
if (envs.NODE_ENV === "development") {
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
      const token = await AuthService.getSignedToken(user);

      writeToken(resp, token);
      resp.status(StatusCodes.OK).json({ user });
    }),
  );
}

export const authRouter = router;
