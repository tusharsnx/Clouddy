"use client";

import { redirect } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { type PropsWithChildren, use } from "react";
import { useSession } from "#/hooks/use-session";
import { createNeverResolvingPromise } from "#/lib/utils";

const suspend = () => {
  use(createNeverResolvingPromise());
  // We should never reach here
  throw new Error("There is a bug in suspend()");
};

export default function Protected({ children }: PropsWithChildren) {
  const session = useSession();
  const searchParams = useSearchParams();

  if (session.status === "logged-out") {
    // The user may land on this page directly from the OAuth
    // provider's page. In that case, we'll have the code in the URL.
    const exchangeCode = searchParams.get("code");

    if (!exchangeCode) {
      redirect("/login");
    }

    async function sendCode() {
      if (session.status === "logged-in") {
        throw Error("Session is not logged in");
      }

      await session.exchange("google", searchParams.toString());

      // Remove the code from the URL so we don't redo the exchange
      // ceremony. Note that it's important to do this after the code
      // exchange, otherwise during a re render, we might end up in the
      // redirect condition above.
      window.history.replaceState(null, "", window.location.pathname);
    }

    // We have the code. Pass it to the server, and let it handle the
    // rest.
    use(sendCode());

    // We should never reach here, but if we do, we'll just suspend
    // forever so the UI isn't shown to a logged out user.
    redirect("/login");
  }

  return children;
}
