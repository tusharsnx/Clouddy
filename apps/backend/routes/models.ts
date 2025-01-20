import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { files, uploadRequests, users } from "../resources/db/schemas.ts";

export const UserModel = createSelectSchema(users);
export const CreateUserModel = createInsertSchema(users).omit({
  id: true,
  quotaRemaining: true,
});
export const UpdateUserModel = createUpdateSchema(users).pick({
  name: true,
  email: true,
});
export type UserModel = z.infer<typeof UserModel>;
export type CreateUserModel = z.infer<typeof CreateUserModel>;
export type UpdateUserModel = z.infer<typeof UpdateUserModel>;

export const FileModel = createSelectSchema(files);
export const CreateFileModel = createInsertSchema(files).omit({
  ownerId: true,
  type: true,
  size: true,
  created: true,
  modified: true,
});
export const UpdateFileModel = createUpdateSchema(files).omit({
  created: true,
  id: true,
  modified: true,
  ownerId: true,
  size: true,
  type: true,
});
export type FileModel = z.infer<typeof FileModel>;
export type CreateFileModel = z.infer<typeof CreateFileModel>;
export type UpdateFileModel = z.infer<typeof UpdateFileModel>;

export const UploadRequestModel = createSelectSchema(uploadRequests);
export const CreateUploadRequestModel = createInsertSchema(uploadRequests);
export const UpdateUploadRequestModel = createUpdateSchema(uploadRequests);
export type UploadRequestModel = z.infer<typeof UploadRequestModel>;
export type CreateUploadRequestModel = z.infer<typeof CreateUploadRequestModel>;
export type UpdateUploadRequestModel = z.infer<typeof UpdateUploadRequestModel>;

export const UploadDataModel = z.object({
  name: z.string(),
  path: z.string(),
  type: z.string(),
  size: z.number(),
});
export type UploadDataModel = z.infer<typeof UploadDataModel>;
