import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { assertNotUndefined, assertTrue } from "#/lib/app-error.ts";
import { authenticate } from "#/lib/auth.ts";
import { createSafeHandler } from "#/lib/create-handler.ts";
import { FileService } from "#/lib/file.ts";
import { UserService } from "#/lib/user.ts";
import { validate } from "#/lib/validator.ts";
import { UpdateUserSchema } from "#/routes/models.ts";

const router = Router();
export const usersRouter = router;

router.put(
  "/:id",
  createSafeHandler(async (req, resp) => {
    const userId = req.params.id;
    assertNotUndefined(userId, "BadRequest", "Invalid user id");

    const session = await authenticate(req, resp);

    assertTrue(
      userId === session.user.id,
      "Unauthorized",
      "The id did not match the authenticated user id",
    );

    // Update user
    const { body: updateUserBody } = validate(req, { body: UpdateUserSchema });
    const updatedUser = await UserService.updateUser(userId, updateUserBody);
    resp.status(StatusCodes.OK).send({ user: updatedUser });
  }),
);

router.delete(
  "/:id",
  createSafeHandler(async (req, resp) => {
    const userId = req.params.id;
    assertNotUndefined(userId, "BadRequest", "Invalid user id");

    const session = await authenticate(req, resp);

    assertTrue(
      userId === session.user.id,
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

    const session = await authenticate(req, resp);
    assertTrue(
      session.user.id === id,
      "Unauthorized",
      "User id does not match authenticated user id.",
    );

    const files = await FileService.getFilesByUser(session.user);
    resp.status(StatusCodes.OK).json({
      files: files,
    });
  }),
);
