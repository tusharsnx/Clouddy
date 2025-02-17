import * as d from "drizzle-orm";
import { MimeTypes } from "#/constants.ts";
import { assertNotUndefined, assertTrue, canRetry } from "#/lib/app-error.ts";
import { ApplicationError } from "#/lib/app-error.ts";
import { db } from "#/resources/db/client.ts";
import { keyAlreadyExists } from "#/resources/db/error-handlers.ts";
import { tables } from "#/resources/db/tables.ts";
import { StorageClient } from "#/resources/storage/client.ts";
import type {
  File,
  UpdateFile,
  UploadData,
  UploadRequest,
  User,
} from "#/routes/models.ts";
import { TaskExecutor } from "#/task-executor.ts";

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
      db.query.files.findFirst({
        where: d.eq(tables.files.id, fileId),
      }),
    );
    assertNotUndefined(file, "NotFound", "File not found.");
    return file;
  },

  async updateFile(id: string, data: UpdateFile) {
    return await executor.execute(async () => {
      const insertedFiles = await db
        .update(tables.files)
        .set(data)
        .where(d.eq(tables.files.id, id))
        .returning();
      const file = insertedFiles[0];
      assertNotUndefined(file, "OperationFailed", "Could not save the file.");
      return file;
    });
  },

  async getFileDownloadStream(file: File) {
    const key = getObjectKey(file.ownerId, file.id);
    const stream = await executor.execute(() =>
      StorageClient.getFileStream(key),
    );
    assertNotUndefined(stream, "OperationFailed", "Failed to get file.");
    return stream;
  },

  async getUploadRequestById(uploadId: string) {
    const uploadReq = await executor.execute(() =>
      db.query.uploadRequests.findFirst({
        where: d.eq(tables.uploadRequests.id, uploadId),
      }),
    );
    assertNotUndefined(uploadReq, "NotFound", "Upload request not found.");
    return uploadReq;
  },

  async saveUploadedFile(uploadReq: UploadRequest) {
    const {
      success,
      result: newFile,
      error,
    } = await executor.executeSafe(() =>
      db.transaction(async (tx) => {
        // Check to see if the file actually exists in the
        // upload directory
        const uploadKey = getUploadKey(uploadReq.fileId);
        const uploadObjData = await StorageClient.getFileMetadata(uploadKey);

        // todo: File may already exist in the db
        // Insert file into db
        let insertedFiles: File[];
        try {
          insertedFiles = await tx
            .insert(tables.files)
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
          .update(tables.users)
          .set({
            quotaRemaining: d.sql<number>`${tables.users.quotaRemaining} - ${uploadReq.size}`,
          })
          .where(d.eq(tables.users.id, uploadReq.userId));

        // Move file to user's directory
        const userObjectKey = getObjectKey(uploadReq.userId, uploadReq.fileId);
        await StorageClient.moveFile(uploadKey, userObjectKey);

        return file;
      }),
    );

    assertTrue(success, "OperationFailed", "Failed to create file.", error);
    return newFile;
  },

  async getSignedUploadUrl(user: User, uploadData: UploadData) {
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
      db.transaction(async (tx) => {
        const userUploadRequests = await tx.query.uploadRequests.findMany({
          where: d.and(
            d.eq(tables.uploadRequests.userId, user.id),
            // Only get the upload requests that are still active
            d.gt(tables.uploadRequests.expires, new Date()),
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
          .insert(tables.uploadRequests)
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

  async getFilesByUser(user: User) {
    return await executor.execute(() =>
      db.query.files.findMany({
        where: d.eq(tables.files.ownerId, user.id),
      }),
    );
  },
};
