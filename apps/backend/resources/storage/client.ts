import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UploadRequestMaxAge } from "../../constants.ts";
import { envs } from "../../envs.ts";
import { TaskExecutor } from "../../task-executor.ts";

const s3Client = new S3Client({
  region: "auto",
  endpoint: envs.S3_ENDPOINT,
  credentials: {
    accessKeyId: envs.S3_ACCESS_KEY_ID,
    secretAccessKey: envs.S3_SECRET_ACCESS_KEY,
  },
});
const BinDir = "bin";

const executor = new TaskExecutor({
  // Fail fast if this is our (client's) fault
  failFast: (e) => !(e instanceof S3ServiceException) || e.$fault === "client",
});

export const StorageClient = {
  /**
   * Get object stream for a given key
   * @returns A readable stream of the object
   */
  async getFileStream(key: string) {
    const getObjectCommand = new GetObjectCommand({
      Bucket: envs.S3_BUCKET,
      Key: key,
    });

    const result = await s3Client.send(getObjectCommand);
    return result.Body?.transformToWebStream();
  },

  /**
   * Returns a signed upload URL for a given key, content type and size
   * @returns A signed upload URL
   */
  async createSignedUploadUrl(key: string, contentType: string, size: number) {
    const command = new PutObjectCommand({
      Bucket: envs.S3_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });

    return getSignedUrl(s3Client, command, {
      expiresIn: UploadRequestMaxAge,
    });
  },

  /**
   * Moves object to a new key.
   *
   * NOTE: This operation is not atomic and may leave original object
   *       in its current location.
   * @param key The key of the object to move
   * @param newKey The new key of the object
   */
  async moveFile(key: string, newKey: string) {
    const copyCmd = new CopyObjectCommand({
      Bucket: envs.S3_BUCKET,
      Key: key,
      CopySource: `${envs.S3_BUCKET}/${newKey}`,
    });
    await s3Client.send(copyCmd);

    const delCmd = new DeleteObjectCommand({
      Bucket: envs.S3_BUCKET,
      Key: key,
    });
    await s3Client.send(delCmd);
  },

  /**
   * Moves object to the bin.
   */
  async deleteFile(key: string | string[]) {
    const keys = Array.isArray(key) ? key : [key];
    await Promise.allSettled(
      keys.map((key) => {
        executor.execute(() => this.moveFile(key, `${BinDir}/${key}`));
      }),
    );
  },
};
