"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, use } from "react";
import * as session from "#/lib/session";

type SessionContext =
  | {
      status: "logged-out";
      user: null;
      login: (provider: string) => Promise<void>;
      exchange: (provider: string) => Promise<void>;
    }
  | {
      status: "logged-in";
      user: session.User;
      logout: () => Promise<void>;
    };

const SessionContext = createContext<SessionContext | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  async function login(provider: string) {
    session.login(provider);
  }

  async function logout() {
    const result = await session.logout();
    if (!result) return;
    await queryClient.refetchQueries({ queryKey: ["session"] });
    router.push("/login");
  }

  function getSessionContext(user?: session.User) {
    return (
      user
        ? {
            status: "logged-in",
            user,
            logout,
          }
        : {
            status: "logged-out",
            user: null,
            login,
            exchange,
          }
    ) satisfies SessionContext;
  }

  async function exchange(provider: string) {
    // The code is in the URL search params
    const searchParams = new URLSearchParams(window.location.search);
    const user = await session.exchange(provider, searchParams.toString());
    if (!user) return;
    queryClient.setQueryData(["session"], getSessionContext(user));
    window.history.replaceState(null, "", window.location.pathname);
  }

  async function loadSession() {
    const user = await session.getLoggedInUser();
    return getSessionContext(user);
  }

  const query = useQuery<SessionContext>({
    queryKey: ["session"],
    queryFn: loadSession,
  });

  return <SessionContext value={use(query.promise)}>{children}</SessionContext>;
}

export function useSession() {
  const context = use(SessionContext);
  if (context === null) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

export function useSessionLogin() {
  const context = use(SessionContext);
  if (context === null) {
    throw Error("useSession must be used within a SessionProvider");
  }
  if (context.status === "logged-in") {
    throw Error(
      "useSessionLogin() can only be used when user is not logged in",
    );
  }

  return context;
}

export function useSessionLogout() {
  const context = use(SessionContext);
  if (context === null) {
    throw Error("useSessionLogout must be used within a SessionProvider");
  }
  if (context.status !== "logged-in") {
    throw Error("useSessionLogout is only available when user is loged in");
  }

  return context;
}

export function useSessionUser() {
  const context = use(SessionContext);
  if (context === null) {
    throw Error("useSession must be used within a SessionProvider");
  }
  if (context.status !== "logged-in") {
    throw Error("User is not logged in");
  }

  return context.user;
}
