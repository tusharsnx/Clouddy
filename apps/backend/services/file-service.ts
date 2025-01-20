import * as d from "drizzle-orm";
import { MimeTypes } from "../constants.ts";
import { DBClient } from "../resources/db/client.ts";
import { keyAlreadyExists } from "../resources/db/error-handlers.ts";
import { files, uploadRequests, users } from "../resources/db/schemas.ts";
import { StorageClient } from "../resources/storage/client.ts";
import type {
  FileModel,
  UpdateFileModel,
  UploadDataModel,
  UploadRequestModel,
  UserModel,
} from "../routes/models.ts";
import { TaskExecutor } from "../task-executor.ts";
import {
  assertNotUndefined,
  assertTrue,
  canRetry,
} from "./application-error-service/helpers.ts";
import { ApplicationError } from "./application-error-service/types.ts";

const executor = new TaskExecutor({
  failFast: (e) => {
    // Fail fast for application errors that has client problems
    if (e instanceof ApplicationError) return !canRetry(e);
    return false;
  },
});

export function getObjectKey(userId: string, fileId: string) {
  return `${userId}/${fileId}`;
}

const BucketTempDir = "tmp";
function getUploadKey(fileId: string) {
  return `${BucketTempDir}/${fileId}`;
}

export const FileService = {
  async getFileById(fileId: string) {
    const file = await executor.execute(() =>
      DBClient.query.files.findFirst({
        where: d.eq(files.id, fileId),
      }),
    );
    assertNotUndefined(file, "NotFound", "File not found.");
    return file;
  },

  async updateFile(id: string, data: UpdateFileModel) {
    return await executor.execute(async () => {
      const insertedFiles = await DBClient.update(files)
        .set(data)
        .where(d.eq(files.id, id))
        .returning();
      const file = insertedFiles[0];
      assertNotUndefined(file, "OperationFailed", "Could not save the file.");
      return file;
    });
  },

  async getFileDownloadStream(file: FileModel) {
    const key = getObjectKey(file.ownerId, file.id);
    const stream = await executor.execute(() =>
      StorageClient.getFileStream(key),
    );
    assertNotUndefined(stream, "OperationFailed", "Failed to get file.");
    return stream;
  },

  async getUploadRequestById(uploadId: string) {
    const uploadReq = await executor.execute(() =>
      DBClient.query.uploadRequests.findFirst({
        where: d.eq(uploadRequests.id, uploadId),
      }),
    );
    assertNotUndefined(uploadReq, "NotFound", "Upload request not found.");
    return uploadReq;
  },

  async saveUploadedFile(uploadReq: UploadRequestModel) {
    const {
      success,
      result: newFile,
      error,
    } = await executor.executeSafe(() =>
      DBClient.transaction(async (tx) => {
        // Check to see if the file actually exists in the
        // upload directory
        const uploadKey = getUploadKey(uploadReq.fileId);
        const uploadObjData = await StorageClient.getFileMetadata(uploadKey);

        // todo: File may already exist in the db
        // Insert file into db
        let insertedFiles: FileModel[];
        try {
          insertedFiles = await tx
            .insert(files)
            .values([
              {
                id: uploadReq.fileId,
                name: uploadReq.fileName,
                path: uploadReq.path,
                ownerId: uploadReq.userId,

                // Use type and size from the uploaded object
                size: uploadObjData.contentLength,
                type: uploadObjData.contentType,
              },
            ])
            .returning();
        } catch (e) {
          // If the error is key already exists,
          // throw an application error
          throw e instanceof Error && keyAlreadyExists(e)
            ? new ApplicationError("BadRequest", "File already exists.")
            : e;
        }

        // Ensure that the file was inserted
        const file = insertedFiles[0];
        assertNotUndefined(file, "OperationFailed", "Could not save the file.");

        // Update user quota
        await tx
          .update(users)
          .set({
            quotaRemaining: d.sql<number>`${users.quotaRemaining} - ${uploadReq.size}`,
          })
          .where(d.eq(users.id, uploadReq.userId));

        // Move file to user's directory
        const userObjectKey = getObjectKey(uploadReq.userId, uploadReq.fileId);
        await StorageClient.moveFile(uploadKey, userObjectKey);

        return file;
      }),
    );

    assertTrue(success, "OperationFailed", "Failed to create file.", error);
    return newFile;
  },

  async getSignedUploadUrl(user: UserModel, uploadData: UploadDataModel) {
    // Ensure user has enough free quota for the upload
    assertTrue(
      user.quotaRemaining >= uploadData.size,
      "BadRequest",
      "Not enough quota.",
    );

    // Ensure the content type is allowed
    assertTrue(
      MimeTypes.has(uploadData.type),
      "BadRequest",
      "Invalid mime type.",
    );

    // Get an upload request in a transaction
    return await executor.execute(() =>
      DBClient.transaction(async (tx) => {
        const userUploadRequests = await tx.query.uploadRequests.findMany({
          where: d.and(
            d.eq(uploadRequests.userId, user.id),
            // Only get the upload requests that are still active
            d.gt(uploadRequests.expires, new Date()),
          ),
        });

        // Calculate the total size of active upload requests
        const active = userUploadRequests.reduce(
          (acc, uploadRequest) => acc + uploadRequest.size,
          0,
        );

        // Ensure user has enough storage for the upload
        assertTrue(
          user.quotaRemaining - active >= uploadData.size,
          "BadRequest",
          "Not enough quota.",
        );

        // Insert new upload request
        const insertedUploadRequests = await tx
          .insert(uploadRequests)
          .values([
            {
              userId: user.id,
              contentType: uploadData.type,
              size: uploadData.size,
              path: uploadData.path,
              fileName: uploadData.name,
            },
          ])
          .returning();

        const uploadReq = insertedUploadRequests[0];
        assertNotUndefined(
          uploadReq,
          "OperationFailed",
          "Failed to create upload request.",
        );

        // Create a signed upload url
        const uploadKey = getUploadKey(uploadReq.fileId);
        const signedUrl = await StorageClient.createSignedUploadUrl(
          uploadKey,
          uploadReq.contentType,
          uploadReq.size,
        );

        return {
          uploadId: uploadReq.id,
          signedUrl,
        };
      }),
    );
  },

  async getFilesByUser(user: UserModel) {
    return await executor.execute(() =>
      DBClient.query.files.findMany({
        where: d.eq(files.ownerId, user.id),
      }),
    );
  },
};
