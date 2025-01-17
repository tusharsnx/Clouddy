import * as d from "drizzle-orm";
import { MaxUsageLimit } from "../constants.ts";
import { DBClient } from "../resources/db/client.ts";
import {
  type CreateUserModel,
  type UpdateUserModel,
  files,
  users,
} from "../resources/db/schemas.ts";
import { StorageClient } from "../resources/storage/client.ts";
import { TaskExecutor } from "../task-executor.ts";
import { createRandomId } from "../utils.ts";
import {
  assertNotUndefined,
  assertTrue,
} from "./application-error-service/helpers.ts";

const executor = new TaskExecutor();

export const UserService = {
  async createUser(data: CreateUserModel) {
    const id = createRandomId();
    const { success, result: createUsers } = await executor.executeSafe(() =>
      DBClient.insert(users)
        .values([
          {
            id,
            name: data.name,
            email: data.email,
            quotaRemaining: MaxUsageLimit,
            picture: data.picture,
          },
        ])
        .returning(),
    );
    assertTrue(success, "OperationFailed", "Failed to create user");
    const user = createUsers[0];
    assertNotUndefined(user, "NotFound", "User not found");
    return user;
  },

  async getUser(id: string) {
    const {
      success,
      result: user,
      error,
    } = await executor.executeSafe(() =>
      DBClient.query.users.findFirst({
        where: d.eq(users.id, id),
      }),
    );
    assertTrue(success, "OperationFailed", "Failed to get user", error);
    assertNotUndefined(user, "NotFound", "User not found");
    return user;
  },

  async getUserByEmail(email: string) {
    const {
      success,
      result: user,
      error,
    } = await executor.executeSafe(() =>
      DBClient.query.users.findFirst({
        where: d.eq(users.email, email),
      }),
    );
    assertTrue(success, "OperationFailed", "Failed to get user", error);
    assertNotUndefined(user, "NotFound", "User not found");
    return user;
  },

  async getOrCreateUser(data: CreateUserModel) {
    try {
      return await this.getUserByEmail(data.email);
    } catch {
      return await this.createUser(data);
    }
  },

  async updateUser(id: string, data: UpdateUserModel) {
    const { success, result: updatedUsers } = await executor.executeSafe(() =>
      DBClient.update(users).set(data).where(d.eq(users.id, id)).returning(),
    );
    assertTrue(success, "OperationFailed", "Failed to update user");
    const user = updatedUsers[0];
    assertNotUndefined(user, "NotFound", "User not found");
    return user;
  },

  async deleteUser(id: string) {
    const { success, result: deletedUsers } = await executor.executeSafe(
      async () => {
        // Fetch and delete user files
        const userFiles = await DBClient.query.files.findMany({
          where: d.eq(files.ownerId, id),
          columns: { id: true },
        });
        await StorageClient.deleteFile(userFiles.map((file) => file.id));

        // Delete user
        return await DBClient.delete(users)
          .where(d.eq(users.id, id))
          .returning();
      },
    );

    assertTrue(success, "OperationFailed", "Failed to delete user");
    const user = deletedUsers[0];
    assertNotUndefined(user, "NotFound", "User not found");
    return user;
  },
};
