"use client";

import { Button } from "#/components/ui/button";
import { useLoggedInSession } from "#/hooks/use-session";

export default function Home() {
  const session = useLoggedInSession();

  return (
    <Button
      onClick={async () => {
        await session.logout();
      }}
    >
      Logout
    </Button>
  );
}
