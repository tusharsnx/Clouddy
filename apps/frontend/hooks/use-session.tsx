import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createContext, use } from "react";
import { login } from "#/lib/login";
import { type User, exchange, getLoggedInUser, logout } from "#/lib/session";
import { suspend } from "#/lib/utils";

type SessionContext =
  | {
      status: "logged-out";
      user: null;
      login: (provider: string) => Promise<void>;
      exchange: (provider: string, params: string) => Promise<void>;
    }
  | {
      status: "logged-in";
      user: User;
      logout: () => Promise<void>;
    };

const SessionContext = createContext<SessionContext | null>(null);

// State: Pending | LoggedIn | LoggedOut
// In Pending state, we should start loading the session data and suspend on the promise
// In LoggedIn state, we should render the children
// In LoggedOut state, we should redirect to login page

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  async function loginSession(provider: string) {
    login(provider);
    queryClient.invalidateQueries({ queryKey: ["session"] });
  }

  async function exchangeCode(provider: string, params: string) {
    await exchange(provider, params);
    queryClient.invalidateQueries({ queryKey: ["session"] });
  }

  async function logoutSession() {
    await logout();
    queryClient.invalidateQueries({ queryKey: ["session"] });
  }

  async function loadSessionContext() {
    const user = await getLoggedInUser();
    return (
      user
        ? {
            status: "logged-in",
            user: user,
            logout: logoutSession,
          }
        : {
            status: "logged-out",
            user: null,
            login: loginSession,
            exchange: exchangeCode,
          }
    ) satisfies SessionContext;
  }

  const query = useSuspenseQuery({
    queryKey: ["session"],
    queryFn: () => loadSessionContext(),
  });

  return <SessionContext value={query.data}>{children}</SessionContext>;
}

export function useSession() {
  const context = use(SessionContext);
  if (context === null) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

export function useLoggedInSession() {
  const context = use(SessionContext);
  if (context === null) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  if (context.status !== "logged-in") {
    suspend();
  }

  return context;
}
