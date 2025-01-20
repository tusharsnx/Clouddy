export function keyAlreadyExists(e: Error & { code?: string }): boolean {
  return e.code === "23505";
}
