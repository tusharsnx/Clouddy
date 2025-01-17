import { relations } from "drizzle-orm";
import {
  bigint,
  doublePrecision,
  index,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type { z } from "zod";
import { MaxIDLength, UploadRequestMaxAge } from "../../constants.ts";

export const users = pgTable("users", {
  id: varchar({ length: MaxIDLength }).primaryKey(),
  name: varchar({ length: 1024 }).notNull(),
  email: varchar({ length: 100 }).notNull().unique(),
  picture: varchar({ length: 1024 }).notNull(),
  quotaRemaining: doublePrecision().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  files: many(files),
  uploadRequests: many(uploadRequests),
}));

export const files = pgTable(
  "files",
  {
    id: varchar({ length: MaxIDLength }).primaryKey(),
    name: varchar({ length: 1024 }).notNull(),
    path: varchar({ length: 1024 }).notNull(),
    type: varchar({ length: 128 }).notNull(),
    size: bigint({ mode: "number" }).notNull(),
    ownerId: varchar({ length: MaxIDLength }).references(() => users.id, {
      onDelete: "cascade",
    }),
    created: timestamp().notNull().defaultNow(),
    modified: timestamp()
      .notNull()
      .$onUpdateFn(() => new Date()),
  },
  (table) => [index("owner_id_idx").on(table.ownerId)],
);

export const filesRelations = relations(files, ({ one }) => ({
  owner: one(users, {
    fields: [files.ownerId],
    references: [users.id],
  }),
}));

export const uploadRequests = pgTable(
  "upload_requests",
  {
    id: varchar({ length: MaxIDLength }).primaryKey(),
    size: bigint({ mode: "number" }).notNull(),
    userId: varchar({ length: MaxIDLength }).references(() => users.id, {
      onDelete: "cascade",
    }),
    fileId: varchar({ length: MaxIDLength }),
    contentType: varchar({ length: 128 }).notNull(),
    expires: timestamp().$defaultFn(
      () => new Date(Date.now() + UploadRequestMaxAge),
    ),
  },
  (table) => [
    index("user_id_idx").on(table.userId),
    index("file_id_idx").on(table.fileId),
  ],
);

export const uploadRequestsRelations = relations(uploadRequests, ({ one }) => ({
  user: one(users, {
    fields: [uploadRequests.userId],
    references: [users.id],
  }),
}));

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
export const CreateFileModel = createInsertSchema(files);
export const UpdateFileModel = createUpdateSchema(files);
export type FileModel = z.infer<typeof FileModel>;
export type CreateFileModel = z.infer<typeof CreateFileModel>;
export type UpdateFileModel = z.infer<typeof UpdateFileModel>;

export const UploadRequestModel = createSelectSchema(uploadRequests);
export const CreateUploadRequestModel = createInsertSchema(uploadRequests);
export const UpdateUploadRequestModel = createUpdateSchema(uploadRequests);
export type UploadRequestModel = z.infer<typeof UploadRequestModel>;
export type CreateUploadRequestModel = z.infer<typeof CreateUploadRequestModel>;
export type UpdateUploadRequestModel = z.infer<typeof UpdateUploadRequestModel>;
