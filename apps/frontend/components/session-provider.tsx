"use client";

import { type User, login, logout } from "#/lib/session";

import { createContext, use } from "react";
import { Loader } from "#/components/ui/loader";
import {
  useInvalidateSessionUserQuery,
  useSessionUserQuery,
} from "#/hooks/use-session-user-query";

type SessionContext =
  | { status: "pending"; user?: undefined }
  | {
      status: "logged-out";
      user: null;
      login: (provider: string) => void;
    }
  | {
      status: "logged-in";
      user: User;
      logout: () => void;
    };

const SessionContext = createContext<SessionContext | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useSessionUserQuery();
  const invalidateSessionUserQuery = useInvalidateSessionUserQuery();

  const sessionCtx: SessionContext | null =
    user === undefined
      ? {
          status: "pending",
        }
      : user == null
        ? {
            status: "logged-out",
            user: null,
            login: (provider) => login(provider),
          }
        : {
            status: "logged-in",
            user,
            logout: async () => {
              if (await logout()) {
                await invalidateSessionUserQuery();
              }
            },
          };

  return sessionCtx.status === "pending" ? (
    <Loader />
  ) : (
    <SessionContext value={sessionCtx}>{children}</SessionContext>
  );
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
