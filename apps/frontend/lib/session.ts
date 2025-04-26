import { z } from "zod";

const UserSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  email: z.string().email(),
  picture: z.string().nonempty(),
  quotaRemaining: z.number(),
});

export type User = z.infer<typeof UserSchema>;

export async function isLoggedIn() {
  const resp = await fetch("/api/auth/me");
  return resp.ok;
}

export async function exchange(
  provider: string,
  params: string,
): Promise<User | null> {
  const resp = await fetch(`/api/auth/login/${provider}/callback?${params}`);
  const { data: user = null } = UserSchema.safeParse(await resp.json());
  return user;
}

export function login(provider: string) {
  window.location.href = `/api/auth/login/${provider}`;
}

export async function logout() {
  const resp = await fetch("/api/auth/logout", {
    method: "post",
  });
  return resp.ok;
}

export async function getUser(): Promise<User | null> {
  const resp = await fetch("/api/auth/me");
  const { data: user = null } = UserSchema.safeParse(await resp.json());
  return user;
}
