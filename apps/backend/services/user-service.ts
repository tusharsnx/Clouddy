import * as d from "drizzle-orm";
import { MaxUsageLimitBytes } from "../constants.ts";
import { DBClient } from "../resources/db/client.ts";
import { files, users } from "../resources/db/schemas.ts";
import { StorageClient } from "../resources/storage/client.ts";
import type { CreateUserModel, UpdateUserModel } from "../routes/models.ts";
import { TaskExecutor } from "../task-executor.ts";
import { createRandomId } from "../utils.ts";
import {
  assertNotUndefined,
  canRetry,
} from "./application-error-service/helpers.ts";
import { ApplicationError } from "./application-error-service/types.ts";

const executor = new TaskExecutor({
  failFast: (e) => {
    if (e instanceof ApplicationError) return !canRetry(e);
    return false;
  },
});

const Internal = {
  async createUser(data: CreateUserModel) {
    const id = createRandomId();
    const insertedUser = await DBClient.insert(users)
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
    return await DBClient.query.users.findFirst({
      where: d.eq(users.id, id),
    });
  },

  async getUserByEmail(email: string) {
    return await DBClient.query.users.findFirst({
      where: d.eq(users.email, email),
    });
  },
};

export const UserService = {
  async createUser(data: CreateUserModel) {
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

  async getOrCreateUser(data: CreateUserModel) {
    return (
      (await Internal.getUserByEmail(data.email)) ||
      (await this.createUser(data))
    );
  },

  async updateUser(id: string, data: UpdateUserModel) {
    const updatedUsers = await executor.execute(() =>
      DBClient.update(users).set(data).where(d.eq(users.id, id)).returning(),
    );
    const user = updatedUsers[0];
    assertNotUndefined(user, "NotFound", "User not found");
    return user;
  },

  async deleteUser(id: string) {
    const deletedUsers = await executor.execute(async () => {
      // Fetch and delete user files
      const userFiles = await DBClient.query.files.findMany({
        where: d.eq(files.ownerId, id),
        columns: { id: true },
      });
      await StorageClient.deleteFile(userFiles.map((file) => file.id));

      // Delete user
      return await DBClient.delete(users).where(d.eq(users.id, id)).returning();
    });

    const user = deletedUsers[0];
    assertNotUndefined(user, "NotFound", "User not found");
    return user;
  },
};
