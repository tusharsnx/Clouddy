import * as d from "drizzle-orm";
import { MaxUsageLimitBytes } from "#/constants.ts";
import {
  ApplicationError,
  assertNotUndefined,
  canRetry,
} from "#/lib/app-error.ts";
import { db } from "#/resources/db/client.ts";
import { tables } from "#/resources/db/tables.ts";
import { StorageClient } from "#/resources/storage/client.ts";
import type { CreateUser, UpdateUser } from "#/routes/models.ts";
import { TaskExecutor } from "#/task-executor.ts";
import { createRandomId } from "#/utils/misc.ts";

const executor = new TaskExecutor({
  failFast: (e) => {
    if (e instanceof ApplicationError) return !canRetry(e);
    return false;
  },
});

const Internal = {
  async createUser(data: CreateUser) {
    const id = createRandomId();
    const insertedUser = await db
      .insert(tables.users)
      .values([
        {
          id,
          name: data.name,
          email: data.email,
          quotaRemaining: MaxUsageLimitBytes,
          picture: data.picture,
        },
      ])
      .returning();
    return insertedUser[0];
  },

  async getUser(id: string) {
    return await db.query.users.findFirst({
      where: d.eq(tables.users.id, id),
    });
  },

  async getUserByEmail(email: string) {
    return await db.query.users.findFirst({
      where: d.eq(tables.users.email, email),
    });
  },
};

export const UserService = {
  async createUser(data: CreateUser) {
    const user = await executor.execute(() => Internal.createUser(data));
    assertNotUndefined(user, "NotFound", "User not found");
    return user;
  },

  async getUser(id: string) {
    const user = await executor.execute(() => Internal.getUser(id));
    assertNotUndefined(user, "NotFound", "User not found");
    return user;
  },

  async getUserByEmail(email: string) {
    const user = await executor.execute(() => Internal.getUserByEmail(email));
    assertNotUndefined(user, "NotFound", "User not found");
    return user;
  },

  async getOrCreateUser(data: CreateUser) {
    return (
      (await Internal.getUserByEmail(data.email)) ||
      (await this.createUser(data))
    );
  },

  async updateUser(id: string, data: UpdateUser) {
    const updatedUsers = await executor.execute(() =>
      db
        .update(tables.users)
        .set(data)
        .where(d.eq(tables.users.id, id))
        .returning(),
    );
    const user = updatedUsers[0];
    assertNotUndefined(user, "NotFound", "User not found");
    return user;
  },

  async deleteUser(id: string) {
    const deletedUsers = await executor.execute(async () => {
      // Fetch and delete user files
      const userFiles = await db.query.files.findMany({
        where: d.eq(tables.files.ownerId, id),
        columns: { id: true },
      });
      await StorageClient.deleteFile(userFiles.map((file) => file.id));

      // Delete user
      return await db
        .delete(tables.users)
        .where(d.eq(tables.users.id, id))
        .returning();
    });

    const user = deletedUsers[0];
    assertNotUndefined(user, "NotFound", "User not found");
    return user;
  },
};
