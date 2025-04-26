"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginWidget from "#/components/login-widget";
import { useSession } from "#/components/session-provider";
import { Loader } from "#/components/ui/loader";

export default function Page() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect to '/' when the user is already logged-in.
    if (session.status === "logged-in") {
      router.push("/");
    }
  }, [session, router]);

  return session.status !== "logged-out" ? (
    <Loader />
  ) : (
    <div className="h-full flex justify-center items-center">
      <LoginWidget onLogin={session.login} />
    </div>
  );
}
