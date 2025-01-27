import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import {
  assertNotUndefined,
  assertTrue,
} from "../services/application-error-service/helpers.ts";
import { FileService } from "../services/file-service.ts";
import { authenticate } from "../services/session.ts";
import { UserService } from "../services/user-service.ts";
import { createSafeHandler } from "../utils/create-handler.ts";
import { validate } from "../utils/validators.ts";
import { UpdateUserModel } from "./models.ts";

const router = Router();
export const usersRouter = router;

router.put(
  "/:id",
  createSafeHandler(async (req, resp) => {
    const userId = req.params.id;
    assertNotUndefined(userId, "BadRequest", "Invalid user id");

    const user = await authenticate(req);

    assertTrue(
      userId === user.id,
      "Unauthorized",
      "The id did not match the authenticated user id",
    );

    // validate data and update user
    const userData = validate(UpdateUserModel, req.body);
    const updatedUser = await UserService.updateUser(userId, userData);
    resp.status(StatusCodes.OK).send({ user: updatedUser });
  }),
);

router.delete(
  "/:id",
  createSafeHandler(async (req, resp) => {
    const userId = req.params.id;
    assertNotUndefined(userId, "BadRequest", "Invalid user id");

    const user = await authenticate(req);

    assertTrue(
      userId === user.id,
      "Unauthorized",
      "The id did not match the authenticated user id",
    );

    const deletedUser = await UserService.deleteUser(userId);
    resp.status(StatusCodes.OK).send({ user: deletedUser });
  }),
);

router.get(
  "/:id/files",
  createSafeHandler(async (req, resp) => {
    const id = req.params.id;
    assertNotUndefined(id, "BadRequest", "User Id is missing.");

    const user = await authenticate(req);
    assertTrue(
      user.id === id,
      "Unauthorized",
      "User id does not match authenticated user id.",
    );

    const files = await FileService.getFilesByUser(user);
    resp.status(StatusCodes.OK).json({
      files: files,
    });
  }),
);
