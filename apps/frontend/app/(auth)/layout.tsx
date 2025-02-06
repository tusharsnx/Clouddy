import { NextClientSuspense } from "#/components/next-client-suspense";

export default function AuthLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <NextClientSuspense fallback={<div>Loading...</div>}>
      {children}
    </NextClientSuspense>
  );
}
