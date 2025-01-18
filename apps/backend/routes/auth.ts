import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { envs } from "../envs.ts";
import { authenticate } from "../services/auth-service/authenticator.ts";
import { signInMiddleware } from "../services/auth-service/signin.ts";
import { createSafeHandler } from "../utils/create-handler.ts";

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

export const authRouter = router;
