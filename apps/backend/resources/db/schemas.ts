import { relations } from "drizzle-orm";
import {
  bigint,
  doublePrecision,
  index,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { MaxIDLength, UploadRequestMaxAgeSecs } from "../../constants.ts";
import { createRandomId } from "../../utils.ts";

export const users = pgTable("users", {
  id: varchar({ length: MaxIDLength })
    .primaryKey()
    .$defaultFn(() => createRandomId()),
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
    ownerId: varchar({ length: MaxIDLength })
      .notNull()
      .references(() => users.id, {
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
    id: varchar({ length: MaxIDLength })
      .primaryKey()
      .$defaultFn(() => createRandomId()),
    size: bigint({ mode: "number" }).notNull(),
    userId: varchar({ length: MaxIDLength })
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    fileId: varchar({ length: MaxIDLength })
      .notNull()
      .$defaultFn(() => createRandomId()),
    contentType: varchar({ length: 128 }).notNull(),
    expires: timestamp()
      .notNull()
      .$defaultFn(() => new Date(Date.now() + UploadRequestMaxAgeSecs * 1000)),
    path: varchar({ length: 1024 }).notNull(),
    fileName: varchar({ length: 1024 }).notNull(),
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
