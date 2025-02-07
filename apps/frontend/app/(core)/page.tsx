"use client";

import { useSessionLogout } from "#/components/session-provider";
import { Button } from "#/components/ui/button";

export default function Home() {
  const session = useSessionLogout();

  return <Button onClick={() => session.logout()}>Logout</Button>;
}
