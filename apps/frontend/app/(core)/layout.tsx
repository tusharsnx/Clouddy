import type { PropsWithChildren } from "react";
import { NextClientSuspense } from "#/components/next-client-suspense";
import Protected from "#/components/protected";
import { Loader } from "#/components/ui/loader";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <NextClientSuspense fallback={<Loader />}>
      <Protected>{children}</Protected>
    </NextClientSuspense>
  );
}
