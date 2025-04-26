import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { exchange, getUser } from "#/lib/session";

export const SessionUserQueryKey = ["session-key"];

export function useSessionUserQuery() {
  const searchParams = useSearchParams();

  // The user may have been redirected here by an OAuth provider,
  // in which case, we'll have a code in the search params.
  const hasExchangeCode = searchParams.has("code");

  return useQuery({
    queryKey: SessionUserQueryKey,
    queryFn: () => {
      return hasExchangeCode
        ? exchangeAndClearSearchParams("google", searchParams)
        : getUser();
    },
    retry: !hasExchangeCode,
  });
}

export function useInvalidateSessionUserQuery() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: SessionUserQueryKey,
      exact: true,
    });
}

async function exchangeAndClearSearchParams(
  provider: string,
  searchParams: URLSearchParams,
) {
  // We only want to do this once. Clear the search params so it can't be used again.
  window.history.replaceState({}, "", window.location.pathname);
  return await exchange(provider, searchParams.toString());
}
