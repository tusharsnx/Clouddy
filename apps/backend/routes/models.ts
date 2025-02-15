import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { tables } from "#/resources/db/tables.ts";

export const UserSchema = createSelectSchema(tables.users);
export const CreateUserSchema = createInsertSchema(tables.users).omit({
  id: true,
  quotaRemaining: true,
});
export const UpdateUserSchema = createUpdateSchema(tables.users).pick({
  name: true,
  email: true,
});

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

export const FileSchema = createSelectSchema(tables.files);
export const CreateFileSchema = createInsertSchema(tables.files).omit({
  ownerId: true,
  type: true,
  size: true,
  created: true,
  modified: true,
});
export const UpdateFileSchema = createUpdateSchema(tables.files).omit({
  created: true,
  id: true,
  modified: true,
  ownerId: true,
  size: true,
  type: true,
});

export type File = z.infer<typeof FileSchema>;
export type CreateFile = z.infer<typeof CreateFileSchema>;
export type UpdateFile = z.infer<typeof UpdateFileSchema>;

export const UploadRequestSchema = createSelectSchema(tables.uploadRequests);
export const CreateUploadRequestSchema = createInsertSchema(
  tables.uploadRequests,
);
export const UpdateUploadRequestSchema = createUpdateSchema(
  tables.uploadRequests,
);

export type UploadRequest = z.infer<typeof UploadRequestSchema>;
export type CreateUploadRequest = z.infer<typeof CreateUploadRequestSchema>;
export type UpdateUploadRequest = z.infer<typeof UpdateUploadRequestSchema>;

export const UploadDataSchema = z.object({
  name: z.string(),
  path: z.string(),
  type: z.string(),
  size: z.number(),
});
export type UploadData = z.infer<typeof UploadDataSchema>;

export const SessionSchema = createSelectSchema(tables.sessions);
export const CreateSessionSchema = createInsertSchema(tables.sessions);
export const UpdateSessionSchema = createUpdateSchema(tables.sessions).omit({
  id: true,
  userId: true,
});

export type Session = z.infer<typeof SessionSchema>;
export type CreateSession = z.infer<typeof CreateSessionSchema>;
export type UpdateSession = z.infer<typeof UpdateSessionSchema>;
