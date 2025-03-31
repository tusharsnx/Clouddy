"use client";

import dynamic from "next/dynamic";
import type { PropsWithChildren } from "react";
import { Loader } from "#/components/ui/loader";

export const ClientOnly = dynamic(
  // Resolve with children
  () => Promise.resolve(({ children }: PropsWithChildren) => children),
  // Opt out of SSR, but prerender a loader so the user is greeted
  // with a nice loading sequence.
  { ssr: false, loading: () => <Loader /> },
);
