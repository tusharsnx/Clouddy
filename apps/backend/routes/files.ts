import { Writable } from "node:stream";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import {
  assertNotUndefined,
  assertTrue,
} from "../services/application-error-service/helpers.ts";
import { FileService } from "../services/file-service.ts";
import { authenticate } from "../services/session.ts";
import { createSafeHandler } from "../utils/create-handler.ts";
import { validate } from "../utils/validators.ts";
import { UpdateFileModel, UploadDataModel } from "./models.ts";

const router = Router();
export const filesRouter = router;

router.get(
  "/upload",
  createSafeHandler(async (req, resp) => {
    const uploadData = validate(UploadDataModel, req.body);

    const user = await authenticate(req);

    const { uploadId: upload_id, signedUrl: signed_url } =
      await FileService.getSignedUploadUrl(user, uploadData);
    resp.status(StatusCodes.OK).json({ upload_id, signed_url });
  }),
);

router.post(
  "/upload/:id",
  createSafeHandler(async (req, resp) => {
    const uploadId = req.params.id;
    assertNotUndefined(uploadId, "BadRequest", "Invalid upload id.");

    const user = await authenticate(req);
    const uploadReq = await FileService.getUploadRequestById(uploadId);

    // Make sure the user is authorized
    assertTrue(
      user.id === uploadReq.userId,
      "Unauthorized",
      "You are not authorized to access this file.",
    );

    const file = await FileService.saveUploadedFile(uploadReq);
    resp.status(StatusCodes.CREATED).json({ file });
  }),
);

router.get(
  "/:id",
  createSafeHandler(async (req, resp) => {
    const fileId = req.params.id;
    assertNotUndefined(fileId, "BadRequest", "Invalid file id.");

    const user = await authenticate(req);
    const file = await FileService.getFileById(fileId);

    // Make sure the user is the owner of the file
    assertTrue(
      user.id === file.ownerId,
      "Unauthorized",
      "You are not authorized to access this file.",
    );

    resp.status(StatusCodes.OK).json({ file });
  }),
);

router.put(
  "/:id",
  createSafeHandler(async (req, resp) => {
    const fileId = req.params.id;
    assertNotUndefined(fileId, "BadRequest", "Invalid file id.");

    const user = await authenticate(req);
    const file = await FileService.getFileById(fileId);

    // Make sure the user is the owner of the file
    assertTrue(
      user.id === file.ownerId,
      "Unauthorized",
      "You are not authorized to access this file.",
    );

    const updateData = validate(UpdateFileModel, req.body);
    const updatedFile = await FileService.updateFile(fileId, updateData);
    resp.status(StatusCodes.OK).json({ file: updatedFile });
  }),
);

router.get(
  "/:id/download",
  createSafeHandler(async (req, resp) => {
    const fileId = req.params.id;
    assertNotUndefined(fileId, "BadRequest", "Invalid file id.");

    const user = await authenticate(req);
    const file = await FileService.getFileById(fileId);

    // Make sure the user is the owner of the file
    assertTrue(
      user.id === file.ownerId,
      "Unauthorized",
      "You are not authorized to access this file.",
    );

    // Get the download stream
    const stream = await FileService.getFileDownloadStream(file);

    // Todo: Check if the client accept gzip encoding
    resp.status(StatusCodes.OK).header({
      "Content-Type": file.type,
      "Content-Encoding": "gzip",
      "Transfer-Encoding": "chunked",
    });

    stream
      .pipeThrough(new CompressionStream("gzip"))
      .pipeTo(Writable.toWeb(resp));
  }),
);
