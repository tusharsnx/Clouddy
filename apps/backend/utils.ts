import { uuidv7 } from "uuidv7";

export function createRandomId() {
  return uuidv7().replace(/-/g, "");
}
