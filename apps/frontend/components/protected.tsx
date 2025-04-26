"use client";

import { useRouter } from "next/navigation";
import { type PropsWithChildren, useEffect } from "react";
import { useSession } from "#/components/session-provider";
import { Loader } from "#/components/ui/loader";

export default function Protected({ children }: PropsWithChildren) {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    // Go to "/login" if the user is logged-out.
    if (session.status === "logged-out") {
      router.push("/login");
    }
  }, [session, router]);

  return session.status === "logged-in" ? children : <Loader />;
}
