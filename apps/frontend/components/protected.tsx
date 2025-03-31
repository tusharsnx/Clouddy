"use client";

import { useRouter } from "next/navigation";
import { type PropsWithChildren, useEffect } from "react";
import { useSession } from "#/components/session-provider";
import { Loader } from "./ui/loader";

export default function Protected({ children }: PropsWithChildren) {
  const session = useSession();
  const router = useRouter();

  // The user may land on this page directly through the OAuth
  // callback. In that case, we'll have the code in the URL.
  const isOAuthCallback = new URLSearchParams(window.location.search).get(
    "code",
  );

  // If user is not logged-in, and this is an oauth callback,
  // send the exchange code to the server for authentication
  useEffect(() => {
    if (session.status === "logged-out" && isOAuthCallback) {
      session.exchange("google");
    }
  }, [session, isOAuthCallback]);

  // If user is not logged-in and this is not an oauth callback,
  // redirect user to the login page
  useEffect(() => {
    if (session.status === "logged-out" && !isOAuthCallback) {
      router.push("/login");
    }
  }, [router, session, isOAuthCallback]);

  const isLoggedIn = session.status === "logged-in";
  if (!isLoggedIn) {
    return <Loader />;
  }

  return children;
}
