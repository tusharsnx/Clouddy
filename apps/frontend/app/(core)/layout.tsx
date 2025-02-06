import type { PropsWithChildren } from "react";
import { NextClientSuspense } from "#/components/next-client-suspense";
import Protected from "#/components/protected";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <NextClientSuspense fallback={<div>loading...</div>}>
      <Protected>{children}</Protected>
    </NextClientSuspense>
  );
}
