import { z } from "zod";
import { getApiURL } from "./utils";

const UserSchema = z.object({
  id: z.string().nonempty(),
  name: z.string().nonempty(),
  email: z.string().nonempty(),
  picture: z.string().nonempty(),
  quotaRemaining: z.number(),
});

export type User = z.infer<typeof UserSchema>;

export async function isLoggedIn() {
  const resp = await fetch(getApiURL("/auth/me"), {
    credentials: "include",
  });
  return resp.ok;
}

export async function exchange(provider: string, params: string) {
  const resp = await fetch(
    getApiURL(`/auth/login/${provider}/callback?${params}`),
    {
      credentials: "include",
    },
  );
  if (!resp.ok) {
    return undefined;
  }

  const { data: user } = UserSchema.safeParse(await resp.json());
  return user;
}

export function login(provider: string) {
  window.location.href = getApiURL(`/auth/login/${provider}`);
}

export async function logout() {
  const resp = await fetch(getApiURL("/auth/logout"), {
    method: "post",
    credentials: "include",
  });
  return resp.ok;
}

export async function getLoggedInUser() {
  const resp = await fetch(getApiURL("/auth/me"), {
    credentials: "include",
  });
  const { data: user } = UserSchema.safeParse(await resp.json());
  return user;
}
