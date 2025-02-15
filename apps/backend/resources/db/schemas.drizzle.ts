import { relations as drizzleRelation } from "drizzle-orm";
import {
  bigint,
  doublePrecision,
  index,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { MaxIDLength, UploadRequestMaxAgeSecs } from "#/constants.ts";
import { createRandomId } from "#/utils/misc.ts";

export const users = pgTable("users", {
  id: varchar({ length: MaxIDLength })
    .primaryKey()
    .$defaultFn(() => createRandomId()),
  name: varchar({ length: 1024 }).notNull(),
  email: varchar({ length: 100 }).notNull().unique(),
  picture: varchar({ length: 1024 }).notNull(),
  quotaRemaining: doublePrecision().notNull(),
});

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

export const sessions = pgTable(
  "sessions",
  {
    id: varchar({ length: MaxIDLength })
      .primaryKey()
      .$defaultFn(() => createRandomId()),
    userId: varchar({ length: MaxIDLength })
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),
    refreshTokenId: varchar({ length: MaxIDLength }).notNull(),
  },
  (table) => [index("refresh_token_id_idx").on(table.refreshTokenId)],
);

export const usersRelation = drizzleRelation(users, ({ many }) => ({
  files: many(files),
  uploadRequests: many(uploadRequests),
  sessions: many(sessions),
}));

export const filesRelation = drizzleRelation(files, ({ one }) => ({
  owner: one(users, {
    fields: [files.ownerId],
    references: [users.id],
  }),
}));

export const uploadRequestsRelation = drizzleRelation(
  uploadRequests,
  ({ one }) => ({
    user: one(users, {
      fields: [uploadRequests.userId],
      references: [users.id],
    }),
  }),
);

export const sessionsRelation = drizzleRelation(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
