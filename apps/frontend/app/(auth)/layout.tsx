import { NextClientSuspense } from "#/components/next-client-suspense";
import { Loader } from "#/components/ui/loader";

export default function AuthLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <NextClientSuspense fallback={<Loader />}>{children}</NextClientSuspense>
  );
}
