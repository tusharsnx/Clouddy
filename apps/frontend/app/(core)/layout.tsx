import type { PropsWithChildren } from "react";
import Protected from "#/components/protected";
import { TopNav } from "#/components/top-nav";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <Protected>
      <header className="px-4">
        <TopNav />
      </header>
      <main className="px-4">{children}</main>
      <footer className="px-4" />
    </Protected>
  );
}
