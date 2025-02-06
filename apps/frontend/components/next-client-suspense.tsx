"use client";

import dynamic from "next/dynamic";
import type { PropsWithChildren } from "react";

export function NextClientSuspense({
  children,
  fallback,
}: PropsWithChildren<{ fallback: React.ReactNode }>) {
  const Csr = dynamic(
    // Resolve with children
    () => Promise.resolve(({ children }: PropsWithChildren) => children),
    // Opt out of SSR, and prerender fallback in the generated HTML
    { ssr: false, loading: () => <>{fallback}</> },
  );

  return <Csr>{children}</Csr>;
}
