"use client";

import { redirect } from "next/navigation";
import LoginWidget from "#/components/login-widget";
import { useSession } from "#/hooks/use-session";

export default function Page() {
  const session = useSession();

  if (session.status === "logged-in") {
    redirect("/");
  }

  return (
    <div className="h-full flex justify-center items-center">
      <LoginWidget />
    </div>
  );
}
