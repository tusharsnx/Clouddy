"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginWidget from "#/components/login-widget";
import { useSession } from "#/components/session-provider";
import { Loader } from "#/components/ui/loader";

export default function Page() {
  const session = useSession();
  const router = useRouter();

  // Try to redirect the user if they're already logged in
  useEffect(() => {
    if (session.status === "logged-out") return;
    router.push("/");
  }, [session, router]);

  if (session.status === "logged-in") {
    // The above use effect will redirect the user to the home page,
    // but until then we'll show a loader.
    return <Loader />;
  }

  return (
    <div className="h-full flex justify-center items-center">
      <LoginWidget onLogin={session.login} />
    </div>
  );
}
