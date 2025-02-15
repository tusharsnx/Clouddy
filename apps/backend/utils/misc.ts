import { uuidv7 } from "uuidv7";

export function createRandomId() {
  return uuidv7().replace(/-/g, "");
}

export async function getEncryptionKey(secret: string) {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );
}
