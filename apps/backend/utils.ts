import { uuidv7 } from "uuidv7";

export function createObjectKey(userId: string, fileId: string) {
  return `${userId}/${fileId}`;
}

export function createRandomId() {
  return uuidv7().replace(/-/g, "");
}
